-- TKT-DB-01 · 03-db-schema.md §3.3, §4(products), §5(audit_rls), §7(app_constants)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  author text not null,
  publisher text not null,
  theme public.theme not null,
  price integer not null check (price >= 0),
  image_url text not null,
  description text not null,
  bookkeeper_note text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0), -- INV-08
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_theme_idx on public.products (theme);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy products_select_all on public.products
  for select to anon, authenticated
  using (true);

-- 관리자는 재고만 수정 (D-006). 관리자 update 정책은 is_admin()이 생기는 20261021000003에서 만든다.
revoke update on public.products from anon, authenticated;
grant update (stock_quantity) on public.products to authenticated;

-- 임시 금액 (Q-013, D-032). 화면과 DB 함수가 같은 값을 쓴다.
create function public.app_constants()
  returns table (shipping_fee integer, subscription_monthly_price integer)
  language sql
  immutable
  set search_path = ''
as $$
  select 3000, 18000
$$;
grant execute on function public.app_constants() to anon, authenticated, service_role;

-- GATE-07: public 테이블별 RLS 여부와 정책 수
create function public.audit_rls()
  returns table (table_name text, rls_enabled boolean, policy_count integer)
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select c.relname::text,
         c.relrowsecurity,
         (select count(*)::integer from pg_catalog.pg_policies p
           where p.schemaname = 'public' and p.tablename = c.relname)
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
$$;
revoke execute on function public.audit_rls() from public, anon, authenticated;
grant execute on function public.audit_rls() to service_role;
