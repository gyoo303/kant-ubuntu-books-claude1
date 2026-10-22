-- TKT-DB-05 · 03-db-schema.md §5(구독 RPC) · 04-interfaces-api.md SEQ-04·05·06·10

-- 첫 결제 성공 뒤 구독·빌링키·결제·회차 1·편지를 한 번에 만든다. 같은 토스 주문번호 재호출은 성공(멱등).
create function public.start_subscription(
  p_subscription_id uuid, p_user_id uuid, p_customer_key uuid, p_billing_key text,
  p_toss_order_id text, p_payment_key text, p_amount integer, p_method text, p_approved_at timestamptz,
  p_billing_day smallint, p_next_billing_date date)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_existing uuid;
  v_draft public.subscription_drafts%rowtype;
  v_payment_id uuid;
  v_cycle_id uuid;
begin
  select subscription_id into v_existing from public.payments
    where toss_order_id = p_toss_order_id and status = 'confirmed';
  if v_existing is not null then
    return v_existing;
  end if;

  if exists (select 1 from public.subscriptions where user_id = p_user_id and status = 'active') then
    raise exception using errcode = 'P0001', message = 'ALREADY_SUBSCRIBED';
  end if;

  select * into v_draft from public.subscription_drafts where user_id = p_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  insert into public.subscriptions (id, user_id, monthly_price, billing_day, next_billing_date)
  values (p_subscription_id, p_user_id, p_amount, p_billing_day, p_next_billing_date);

  insert into public.billing_keys (subscription_id, customer_key, billing_key)
  values (p_subscription_id, p_customer_key, p_billing_key);

  insert into public.payments (user_id, purpose, subscription_id, cycle_no, toss_order_id, payment_key,
    amount, status, method, approved_at)
  values (p_user_id, 'subscription_cycle', p_subscription_id, 1, p_toss_order_id, p_payment_key,
    p_amount, 'confirmed', p_method, p_approved_at)
  returning id into v_payment_id;

  insert into public.subscription_cycles (subscription_id, user_id, cycle_no, status, payment_id)
  values (p_subscription_id, p_user_id, 1, 'letter_arrived', v_payment_id)
  returning id into v_cycle_id;

  insert into public.subscription_letters (subscription_id, user_id, cycle_id, body)
  values (p_subscription_id, p_user_id, v_cycle_id, v_draft.letter_body);

  delete from public.subscription_drafts where user_id = p_user_id;

  return p_subscription_id;
end
$$;

-- 매달 결제 성공 뒤 다음 회차를 연다. 보관 편지가 있으면 붙인다(D-014).
create function public.open_cycle(
  p_subscription_id uuid, p_cycle_no integer, p_toss_order_id text, p_payment_key text,
  p_amount integer, p_approved_at timestamptz, p_next_billing_date date)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_existing uuid;
  v_max integer;
  v_payment_id uuid;
  v_cycle_id uuid;
  v_letter_id uuid;
begin
  select c.id into v_existing
    from public.payments p join public.subscription_cycles c on c.payment_id = p.id
    where p.toss_order_id = p_toss_order_id;
  if v_existing is not null then
    return v_existing;
  end if;

  select * into v_sub from public.subscriptions where id = p_subscription_id for update;
  if not found or v_sub.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'NO_ACTIVE_SUBSCRIPTION';
  end if;

  select coalesce(max(cycle_no), 0) into v_max from public.subscription_cycles where subscription_id = p_subscription_id;
  if p_cycle_no <> v_max + 1 then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  insert into public.payments (user_id, purpose, subscription_id, cycle_no, toss_order_id, payment_key,
    amount, status, method, approved_at)
  values (v_sub.user_id, 'subscription_cycle', p_subscription_id, p_cycle_no, p_toss_order_id, p_payment_key,
    p_amount, 'confirmed', '카드', p_approved_at)
  returning id into v_payment_id;

  select id into v_letter_id from public.subscription_letters
    where subscription_id = p_subscription_id and cycle_id is null for update;

  insert into public.subscription_cycles (subscription_id, user_id, cycle_no, status, payment_id)
  values (p_subscription_id, v_sub.user_id, p_cycle_no,
    case when v_letter_id is null then 'awaiting_letter'::public.cycle_status else 'letter_arrived'::public.cycle_status end,
    v_payment_id)
  returning id into v_cycle_id;

  if v_letter_id is not null then
    update public.subscription_letters set cycle_id = v_cycle_id where id = v_letter_id;
  end if;

  update public.subscriptions set next_billing_date = p_next_billing_date where id = p_subscription_id;

  return v_cycle_id;
end
$$;

