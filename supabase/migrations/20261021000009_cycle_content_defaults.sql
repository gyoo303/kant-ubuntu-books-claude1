-- TKT-DB-06 보완: 부분 저장 인자에 기본값(null)을 둬서 바꾸지 않을 항목은 생략할 수 있게 한다.
-- 생성 타입에서 선택 인자가 되도록 (types/database.ts). 동작은 20261021000008과 같다.
create or replace function public.admin_save_cycle_content(
  p_cycle_id uuid,
  p_product_id uuid default null,
  p_reply_letter text default null,
  p_postcard_path text default null,
  p_teaser text default null)
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
