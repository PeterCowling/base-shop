# @acme/cms-marketing

CMS-only marketing UIs and logic (campaigns, discounts, email scheduling, segments, shared UI) that sit above `@acme/platform-core` and `@acme/ui` and below the CMS app.

See:

- `docs/architecture.md` – package layering and public surfaces.
- `docs/platform-vs-apps.md` – platform vs apps responsibilities and public API.

Code in this package should depend on platform-core for domain operations and on `@acme/ui` for layout and Page Builder primitives, without importing from app `src/` paths or other internal modules.
