-- TKT-DB-02 · 03-db-schema.md §3.2, §4(profiles, shipping_addresses, products 관리자 update) · ADR-003
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- auth.users insert 시 profiles 생성. 소셜 로그인 이름은 비어 올 수 있어 기본값 ''.
create function public.handle_new_user() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      ''
    )
  );
  return new;
end
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create table public.shipping_addresses (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  recipient_name text not null check (char_length(recipient_name) between 1 and 50),
  phone text not null check (phone ~ '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$'),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  address1 text not null check (char_length(address1) between 1 and 200),
  address2 text not null default '' check (char_length(address2) <= 100),
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shipping_addresses_set_updated_at before update on public.shipping_addresses
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.shipping_addresses enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());

create policy shipping_select_own on public.shipping_addresses
  for select to authenticated using (user_id = auth.uid());
create policy shipping_insert_own on public.shipping_addresses
  for insert to authenticated with check (user_id = auth.uid());
create policy shipping_update_own on public.shipping_addresses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy shipping_select_admin on public.shipping_addresses
  for select to authenticated using (public.is_admin());

-- 관리자 재고 수정 (컬럼 권한은 20261021000002에서 stock_quantity만 부여)
create policy products_update_admin on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
