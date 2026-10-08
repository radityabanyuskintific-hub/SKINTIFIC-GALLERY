grant select on public.gallery_images, public.gallery_collections to anon;
create policy public_reads_library on public.gallery_images
for select to anon, authenticated using (deleted_at is null);
create policy public_reads_library_files on storage.objects
for select to anon, authenticated using (
  bucket_id = 'gallery-originals'
  and exists (
    select 1 from public.gallery_images i
    where i.storage_path = storage.objects.name and i.deleted_at is null
  )
);
create or replace view public.gallery_collections with (security_invoker = true) as
select collection as name, count(*) as image_count from public.gallery_images
where collection <> '' and deleted_at is null group by collection;