-- 자동결제 실패: 그달 회차 없이 종료 (D-003)
create function public.end_subscription_payment_failed(
  p_subscription_id uuid, p_cycle_no integer, p_toss_order_id text, p_amount integer, p_code text, p_message text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  select * into v_sub from public.subscriptions where id = p_subscription_id for update;
  if not found or v_sub.status <> 'active' then
    return;
  end if;

  insert into public.payments (user_id, purpose, subscription_id, cycle_no, toss_order_id, amount, status,
    failure_code, failure_message)
  values (v_sub.user_id, 'subscription_cycle', p_subscription_id, p_cycle_no, p_toss_order_id, p_amount, 'failed',
    p_code, p_message)
  on conflict (toss_order_id) do nothing;

  update public.subscriptions
    set status = 'ended', ended_at = now(), end_reason = 'payment_failed', next_billing_date = null
    where id = p_subscription_id;
end
$$;

-- 회원 편지 제출 (D-014, D-027)
create function public.submit_letter(p_body text)
  returns table (letter_id uuid, attached_cycle_id uuid)
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_sub_id uuid;
  v_cycle_id uuid;
  v_letter_id uuid;
begin
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;
  if p_body is null or char_length(p_body) not between 1 and 2000 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select id into v_sub_id from public.subscriptions where user_id = v_user and status = 'active' for update;
  if v_sub_id is null then
    raise exception using errcode = 'P0001', message = 'NO_ACTIVE_SUBSCRIPTION';
  end if;

  select c.id into v_cycle_id
    from public.subscription_cycles c
    where c.subscription_id = v_sub_id and c.status = 'awaiting_letter'
      and not exists (select 1 from public.subscription_letters l where l.cycle_id = c.id)
    order by c.cycle_no
    limit 1
    for update;

  if v_cycle_id is not null then
    insert into public.subscription_letters (subscription_id, user_id, cycle_id, body)
    values (v_sub_id, v_user, v_cycle_id, p_body)
    returning id into v_letter_id;
    update public.subscription_cycles set status = 'letter_arrived' where id = v_cycle_id;
    return query select v_letter_id, v_cycle_id;
    return;
  end if;

  select id into v_letter_id from public.subscription_letters
    where subscription_id = v_sub_id and cycle_id is null for update;
  if v_letter_id is null then
    insert into public.subscription_letters (subscription_id, user_id, body)
    values (v_sub_id, v_user, p_body)
    returning id into v_letter_id;
  else
    update public.subscription_letters set body = p_body where id = v_letter_id;
  end if;
  return query select v_letter_id, null::uuid;
end
$$;

-- 편지 수정: 보관 편지이거나 붙은 회차가 아직 letter_arrived일 때만 (D-027)
create function public.update_letter(p_letter_id uuid, p_body text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_letter public.subscription_letters%rowtype;
  v_status public.cycle_status;
begin
  if p_body is null or char_length(p_body) not between 1 and 2000 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;
  select * into v_letter from public.subscription_letters where id = p_letter_id and user_id = auth.uid() for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_letter.cycle_id is not null then
    select status into v_status from public.subscription_cycles where id = v_letter.cycle_id;
    if v_status <> 'letter_arrived' then
      raise exception using errcode = 'P0001', message = 'INVALID_STATE';
    end if;
  end if;
  update public.subscription_letters set body = p_body where id = p_letter_id;
end
$$;

-- 해지: 단계 없이 한 번에 (INV-12). 다음 결제 없음(INV-19). 이미 해지된 경우 성공.
create function public.cancel_subscription(p_note text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_sub_id uuid;
  v_latest public.subscription_status;
begin
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;
  if char_length(coalesce(p_note, '')) > 2000 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select id into v_sub_id from public.subscriptions where user_id = v_user and status = 'active' for update;
  if v_sub_id is null then
    select status into v_latest from public.subscriptions where user_id = v_user order by created_at desc limit 1;
    if v_latest = 'cancelled' then
      return;
    end if;
    raise exception using errcode = 'P0001', message = 'NO_ACTIVE_SUBSCRIPTION';
  end if;

  update public.subscriptions
    set status = 'cancelled', cancelled_at = now(), next_billing_date = null
    where id = v_sub_id;
  insert into public.farewell_notes (subscription_id, user_id, body)
  values (v_sub_id, v_user, coalesce(p_note, ''));
end
$$;

revoke execute on function public.start_subscription(uuid, uuid, uuid, text, text, text, integer, text, timestamptz, smallint, date) from public, anon, authenticated;
grant execute on function public.start_subscription(uuid, uuid, uuid, text, text, text, integer, text, timestamptz, smallint, date) to service_role;
revoke execute on function public.open_cycle(uuid, integer, text, text, integer, timestamptz, date) from public, anon, authenticated;
grant execute on function public.open_cycle(uuid, integer, text, text, integer, timestamptz, date) to service_role;
revoke execute on function public.end_subscription_payment_failed(uuid, integer, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.end_subscription_payment_failed(uuid, integer, text, integer, text, text) to service_role;
revoke execute on function public.submit_letter(text) from public, anon;
grant execute on function public.submit_letter(text) to authenticated;
revoke execute on function public.update_letter(uuid, text) from public, anon;
grant execute on function public.update_letter(uuid, text) to authenticated;
revoke execute on function public.cancel_subscription(text) from public, anon;
grant execute on function public.cancel_subscription(text) to authenticated;
