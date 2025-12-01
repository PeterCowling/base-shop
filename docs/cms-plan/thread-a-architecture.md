# Thread A – Overall architecture & boundaries

This thread operationalises §1 of `docs/cms-research.md` into concrete work.

It focuses on:

- Source-of-truth semantics for shops/settings (Prisma vs JSON).
- Platform vs tenant responsibilities and public surfaces.
- Tenancy, environments, and deployment metadata.

---

## Context (from research)

- **Core building blocks**
  - `apps/cms` is the CMS UI + API, built on `@acme/platform-core` and `@acme/ui`.
  - `packages/platform-core` owns the domain model and persistence for shops, settings, pages, products, orders, cart/checkout, etc.
  - Runtime apps (template + tenants) sit on top of `platform-core` and `ui`.
- **Source of truth**
  - `Shop` / `ShopSettings` live in Prisma; JSON under `data/shops/*` acts as a mirror and operational metadata (deploy/upgrade, component versions, status) in most environments.
  - Repositories currently have hybrid paths (DB then JSON) controlled by `*_BACKEND` env vars and `DATA_ROOT`.
- **Tenancy and environments**
  - CMS + DB are multi-shop (`shopId` scoped); each storefront deployment is single-shop, bound via `NEXT_PUBLIC_SHOP_ID` or embedded `shop.json`.
  - Environments (dev/stage/prod) are separated by deployment + DB, not by an `env` field on `Shop`.

---

## Decisions / direction (to keep aligned)

- Treat Prisma/Postgres as canonical for **business state** in shared environments; JSON mirrors are for tooling, export/import, and operational metadata.
- Treat `data/shops/<id>` as canonical for **operational metadata** (deploy/upgrade history, component versions, status), not for core business state.
- Each repository resolves exactly one backend per process via `*_BACKEND` and fails fast if misconfigured; hybrid DB+JSON migration lives in tooling, not read paths.
- Platform vs tenant responsibility boundaries and public APIs are explicit and enforced by import rules.
- Tenancy remains “many shops in CMS/DB, one shop per storefront deployment” in v1; multi-tenant runtime is a future optimisation.

---

## Tasks

Each task is intended to be executable in a single focused Codex run.

- [ ] **ARCH-01 – Document platform vs tenant API surface**
  - Scope:
    - Extract the “platform vs tenant responsibilities” and “public surface vs internal details” decisions into a dedicated doc.
  - Implementation:
    - Add/extend a doc (e.g. `docs/architecture.md` or a new `docs/platform-vs-apps.md`) that:
      - Lists allowed `@acme/platform-core` and `@acme/ui` import subpaths for apps and CMS.
      - Clearly labels internal paths (e.g. `*.prisma.server.ts`, `*.json.server.ts`, `src/internal/**`).
    - Cross-link from `docs/cms-research.md` and any relevant package-level `README`s.
  - Definition of done:
    - One canonical document enumerating the public API surfaces and import rules.
    - At least one app (`apps/skylar` or `apps/cover-me-pretty`) checked and updated to comply with the documented import rules where trivial.
  - Dependencies:
    - None (pure documentation + quick import cleanup).

- [ ] **ARCH-02 – Enforce single backend per repo (`*_BACKEND`)**
  - Scope:
    - Refactor `packages/platform-core/src/repositories/*` to select exactly one backend (Prisma *or* JSON) per process using `*_BACKEND`.
  - Implementation:
    - Identify backend resolution helpers (e.g. `resolveRepo`, `resolveShopRepo`, etc.) for:
      - Shops, settings, pages, products, orders (target shops/settings first).
    - For each:
      - Read `*_BACKEND` once, validate value (`"prisma"`/`"json"`/etc.), fail fast if Prisma is selected but `DATABASE_URL` is invalid.
      - Route all reads/writes through the chosen backend without “try DB then JSON” fallback in hot paths.
      - Isolate hybrid migration logic (DB+JSON reconciliation) behind explicit tooling or one-off scripts, not in core repos.
  - Definition of done:
    - `SHOP_BACKEND` and `SETTINGS_BACKEND` control a single backend; no runtime fallback between DB and JSON in primary read/write calls.
    - Unit tests (or focused integration tests) cover:
      - “DB mode” (Prisma backend) and “JSON mode” (JSON backend) for at least shops and settings.
  - Dependencies:
    - Some familiarity with `docs/persistence.md` and `packages/platform-core/src/dataRoot.ts`.

