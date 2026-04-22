-- Stage 3: Supabase Storage buckets + RLS for seller-uploaded photos.
--
-- Two buckets: one for shop cover photos, one for product photos. Both public
-- so <Image> can read them without a signed URL; writes are scoped to the
-- authenticated seller who owns the object.

insert into storage.buckets (id, name, public)
values
  ('shop-photos',    'shop-photos',    true),
  ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- Public read
create policy if not exists "shop_photos_public_read" on storage.objects
  for select using (bucket_id = 'shop-photos');

create policy if not exists "product_photos_public_read" on storage.objects
  for select using (bucket_id = 'product-photos');

-- Authenticated sellers upload (any path, since we namespace client-side)
create policy if not exists "shop_photos_auth_insert" on storage.objects
  for insert with check (
    bucket_id = 'shop-photos' and auth.uid() is not null
  );

create policy if not exists "product_photos_auth_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-photos' and auth.uid() is not null
  );

-- Owner-only update/delete
create policy if not exists "shop_photos_owner_mutate" on storage.objects
  for update using (bucket_id = 'shop-photos' and owner = auth.uid());

create policy if not exists "shop_photos_owner_delete" on storage.objects
  for delete using (bucket_id = 'shop-photos' and owner = auth.uid());

create policy if not exists "product_photos_owner_mutate" on storage.objects
  for update using (bucket_id = 'product-photos' and owner = auth.uid());

create policy if not exists "product_photos_owner_delete" on storage.objects
  for delete using (bucket_id = 'product-photos' and owner = auth.uid());
