---
Type: Plan
Status: Active
Domain: Platform
Created: 2026-02-06
Last-updated: 2026-02-06
Last-reviewed: 2026-02-06
Feature-Slug: article-generation-pipeline
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: PLAT
Relates-to charter: none
---

# Article Generation Pipeline Plan

## Summary

Centralise guide data out of Brikette into the platform layer (following the product repository pattern), extract translation and validation tooling into shared packages, build CMS guide management pages, and create an AI-assisted content pipeline for producing multilingual guides across all businesses. This replaces the CMS Sanity blog system and is the key enabler for L1-to-L2 business progression.

The work is divided into four delivery slices, each independently shippable: (1) centralise read path + data model, (2) translation + validation as shared tooling, (3) CMS authoring + workflow, (4) AI pipeline. This plan covers **Slice 1 in full detail** (ready to build) and **Slices 2-4 at seed level** (requiring `/plan-feature` once Slice 1 lands).

## Goals

- Centralise guide storage, types, and repository into `@acme/platform-core` following the product pattern exactly
- Enable any storefront to consume guide data via `readGuideRepo(shop)`
- Migrate Brikette's 168 guides to the centralised store without breaking the live site
- Establish the foundation for CMS guide management (Slice 3) and AI pipeline (Slice 4)

## Non-goals

- CMS guide editor (Slice 3 -- planned separately)
- AI drafting pipeline (Slice 4 -- planned separately)
- Retiring Brikette draft routes (Slice 3 dependency)
- Retiring CMS Sanity blog (Slice 3 dependency)
- Block type centralisation (deferred -- blocks stay app-specific per fact-find default)

## Constraints & Assumptions

- Constraints:
  - Must not break Brikette during migration (dual-read during transition)
  - Guide content must remain structured JSON (not free-form rich text)
  - Product repository pattern invariants must be followed (10 invariants from fact-find)
  - Risk-tier field must be present in types even if enforcement is Slice 3+
- Assumptions:
  - Pete is the primary editor (content-as-code decision stands)
  - Brikette's 168 guides are the seed data
  - Status enum unified to `"draft" | "review" | "published"` (not "live")

## Fact-Find Reference

- Related brief: `docs/plans/article-generation-pipeline-fact-find.md`
- Key findings:
  - Zero guide types in `@acme/types` -- all live in `apps/brikette/src/routes/guides/`
  - CMS has zero guide functionality -- only Sanity blog
  - Product repo pattern: 10 invariants documented with exact replication steps
  - Status enum divergence: manifest uses "live", index uses "published" -- resolved to use "published"
  - Content-as-code recommended over CMS-first (single author, batch editing, product pattern consistency)
  - `./repositories/*` wildcard export covers new files automatically
  - Barrel `json.server.ts` needs explicit `export * from "./guides.server"` added
  - Authoring write path has zero test coverage (APIs, editor, editorial panel)
  - Script extractability: 2 ready, 3 parameterisable, 2 need architecture work, 3 need rewriting

## Existing System Notes

- Key modules/files:
  - `packages/platform-core/src/repositories/products.types.ts` -- Repository interface pattern to follow
  - `packages/platform-core/src/repositories/products.json.server.ts` -- JSON backend pattern (atomic writes, validateShopName, error handling)
  - `packages/platform-core/src/repositories/products.server.ts` -- Facade pattern (repoPromise singleton, resolveRepo, named exports)
  - `packages/platform-core/src/repositories/json.server.ts` -- Barrel export file
  - `packages/platform-core/src/repositories/repoResolver.ts` -- Backend resolution engine
  - `packages/types/src/Product.ts` -- Domain type pattern (ProductCore + ProductPublication)
  - `apps/brikette/src/routes/guides/content-schema.ts` -- Zod content schema to centralise
  - `apps/brikette/src/routes/guides/guide-manifest.ts` -- Manifest types (GuideManifestEntry, GuideStatus, etc.)
  - `apps/brikette/src/data/guides.index.ts` -- GuideMeta, GuideNamespaceKey types
  - `apps/brikette/src/locales/_guides/node-loader.ts` -- Content filesystem I/O
- Patterns to follow:
  - `import "server-only"` on every `.server.ts` file
  - `validateShopName(shop)` in every path-building function
  - Atomic writes via temp-file-then-rename
  - `row_version` auto-increment server-side in `update`
  - `repoPromise` singleton with `resolveRepo({ backendEnvVar: "GUIDES_BACKEND" })`
  - Read returns `[]` on missing file
  - `ulid()` for new entity IDs
  - Error messages include entity + shop
  - CMS server actions: `"use server"` + `ensureAuthorized()` first line

## Proposed Approach

### Architecture

Follow the exact three-layer product repository pattern:

