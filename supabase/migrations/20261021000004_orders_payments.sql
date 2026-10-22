-- TKT-DB-03 · 03-db-schema.md §3.4, §4(orders, order_items, payments), §5(주문 RPC)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  items_amount integer not null check (items_amount >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  total_amount integer not null check (total_amount = items_amount + shipping_fee and total_amount > 0),
  order_name text not null,
  ship_recipient_name text not null,
  ship_phone text not null,
  ship_postal_code text not null,
  ship_address1 text not null,
  ship_address2 text not null,
  paid_at timestamptz,
  shipped_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null),
  check (status <> 'shipped' or (paid_at is not null and shipped_at is not null)), -- INV-05
  check (status <> 'refunded' or (paid_at is not null and shipped_at is null and refunded_at is not null)) -- INV-18
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, paid_at);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  unique (order_id, product_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  purpose public.payment_purpose not null,
  order_id uuid references public.orders (id) on delete restrict,
  subscription_id uuid, -- FK는 20261021000005에서 추가
  cycle_no integer,
  toss_order_id text not null unique check (toss_order_id ~ '^[A-Za-z0-9_-]{6,64}$'),
  payment_key text unique,
  amount integer not null check (amount > 0),
  status public.payment_status not null default 'ready',
  method text,
  approved_at timestamptz,
  refunded_at timestamptz,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((purpose = 'order' and order_id is not null and subscription_id is null and cycle_no is null)
      or (purpose = 'subscription_cycle' and order_id is null and subscription_id is not null and cycle_no >= 1)),
  check (status not in ('confirmed', 'refunded') or (payment_key is not null and approved_at is not null))
);
create unique index payments_order_once on public.payments (order_id) where purpose = 'order';
create unique index payments_cycle_once on public.payments (subscription_id, cycle_no) where purpose = 'subscription_cycle';
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

create policy orders_select_own on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy orders_select_admin on public.orders
  for select to authenticated using (public.is_admin());

create policy order_items_select_own on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_items_select_admin on public.order_items
  for select to authenticated using (public.is_admin());

create policy payments_select_own on public.payments
  for select to authenticated using (user_id = auth.uid());
create policy payments_select_admin on public.payments
  for select to authenticated using (public.is_admin());

-- 주문 준비: 서버가 가격·재고·금액을 계산하고 배송지를 스냅샷한다. (SEQ-02 ①)
create function public.create_pending_order(p_items jsonb)
  returns table (order_id uuid, toss_order_id text, amount integer, order_name text)
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_addr public.shipping_addresses%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_toss_order_id text := 'ord_' || replace(v_order_id::text, '-', '');
  v_items_amount integer := 0;
  v_shipping_fee integer;
  v_line_count integer;
  v_first_name text;
  v_order_name text;
  v_line record;
