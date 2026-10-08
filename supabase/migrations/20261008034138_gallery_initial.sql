create table public.gallery_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gallery_members enable row level security;
revoke all on public.gallery_members from anon, authenticated;
grant select on public.gallery_members to authenticated;
create policy member_sees_own_access on public.gallery_members for select to authenticated
  using (user_id = (select auth.uid()));

create table public.gallery_images (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  storage_path text not null unique,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  filename text not null check (char_length(filename) between 1 and 255),
  collection text not null default '' check (char_length(collection) <= 80),
  tags text[] not null default '{}' check (cardinality(tags) <= 20 and char_length(array_to_string(tags, ',')) <= 820 and array_position(tags, null) is null),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/gif')),
  bytes bigint not null check (bytes between 1 and 15728640),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_document tsvector not null default ''::tsvector,
  constraint image_owner_path check (
    storage_path = owner_id::text || '/' || id::text || '.' ||
      case mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png'
      when 'image/webp' then 'webp' when 'image/gif' then 'gif' end
  )
);
create function public.gallery_index_image() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.title := btrim(new.title);
  new.collection := btrim(new.collection);
  new.updated_at := now();
  new.search_document := to_tsvector('simple'::regconfig,
    new.title || ' ' || new.filename || ' ' || new.collection || ' ' || array_to_string(new.tags, ' '));
  return new;
end;
$$;
revoke all on function public.gallery_index_image() from public, anon, authenticated;
create trigger gallery_image_index before insert or update on public.gallery_images
for each row execute function public.gallery_index_image();

create index gallery_images_search on public.gallery_images using gin(search_document);
create index gallery_images_recent on public.gallery_images(created_at desc, id);
create index gallery_images_collection on public.gallery_images(collection, created_at desc);
create index gallery_images_owner on public.gallery_images(owner_id);
alter table public.gallery_images enable row level security;
revoke all on public.gallery_images from anon, authenticated;
grant select on public.gallery_images to authenticated;
grant insert(id, owner_id, storage_path, title, filename, collection, tags, mime_type, bytes, width, height) on public.gallery_images to authenticated;
grant update(title, collection, tags, deleted_at) on public.gallery_images to authenticated;

create policy team_reads_images on public.gallery_images for select to authenticated
using (exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active));
create policy team_uploads_images on public.gallery_images for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active)
  and exists (select 1 from storage.objects o where o.bucket_id = 'gallery-originals' and o.name = storage_path)
);
create policy team_edits_images on public.gallery_images for update to authenticated
using (exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active))
with check (exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active));

create view public.gallery_collections with (security_invoker = true) as
select collection as name, count(*) as image_count
from public.gallery_images where collection <> ''
group by collection;
revoke all on public.gallery_collections from anon, authenticated;
grant select on public.gallery_collections to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-originals', 'gallery-originals', false, 15728640,
  array['image/jpeg','image/png','image/webp','image/gif']);

create policy gallery_team_reads_files on storage.objects for select to authenticated
using (bucket_id = 'gallery-originals'
  and exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active));
create policy gallery_team_uploads_files on storage.objects for insert to authenticated
with check (bucket_id = 'gallery-originals'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active));
create policy gallery_owner_cleans_unindexed_uploads on storage.objects for delete to authenticated
using (bucket_id = 'gallery-originals'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active)
  and not exists (select 1 from public.gallery_images i where i.storage_path = name));