- [x] **ARCH-03 – Separate business vs operational fields for shops**
  - Scope:
    - Implement the “business vs operational” split for `Shop` / `ShopSettings` between Prisma and JSON mirrors.
  - Implementation:
    - Identify business fields stored on `Shop`/`ShopSettings` vs operational/infra fields in `shop.json` / `deploy.json`.
    - Ensure that in DB mode:
      - Business reads/writes go exclusively through Prisma-backed repositories.
      - JSON mirrors are written only via shared repo functions and never mutated directly by deploy/upgrade scripts.
    - Where a field appears in both DB and JSON (e.g. navigation), document and enforce DB as canonical.
  - Definition of done:
    - Clear mapping of which fields are owned by Prisma vs JSON, captured in a doc (see `docs/persistence.md`).
    - Repo code avoids mixing the two responsibilities in a single function; deploy/upgrade tooling reads and updates operational metadata (`status`, `lastUpgrade`, `componentVersions`, etc.) without treating JSON as a second source of truth for business fields.
  - Dependencies:
    - Builds on ARCH-02 backend selection semantics.

- [ ] **ARCH-04 – Enforce `shopId` scoping in repositories**
  - Scope:
    - Ensure all per-shop repositories require `shopId` and that all queries are scoped appropriately.
  - Implementation:
    - Audit `packages/platform-core/src/repositories/*` for any per-shop methods that:
      - Do not take `shopId` as a parameter, or
      - Run queries without `shopId` in the where clause / composite keys.
    - Introduce helpers (e.g. `withShopScope`) to reduce duplication when adding `shopId` constraints.
  - Definition of done:
    - All per-shop repo functions take a `shopId` parameter.
    - No obvious per-shop queries without `shopId` filters.
    - Optional: a lint rule or small test that prevents adding new per-shop functions without `shopId`.
  - Dependencies:
    - None strict, but easier once ARCH-01 and ARCH-02 have clarified responsibilities and backends.

- [ ] **ARCH-05 – Capture tenancy & environment model in docs**
  - Scope:
    - Turn the tenancy + environments decisions into a concise, canonical diagram and narrative.
  - Implementation:
    - Update `docs/architecture.md` (or add a focused `docs/tenancy-and-environments.md`) to cover:
      - Multi-shop CMS + DB vs single-shop storefront deployments.
      - Environment boundaries (dev/stage/prod via deployment + DB, not via `Shop.env`).
      - How `NEXT_PUBLIC_SHOP_ID` and any embedded `shop.json` or `deploy.json` tie deployments to shops.
  - Definition of done:
    - One doc that new contributors can read to understand tenancy and environments without reading the entire research log.
  - Dependencies:
    - ARCH-01 (so the same doc also reflects platform vs tenant responsibilities where relevant).

- [x] **ARCH-06 – Add tests for `*_BACKEND` and data-root behaviour**
  - Scope:
    - Add focused tests around backend selection and `DATA_ROOT` usage for shops/settings.
  - Implementation:
    - In `packages/platform-core`, add tests that:
      - Set `SHOP_BACKEND` / `SETTINGS_BACKEND` to `"json"` and `"prisma"` and assert the correct backend is used.
      - Verify failure behaviour when Prisma is selected but `DATABASE_URL` is invalid.
      - Verify JSON mode does not touch Prisma at all.
  - Definition of done:
    - New tests guarding regression on backend selection semantics.
  - Dependencies:
    - ARCH-02 implementation to stabilise the behaviour being tested.

---

## Dependencies & validation

- This thread underpins all others; decisions here are referenced in threads B–F.
- Validation:
  - Docs updated: `docs/architecture.md` / new tenancy/source-of-truth docs exist and reference `cms-research`.
  - Repositories: unit tests (and/or small integration tests) pass for both Prisma and JSON modes for shops/settings.
  - Apps: at least one app uses only documented `@acme/platform-core` and `@acme/ui` public surfaces (no deep imports left in that app).
