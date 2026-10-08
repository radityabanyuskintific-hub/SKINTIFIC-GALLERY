# Gallery direction

Anti Slop applies during the build, as selected by the user.

The October 8 revision follows the supplied Cosmos reference and the explicit brief: clean and straightforward, images only, tag filters immediately below the header. ENERGY 1 / RHYTHM 2 / MOTION 1.

- White canvas and neutral text let uploaded images supply the color and character.
- The header contains the existing SKINTIFIC Visual Bank name, search, upload/sign-in, and a compact options menu. No hero, introduction, or account summary occupies the feed.
- Actual tags form a horizontal filter strip below the header. Selected tags use dark fill; filtering uses exact tag membership and combines with search and collection filters.
- The masonry feed preserves image proportions, with nearly square corners and generous gutters inspired by the supplied reference. Five columns on wide desktop, two on phones. DOM and keyboard order follow the columns.
- Tiles contain only images. Titles remain accessible button names and appear with tags, collection, and file details when opened.
- Collection, sorting, refresh, Trash, and sign-out live in the options menu. The menu supports keyboard interaction, Escape, and outside-click dismissal.
- Arial/Helvetica remains the product font. Blue is retained for form actions and keyboard focus, not used as feed decoration.
- Shadows indicate an open menu or dialog. Motion is limited to interaction feedback, with reduced-motion support. Tag controls remain at least 44 pixels tall, with focus clearance inside the scroll strip.
- No copied Cosmos logo, onboarding cards, avatars, advertising, or invented gallery content.
- Public browsing and active registered team upload/manage access remain. Trash and editing stay hidden from guests.

Storage direction agreed: Supabase for authentication and gallery metadata; Cloudflare R2 for photos. R2 migration is a separate pending task. The UI revision continues using the existing Supabase photo bucket.
