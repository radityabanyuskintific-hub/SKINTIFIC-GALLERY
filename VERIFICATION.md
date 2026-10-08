# Verification: 8 October 2026

## Public viewing update (latest)

This section supersedes the initial private-viewing and anonymous-read checks below.

- PASS: public gallery opens without a session; live browser sees the published image and its signed preview.
- PASS: guests can open details and download originals; upload directs to login. Edit, Trash, and Restore controls are hidden from guests.
- PASS: live transaction tests allow approved-member inserts and edits, while guest uploads and edits are blocked. Public queries exclude Trash, unindexed files, and memberships. All fixtures rolled back.
- PASS: five browser integration tests, lint, typecheck, and production build.
- PASS: live `tests/check-public.mjs` and updated `tests/check-login.mjs`, including accessibility scans, mobile overflow, sign-in link, and no JavaScript page errors.
- PASS: Vercel production deployment `dpl_7tCccs51tBMWuS8HpNRZi3sSYgj4` reported READY and serves the updated gallery.
- Database migrations retain active membership for writes. The insert policy checks ownership and active membership; upload completion is verified by the application before saving metadata, avoiding cyclic image/storage access policies.
- Current Supabase advisor reports the Auth account setting for leaked-password protection is disabled, with no database policy findings. Guidance: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Build and deployment

- PASS: `npm run build`, Next.js 16.4.0 production build.
- PASS: `npm run typecheck` and `npm run lint`.
- PASS: `npm test`, 2 validation tests covering unsupported/oversized/empty files and metadata boundaries.
- PASS: Vercel deployment `dpl_F4pAbdTq8GdLE6NVnsNZgupsLjN9` reported READY. First deployment was assigned the production target by Vercel.
- PASS: production login responds HTTP 200 at https://skintific-gallery.vercel.app/login.
- PASS: `.env.local` and `.vercel/project.json` are ignored by Git. No service-role key is used or shipped.

## Browser checks and Anti Slop evidence

`npm run test:e2e`: 4 passing Microsoft Edge tests. Gallery tests run a separate harness with intercepted Supabase responses and labelled synthetic files. These are UI integration checks, not evidence of a real authenticated production upload.

- R-26 PASS: header and empty-state Upload open the dialog; file selection and upload create a visible card; unsupported SVG shows an actionable error; Cancel and Close dismiss the dialog.
- R-26 PASS: detail preview opens; Edit saves the title; download requests a signed original and produces a browser download; Trash asks for confirmation; Keep image cancels; confirmed Trash removes the card; Restore returns it to Library.
- R-26 PASS: search displays matching/empty states; Clear filters restores results; collection selection filters cards; sorting changes order; Load more expands 36 records to 38; Refresh fetches again; notification dismisses; Sign out navigates to login.
- R-27 PASS: first-run empty state, empty Trash, no search results, loading, and API error/retry paths exercised.
- R-32 PASS: keyboard Enter opens a card; Escape closes its modal; focus returns to the opening card. Native dialog supplies modal focus containment.
- R-03 PASS: populated library has no horizontal overflow at 320, 375, 768, and 1440 px. Mobile upload dialog also fits. Desktop/mobile screenshots inspected.
- R-25 PASS: axe WCAG A/AA scans report zero violations for mobile gallery, image details, and login.
- R-35 PASS for tested scope: local production build and deployed login both exercised. Gallery UI tests recorded no JavaScript page errors.
- Purpose and liveliness PASS for the initial direction: DESIGN.md records inherited blue/white palette, system typography, image-led hierarchy, restrained radii, modal-only shadow, fixed light comparison background, and ENERGY 1 / RHYTHM 1 / MOTION 1.
- Content honesty PASS: no production fixture images, invented team identities, activity, or counts. The library is actually empty.

`node tests/check-login.mjs` passed against the local production server and, using `GALLERY_TEST_URL`, the live Vercel URL. It verifies unauthenticated redirect, browser-required fields, invalid-login feedback using an intercepted response, axe, mobile overflow, and no page errors. It does not prove a successful real-user sign-in.

## Supabase checks

- PASS: migration applied to the owner-confirmed project. Local migration filename matches remote version `20261008034138`.
- PASS: live transaction tests validated member insert/read, tag full-text search, trash/restore, blocked ownership reassignment, blocked permanent metadata deletion, outsider isolation, and disabled-member isolation.
- PASS: anonymous REST requests for images, collections, and memberships returned HTTP 401.
- PASS: security advisor returned no findings after migration.
- PASS: rollback cleanup verified: 0 images, 0 memberships, 0 Auth users remain. No real team image was used for deletion tests.

## Remaining setup and limits

- First approved account must be created by the owner. Successful real-user sign-in, actual Storage byte upload/download, and session-expiry behavior remain to be checked with that account.
- Vercel connector's protected fetch helper returned 403 when requesting bypass metadata. Ordinary production access worked; direct browser checks succeeded. No protection setting was disabled.
- `npm audit --omit=dev`: 0 vulnerabilities. Full audit reports 5 high-severity development-tool findings, all stemming from `braces` through the Next ESLint toolchain (GHSA-vfj7-8cjw-p6xm). Registry latest was 3.0.3, with no patched release available. Do not downgrade Next's ESLint configuration across major versions just to silence the audit; update when the toolchain fix ships. These findings do not affect deployed runtime dependencies.
- Original files currently supply previews. Thumbnail generation, Drive import, and in-app account administration are not included.
- Real mobile on-screen keyboard and manual 200% zoom testing were not performed. Automated accessibility checks do not replace a full manual audit.


## October 8 image-only UI revision

- PASS: ESLint and production build.
- PASS: 5 Edge browser tests, covering guest restrictions, upload/edit/trash/restore, pagination, exact tag filtering, collection/sort, download, keyboard modal behavior, empty/error retry states, and responsive widths 320/375/768/1440.
- PASS: automated axe checks in guest, empty mobile, and image-detail states. Menu supports Escape and outside-click dismissal. Feed titles are accessible button names while visible tiles contain only images.
- Desktop/mobile screenshots: test-results/desktop-feed.png and mobile-feed.png. These use geometric test fixtures, not production photos. Reference supplied by user is the UI direction; no reference artwork was copied into the product.
- Supabase tag discovery fetches tag arrays in ordered batches of 1000 records and deduplicates them. This avoids losing tags beyond the first image page; an indexed aggregate endpoint would be appropriate as the library grows.
- Production deployment attempted through Vercel connector: HTTP 403, connector not authorized for the existing team scope. Existing production site has not been updated by this attempt.
- Real-photo verification from local production build could not complete: requests to the Supabase project hostname failed with ERR_NAME_NOT_RESOLVED on this machine. No real photo or account was modified during this revision.
- Cloudflare R2 photo storage remains the agreed next direction; no storage migration was performed as part of the UI revision.

- CLI deployment fallback also failed: Vercel CLI could not load the user (fetch failed). No production deployment succeeded.
