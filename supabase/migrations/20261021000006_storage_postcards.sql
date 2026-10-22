-- TKT-DB-04 · 03-db-schema.md §6
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('postcards', 'postcards', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 경로 규칙: cycles/<cycle_id>/postcard.<ext>
create policy postcards_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'postcards' and public.is_admin())
  with check (bucket_id = 'postcards' and public.is_admin());

-- 회원: 본인 회차이고 언박싱한 경우에만 (INV-01)
create policy postcards_member_select_unboxed on storage.objects
  for select to authenticated
  using (
    bucket_id = 'postcards'
    and (storage.foldername(name))[1] = 'cycles'
    and exists (
      select 1 from public.subscription_cycles c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = auth.uid()
        and c.status = 'unboxed'));
