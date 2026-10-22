-- 무료배송 기준 추가 (D-039): 책 금액 30,000원 이상이면 배송비 0원. 금액은 모두 예시 (Q-013)
-- app_constants는 돌려주는 칼럼이 늘어 지우고 다시 만든다. create_pending_order는 같은 인자로 교체한다.
drop function public.app_constants();

create function public.app_constants()
  returns table (shipping_fee integer, subscription_monthly_price integer, free_shipping_threshold integer)
  language sql
  immutable
  set search_path = ''
as $$
  select 3000, 18000, 30000
$$;
grant execute on function public.app_constants() to anon, authenticated, service_role;

create or replace function public.create_pending_order(p_items jsonb)
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
  v_free_threshold integer;
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

  select c.shipping_fee, c.free_shipping_threshold into v_shipping_fee, v_free_threshold from public.app_constants() c;

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

  -- 책 금액이 기준 이상이면 배송비 무료 (D-039)
  if v_items_amount >= v_free_threshold then
    v_shipping_fee := 0;
  end if;

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
