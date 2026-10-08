-- File visibility looks up image rows; checking Storage inside this policy creates cyclic RLS.
-- The upload flow saves metadata only after Storage succeeds. Owner/path constraints remain enforced.
alter policy team_uploads_images on public.gallery_images
with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.gallery_members m where m.user_id = (select auth.uid()) and m.active)
);