begin
  if v_user is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  select * into v_addr from public.shipping_addresses where user_id = v_user;
  if not found then
    raise exception using errcode = 'P0001', message = 'SHIPPING_ADDRESS_REQUIRED';
  end if;

  select c.shipping_fee into v_shipping_fee from public.app_constants() c;

  -- 같은 상품이 여러 줄이면 수량을 합친다
  drop table if exists pg_temp._lines;
  create temp table _lines on commit drop as
    select (item ->> 'productId')::uuid as product_id, sum((item ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) item
    group by 1;

  if exists (select 1 from pg_temp._lines where quantity < 1 or quantity > 99) then
    raise exception using errcode = 'P0001', message = 'VALIDATION_FAILED';
  end if;

  for v_line in
    select l.product_id, l.quantity, p.name, p.price, p.stock_quantity
    from pg_temp._lines l left join public.products p on p.id = l.product_id
    order by l.product_id
  loop
    if v_line.name is null then
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
    if v_line.stock_quantity < v_line.quantity then
      raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK', detail = v_line.product_id::text;
    end if;
    v_items_amount := v_items_amount + v_line.price * v_line.quantity;
  end loop;

  select count(*) into v_line_count from pg_temp._lines;
  select p.name into v_first_name from pg_temp._lines l join public.products p on p.id = l.product_id order by p.name limit 1;
  v_order_name := case when v_line_count > 1 then v_first_name || ' 외 ' || (v_line_count - 1) || '건' else v_first_name end;

  insert into public.orders (id, user_id, items_amount, shipping_fee, total_amount, order_name,
    ship_recipient_name, ship_phone, ship_postal_code, ship_address1, ship_address2)
  values (v_order_id, v_user, v_items_amount, v_shipping_fee, v_items_amount + v_shipping_fee, v_order_name,
    v_addr.recipient_name, v_addr.phone, v_addr.postal_code, v_addr.address1, v_addr.address2);

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, l.product_id, p.name, p.price, l.quantity
  from pg_temp._lines l join public.products p on p.id = l.product_id;

  insert into public.payments (user_id, purpose, order_id, toss_order_id, amount)
  values (v_user, 'order', v_order_id, v_toss_order_id, v_items_amount + v_shipping_fee);

  return query select v_order_id, v_toss_order_id, v_items_amount + v_shipping_fee, v_order_name;
end
$$;

-- 결제 확정: 금액 대조 + 재고 조건부 차감 + 상태 전이를 한 트랜잭션으로. 같은 paymentKey 재호출은 성공(멱등).
create function public.confirm_order_payment(
  p_toss_order_id text, p_payment_key text, p_amount integer, p_method text, p_approved_at timestamptz)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_item record;
begin
  select * into v_payment from public.payments where toss_order_id = p_toss_order_id and purpose = 'order' for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_payment.status = 'confirmed' and v_payment.payment_key = p_payment_key then
    return v_payment.order_id;
  end if;
  if v_payment.status <> 'ready' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;
  if v_payment.amount <> p_amount then
    raise exception using errcode = 'P0001', message = 'AMOUNT_MISMATCH';
  end if;

  for v_item in
    select product_id, quantity from public.order_items where order_id = v_payment.order_id order by product_id
  loop
    update public.products set stock_quantity = stock_quantity - v_item.quantity
      where id = v_item.product_id and stock_quantity >= v_item.quantity;
    if not found then
      raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK', detail = v_item.product_id::text;
    end if;
  end loop;

  update public.payments
    set status = 'confirmed', payment_key = p_payment_key, method = p_method, approved_at = p_approved_at
    where id = v_payment.id;
  update public.orders set status = 'paid', paid_at = p_approved_at
    where id = v_payment.order_id and status = 'pending_payment';
  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  return v_payment.order_id;
end
$$;

create function public.fail_order_payment(p_toss_order_id text, p_code text, p_message text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  update public.payments
    set status = 'failed', failure_code = p_code, failure_message = p_message
    where toss_order_id = p_toss_order_id and purpose = 'order' and status = 'ready'
    returning order_id into v_order_id;
  if v_order_id is not null then
    update public.orders set status = 'cancelled' where id = v_order_id and status = 'pending_payment';
  end if;
end
$$;

-- 환불 반영: Route가 본인·paid 확인 후 토스 취소에 성공한 다음 호출한다. 이미 refunded면 그대로 성공.
create function public.refund_order(p_order_id uuid, p_refunded_at timestamptz)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_order.status = 'refunded' then
    return;
  end if;
  if v_order.status <> 'paid' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id order by product_id loop
    update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
  end loop;

  update public.orders set status = 'refunded', refunded_at = p_refunded_at where id = p_order_id;
  update public.payments set status = 'refunded', refunded_at = p_refunded_at
    where order_id = p_order_id and purpose = 'order' and status = 'confirmed';
end
$$;

create function public.admin_ship_order(p_order_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_status public.order_status;
begin
  if not public.is_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_status = 'shipped' then
    return;
  end if;
  if v_status <> 'paid' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE';
  end if;
  update public.orders set status = 'shipped', shipped_at = now() where id = p_order_id;
end
$$;

revoke execute on function public.create_pending_order(jsonb) from public, anon;
grant execute on function public.create_pending_order(jsonb) to authenticated;
revoke execute on function public.confirm_order_payment(text, text, integer, text, timestamptz) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(text, text, integer, text, timestamptz) to service_role;
revoke execute on function public.fail_order_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.fail_order_payment(text, text, text) to service_role;
revoke execute on function public.refund_order(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.refund_order(uuid, timestamptz) to service_role;
revoke execute on function public.admin_ship_order(uuid) from public, anon;
grant execute on function public.admin_ship_order(uuid) to authenticated;
