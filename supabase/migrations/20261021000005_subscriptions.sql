-- TKT-DB-04 · 03-db-schema.md §3.5, §4(구독 관련 행)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.subscription_status not null default 'active',
  monthly_price integer not null check (monthly_price > 0),
  billing_day smallint not null check (billing_day between 1 and 31),
  next_billing_date date,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  ended_at timestamptz,
  end_reason text check (end_reason in ('payment_failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'active') = (next_billing_date is not null)), -- INV-19
  check (status <> 'cancelled' or cancelled_at is not null),
  check (status <> 'ended' or (ended_at is not null and end_reason is not null))
);
create unique index subscriptions_one_active on public.subscriptions (user_id) where status = 'active'; -- INV-17
create index subscriptions_billing_idx on public.subscriptions (next_billing_date) where status = 'active';
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.payments
  add constraint payments_subscription_fk foreign key (subscription_id) references public.subscriptions (id) on delete restrict;

create table public.billing_keys (
  subscription_id uuid primary key references public.subscriptions (id) on delete cascade,
  customer_key uuid not null,
  billing_key text not null,
  created_at timestamptz not null default now()
);

create table public.subscription_drafts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  letter_body text not null check (char_length(letter_body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscription_drafts_set_updated_at before update on public.subscription_drafts
  for each row execute function public.set_updated_at();

create table public.subscription_cycles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  cycle_no integer not null check (cycle_no >= 1),
  status public.cycle_status not null,
  payment_id uuid not null unique references public.payments (id) on delete restrict, -- INV-05
  teaser text check (char_length(teaser) between 1 and 100),
  reading_started_at timestamptz,
  shipped_at timestamptz,
  unboxed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, cycle_no),
  check (status not in ('reading', 'shipped', 'unboxed') or reading_started_at is not null),
  check (status not in ('shipped', 'unboxed') or (shipped_at is not null and teaser is not null)), -- INV-15
  check (status <> 'unboxed' or unboxed_at is not null)
);
create index cycles_user_idx on public.subscription_cycles (user_id, cycle_no desc);
create index cycles_status_idx on public.subscription_cycles (status, created_at);
create trigger subscription_cycles_set_updated_at before update on public.subscription_cycles
  for each row execute function public.set_updated_at();

create table public.subscription_letters (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  cycle_id uuid unique references public.subscription_cycles (id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index letters_one_stored on public.subscription_letters (subscription_id) where cycle_id is null; -- D-027
create trigger subscription_letters_set_updated_at before update on public.subscription_letters
  for each row execute function public.set_updated_at();

create table public.cycle_contents (
  cycle_id uuid primary key references public.subscription_cycles (id) on delete restrict,
  product_id uuid references public.products (id) on delete restrict,
  reply_letter text check (char_length(reply_letter) between 1 and 2000),
  postcard_path text,
  updated_at timestamptz not null default now()
);
create trigger cycle_contents_set_updated_at before update on public.cycle_contents
  for each row execute function public.set_updated_at();

create table public.unboxing_codes (
  cycle_id uuid primary key references public.subscription_cycles (id) on delete restrict,
  code char(6) not null check (code ~ '^[0-9]{6}$'),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz
);
create unique index unboxing_codes_unique_unredeemed on public.unboxing_codes (code) where redeemed_at is null; -- INV-02

create table public.unboxing_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  cycle_id uuid not null references public.subscription_cycles (id) on delete cascade,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);
create index unboxing_attempts_user_idx on public.unboxing_attempts (user_id, attempted_at desc);

create table public.shelf_memos (
  cycle_id uuid primary key references public.subscription_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shelf_memos_set_updated_at before update on public.shelf_memos
  for each row execute function public.set_updated_at();

create table public.farewell_letters (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger farewell_letters_set_updated_at before update on public.farewell_letters
  for each row execute function public.set_updated_at();

create table public.farewell_notes (
  subscription_id uuid primary key references public.subscriptions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

-- RLS (03-db-schema.md §4)
alter table public.subscriptions enable row level security;
alter table public.billing_keys enable row level security; -- 정책 없음: service role만 (RISK-08)
alter table public.subscription_drafts enable row level security;
alter table public.subscription_cycles enable row level security;
alter table public.subscription_letters enable row level security;
alter table public.cycle_contents enable row level security;
alter table public.unboxing_codes enable row level security;
alter table public.unboxing_attempts enable row level security; -- 정책 없음: RPC만 기록
alter table public.shelf_memos enable row level security;
alter table public.farewell_letters enable row level security;
alter table public.farewell_notes enable row level security;

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy subscriptions_select_admin on public.subscriptions
  for select to authenticated using (public.is_admin());

create policy drafts_select_own on public.subscription_drafts
  for select to authenticated using (user_id = auth.uid());
create policy drafts_insert_own on public.subscription_drafts
  for insert to authenticated with check (user_id = auth.uid());
create policy drafts_update_own on public.subscription_drafts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy drafts_delete_own on public.subscription_drafts
  for delete to authenticated using (user_id = auth.uid());

create policy cycles_select_own on public.subscription_cycles
  for select to authenticated using (user_id = auth.uid());
create policy cycles_select_admin on public.subscription_cycles
  for select to authenticated using (public.is_admin());

create policy letters_select_own on public.subscription_letters
  for select to authenticated using (user_id = auth.uid());
create policy letters_select_admin on public.subscription_letters
  for select to authenticated using (public.is_admin());

-- INV-01: 회원은 언박싱한 회차의 책·답장·엽서만 읽는다
create policy cycle_contents_select_own_unboxed on public.cycle_contents
  for select to authenticated
  using (exists (
    select 1 from public.subscription_cycles c
    where c.id = cycle_id and c.user_id = auth.uid() and c.status = 'unboxed'));
create policy cycle_contents_select_admin on public.cycle_contents
  for select to authenticated using (public.is_admin());

-- INV-04: 회원 정책 없음
create policy unboxing_codes_select_admin on public.unboxing_codes
  for select to authenticated using (public.is_admin());

-- INV-11: 본인만, 관리자 정책 없음
create policy shelf_memos_select_own on public.shelf_memos
  for select to authenticated using (user_id = auth.uid());
create policy shelf_memos_insert_own_unboxed on public.shelf_memos
  for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.subscription_cycles c
    where c.id = cycle_id and c.user_id = auth.uid() and c.status = 'unboxed'));
create policy shelf_memos_update_own on public.shelf_memos
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy shelf_memos_delete_own on public.shelf_memos
  for delete to authenticated using (user_id = auth.uid());

create policy farewell_letters_select_own on public.farewell_letters
  for select to authenticated using (user_id = auth.uid());
create policy farewell_letters_select_admin on public.farewell_letters
  for select to authenticated using (public.is_admin());
create policy farewell_letters_insert_admin on public.farewell_letters
  for insert to authenticated
  with check (public.is_admin() and exists (
    select 1 from public.subscriptions s where s.user_id = farewell_letters.user_id and s.status = 'active'));
create policy farewell_letters_update_admin on public.farewell_letters
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and exists (
    select 1 from public.subscriptions s where s.user_id = farewell_letters.user_id and s.status = 'active'));

create policy farewell_notes_select_admin on public.farewell_notes
  for select to authenticated using (public.is_admin());
