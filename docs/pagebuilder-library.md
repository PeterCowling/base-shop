Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

Page Builder — Library Import/Export and Presets Feed

- Import/Export
  - Import or export library items via the Page Builder palette → “My Library” → Import/Export.
  - Export downloads a JSON array of items. Import accepts either an array or an object with `{ items: [...] }`.
  - On import, items get new ids and default to private (not shared).
  - Server-backed storage keeps items per user/shop, with an optional “Shared” flag to show to your team.

- Remote Presets Feed
  - Optionally supply a curated presets feed via `NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL`.
  - Endpoint must return JSON in this shape:
    - Array of objects (or `{ items: [...] }`) with: `{ id, label, description?, preview, category: "Hero"|"Features"|"Testimonials"|"Commerce", template: PageComponent }`.
  - The Presets modal validates the feed and maps each item into an internal “build” function that inserts the provided `template`.
  - If the feed is unreachable or invalid, the built‑in curated presets are used.

Notes
- Library storage API: `GET/POST/PATCH/DELETE /api/library?shop=<id>` in the CMS app.
- Local snapshots in the browser are kept for speed and synced to the server in the background.