```
@acme/types                          ← GuideCore, GuidePublication, GuideContentInput
  ↓
@acme/platform-core/repositories
  ├── guides.types.ts                ← GuidesRepository interface
  ├── guides.json.server.ts          ← JSON filesystem backend
  ├── guides.prisma.server.ts        ← Passthrough to JSON (for now)
  └── guides.server.ts               ← Public facade (readGuideRepo, etc.)
  ↓
json.server.ts (barrel)              ← export * from "./guides.server"
  ↓
apps/brikette                        ← Switches from local content to readGuideRepo(shop)
```

### Data model decisions

- **Status enum:** `"draft" | "review" | "published"` (unified). During migration, manifest `"live"` maps to `"published"`.
- **Content storage:** Single JSON file per shop: `data/shops/{shopId}/guides.json` containing an array of `GuidePublication` objects. Each object holds the guide metadata (manifest fields) plus a `content` field containing locale-keyed content (`Record<Locale, GuideContentInput>`).
  - Alternative considered: per-guide-per-locale files (`data/shops/{shopId}/guides/{guideKey}/{locale}.json`). Rejected because: product pattern uses a single array file per entity, and the repository interface assumes `read(shop): T[]`. Consistency with products is more important than optimal file granularity at this stage.
  - Trade-off: large file for 168 guides with 18 locales. Mitigation: content field is lazy-loaded via a separate `getGuideContent(shop, key, locale)` method that reads from a split content directory.
- **Split storage approach:** Metadata in `data/shops/{shopId}/guides.json` (array of guide metadata without content). Content in `data/shops/{shopId}/guides/content/{guideKey}/{locale}.json`. This mirrors Brikette's split-directory pattern and keeps the main file manageable.
- **Block types:** Stored as `blocks: unknown[]` in the platform type. Each app validates on read with its own block type schema. This avoids coupling all businesses to Brikette's 14-block vocabulary.
- **Risk tier:** `riskTier: 0 | 1 | 2` field on `GuidePublication`. Defaults to 0. Enforcement is Slice 3.

## Active tasks

- TASK-01: Define guide types in `@acme/types` (Pending)
- TASK-02: Create `GuidesRepository` interface (Pending, depends on TASK-01)
- TASK-03: Implement JSON backend (`guides.json.server.ts`) (Pending, depends on TASK-02)
- TASK-04: Create server facade (`guides.server.ts`) (Pending, depends on TASK-03)
- TASK-05: Add to barrel export and Prisma passthrough (Pending, depends on TASK-04)
- TASK-06: Write migration script: Brikette → centralised store (Pending, depends on TASK-03)
- TASK-07: Wire Brikette storefront to read from centralised store (Pending, depends on TASK-04, TASK-06)
- TASK-08: Validate migration data integrity (Pending, depends on TASK-06)
- TASK-09: Confirm Slice 2-4 scope and sequencing (Pending, depends on TASK-07)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Define guide types in `@acme/types` | 90% | S | Pending | - |
| TASK-02 | IMPLEMENT | Create `GuidesRepository` interface | 92% | S | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Implement JSON backend (`guides.json.server.ts`) | 85% | M | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Create server facade (`guides.server.ts`) | 90% | S | Pending | TASK-03 |
| TASK-05 | IMPLEMENT | Add to barrel export and Prisma passthrough | 92% | S | Pending | TASK-04 |
| TASK-06 | IMPLEMENT | Write migration script: Brikette → centralised store | 80% | M | Pending | TASK-03 |
| TASK-07 | IMPLEMENT | Wire Brikette storefront to read from centralised store | 82% | M | Pending | TASK-04, TASK-06 |
| TASK-08 | INVESTIGATE | Validate migration data integrity | 75% ⚠️ | S | Pending | TASK-06 |
| TASK-09 | DECISION | Confirm Slice 2-4 scope and sequencing | 70% ⚠️ | S | Pending | TASK-07 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Define guide types in `@acme/types`

- **Type:** IMPLEMENT
- **Affects:**
  - `packages/types/src/Guide.ts` (new)
  - `packages/types/src/index.ts`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 95% — Direct pattern from `Product.ts`: define `GuideCore` interface + `GuidePublication` extension. `ProductCore`/`ProductPublication` at `packages/types/src/Product.ts` is the exact template.
  - Approach: 90% — Types mirror resolved decisions from fact-find (unified status enum, risk tier, schemaVersion, content-as-code). Block types as `unknown[]` is the simplest viable approach.
  - Impact: 85% — New file, additive only. Re-exported from barrel. No existing consumers to break.
