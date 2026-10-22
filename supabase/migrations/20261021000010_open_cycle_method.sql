-- TKT-DB-05 보완: 매달 자동결제의 실제 결제 수단(카드·간편결제)을 기록한다. 이전 버전은 '카드'로 고정했다.
-- 인자가 늘어나므로 기존 함수를 지우고 다시 만든다(같은 이름의 오버로드가 남지 않게).
drop function public.open_cycle(uuid, integer, text, text, integer, timestamptz, date);

create function public.open_cycle(
  p_subscription_id uuid, p_cycle_no integer, p_toss_order_id text, p_payment_key text,
  p_amount integer, p_approved_at timestamptz, p_next_billing_date date, p_method text default '카드')
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
    p_amount, 'confirmed', coalesce(p_method, '카드'), p_approved_at)
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

revoke execute on function public.open_cycle(uuid, integer, text, text, integer, timestamptz, date, text) from public, anon, authenticated;
grant execute on function public.open_cycle(uuid, integer, text, text, integer, timestamptz, date, text) to service_role;
