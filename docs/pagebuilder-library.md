Page Builder — Library Import/Export and Presets Feed

- Import/Export
  - Import or export library items via the Page Builder palette → “My Library” → Import/Export.
  - Export downloads a JSON array of items. Import accepts either an array or an object with `{ items: [...] }`.
  - On import, items get new ids and default to private (not shared).
  - Server-backed storage keeps items per user/shop, with an optional “Shared” flag to show to your team.

- Remote Presets Feed
  - Optionally supply a curated presets feed via `NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL`.
  - Value must point to JSON compatible with the local schema:
    - Array of objects: `{ id, label, description?, preview, category, build: () => PageComponent }`.
  - When set, the Presets modal will prefer the remote list; otherwise it falls back to the built-in presets.

Notes
- Library storage API: `GET/POST/PATCH/DELETE /api/library?shop=<id>` in the CMS app.
- Local snapshots in the browser are kept for speed and synced to the server in the background.

