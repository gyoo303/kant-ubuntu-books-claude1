-- TKT-DB-06 · 03-db-schema.md §5(회차 RPC) · 04-interfaces-api.md SEQ-07·08·09

-- 읽기 시작: 촛불은 이것으로만 켜진다 (INV-09)
create function public.admin_start_reading(p_cycle_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_status public.cycle_status;
begin
  if not public.is_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select status into v_status from public.subscription_cycles where id = p_cycle_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_status = 'reading' then
    return;
  end if;
  if v_status not in ('letter_arrived', 'awaiting_letter') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;
  update public.subscription_cycles set status = 'reading', reading_started_at = now() where id = p_cycle_id;
  insert into public.cycle_contents (cycle_id) values (p_cycle_id) on conflict (cycle_id) do nothing;
end
$$;

-- 매칭·답장·엽서·힌트 부분 저장. null 인자는 그대로 둔다.
create function public.admin_save_cycle_content(
  p_cycle_id uuid, p_product_id uuid, p_reply_letter text, p_postcard_path text, p_teaser text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_status public.cycle_status;
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select status into v_status from public.subscription_cycles where id = p_cycle_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_status <> 'reading' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;
  if p_product_id is not null then
    select stock_quantity into v_stock from public.products where id = p_product_id;
    if v_stock is null then
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
    if v_stock < 1 then
      raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK', detail = p_product_id::text;
    end if;
  end if;

  insert into public.cycle_contents (cycle_id) values (p_cycle_id) on conflict (cycle_id) do nothing;
  update public.cycle_contents set
    product_id = coalesce(p_product_id, product_id),
    reply_letter = coalesce(p_reply_letter, reply_letter),
    postcard_path = coalesce(p_postcard_path, postcard_path)
    where cycle_id = p_cycle_id;
  if p_teaser is not null then
    update public.subscription_cycles set teaser = p_teaser where id = p_cycle_id;
  end if;
end
$$;

-- 발송: 필수 항목 확인 → 재고 1 차감 → 6자리 코드 발급 → shipped. 이미 발송됐으면 기존 코드 반환(멱등).
create function public.admin_ship_cycle(p_cycle_id uuid)
  returns text
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_cycle public.subscription_cycles%rowtype;
  v_content public.cycle_contents%rowtype;
  v_missing text[] := array[]::text[];
  v_bytes bytea;
  v_code text;
  v_try integer := 0;
begin
  if not public.is_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into v_cycle from public.subscription_cycles where id = p_cycle_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_cycle.status in ('shipped', 'unboxed') then
    select code into v_code from public.unboxing_codes where cycle_id = p_cycle_id;
    return v_code;
  end if;
  if v_cycle.status <> 'reading' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  select * into v_content from public.cycle_contents where cycle_id = p_cycle_id;
  if v_content.product_id is null then v_missing := v_missing || 'product'; end if;
  if v_content.reply_letter is null then v_missing := v_missing || 'replyLetter'; end if;
  if v_cycle.teaser is null then v_missing := v_missing || 'teaser'; end if;
  if array_length(v_missing, 1) > 0 then
    raise exception using errcode = 'P0001', message = 'MISSING_CONTENT', detail = array_to_string(v_missing, ',');
  end if;

  update public.products set stock_quantity = stock_quantity - 1
    where id = v_content.product_id and stock_quantity >= 1;
  if not found then
    raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK', detail = v_content.product_id::text;
  end if;

  loop
    v_try := v_try + 1;
    v_bytes := extensions.gen_random_bytes(3);
    v_code := lpad(((get_byte(v_bytes, 0) * 65536 + get_byte(v_bytes, 1) * 256 + get_byte(v_bytes, 2)) % 1000000)::text, 6, '0');
    begin
      insert into public.unboxing_codes (cycle_id, code) values (p_cycle_id, v_code);
      exit;
    exception when unique_violation then
      if v_try >= 10 then
        raise exception using errcode = 'P0001', message = 'INTERNAL';
      end if;
    end;
  end loop;

  update public.subscription_cycles set status = 'shipped', shipped_at = now() where id = p_cycle_id;
  return v_code;
end
$$;

-- 언박싱: 본인 회차만, 최근 10분 실패 5회면 잠금 (INV-02·03, NFR-07). 다른 회원 회차는 틀린 코드와 같게 응답.
create function public.redeem_unboxing_code(p_cycle_id uuid, p_code text)
  returns table (ok boolean, remaining_attempts integer, locked_until timestamptz)
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_max_failures constant integer := 5;
  v_window constant interval := interval '10 minutes';
  v_last_success timestamptz;
  v_failures integer;
  v_oldest_failure timestamptz;
  v_cycle public.subscription_cycles%rowtype;
  v_code text;
  v_cycle_exists boolean;
begin
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;

  select max(attempted_at) into v_last_success from public.unboxing_attempts
    where user_id = v_user and succeeded;
  select count(*), min(attempted_at) into v_failures, v_oldest_failure from (
    select attempted_at from public.unboxing_attempts
    where user_id = v_user and not succeeded
      and attempted_at > greatest(now() - v_window, coalesce(v_last_success, '-infinity'::timestamptz))
    order by attempted_at desc
    limit v_max_failures) recent;

  if v_failures >= v_max_failures then
    return query select false, 0, v_oldest_failure + v_window;
    return;
  end if;

  select * into v_cycle from public.subscription_cycles where id = p_cycle_id for update;
  v_cycle_exists := found;
  if v_cycle_exists and v_cycle.user_id = v_user and v_cycle.status = 'unboxed' then
    return query select true, v_max_failures - v_failures, null::timestamptz;
    return;
  end if;

  if v_cycle_exists and v_cycle.user_id = v_user and v_cycle.status = 'shipped' then
    select code into v_code from public.unboxing_codes where cycle_id = p_cycle_id and redeemed_at is null;
  end if;

  if v_code is not null and v_code = p_code then
    update public.unboxing_codes set redeemed_at = now() where cycle_id = p_cycle_id;
    update public.subscription_cycles set status = 'unboxed', unboxed_at = now() where id = p_cycle_id;
    insert into public.unboxing_attempts (user_id, cycle_id, succeeded) values (v_user, p_cycle_id, true);
    return query select true, v_max_failures, null::timestamptz;
    return;
  end if;

  if v_cycle_exists then
    insert into public.unboxing_attempts (user_id, cycle_id, succeeded) values (v_user, p_cycle_id, false);
  end if;
  v_failures := v_failures + 1;
  return query select false, greatest(v_max_failures - v_failures, 0),
    case when v_failures >= v_max_failures then now() + v_window else null::timestamptz end;
end
$$;

revoke execute on function public.admin_start_reading(uuid) from public, anon;
grant execute on function public.admin_start_reading(uuid) to authenticated;
revoke execute on function public.admin_save_cycle_content(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.admin_save_cycle_content(uuid, uuid, text, text, text) to authenticated;
revoke execute on function public.admin_ship_cycle(uuid) from public, anon;
grant execute on function public.admin_ship_cycle(uuid) to authenticated;
revoke execute on function public.redeem_unboxing_code(uuid, text) from public, anon;
grant execute on function public.redeem_unboxing_code(uuid, text) to authenticated;
