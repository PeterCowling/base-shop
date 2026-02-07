---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Created: 2026-02-06
Last-updated: 2026-02-06
Feature-Slug: article-generation-pipeline
Related-Plan: docs/plans/article-generation-pipeline-plan.md
Business-Unit: PLAT
---

# Article Generation Pipeline Fact-Find Brief

## Scope

### Summary

Centralise guide data out of Brikette into the platform layer (following the product repository pattern), then build an AI-assisted content pipeline for producing multilingual guides across all businesses. Supersedes the CMS Sanity blog system. See `docs/business-os/ideas/inbox/PLAT-OPP-0003.user.md` for the full idea and `docs/business-os/strategy/business-maturity-model.md` for the L1/L2/L3 maturity model.

### Goals

- Centralise guide storage, types, and repository into `@acme/platform-core` following the product pattern
- Move guide authoring (draft dashboard, editor, SEO audit, publish workflow) into the CMS app
- Build an AI-assisted pipeline: idea generation -> content brief -> AI draft -> human review -> translation -> validation
- Make L1-to-L2 transition repeatable for any business, not a manual grind

### Non-goals

- Replacing all editorial content (announcements/news stay separate if needed)
- Fully autonomous content (human review is non-negotiable)
- Real-time content (guides are standing information)
- CMS feature parity with Sanity (purpose-built for structured JSON templates)

### Constraints & Assumptions

- Constraints:
  - Must not break Brikette during migration (incremental delivery)
  - Guide content must remain structured JSON (not free-form rich text)
  - Product repository pattern (`platform-core`) must be followed for consistency
  - Risk-tier-gated review workflow required (tier 0/1/2)
- Assumptions:
  - Pete is the primary editor for the foreseeable future (informs content-as-code vs CMS-first decision)
  - Claude API remains viable and cost-effective for translation (~$3-5 per batch)
  - Brikette's 168 existing guides will be the seed data for centralised storage

## Repo Audit (Current State)

### Entry Points