- **Acceptance:**
  - `GuideCore` interface exists with fields: `key` (string), `slug` (string), `contentKey` (string), `areas` (string[]), `primaryArea` (string), `template` (string, optional), `focusKeyword` (string, optional), `primaryQuery` (string, optional), `blocks` (unknown[]), `relatedGuides` (string[]), `structuredData` (unknown[]), `options` (Record<string, unknown>, optional), `riskTier` (0 | 1 | 2), `schemaVersion` (number)
  - `GuidePublication` extends `GuideCore` with: `id` (string/ULID), `shop` (string), `status` (`"draft" | "review" | "published"`), `row_version` (number), `created_at` (string), `updated_at` (string), `lastValidated` (string, optional), `timeSensitive` (boolean, optional)
  - `GuidePublicationStatus` type alias exported: `"draft" | "review" | "published"`
  - `GuideContentInput` Zod schema exported (moved from Brikette's content-schema.ts): `seo` (required), `linkLabel`, `lastUpdated`, `intro`, `sections`, `faqs`, `galleries`, `callouts`, plus `.passthrough()`
  - `guideContentSchema` Zod validator exported
  - All types re-exported from `packages/types/src/index.ts`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: GuidePublication assignable with all required fields → compiles
    - TC-02: GuidePublication missing `status` → TypeScript error
    - TC-03: GuidePublicationStatus only accepts "draft" | "review" | "published" → rejects "live", "active"
    - TC-04: guideContentSchema validates minimal valid input (seo only) → passes
    - TC-05: guideContentSchema rejects missing seo.title → fails
    - TC-06: guideContentSchema allows passthrough fields → passes with extra fields preserved
    - TC-07: riskTier only accepts 0, 1, or 2 → rejects 3, -1, "high"
  - **Acceptance coverage:** TC-01..03 cover type correctness; TC-04..06 cover Zod schema; TC-07 covers risk tier
  - **Test type:** unit
  - **Test location:** `packages/types/src/__tests__/Guide.test.ts` (new)
  - **Run:** `pnpm --filter @acme/types test`
- **Rollout / rollback:**
  - Rollout: Additive types, no consumers yet. Ship directly.
  - Rollback: Delete file, remove from barrel.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `packages/types/src/Product.ts` lines 78-119
  - Content schema source: `apps/brikette/src/routes/guides/content-schema.ts`
  - Status enum resolution: fact-find "Resolved Questions" section

---

### TASK-02: Create `GuidesRepository` interface

- **Type:** IMPLEMENT
- **Affects:**
  - `packages/platform-core/src/repositories/guides.types.ts` (new)
  - `[readonly] packages/platform-core/src/repositories/products.types.ts`
- **Depends on:** TASK-01
- **Confidence:** 92%
  - Implementation: 95% — Direct copy of `ProductsRepository` interface pattern with guide-specific generics and an additional `getByKey` method.
  - Approach: 92% — Follows proven repository pattern used by products, inventory, coupons, pricing, etc. Additional `getGuideContent(shop, key, locale)` method for split content reads.
  - Impact: 90% — New file. No consumers yet.
- **Acceptance:**
  - `GuidesRepository` interface exported with methods:
    - `read<T = GuidePublication>(shop: string): Promise<T[]>` — all guide metadata
    - `write<T = GuidePublication>(shop: string, guides: T[]): Promise<void>` — overwrite all
    - `getById<T extends { id: string }>(shop: string, id: string): Promise<T | null>` — by ULID
    - `getByKey(shop: string, key: string): Promise<GuidePublication | null>` — by guide key
    - `update<T extends { id: string; row_version: number }>(shop: string, patch: Partial<T> & { id: string }): Promise<T>` — merge-patch
    - `delete(shop: string, id: string): Promise<void>` — remove
    - `duplicate<T extends GuidePublication>(shop: string, id: string): Promise<T>` — copy
    - `getContent(shop: string, key: string, locale: string): Promise<GuideContentInput | null>` — read locale content
    - `writeContent(shop: string, key: string, locale: string, content: GuideContentInput): Promise<void>` — write locale content
  - Generic type defaults to `GuidePublication` from `@acme/types`
  - Import uses `type` imports only (no runtime code)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Interface is importable and assignable to a mock implementation → compiles
    - TC-02: Mock implementation satisfies all required methods → type-checks
  - **Acceptance coverage:** TC-01..02 cover type contract (compile-time only, tested via implementation in TASK-03)
  - **Test type:** unit (compile-time verification via implementation tests)
  - **Test location:** Verified implicitly by TASK-03 tests
  - **Run:** `pnpm --filter @acme/platform-core test`
- **Rollout / rollback:**
  - Rollout: Additive file. Ship directly.
  - Rollback: Delete file.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `packages/platform-core/src/repositories/products.types.ts`
  - Additional methods (`getByKey`, `getContent`, `writeContent`) diverge from product pattern — justified by guide's key-based access pattern and split content storage

---

### TASK-03: Implement JSON backend (`guides.json.server.ts`)

- **Type:** IMPLEMENT
- **Affects:**
  - `packages/platform-core/src/repositories/guides.json.server.ts` (new)
  - `[readonly] packages/platform-core/src/repositories/products.json.server.ts`
  - `[readonly] packages/platform-core/src/dataRoot.ts`
  - `[readonly] packages/platform-core/src/shops/universal.ts`
- **Depends on:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — Direct replication of `products.json.server.ts` pattern. Every helper function and CRUD operation is documented in fact-find with exact signatures. Split content storage adds complexity vs products.
  - Approach: 85% — Split storage (metadata in `guides.json`, content in `guides/content/{key}/{locale}.json`) is more complex than the single-file product pattern but necessary for 168 guides × 18 locales.
  - Impact: 80% — New file. Touches filesystem under `data/shops/{shopId}/`. Must validate `ensureDir` creates nested content directories correctly.
- **Acceptance:**
  - File starts with `import "server-only"`
  - `filePath(shop)` returns `path.join(DATA_ROOT, validateShopName(shop), "guides.json")`
  - `contentFilePath(shop, key, locale)` returns `path.join(DATA_ROOT, validateShopName(shop), "guides", "content", key, `${locale}.json`)`
  - `read(shop)` returns `[]` on missing file (never throws)
  - `write(shop, guides)` uses atomic temp-file-then-rename
  - `getById(shop, id)` finds by `.id` field, returns `null` if missing
  - `getByKey(shop, key)` finds by `.key` field, returns `null` if missing
  - `update(shop, patch)` increments `row_version`, throws if not found (error message includes entity + shop)
  - `delete(shop, id)` removes from array, throws if not found
  - `duplicate(shop, id)` creates copy with `ulid()` id, `"draft"` status, `row_version: 1`, new timestamps
  - `getContent(shop, key, locale)` reads JSON from content directory, returns `null` on missing
  - `writeContent(shop, key, locale, content)` validates with `guideContentSchema`, stamps `lastUpdated`, atomic write
  - Exported as `jsonGuidesRepository: GuidesRepository`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `read` returns empty array when no guides file exists → `[]`
    - TC-02: `read` returns parsed array when guides file exists → guide array
    - TC-03: `write` creates temp file then renames atomically → `fs.rename` called
    - TC-04: `write` creates directory if missing → `fs.mkdir` called with `recursive: true`
    - TC-05: `getById` returns matching guide → correct guide object
    - TC-06: `getById` returns null for non-existent id → `null`
    - TC-07: `getByKey` returns matching guide by key field → correct guide object
    - TC-08: `getByKey` returns null for non-existent key → `null`
    - TC-09: `update` increments `row_version` → `row_version` is original + 1
    - TC-10: `update` throws when guide not found → `Error("Guide {id} not found in {shop}")`
    - TC-11: `update` merges partial patch correctly → only patched fields change
    - TC-12: `delete` removes guide from array → array length decreases
    - TC-13: `delete` throws when guide not found → `Error("Guide {id} not found in {shop}")`
    - TC-14: `duplicate` creates copy with new ulid, draft status, row_version 1 → correct fields
    - TC-15: `duplicate` throws when source not found → Error
    - TC-16: `getContent` returns null when content file missing → `null`
    - TC-17: `getContent` returns parsed content when file exists → content object
    - TC-18: `writeContent` validates content with Zod → rejects invalid content
    - TC-19: `writeContent` stamps `lastUpdated` with current ISO timestamp → timestamp present
    - TC-20: `writeContent` uses atomic write for content files → temp + rename
    - TC-21: `validateShopName` rejects invalid shop names → throws on `../evil`
  - **Acceptance coverage:** TC-01..02 cover read, TC-03..04 cover write, TC-05..08 cover lookups, TC-09..11 cover update, TC-12..13 cover delete, TC-14..15 cover duplicate, TC-16..20 cover content I/O, TC-21 covers security
  - **Test type:** unit (mocked fs)
  - **Test location:** `packages/platform-core/src/repositories/__tests__/guides.json.server.test.ts` (new)
  - **Run:** `pnpm --filter @acme/platform-core test`
- **Planning validation:**
  - Tests run: `npx jest --config ./jest.config.cjs --testPathPattern="json.server" --no-coverage` — 6 passed, 2 failed (unrelated pages test), 30 total
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Product-specific test files exist on disk but aren't discovered by Jest (likely excluded by config). The json.server barrel test passes and demonstrates the lazy-load mocking pattern.
- **What would make this ≥90%:**
  - Confirm the split content directory approach works with `DATA_ROOT` resolution by writing a small spike reading/writing to `data/shops/test-shop/guides/content/test-key/en.json`
- **Rollout / rollback:**
  - Rollout: New code, no consumers yet. Ship directly.
  - Rollback: Delete file.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `packages/platform-core/src/repositories/products.json.server.ts` (exact replication with additions)
  - `validateShopName` at `packages/platform-core/src/shops/universal.ts` — regex `^[a-z0-9_-]+$/i`
  - `DATA_ROOT` at `packages/platform-core/src/dataRoot.ts` — walks up from cwd looking for `data/shops`
  - Atomic write pattern: write to `${path}.${Date.now()}.tmp`, then `fs.rename(tmp, path)`

---

### TASK-04: Create server facade (`guides.server.ts`)

- **Type:** IMPLEMENT
- **Affects:**
  - `packages/platform-core/src/repositories/guides.server.ts` (new)
  - `packages/platform-core/src/repositories/guides.prisma.server.ts` (new -- passthrough)
  - `[readonly] packages/platform-core/src/repositories/products.server.ts`
  - `[readonly] packages/platform-core/src/repositories/repoResolver.ts`
- **Depends on:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — Exact replication of `products.server.ts` facade pattern. `repoPromise` singleton, `getRepo()` with `resolveRepo()`, named exports.
  - Approach: 90% — Proven pattern used by all entity facades. Backend env var `GUIDES_BACKEND`.
  - Impact: 85% — New files. `resolveRepo` already handles new entities generically.
- **Acceptance:**
  - `guides.server.ts` starts with `import "server-only"`
  - `repoPromise` singleton with `getRepo()` using `resolveRepo({ backendEnvVar: "GUIDES_BACKEND" })`
  - Named exports: `readGuideRepo`, `writeGuideRepo`, `getGuideById`, `getGuideByKey`, `updateGuideInRepo`, `deleteGuideFromRepo`, `duplicateGuideInRepo`, `getGuideContent`, `writeGuideContent`
  - Each function gets repo via `await getRepo()` then delegates
  - `guides.prisma.server.ts` exports `prismaGuidesRepository` as passthrough to `jsonGuidesRepository`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `readGuideRepo` delegates to resolved repository's `read` method → mock repo called
    - TC-02: `getGuideByKey` delegates to resolved repository's `getByKey` method → mock repo called
    - TC-03: `updateGuideInRepo` delegates to resolved repository's `update` method → mock repo called
    - TC-04: Facade resolves JSON backend when `GUIDES_BACKEND=json` → `jsonGuidesRepository` used
    - TC-05: Facade resolves JSON backend when no env var set → falls back to JSON
    - TC-06: `repoPromise` is singleton — second call reuses first resolution → `resolveRepo` called once
  - **Acceptance coverage:** TC-01..03 cover delegation, TC-04..05 cover backend selection, TC-06 covers singleton
  - **Test type:** unit (mocked repoResolver)
  - **Test location:** `packages/platform-core/src/repositories/__tests__/guides.server.test.ts` (new)
  - **Run:** `pnpm --filter @acme/platform-core test`
- **Rollout / rollback:**
  - Rollout: New code. Ship directly.
  - Rollback: Delete files.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `packages/platform-core/src/repositories/products.server.ts`
  - `resolveRepo` at `packages/platform-core/src/repositories/repoResolver.ts` — tested in `repoResolver.test.ts`

---

### TASK-05: Add to barrel export and Prisma passthrough

- **Type:** IMPLEMENT
- **Affects:**
  - `packages/platform-core/src/repositories/json.server.ts`
- **Depends on:** TASK-04
- **Confidence:** 92%
  - Implementation: 95% — Single line addition: `export * from "./guides.server"`. Pattern at line 28 of `json.server.ts`.
  - Approach: 92% — Exact pattern used by products, inventory, pricing, returnLogistics.
  - Impact: 90% — Additive only. Existing consumers unaffected. New exports become available to CMS and storefronts.
- **Acceptance:**
  - `json.server.ts` includes `export * from "./guides.server"`
  - Existing barrel test pattern passes (lazy-load verification)
  - `readGuideRepo` is importable from `@acme/platform-core/repositories/json.server`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `readGuideRepo` is importable from barrel → import resolves
    - TC-02: Lazy-load: guide module not loaded until first call → `jest.doMock` verifies deferred load
  - **Acceptance coverage:** TC-01 covers export, TC-02 covers lazy-load pattern
  - **Test type:** unit
  - **Test location:** `packages/platform-core/src/repositories/__tests__/guides.barrel.test.ts` (new) — follows pattern of `json.server.test.ts`
  - **Run:** `pnpm --filter @acme/platform-core test`
- **Rollout / rollback:**
  - Rollout: Additive export. Ship directly.
  - Rollback: Remove export line.
- **Documentation impact:** None
- **Notes / references:**
  - Barrel file: `packages/platform-core/src/repositories/json.server.ts` lines 26-37
  - Existing barrel test: `packages/platform-core/src/repositories/__tests__/json.server.test.ts`

---

### TASK-06: Write migration script: Brikette → centralised store

- **Type:** IMPLEMENT
- **Affects:**
  - `scripts/migrate-guides-to-central.ts` (new)
  - `[readonly] apps/brikette/src/routes/guides/guide-manifest.ts`
  - `[readonly] apps/brikette/src/data/guides.index.ts`
  - `[readonly] apps/brikette/src/locales/en/guides/content/` (168 files)
  - `[readonly] apps/brikette/src/locales/{locale}/guides/content/` (18 locales × 168 files)
- **Depends on:** TASK-03
- **Confidence:** 80%
  - Implementation: 82% — Reads from known file paths (manifest + locale directories), transforms to `GuidePublication`, writes via repository. The status mapping ("live" → "published") and field mapping are documented.
  - Approach: 80% — One-shot migration script is the right approach for a single-time data move. Idempotent (can re-run safely).
  - Impact: 78% — Creates files under `data/shops/brikette/`. Must verify all 168 guides × 18 locales migrate correctly. Data integrity is critical.
- **Acceptance:**
  - Script reads all `GuideManifestEntry` entries from Brikette's `guide-manifest.ts`
  - Script maps each entry to `GuidePublication`:
    - `id`: `ulid()`
    - `key`, `slug`, `contentKey`: from manifest entry
    - `status`: "live" → "published", "draft" → "draft", "review" → "review"
    - `areas`, `primaryArea`, `template`, `focusKeyword`, `primaryQuery`, `blocks`, `relatedGuides`, `structuredData`, `options`: from manifest entry
    - `riskTier`: 0 (default for existing content)
    - `schemaVersion`: 1
    - `row_version`: 1
    - `created_at`, `updated_at`: current timestamp
    - `shop`: "brikette"
  - Script writes metadata array to `data/shops/brikette/guides.json`
  - Script copies content files: `apps/brikette/src/locales/{locale}/guides/content/{key}.json` → `data/shops/brikette/guides/content/{key}/{locale}.json`
  - Script validates each content file against `guideContentSchema` during copy
  - Script outputs a summary: total guides migrated, locales per guide, validation failures
  - Script is idempotent (can be re-run without duplicating)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Script maps "live" status to "published" → correct status in output
    - TC-02: Script maps "draft" status to "draft" → correct status in output
    - TC-03: Script assigns ulid to each guide → all ids are valid ULIDs
    - TC-04: Script creates correct directory structure → `data/shops/brikette/guides/content/{key}/{locale}.json`
    - TC-05: Script handles missing locale content gracefully → skips, reports in summary
    - TC-06: Script validates content against Zod schema → reports validation failures
    - TC-07: Script is idempotent → running twice produces same output
    - TC-08: Script preserves manifest override merges → overrides applied before migration
  - **Acceptance coverage:** TC-01..03 cover data mapping, TC-04 covers structure, TC-05..06 cover error handling, TC-07 covers idempotency, TC-08 covers overrides
  - **Test type:** integration (reads real Brikette files, writes to temp directory)
  - **Test location:** `scripts/__tests__/migrate-guides-to-central.test.ts` (new)
  - **Run:** `pnpm exec tsx scripts/migrate-guides-to-central.ts --dry-run`
- **Planning validation:**
  - Tests run: N/A (migration script doesn't exist yet)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Run the script in dry-run mode against real Brikette data and verify output file structure
  - Cross-check migrated guide count (168) against manifest entry count
  - Verify content roundtrip: read migrated content via `jsonGuidesRepository.getContent()`, compare to original
- **Rollout / rollback:**
  - Rollout: Run script once. Commit resulting `data/shops/brikette/` directory.
  - Rollback: `git checkout -- data/shops/brikette/`
- **Documentation impact:** None
- **Notes / references:**
  - Manifest source: `apps/brikette/src/routes/guides/guide-manifest.ts` (`listGuideManifestEntries()`)
  - Content source: `apps/brikette/src/locales/{locale}/guides/content/{contentKey}.json`
  - Override source: `apps/brikette/src/data/guides/guide-manifest-overrides.json`
  - Status mapping: fact-find "Status enum divergence" section

---

### TASK-07: Wire Brikette storefront to read from centralised store

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx`
  - `apps/brikette/src/routes/guides/` (multiple files for dual-read adapter)
  - `[readonly] packages/platform-core/src/repositories/guides.server.ts`
- **Depends on:** TASK-04, TASK-06
- **Confidence:** 82%
  - Implementation: 85% — The storefront rendering chain is documented (route → manifest lookup → i18n content load → block rendering). Swapping the content source is conceptually simple but touches the i18n loading path.
  - Approach: 82% — Dual-read strategy: try centralised store first, fall back to existing locale files. Feature-flagged via env var `USE_CENTRAL_GUIDES=1`. This allows incremental rollout.
  - Impact: 80% — Touches the live guide rendering path. Must not break the 168 existing published guides. Dual-read mitigates risk but adds complexity.
- **Acceptance:**
  - New env var `USE_CENTRAL_GUIDES` (boolean) gates the switch
  - When enabled: guide metadata loads from `readGuideRepo("brikette")`, content loads from `getGuideContent("brikette", key, locale)`
  - When disabled (default): existing behavior unchanged (manifest from TS, content from i18n locale files)
  - All existing guide URLs continue to work (`/{lang}/experiences/{slug}`)
  - Guide content renders identically from both sources (visual regression check)
  - Draft routes continue to work (they will still use the old path for now)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: With `USE_CENTRAL_GUIDES=0`, guide loads from legacy path → i18n content used
    - TC-02: With `USE_CENTRAL_GUIDES=1`, guide metadata loads from centralised repo → `readGuideRepo` called
    - TC-03: With `USE_CENTRAL_GUIDES=1`, guide content loads from centralised content store → `getGuideContent` called
    - TC-04: Centralised store missing a guide falls back to legacy → graceful degradation
    - TC-05: Centralised content missing a locale falls back to English → English content returned
    - TC-06: All 168 guide URLs resolve successfully with centralised store → no 404s (integration check)
  - **Acceptance coverage:** TC-01..03 cover feature flag behavior, TC-04..05 cover fallback, TC-06 covers regression
  - **Test type:** unit + integration
  - **Test location:** `apps/brikette/src/__tests__/central-guides-adapter.test.ts` (new)
  - **Run:** `pnpm --filter brikette test`
- **Planning validation:**
  - Tests run: N/A (adapter doesn't exist yet)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Storefront reads guide content via `react-i18next`'s `t()` function with `returnObjects: true`, not via an API. The adapter must either: (a) populate the i18n resource bundle from the centralised store before render, or (b) bypass i18n and pass content directly. Option (a) is less invasive.
- **What would make this ≥90%:**
  - Spike the i18n resource bundle population approach: load content from `getGuideContent()`, inject into i18n's `addResourceBundle()` before component render
  - Verify no hydration mismatches when switching content source
- **Rollout / rollback:**
  - Rollout: Feature-flagged via `USE_CENTRAL_GUIDES`. Deploy with flag off, enable per-environment.
  - Rollback: Set `USE_CENTRAL_GUIDES=0` (instant, no deploy needed).
- **Documentation impact:** None
- **Notes / references:**
  - Rendering chain documented in fact-find: route → `resolveGuideKeyFromSlug` → `loadGuideManifestOverridesFromFs` → `<GuideContent>` → `useTranslation("guides")` → `tGuides("content.{key}.{field}", { returnObjects: true })`
  - i18n resource bundle API: `i18next.addResourceBundle(locale, "guides", data)`
  - Feature flag pattern: other env-based feature flags exist in the codebase (e.g., `ENABLE_GUIDE_AUTHORING`)

---

### TASK-08: Validate migration data integrity

- **Type:** INVESTIGATE
- **Affects:** `data/shops/brikette/guides.json`, `data/shops/brikette/guides/content/`
- **Depends on:** TASK-06
- **Confidence:** 75% ⚠️
  - Implementation: 80% — Validation logic is straightforward (compare counts, spot-check content)
  - Approach: 75% — Need to determine what "correct" means for 168 × 18 = 3,024 content files
  - Impact: 70% — If migration is wrong, Brikette renders broken content to real users when the flag is enabled
- **Blockers / questions to answer:**
  - How many of the 168 guides actually have content in all 18 locales? (Some may have fewer)
  - Are there manifest overrides that change status for specific guides? (Must verify override merging)
  - Do any content files have passthrough fields not in the Zod schema? (Must verify `.passthrough()` preserves them)
- **Acceptance:**
  - Guide count matches: `guides.json` has exactly as many entries as `listGuideManifestEntries()` (minus any explicitly excluded)
  - Every guide in `guides.json` has a corresponding content directory under `guides/content/{key}/`
  - Content locale count per guide matches the original locale file count
  - Spot-check 10 guides: content roundtrips correctly (read from centralised store, compare to original)
  - No Zod validation failures in the migration output
  - Status mapping is correct for all guides (no "live" status in output)
- **Notes / references:**
  - This task gates TASK-07's feature flag activation
  - Use `--dry-run` mode to validate without committing files

---

### TASK-09: Confirm Slice 2-4 scope and sequencing

- **Type:** DECISION
- **Affects:** `docs/plans/article-generation-pipeline-plan.md` (this doc)
- **Depends on:** TASK-07
- **Confidence:** 70% ⚠️
  - Implementation: 80% — Slice boundaries are well-defined in fact-find
  - Approach: 65% — Sequencing between Slice 2 (translation tooling) and Slice 3 (CMS authoring) could go either way
  - Impact: 65% — Wrong sequencing wastes effort; correct sequencing maximises value per slice
- **Options:**
  - **Option A:** Slice 2 (translation tooling) next — shared translation scripts unblock multi-locale publishing for any shop before CMS exists
  - **Option B:** Slice 3 (CMS authoring) next — gives non-developer guide editing capability sooner; translation stays script-based temporarily
  - **Option C:** Slice 2 and 3 in parallel — possible if well-coordinated, maximises throughput
- **Recommendation:** Option A — translation tooling is lower risk, smaller scope, and immediately useful for XA shops. CMS authoring is larger and benefits from having shared tooling already extracted.
- **Question for user:**
  - After Slice 1 lands, what's the priority: shared translation tooling (Slice 2) or CMS guide editor (Slice 3)?
  - Why it matters: determines which plan to write next
  - Default if no answer: Slice 2 first (lower risk, smaller scope)
- **Acceptance:**
  - User confirms next slice priority
  - Plan updated with sequencing decision
  - Next slice's `/plan-feature` is scoped accordingly

---

## Slice 2-4 Task Seeds (Non-binding)

These are carried over from the fact-find brief. Each will get its own `/plan-feature` run when ready.

### Slice 2: Translation + Validation as Shared Tooling

- Extract shared utilities (`listJsonFiles`, `readJson`, `extractStringsFromContent`) to `@acme/guides-core`
- Rewrite `translate-guides.ts` as generic translation runner with `promptBuilder` callback
- Extract `validate-guide-content.ts` with injectable schema
- Extract `backfill-guides-from-en.ts` and `download-commons-image.ts`
- Add drift detection (EN changes → flag stale locales)
- Add `schemaVersion` migration support

### Slice 3: CMS Authoring + Workflow

- Create CMS guide list page at `cms/shop/[shop]/guides/` (follow products page pattern)
- Create CMS guide editor (build fresh with tests, informed by Brikette editor)
- Create CMS guide status/publish workflow with risk-tier-gated review
- Create CMS SEO audit panel (extract audit engine from Brikette first)
- Create CMS preview mode (per shop, per locale, per revision)
- Retire Brikette draft routes
- Retire CMS Sanity blog routes

### Slice 4: AI Pipeline

- Define brief contract and template contract types
- Define 3 MVP article type templates with concrete schemas
- Implement AI idea generation from catalog coverage gaps
- Implement AI drafting with grounding constraints
- Build pipeline orchestrator (brief → draft → validate → translate → validate)
- Implement maintenance loop (staleness tracking, revalidation SLAs)

## Risks & Mitigations

- **Migration data loss:** Content files are numerous (3,000+). Mitigated by: dry-run mode, validation script (TASK-08), git-committed output (reversible), dual-read with feature flag.
- **i18n integration complexity:** Switching content source may cause hydration mismatches. Mitigated by: feature flag (instant rollback), `addResourceBundle` approach minimises rendering changes.
- **Status enum confusion:** Three divergent enums exist. Mitigated by: unified to "draft/review/published" at the type level, explicit mapping in migration script.
- **Split content storage performance:** Per-guide-per-locale file reads may be slower than i18n's bundle approach. Mitigated by: SSR caching, lazy content loading, benchmark after TASK-07.
- **Scope creep into Slice 2-4:** Risk of pulling CMS/pipeline work into Slice 1. Mitigated by: clear non-goals, deferred tasks, TASK-09 decision gate.

## Observability

- Logging: Migration script logs per-guide status (migrated/skipped/failed)
- Metrics: Guide count in centralised store vs Brikette manifest (should match after migration)
- Alerts/Dashboards: Not needed for Slice 1 (infrastructure only)

## Acceptance Criteria (overall)

- [ ] `GuidePublication` type exists in `@acme/types` with unified status enum
- [ ] `GuidesRepository` interface and JSON backend exist in `@acme/platform-core`
- [ ] `readGuideRepo("brikette")` returns all 168 guides
- [ ] `getGuideContent("brikette", key, locale)` returns correct content for any guide/locale
- [ ] Migration script produces `data/shops/brikette/` with correct structure
- [ ] Brikette storefront renders guides identically from centralised store (behind feature flag)
- [ ] All new code has tests matching the test contracts above
- [ ] No regressions in existing Brikette guide rendering

## Decision Log

- 2026-02-06: Status enum unified to "draft" | "review" | "published" — "live" mapped to "published" during migration. Rationale: "published" is the user-facing term; "live" is an internal artifact of the manifest system.
- 2026-02-06: Content-as-code confirmed (not CMS-first) — single author, batch editing, consistent with product pattern. Revisit at L3 if editor count grows.
- 2026-02-06: Block types stay app-specific (`blocks: unknown[]` at platform level) — avoids coupling all businesses to Brikette's 14-block vocabulary. Each app validates blocks on read.
- 2026-02-06: Split content storage chosen (metadata in `guides.json`, content in `guides/content/{key}/{locale}.json`) — single file would be too large for 168 guides × 18 locales.
- 2026-02-06: Slice 1 scoped to read path + data model only — CMS authoring (Slice 3) and AI pipeline (Slice 4) planned separately to contain risk.
