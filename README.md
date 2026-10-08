# SKINTIFIC Gallery

Company image library built with Next.js, hosted on Vercel, with Supabase Auth, Postgres, and Storage. The library is publicly viewable. Registered team accounts with active membership can upload and manage images. Anti Slop is applied during implementation. Design direction is in DESIGN.md.

## Connected projects

- Supabase: `nwewpaznnbbuewdyievo` (the project confirmed by the owner).
- Vercel: `skintific-gallery`, project `prj_aXtsTKrmiOqZnnbvURRHfN9xWxKP`.
- Originals bucket: `gallery-originals`, private, 15 MB per image.
- `.env.local` and `.vercel/project.json` are local configuration and ignored by Git. No service-role key is used.
- `.env.production` contains only the public Supabase project URL and publishable browser key so a fresh Vercel import connects to the existing gallery. Publishable keys do not bypass access policies. Do not add secret keys, service-role keys, passwords, or other private values to this tracked file. Vercel environment variables can override these defaults.

## First team account

1. Open [Supabase Authentication / Users](https://supabase.com/dashboard/project/nwewpaznnbbuewdyievo/auth/users). Create a user with an email and password, marking the email confirmed. Choose and share credentials privately; do not put passwords in this repository or chat.
2. Copy that user's UUID. Open Table Editor, select `gallery_members`, and insert a row with that `user_id` and `active = true`.
3. Open the app and sign in with the account. Repeat for each teammate. Disable public signups in Supabase Auth settings if they are enabled; the app provides no registration route, and an Auth account without an active membership can browse but cannot upload or manage images.
4. To remove access, set the membership's `active` field to false and revoke the user's sessions in Supabase. Already issued file URLs expire within one hour.

Alternatively, grant membership through the SQL Editor after replacing the placeholder UUID:

```sql
insert into public.gallery_members (user_id, active)
values ('REPLACE_WITH_AUTH_USER_UUID', true)
on conflict (user_id) do update set active = true;
```

Anyone can browse, search, open details, and download originals for images currently in the library. Trash and unindexed uploads stay restricted to approved accounts. Project owners administer memberships in Supabase. Members can upload, edit, trash, and restore the shared library. They cannot change ownership, alter file paths, grant memberships, or permanently delete indexed originals. There is no in-app member administration or password-reset screen in this first version; the project owner manages accounts.

## Local development

Use Node.js 24 LTS to match Vercel (the initial local build was also checked on installed Node 26). Run `npm ci`, populate the two variables from `.env.example`, then `npm run dev`. The connected checkout already has local configuration.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Browser checks use installed Microsoft Edge. Set Playwright's channel in `playwright.config.ts` for another browser. They run a separate test-only harness with intercepted API requests, never a sign-in bypass in the deployed application. Test files contain labelled fixtures only. Production account and file flows still need verification with a real approved member.

## Data and storage

The agreed next storage setup is Supabase for authentication and metadata, with Cloudflare R2 for photos. R2 migration is pending; this source currently uses Supabase Storage.

The committed migration defines members, image metadata, full-text search, collections, access policies, and the private bucket. It has been applied to the confirmed Supabase project through the connector. Its local filename matches the remote migration history. Do not reapply it manually to that project. Before using CLI migration pushes, link the project and confirm local/remote migration versions with `supabase migration list`.

The browser uploads directly to Storage, then creates the image record. If indexing fails, it tries to remove only the new unindexed upload. An interrupted connection or tab closure between these requests can leave an unindexed file; administrators can inspect Storage for these. SQL and Storage do not share a transaction.

Trash sets `deleted_at`; restore clears it. Original files remain in Storage. Do not manually delete files that have metadata rows. Search matches words in titles, filenames, collections, and tags, using Postgres web-search syntax. The gallery loads 36 images at a time with one-hour signed URLs and refreshes them after 45 minutes.

Initial previews use the original files, so large originals can be bandwidth-heavy. Dedicated thumbnail generation is a future performance improvement. Existing Drive images have not been imported.

## Deployment

`vercel.json` selects the Next.js preset, runs `npm run build`, and sets `outputDirectory` to `null` to use framework defaults. This overrides an incorrect `public` output directory in imported project settings. Keep the Vercel Root Directory at the repository root. The tracked `.env.production` supplies both public Supabase variables during production builds, including Vercel preview builds. You can override them through Vercel environment settings when changing projects.

The Vercel project is configured for Next.js with both public Supabase environment variables. Project source visibility is private. The app is at [skintific-gallery.vercel.app](https://skintific-gallery.vercel.app). Public gallery content can be viewed without a session; uploading and management require a Supabase session and active membership. Vercel's default project protection settings were retained. Deploy future updates from this folder with an authenticated Vercel CLI, or connect the source repository at https://github.com/radityabanyuskintific-hub/SKINTIFIC-GALLERY.

Implementation follows [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs) and [Storage access policies](https://supabase.com/docs/guides/storage/security/access-control). See VERIFICATION.md for actual checks and limitations.