**Brikette guide authoring routes:**
- `apps/brikette/src/app/[lang]/draft/page.tsx` -- Draft dashboard (SSR)
- `apps/brikette/src/app/[lang]/draft/[...slug]/page.tsx` -- Draft preview (catch-all, force-dynamic)
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/page.tsx` -- Guide editor (gated by authoring + preview token)
- `apps/brikette/src/app/[lang]/draft/validation/page.tsx` -- Validation dashboard
- `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` -- Live guide rendering

**Brikette guide APIs:**
- `apps/brikette/src/app/api/guides/[guideKey]/route.ts` -- Content CRUD (GET/PUT)
- `apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts` -- Manifest CRUD (GET/PUT/DELETE)
- `apps/brikette/src/app/api/guides/[guideKey]/audit/route.ts` -- SEO audit (POST)

**Product repository (pattern to follow):**
- `packages/platform-core/src/repositories/products.server.ts` -- Server facade
- `packages/platform-core/src/repositories/products.json.server.ts` -- JSON backend
- `packages/platform-core/src/repositories/products.types.ts` -- Repository interface

**CMS (target for guide management):**
- `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` -- Product management (pattern to follow)
- `apps/cms/src/app/cms/blog/` -- Blog system (to be superseded)

### Key Modules / Files

**Guide data model (all in Brikette):**

| Module | Path | Lines | Role |
|--------|------|-------|------|
| Content schema | `apps/brikette/src/routes/guides/content-schema.ts` | ~80 | Zod schema: `seo`, `intro`, `sections`, `faqs`, `galleries`, `callouts`, `lastUpdated`. Uses `.passthrough()` for extra fields. |
| Manifest | `apps/brikette/src/routes/guides/guide-manifest.ts` | ~4700 | Types + all manifest seed data. Exports `GuideManifestEntry`, `GuideStatus`, `GuideArea`, `GuideTemplate`, `GuideBlockDeclaration`, `listGuideManifestEntries()`, `buildGuideChecklist()`. |
| Manifest overrides | `apps/brikette/src/routes/guides/guide-manifest-overrides.ts` | ~100 | Override schema: `ManifestOverride` (areas, primaryArea, status, auditResults, draftPathSegment). |
| Overrides node ops | `apps/brikette/src/routes/guides/guide-manifest-overrides.node.ts` | ~150 | Filesystem CRUD with atomic writes, backup, scoped path resolution. |
| Block types | `apps/brikette/src/routes/guides/blocks/types.ts` | ~200 | 14 block types: hero, genericContent, faq, callout, table, serviceSchema, breadcrumbs, relatedGuides, alsoHelpful, planChoice, transportNotice, transportDropIn, jsonLd, custom. |
| Diagnostics | `apps/brikette/src/routes/guides/guide-diagnostics.types.ts` | ~80 | Translation coverage, content completeness, date validation, checklist snapshot types. |
| Guide index | `apps/brikette/src/data/guides.index.ts` | ~200 | `GuideMeta` type, filtered collections, status-by-key map. |
| GuideKey | `apps/brikette/src/guides/slugs/keys.ts` | ~10 | String union of all known guide keys (derived from generated slug data). |
| SEO audit engine | `apps/brikette/src/lib/seo-audit/index.ts` | ~300+ | v3.1.0 comprehensive SEO analysis (0-10 score). Template-aware thresholds. |
| Node loader | `apps/brikette/src/locales/_guides/node-loader.ts` | ~150 | Reads/writes guide content from split-directory or legacy single-file locale format. |
| Authoring gate | `apps/brikette/src/routes/guides/guide-authoring/gate.ts` | ~20 | Env-var gate for authoring (`ENABLE_GUIDE_AUTHORING`). |

**Shared packages:**

| Package | Path | Role |
|---------|------|------|
| `@acme/guides-core` | `packages/guides-core/src/index.ts` | URL/slug helpers only. `createGuideUrlHelpers<Lang, Key>()`. No content types. |
| `@acme/types` | `packages/types/src/` | **No guide types exist.** Only product types (`ProductCore`, `ProductPublication`). |

### Patterns & Conventions Observed

**Product repository pattern (exact pattern to replicate):**

1. `import "server-only"` on every `.server.ts` file
2. `validateShopName(shop)` in every path-building function
3. Atomic writes via temp-file-then-rename in JSON backend
4. `row_version` auto-increment server-side in `update`
5. `repoPromise` singleton in facade -- resolution runs exactly once
6. `resolveRepo()` shared backend selector with `{ backendEnvVar: "<ENTITY>_BACKEND" }`
7. Read returns `[]` on missing file -- never throws for empty shop
8. Error messages include entity id + shop
9. `ulid()` for new entity IDs
10. Duplicated entities set to `"draft"` status with `row_version: 1`

**File naming convention:**
- `X.types.ts` -- Repository interface
- `X.json.server.ts` -- JSON filesystem backend
- `X.prisma.server.ts` -- Prisma backend (optional)
- `X.server.ts` -- Server facade with lazy resolution

**Package exports:** `./repositories/*` wildcard in `platform-core/package.json` covers new entity files automatically.

**Status enum divergence (must resolve during build):**

| Location | Type | Values | Default |
|----------|------|--------|---------|
| Manifest | `GuideStatus` | `"draft" \| "review" \| "live"` | `"draft"` |
| Index | `GuideMeta.status` | `"draft" \| "review" \| "published"` | `"published"` |
| Derived | `GuidePublicationStatus` | `"draft" \| "review" \| "published"` | computed |

Mapping: manifest `"live"` + `draftOnly=false` = `"published"`; `"live"` + `draftOnly=true` = `"review"`.

### Data & Contracts

**Types/schemas:**
- Content: `GuideContentInput` (Zod) -- `seo` (required), `linkLabel`, `lastUpdated`, `intro`, `sections`, `faqs`, `galleries`, `callouts`, plus passthrough fields (`toc`, `images`, `essentials`, `typicalCosts`, `tips`, `warnings`)
- Manifest: `GuideManifestEntry` -- 20+ fields covering identity, status, taxonomy, rendering, SEO, editorial
- Overrides: `ManifestOverride` -- runtime patches for areas, status, audit results, draft paths
- Blocks: `GuideBlockDeclaration` -- discriminated union of 14 block types
- Diagnostics: `TranslationCoverageResult`, `GuideDiagnosticResult`, `GuideChecklistDiagnostics`
- SEO audit: `SeoAuditResult` -- score, analysis (strengths/criticalIssues/improvements), metrics, version

**Persistence:**
- Guide content: `apps/brikette/src/locales/{locale}/guides/content/{contentKey}.json` (168 guides x 18 locales)
- Manifest overrides: `apps/brikette/src/data/guides/guide-manifest-overrides.json`
- Manifest seed: hardcoded TypeScript in `guide-manifest.ts` (~4700 lines)
- Products (pattern): `data/shops/{shopId}/products.json`
- Blog (Sanity): external Sanity project per shop

**API/event contracts:**
- Content API: `GET/PUT /api/guides/{guideKey}?locale={locale}` with `x-preview-token` header
- Manifest API: `GET/PUT/DELETE /api/guides/{guideKey}/manifest` with quality gate (SEO >= 9.0 for "live")
- Audit API: `POST /api/guides/{guideKey}/audit?locale={locale}`

### Dependency & Impact Map

**Upstream dependencies:**
- `@acme/design-system` -- editorial panel and editor UI components
- `@acme/i18n` -- locale configuration
- `@acme/guides-core` -- URL helpers (will expand to full guide data layer)
- `@acme/platform-core` -- will gain guide repository
- `@acme/types` -- will gain guide types
- `react-i18next` -- translation loading for content rendering
- `@tiptap/*` -- WYSIWYG editor in guide editor
- `@anthropic-ai/sdk` -- translation engine
- `@sanity/client` + `@acme/plugin-sanity` -- blog system being superseded

**Downstream dependents:**
- `apps/brikette` -- primary consumer, will switch from local to centralised guide data
- `apps/cms` -- will gain guide management pages
- `apps/xa`, `apps/xa-b`, `apps/xa-j` -- future consumers once at L2
- `packages/mcp-server` -- exposes `brikette://draft-guide` resource (will need updating)

**Likely blast radius:**
- **Slice 1 (centralise read path):** Low. New code in `platform-core` + `types`. Brikette read path swapped. No CMS changes.
- **Slice 2 (translation tooling):** Low. Script extraction into shared package. No runtime changes.
- **Slice 3 (CMS authoring):** Medium-High. New CMS pages. Brikette draft routes retired. Blog routes replaced.
- **Slice 4 (AI pipeline):** Medium. New pipeline code. Touches content APIs and brief/template contracts.

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (primary), React Testing Library for components
- **Commands:** `pnpm test` (via Turbo)
- **CI integration:** Tests run in reusable workflow; currently skipped on staging branch (temporary)
- **Coverage tools:** Jest coverage; 13 tests currently skipped with `describe.skip`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Content schema | Unit | `content-schema.test.ts` | Good -- valid/invalid inputs for all fields |
| Manifest completeness | Unit | `guide-manifest-completeness.test.ts` | Good -- every key has entry, every entry has key |
| Manifest status | Unit | `guide-manifest.status.test.ts` | Good -- validates status values |
| Override schema | Unit | `guide-manifest-overrides.test.ts` | Good -- schema validation, edge cases |
| Override filesystem | Unit | `guide-manifest-overrides.node.test.ts` | Good -- atomic writes, backup, traversal prevention |
| Link validation | Unit | `validate-links.test.ts` | Good -- token extraction and validation |
| Diagnostics | Unit | `guide-diagnostics.test.ts` | Moderate -- real content analysis |
| SEO audit | Unit | `seo-audit.test.ts` | Weak -- only 1 test case despite complex scoring |
| Hydration | Component | 5 hydration test files | Good -- targeted at known failure modes |
| URL helpers | Unit | `guides-core/__tests__/createGuideUrlHelpers.test.ts` | Good -- path building, slug resolution |
| Guide search | Unit | `guide-search.test.ts` | Good -- index building, search |
| Namespace migration | Snapshot | `guide-namespace-migration.test.ts` | Stability check |

#### Coverage Gaps (Planning Inputs)

**Untested paths (critical for migration):**
- `apps/brikette/src/app/api/guides/[guideKey]/route.ts` -- **Content API has zero tests.** GET/PUT content endpoints are untested.
- `apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts` -- **Manifest API has zero tests.** Quality gate (SEO >= 9.0 for "live") is untested.
- `apps/brikette/src/app/api/guides/[guideKey]/audit/route.ts` -- **Audit API untested.**
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/GuideEditor.tsx` -- **Entire editor UI untested** (all 5 tabs, TipTap integration, save flow).
- `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx` -- **906-line editorial panel untested.**
- `apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx` -- **Dashboard client component untested.**
- `apps/brikette/src/routes/guides/guide-authoring/gate.ts` -- **Auth/preview token validation untested.**

**Extinct tests:**
- `GuideSeoTemplate.integration.test.tsx` -- Explicitly `describe.skip`'d. All tests are TODOs.
- `guide-url-resolver.test.ts` -- Explicitly `describe.skip`'d.

#### Testability Assessment
- **Easy to test:** Content schema validation, manifest types, override CRUD, URL helpers, translation token preservation, guide repository (new code following product pattern)
- **Hard to test:** Editorial panel (deeply coupled to guide page rendering context), TipTap editor integration, i18n-dependent diagnostics, SEO audit engine (reads filesystem, imports manifest)
- **Test seams needed:** Guide content loading needs an abstraction (currently direct filesystem reads); SEO audit needs injectable content source; editorial panel needs extraction from rendering context

#### Recommended Test Approach
- **Unit tests for:** Guide types, repository CRUD, content schema, brief/template validation, translation token preservation, risk tier logic
- **Integration tests for:** Content API (read/write roundtrip), manifest API (quality gate enforcement), guide migration script (Brikette -> centralised)
- **Component tests for:** CMS guide editor (when built -- start fresh with tests), CMS guide dashboard
- **E2E tests for:** Draft -> review -> live publishing workflow (once in CMS)

### Recent Git History (Targeted)

Recent guide-related commits (from `git log`):
- `c66d3cc` -- fix(ci): make deploy env validation non-blocking, add build-time secrets
- `1a581241` -- fix(cms): fix test module resolution and provider wrapping
- Earlier: extensive guide system improvements, hydration fixes, SEO audit, editorial panel builds

## Script Extractability Audit

### Summary

| Category | Scripts | Effort |
|----------|---------|--------|
| Readily extractable | `download-commons-image.ts`, `backfill-guides-from-en.ts` | Low |
| Extractable with parameterisation | `validate-guide-content.ts`, `create-guide.ts`, `generate-guide-infographics.ts` (engine only) | Medium |
| Extractable with architecture work | `validate-guide-links.ts`, `report-guide-coverage.ts` | Medium-High |
| Needs rewriting | `translate-guides.ts`, `check-guides-translations.ts`, `audit-guide-seo.ts` | High |

### Key findings

- **`translate-guides.ts`** -- Translation engine is generic, but prompt is deeply Brikette-specific ("hostel guests visiting Positano"), guide list is hardcoded, token preservation rules are Brikette's content format. Needs rewrite as a generic translation runner with `promptBuilder` callback and configurable token patterns.
- **`audit-guide-seo.ts`** -- Thin CLI wrapper around `src/lib/seo-audit/` which imports `GuideKey`, `GuideManifestEntry`, `GuideTemplate`, reads from Brikette locale directory. Can't extract script without extracting entire audit engine first.
- **`check-guides-translations.ts`** -- Boots Brikette's full i18next runtime with app-specific utilities. Needs fundamentally different approach for shared version.
- **Cross-cutting:** Utility functions `listJsonFiles`, `readJson`, `extractStringsFromContent` are duplicated across 3 scripts -- extract to shared module first.
- **`download-commons-image.ts`** -- Zero Brikette imports, fully CLI-driven. Can move as-is.
- **`backfill-guides-from-en.ts`** -- Only import is `i18nConfig` for locale list. Replace with CLI param and it's generic.

## Architectural Decision: Content-as-Code vs CMS-First

### Evidence

- **Primary editor:** Pete (single author for foreseeable future)
- **Editing frequency:** Guide content changes are batch operations, not continuous editing
- **Existing pattern:** Products use JSON-on-disk (content-as-code) consumed by CMS via repository
- **Collaboration needs:** Low for now (single author), but may increase at L3
- **Current workflow:** Brikette editor writes directly to filesystem JSON files -- already content-as-code

### Recommendation: Content-as-code (Option A)

For a single-author, batch-editing workflow, content-as-code is the simpler choice and consistent with the product pattern. The CMS reads/writes via the repository (same as products). Version history comes from git. Review audit trail comes from git history + manifest override timestamps.

**Trade-off:** If the number of editors grows significantly or real-time collaboration becomes important, revisit for Option B (DB-first). But that's an L3 concern, not an L2 concern.

## Questions

### Resolved

- **Q: Are there guide types in `@acme/types`?**
  - A: No. Zero guide-related types exist. All guide types live exclusively in `apps/brikette/src/routes/guides/`.
  - Evidence: `packages/types/src/` searched -- only product types found.

- **Q: Does the CMS have any guide functionality?**
  - A: No. Zero guide management. Blog only (Sanity-backed).
  - Evidence: Full audit of `apps/cms/src/` -- 23 "guide" matches are all incidental (GuidedTour onboarding, doc links).

- **Q: How are product subpath exports configured?**
  - A: `./repositories/*` wildcard in `platform-core/package.json` -- no new entry needed for guides.
  - Evidence: `packages/platform-core/package.json` exports field.

- **Q: Can the status enum divergence be resolved?**
  - A: Yes. The centralised `GuidePublication` should use `"draft" | "review" | "published"` (the user-facing enum). The internal `"live"` + `draftOnly` flag combination becomes a simple status mapping during Brikette migration.
  - Evidence: Three enums mapped in guide data model audit.

- **Q: What's the content-as-code vs CMS-first decision?**
  - A: Content-as-code (see recommendation above).
  - Evidence: Single author, batch editing, consistent with product pattern.

### Open (User Input Needed)

- **Q: Should the 14 block types move to the centralised type system, or are they Brikette-specific rendering concerns?**
  - Why it matters: If blocks are platform-level, every business gets the same block vocabulary. If app-specific, each business defines its own blocks and the platform only stores the declarations.
  - Decision impacted: `GuidePublication` type design, CMS editor scope.
  - Default assumption: Keep blocks app-specific (each business defines its own rendering). The centralised type stores `blocks: unknown[]` and the app validates on read. Risk: lower type safety at the platform level, but avoids coupling all businesses to Brikette's block vocabulary.

- **Q: What are the L2 readiness thresholds for the first non-Brikette business (XA)?**
  - Why it matters: Determines MVP scope for the second shop's guide library.
  - Decision impacted: How many guides to target for the MVP's "1 additional shop" success criterion.
  - Default assumption: 10-15 guides covering top customer intents (product care, sizing, shipping, returns) + top SEO opportunities. Risk: may be too few to demonstrate measurable organic traffic impact.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 72%
  - Product repository pattern is thoroughly documented with exact replication steps. Guide data model is fully mapped. Status enum divergence is resolvable. Script extractability is assessed per-script.
  - What's missing: AI drafting/grounding system is new (no existing code to reference). SEO audit engine extraction is high-effort. Template contracts need concrete schema definition.
  - To reach 80%: Define the 3 MVP template schemas concretely. Spike the AI drafting prompt with grounding constraints against one existing guide.

- **Approach:** 76%
  - Delivery slices are well-defined. Content-as-code decision is made. Product pattern is proven. Blog supersession path is clear.
  - What's missing: Block type platform-vs-app decision. Translation rewrite scope not estimated. CMS editor UX not designed.
  - To reach 80%: Resolve the block type question. Estimate translation script rewrite effort.
  - To reach 90%: CMS editor wireframes. End-to-end prototype of one guide through the full pipeline (idea -> brief -> draft -> validate -> translate -> publish).

- **Impact:** 65%
  - Blast radius is large: touches `platform-core`, `@acme/types`, `@acme/guides-core`, Brikette's core content system, CMS app, and eventually all storefronts. The authoring write path (APIs, editor, editorial panel) has **zero test coverage**.
  - What's missing: No integration tests for content API, manifest API, or quality gate. No E2E tests for the draft->live workflow. Migration script from Brikette to centralised storage not yet designed.
  - To reach 80%: Write integration tests for the existing content and manifest APIs before migrating them. Design and test the migration script.
  - To reach 90%: E2E test for the full publish workflow. Rollback plan tested.

- **Testability:** 58%
  - Good test infrastructure (Jest, RTL). Content schema and manifest validation are well-tested. But the entire authoring write path is untested, 2 test suites are explicitly skipped, and the SEO audit engine has only 1 test.
  - What would improve testability: Extract content loading behind an interface (currently direct filesystem reads). Make SEO audit accept injectable content source. Build CMS guide editor with tests from the start (don't port Brikette's untested UI).
  - To reach 80%: Integration tests for content/manifest APIs. Unit tests for SEO audit engine. Test seams for content loading.

## Planning Constraints & Notes

- Must-follow patterns:
  - Product repository pattern (`import "server-only"`, `validateShopName`, atomic writes, `repoPromise` singleton, `resolveRepo` with entity-specific env var)
  - `ulid()` for entity IDs
  - CMS server actions with `"use server"` + `ensureAuthorized()`
  - Zod validation at API boundaries
- Rollout/rollback expectations:
  - Incremental: each slice ships independently
  - Brikette must continue working throughout migration (dual-read from both old and new paths during transition)
  - Blog retirement only after Slice 3 is stable
- Observability expectations:
  - Pipeline KPIs tracked from first guide published (review time, rewrite rate, validation failures, cost per guide)
  - Per-guide Search Console data collection from publish date

## Suggested Task Seeds (Non-binding)

**Slice 1: Centralise read path + data model**
1. Define `GuideCore` and `GuidePublication` types in `@acme/types`
2. Create `GuidesRepository` interface in `platform-core`
3. Implement JSON backend (`guides.json.server.ts`) following product pattern
4. Create server facade (`guides.server.ts`) with lazy resolution
5. Write migration script: Brikette 168 guides -> `data/shops/brikette/guides.json`
6. Wire Brikette storefront to read from centralised store
7. Add to barrel export in `json.server.ts`
8. Unit + integration tests for repository CRUD

**Slice 2: Translation + validation as shared tooling**
9. Extract shared utilities (`listJsonFiles`, `readJson`, `extractStringsFromContent`) to `@acme/guides-core`
10. Rewrite `translate-guides.ts` as generic translation runner with `promptBuilder` callback
11. Extract `validate-guide-content.ts` with injectable schema
12. Extract `backfill-guides-from-en.ts` and `download-commons-image.ts`
13. Add drift detection (EN changes -> flag stale locales)
14. Add `schemaVersion` field to guide types + migration support

**Slice 3: CMS authoring + workflow**
15. Create CMS guide list page at `cms/shop/[shop]/guides/`
16. Create CMS guide editor (build fresh with tests, informed by Brikette editor)
17. Create CMS guide status/publish workflow with risk-tier-gated review
18. Create CMS SEO audit panel (extract audit engine from Brikette first)
19. Create CMS preview mode (per shop, per locale, per revision)
20. Retire Brikette draft routes
21. Retire CMS Sanity blog routes

**Slice 4: AI pipeline**
22. Define brief contract and template contract types
23. Define 3 MVP article type templates with concrete schemas
24. Implement AI idea generation from catalog coverage gaps
25. Implement AI drafting with grounding constraints (facts field, source requirements)
26. Build pipeline orchestrator (brief -> draft -> validate -> translate -> validate)
27. Implement maintenance loop (staleness tracking, revalidation SLAs)

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None -- open questions have reasonable defaults.
- Recommended next step: Proceed to `/plan-feature` starting with Slice 1 (lowest risk, unblocks everything else). The block type question and L2 readiness thresholds can be resolved during Slice 1 planning without blocking.
