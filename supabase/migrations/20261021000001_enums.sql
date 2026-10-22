-- TKT-DB-01 · 03-db-schema.md §3.1
create extension if not exists pgcrypto with schema extensions;

create type public.theme as enum ('nature', 'food', 'ecology', 'local');
create type public.order_status as enum ('pending_payment', 'paid', 'shipped', 'cancelled', 'refunded');
create type public.payment_status as enum ('ready', 'confirmed', 'failed', 'refunded');
create type public.payment_purpose as enum ('order', 'subscription_cycle');
create type public.subscription_status as enum ('active', 'cancelled', 'ended');
create type public.cycle_status as enum ('awaiting_letter', 'letter_arrived', 'reading', 'shipped', 'unboxed');

create function public.set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;
