---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CMS
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: guide-publication-decoupling
Related-Plan: docs/plans/guide-publication-decoupling-plan.md
Business-Unit: BRIK
---

# Guide Publication Decoupling Fact-Find Brief

## Scope

### Summary

Decouple guide drafting from brikette and make guide publication automatic and multi-site capable. Three requirements:

1. **Remove draft facilities from brikette** — no `/draft/` routes, no `GuideEditorialPanel`, no authoring UI. All drafting happens in business-os.
2. **Automatic publication** — guides with status `"live"` are automatically available to consumer sites at build time. Non-live guides are invisible (no pages generated, no content bundled).
3. **Multi-site publishing** — per-site publication status so a guide can be `"live"` on brikette but `"draft"` on another consumer site.

### Goals

- Single authoring surface (business-os) for all guide content management
- Consumer sites (brikette, future sites) only receive published content
- No draft/preview infrastructure on consumer sites
- Per-site status enables independent publication timelines
- Reduce content bundle size by excluding non-live guides

### Non-goals

- Migrating the guide manifest from TypeScript to a database (keep file-based for now)
- Building a CMS UI for multi-site management (per-site status is a schema/data concern, UI comes later)
- Changing the guide content JSON format or locale structure
- Lazy per-guide content loading (separate optimisation)

### Constraints & Assumptions

- Constraints:
  - Business-os authoring infrastructure (Phase A) is already in place and working
  - Brikette's static export build (`OUTPUT_EXPORT=1`) must continue to work
  - `@acme/guide-system` is the shared package — changes there affect both apps
  - Existing published guides must continue rendering on brikette without regression
- Assumptions:
  - The git-commit-as-release model continues (no CI/CD pipeline for guide content)
  - "Consumer site" means any Next.js app in the monorepo that renders guides
  - business-os will remain the sole authoring surface

## Repo Audit (Current State)

### Entry Points

#### Brikette Draft Routes (~20 files)

- `apps/brikette/src/app/[lang]/draft/page.tsx` — Draft dashboard (lists all guides with status/checklist)
- `apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx` — Client-side dashboard with filtering/sorting
- `apps/brikette/src/app/[lang]/draft/[...slug]/page.tsx` — Dynamic draft preview (SSR, preview token auth)
- `apps/brikette/src/app/[lang]/draft/validation/page.tsx` — Validation dashboard
- `apps/brikette/src/app/[lang]/draft/validation/ValidationDashboard.tsx` — Validation UI
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/` — Full editor (15 files: `page.tsx`, `GuideEditor.tsx`, `GuideJsonEditor.tsx`, `types.ts`, 7 component files, 5 tab files)

#### Brikette API Routes (6 files)

- `apps/brikette/src/app/api/guides/[guideKey]/route.ts` — GET/PUT guide content (reads/writes locale JSON)
- `apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts` — GET/PUT/DELETE manifest overrides
- `apps/brikette/src/app/api/guides/[guideKey]/audit/route.ts` — POST SEO audit execution
- `apps/brikette/src/app/api/guides/bulk-translation-status/route.ts` — Bulk translation status
- `apps/brikette/src/app/api/guides/validate/coverage/route.ts` — Translation coverage validation
- `apps/brikette/src/app/api/guides/validate/manifest/route.ts` — Manifest validation

#### Brikette Authoring Utilities (2 files)

- `apps/brikette/src/routes/guides/guide-authoring/gate.ts` — `isGuideAuthoringEnabled()` (checks `ENABLE_GUIDE_AUTHORING` env)
- `apps/brikette/src/routes/guides/guide-authoring/urls.ts` — `buildGuideEditUrl()` (constructs draft edit URLs)

#### Brikette Editorial Panel & Preview Components (7 files)

- `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx` — 907-line component (status, areas, checklist, SEO audit, inline editing)
- `apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx` — 390 lines (translation table, content fields, FAQ counts, JSON-LD, SEO results)
- `apps/brikette/src/routes/guides/guide-seo/components/PreviewBanner.tsx` — Yellow banner on draft/review guides
- `apps/brikette/src/routes/guides/guide-seo/components/DevStatusPill.tsx` — Clickable status pill (dev mode)
- `apps/brikette/src/routes/guides/guide-seo/components/useTranslationCoverage.ts` — Hook using brikette i18n
- `apps/brikette/src/routes/guides/guide-seo/components/SeoAuditBadge.tsx` — Color-coded score badge
- `apps/brikette/src/routes/guides/guide-seo/components/SeoAuditDetails.tsx` — Audit results display

#### Brikette Template Integration (3 files)

- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` — Main guide template (565 lines). Uses `useGuideManifestState()`, conditionally renders `GuideEditorialPanel` when `shouldShowEditorialPanel` is true
- `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx` — Dynamically imports `GuideEditorialPanel` (`ssr: false`), renders `PreviewBanner` on draft routes, renders `DevStatusPill` in dev mode
- `apps/brikette/src/routes/guides/guide-seo/template/useGuideManifestState.ts` — 154-line hook. Fetches manifest overrides from API, computes `draftUrl`, `isDraftRoute`, `shouldShowEditorialPanel`, builds checklist with diagnostics

#### Brikette Preview & Status Utilities (2 files)

- `apps/brikette/src/routes/guides/guide-seo/utils/preview.ts` — `isPreviewAllowed()`, `isPublishedOrPreview()`, `shouldShowPreviewBanner()`
- `apps/brikette/src/utils/guideStatus.ts` — `getManifestGuideStatus()`, `getEffectiveGuideStatus()`, `toggleGuideStatus()` (localStorage-based status overrides)

#### Brikette Manifest Override System (4 files)

- `apps/brikette/src/routes/guides/guide-manifest-overrides.ts` — Type re-exports from `@acme/guide-system`
- `apps/brikette/src/routes/guides/guide-manifest-overrides.node.ts` — 211 lines, Node.js filesystem operations (atomic writes, backups, scoped path resolution)
- `apps/brikette/src/data/guides/guide-manifest-overrides.json` — Runtime override data (areas, status, draftPathSegment, auditResults)
- `apps/brikette/src/data/guides/guide-manifest-overrides.json.bak` — Backup

#### Brikette SEO Audit System (4 files)

- `apps/brikette/src/lib/seo-audit/index.ts` — Full audit engine (word count, images, links, FAQs, readability, entities, freshness, structured data → 0-10 score)
- `apps/brikette/scripts/audit-guide-seo.ts` — CLI script (231 lines, batch support)
- `apps/brikette/scripts/test-audit.ts` — Audit testing script
- `apps/brikette/scripts/verify-audit-score-fix.ts` — Audit verification script

#### Brikette Config & Robots (2 files)

- `apps/brikette/src/config/env.ts` — `PREVIEW_TOKEN` (lines 81-83) and `ENABLE_GUIDE_AUTHORING` (lines 84-90) env vars
- `apps/brikette/src/seo/robots.ts` — Disallow rules for `/*/draft/` routes (lines 8-21)

### Key Modules / Files

#### Two-Tier Status System

**Critical architectural finding:** Brikette uses two separate status types that are bridged at build time.

1. **Manifest status** (`@acme/guide-system`): `"draft" | "review" | "live"`
2. **Publication status** (brikette-only `guides.index.ts`): `"draft" | "review" | "published"`

The bridge logic lives in `guide-manifest.ts:4487-4505`:
```
live + !draftOnly → "published"
live + draftOnly  → "review"
review            → "review"
draft             → "draft"
```

**Default behavior** in `guides.index.ts:181-188`: entries default to `status: "published"` if not explicitly overridden. This means most guides (171/178) are published by default.

#### Content Loading Chain

1. **Storage**: `apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json`
2. **Node loader** (`locales/_guides/node-loader.ts`): `readSplitNamespace()` reads **ALL** content files from directory
3. **Import loader** (`locales/guides.imports.ts`): `CONTENT_KEYS` (168 entries) loaded in parallel via `Promise.all()`
4. **i18next backend** (`i18n.ts`): `resourcesToBackend` loads entire `guides` namespace when first requested
5. **Component access**: `useTranslation("guides")` → `t("guides:content.{key}.seo.title")`

**Critical finding:** ALL 168 guide content files are loaded as a single namespace. No per-guide lazy loading. 3,024 JSON files across 18 locales (~26.6 MB total).

#### Manifest & Override Merge

**File**: `guide-manifest.ts:4255-4274`
```
Priority: overrides.json > manifest entry > schema default ("draft")
```

`mergeManifestOverride()` replaces `areas`, `primaryArea`, `status` from override if present.

### Patterns & Conventions Observed

- **Static filtering at page level**: Each guide page type (`experiences`, `assistance`, `how-to-get-here`) independently filters `GUIDES_INDEX.filter(g => g.status === "published")` in `generateStaticParams` — evidence: `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx:23-36`
- **Runtime 404 guard**: Page components call `if (!isGuidePublished(guideKey)) notFound()` — evidence: same file line 107-109
- **Environment-gated features**: `ENABLE_GUIDE_AUTHORING` + `PREVIEW_TOKEN` gate all draft/authoring functionality
- **Atomic file writes**: Override system uses write-to-temp + rename pattern with `.bak` backup — evidence: `guide-manifest-overrides.node.ts`

### Data & Contracts

- Types/schemas:
  - `GuideManifestEntry` (`@acme/guide-system/manifest-types.ts`) — core manifest entry, no site discriminator
  - `ManifestOverride` (`@acme/guide-system/manifest-overrides.ts`) — runtime overrides (status, areas, audit results)
  - `GuideStatus`: `"draft" | "review" | "live"` (`@acme/guide-system`)
  - `GuidePublicationStatus`: `"draft" | "review" | "published"` (brikette-only, `guide-manifest.ts`)
  - `guideContentSchema` — Zod schema for guide content JSON
- Persistence:
  - `guide-manifest.ts` — static TypeScript (4523 lines, 165+ entries)
  - `guide-manifest-overrides.json` — runtime JSON overrides
  - `locales/{locale}/guides/content/{key}.json` — content files per locale
- API/event contracts:
  - Business-os API routes mirror brikette's (same endpoints, same auth pattern)
  - Preview token header: `x-preview-token`

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/guide-system` — shared manifest types, content schema, diagnostic types. Changes here affect both apps.
  - `apps/brikette/src/locales/` — content files on disk. Both apps read/write these.
  - `guide-manifest.ts` — static manifest entries. Currently only in brikette, used by both apps via snapshot.
- Downstream dependents:
  - `brikette` build (`generateStaticParams`) — reads `GUIDES_INDEX` to decide which pages to generate
  - `brikette` runtime (page components) — checks `isGuidePublished()` before rendering
  - `business-os` editor — reads manifest snapshot, reads/writes content files via API
  - `@acme/guide-system` consumers — any package importing manifest types
- Likely blast radius:
  - **High**: Changing `GuideManifestEntry` schema affects both apps and the shared package
  - **High**: Changing `guides.index.ts` status logic affects all guide static page generation
  - **Medium**: Removing brikette draft routes is self-contained (no external consumers)
  - **Medium**: Changing content loading to be status-aware affects bundle size and load patterns
  - **Low**: Removing env vars (`ENABLE_GUIDE_AUTHORING`, `PREVIEW_TOKEN`) from brikette is safe if authoring is fully in business-os

### Test Landscape

#### Test Infrastructure

- **Frameworks**: Jest (unit/integration), Cypress (not used for guides), Playwright (not used for guides)
- **Commands**: `pnpm --filter brikette test`, `pnpm --filter @acme/guide-system test`
- **CI integration**: Tests run in reusable workflow (`reusable-app.yml`), skipped on staging branch
- **Coverage tools**: No formal coverage thresholds for guide code

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Manifest completeness | unit | `guide-manifest-completeness.test.ts` | Every guide key has manifest entry |
| Manifest overrides (Node) | unit | `guide-manifest-overrides.node.test.ts` | FS operations, atomic writes |
| Manifest overrides (browser) | unit | `guide-manifest-overrides.test.ts` | Schema validation |
| Status mapping | unit | `guide-manifest.status.test.ts` | Two-tier status bridge logic |
| Content schema | unit | `content-schema.test.ts` | Zod schema validation |
| Placeholder detection | unit | `placeholder-detection.test.ts` | Detects placeholder content |
| SEO audit checklist | unit | `guide-checklist-seo-audit.test.ts` | Audit scoring logic |
| Guide diagnostics | unit | `guide-diagnostics.test.ts` | Diagnostic panel data |
| Published guide hydration | integration | `published-guide-hydration.test.tsx` | SSR → client hydration |
| Preview guide hydration | integration | `preview-guide-hydration.test.tsx` | Preview mode hydration |
| i18n hydration | integration | `guide-i18n-hydration.test.tsx` | Locale loading |
| Translation parity | unit | `i18n-parity-quality-audit.test.ts` | Cross-locale consistency |
| English fallbacks | unit | `guide-english-fallbacks.test.ts` | Missing translation fallback |
| Guide search | unit | `guide-search.test.ts` | Search functionality |
| Guide links | unit | `guideLinks.test.ts` | Link generation |
| URL resolver | unit | `guide-url-resolver.test.ts` | URL resolution |

#### Test Patterns & Conventions

- Unit tests: Import manifest entries and validate properties/schema compliance
- Integration tests: Full React render with i18n providers, check hydration consistency
- Test data: Uses real manifest data and locale files (no fixtures/factories for guide content)

#### Coverage Gaps (Planning Inputs)

- **Untested paths:**
  - `generateStaticParams` — no tests verify the status filter produces correct page params
  - Content bundling — no tests verify non-live guides are excluded from builds
  - Multi-site status — no infrastructure for per-site filtering tests
  - `useGuideManifestState` hook — no test for the bridge between manifest and template
- **Extinct tests** (tests that may assert obsolete behavior after this change):
  - `preview-guide-hydration.test.tsx` — tests preview mode which won't exist on brikette after decoupling
  - `guide-manifest-overrides.node.test.ts` — tests brikette FS operations that may move to business-os only

#### Testability Assessment

- **Easy to test**: Status filtering in `generateStaticParams` (pure function, deterministic), manifest schema changes (Zod validation)
- **Hard to test**: Content bundle exclusion (requires build-time verification), multi-site status resolution (no existing infrastructure)
- **Test seams needed**: Content loader needs a `filterByStatus(entries, site)` seam; `GUIDES_INDEX` generation needs to be parameterizable by site

#### Recommended Test Approach

- **Unit tests for**: Per-site status resolution, manifest schema with `sites` field, `generateStaticParams` output with mixed statuses
- **Integration tests for**: Guide page rendering with non-published status returns 404, content loader excludes non-live content
- **Build-time tests for**: Verify bundle does not contain content for non-live guides (snapshot test or bundle analysis)
- **Regression tests for**: All currently-published guides continue generating static pages after the change

### Recent Git History (Targeted)

- `guide-manifest.ts` — Recent additions of new guide entries, no structural changes to status system
- `guide-manifest-overrides.*` — Override system stabilized, no recent changes
- `guides.index.ts` — Status mapping logic unchanged recently
- Business-os guide authoring (Phase A) — completed recently, all API routes and editor in place

## Questions

### Resolved

- Q: Can business-os already handle all authoring tasks that brikette's draft routes provide?
  - A: Yes. Business-os has equivalent API routes (`/api/guides/[guideKey]`, `/api/guides/[guideKey]/manifest`, `/api/guides/[guideKey]/audit`, `/api/guides/bulk-translation-status`, `/api/guides/validate/*`), a full editor with tabs (overview, sections, FAQs, validation, raw JSON), and the new editorial sidebar with status/area management, checklist, SEO audit runner, and translation coverage.
  - Evidence: `apps/business-os/src/app/guides/edit/[guideKey]/` (complete editor), `apps/business-os/src/app/api/guides/` (all API routes)

- Q: Is the `guides.index.ts` two-tier status system necessary?
  - A: No. It's an artifact of brikette managing both drafting and publishing. With decoupling, the manifest status (`"live"`) can directly gate publication. The intermediate `"published"` status and `draftOnly` flag become unnecessary.
  - Evidence: `guides.index.ts:181-188` defaults to `"published"`, `guide-manifest.ts:4487-4505` bridges `live` → `published`

- Q: Can non-live guide content be excluded from the build bundle?
  - A: Yes, but it requires changes to the content loading chain. Currently `CONTENT_KEYS` in `guides.imports.ts` includes all 168 guide content files. Filtering this list by status at build time would exclude non-live content from the bundle.
  - Evidence: `locales/guides.imports.ts` line 94-101 loads all CONTENT_KEYS via `Promise.all()`

- Q: Where does the manifest live and who owns it?
  - A: The manifest (`guide-manifest.ts`, 4523 lines) lives in brikette. Business-os reads a JSON snapshot (`guide-manifest-snapshot.json`) generated by a script. For multi-site support, the manifest should move to `@acme/guide-system` or remain in brikette with per-site status fields.
  - Evidence: `apps/brikette/src/routes/guides/guide-manifest.ts`, `apps/brikette/scripts/generate-manifest-snapshot.ts`

### Open (User Input Needed)

- Q: Should the manifest move out of brikette into `@acme/guide-system`?
  - Why it matters: If it stays in brikette, adding per-site status means brikette "knows about" other consumer sites. Moving it to the shared package is cleaner but a larger refactor.
  - Decision impacted: Task scope and file ownership
  - Default assumption: Keep manifest in brikette for now, add per-site status fields. Move to shared package in a future phase. Risk: slight architectural smell (brikette owns data about other sites).

- Q: What is the first additional consumer site?
  - Why it matters: Determines whether multi-site needs concrete implementation now or can be schema-only preparation.
  - Decision impacted: Whether to build actual multi-site filtering or just add the schema fields.
  - Default assumption: No second consumer site yet. Add `sites` field to schema, implement single-site filtering for brikette, defer multi-site content bundling until a second site materialises. Risk: low — schema preparation is cheap.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 82%
  - High: All authoring APIs already exist in business-os, draft route removal is straightforward deletion, status filtering logic is well-understood
  - What's missing: Content bundle exclusion needs a new filtering mechanism in `guides.imports.ts` and `node-loader.ts`. Multi-site schema design needs validation.

- **Approach:** 75%
  - The single-site decoupling approach is clear and low-risk. Multi-site schema design has multiple valid options (flat `sites` map vs per-site manifest files vs status arrays). The content loading changes need architectural decision (filter at content-key level vs namespace level).
  - What would raise to ≥80%: Decide on multi-site schema shape. Prototype content exclusion in `guides.imports.ts` to verify bundle size reduction works with Next.js static export.

- **Impact:** 78%
  - Blast radius is well-mapped: ~60 files in brikette for removal, shared package schema changes, content loader changes. Published guide regression risk is moderate (all filtering is status-based, not content-based).
  - What would raise to ≥80%: Add `generateStaticParams` tests for the status filter before making changes. Verify static export produces identical output for published guides after content exclusion.

- **Testability:** 70%
  - Status filtering is highly testable (pure functions). Content bundle exclusion is harder to verify without build-time analysis. No existing test infrastructure for multi-site status.
  - What would improve: Add `generateStaticParams` unit tests, add bundle analysis test (verify non-live content absent from `out/`), create test harness for per-site status resolution.

## Planning Constraints & Notes

- Must-follow patterns:
  - Static export (`OUTPUT_EXPORT=1`) must continue to work for staging builds
  - Production Worker build (`@opennextjs/cloudflare`) must continue to work
  - All currently-published guides must produce identical static pages after the change
  - Shared types go in `@acme/guide-system`, app-specific code stays in the app
  - Business-os editorial sidebar already fetches from APIs — do not break those contracts
- Rollout/rollback expectations:
  - Phase approach: (1) Remove brikette draft routes, (2) Add content exclusion, (3) Add multi-site schema
  - Each phase should be independently deployable and reversible
  - Phase 1 has zero user-facing impact (draft routes are internal-only, gated by env vars)
  - Phase 2 needs verification that published guides are unaffected
- Observability expectations:
  - Log which guides are excluded from build (for debugging missing guides)
  - Build-time validation: warn if a guide has `status: "live"` but content files are missing

## Suggested Task Seeds (Non-binding)

### Phase 1: Remove Draft Facilities from Brikette

1. Delete draft route directory (`apps/brikette/src/app/[lang]/draft/`) — 20 files
2. Delete brikette API routes (`apps/brikette/src/app/api/guides/`) — 6 files
3. Delete authoring utilities (`guide-authoring/gate.ts`, `guide-authoring/urls.ts`)
4. Remove editorial panel and preview components from guide templates (`_GuideSeoTemplate.tsx`, `GuideSeoTemplateBody.tsx`)
5. Delete editorial/preview components (`GuideEditorialPanel.tsx`, `DiagnosticDetails.tsx`, `PreviewBanner.tsx`, `DevStatusPill.tsx`, `useTranslationCoverage.ts`, `SeoAuditBadge.tsx`, `SeoAuditDetails.tsx`)
6. Simplify `useGuideManifestState.ts` — remove draft URL computation, override fetching, editorial panel logic
7. Remove `ENABLE_GUIDE_AUTHORING` and `PREVIEW_TOKEN` env vars from brikette's `env.ts`
8. Remove draft disallow rules from `robots.ts`
9. Clean up manifest override system (keep read-only for status, remove write operations)
10. Remove/update test files that test deleted functionality (`preview-guide-hydration.test.tsx`, `guide-manifest-overrides.node.test.ts`)

### Phase 2: Automatic Publication (Content Exclusion)

11. Add `generateStaticParams` unit tests for current behavior (regression baseline)
12. Simplify two-tier status: replace `"published"` mapping with direct `status === "live"` check in `guides.index.ts`
13. Filter `CONTENT_KEYS` in `guides.imports.ts` to exclude non-live guides
14. Filter `readSplitNamespace()` in `node-loader.ts` to exclude non-live guides
15. Add build-time validation: log excluded guides, warn on missing content for live guides
16. Verify static export produces identical output for published guides

### Phase 3: Multi-Site Schema (Preparation)

17. Add `sites?: Record<string, { status?: GuideStatus }>` to `GuideManifestEntry` in `@acme/guide-system`
18. Update manifest validation and `createManifestEntrySchema()` to support `sites` field
19. Update `guides.index.ts` to resolve per-site status: `entry.sites?.brikette?.status ?? entry.status`
20. Update business-os editorial sidebar to show per-site status
21. Add unit tests for per-site status resolution

## Planning Readiness

- Status: **Ready-for-planning**
- Non-blocking open questions:
  - Manifest location (keep in brikette vs move to shared package) — default assumption is safe
  - First additional consumer site — deferred; schema preparation is sufficient
- Recommended next step: Proceed to `/plan-feature` with phase-based approach (Phase 1 → Phase 2 → Phase 3)

## File Removal Inventory

**~60 files** across brikette that directly implement or support draft/authoring:

| Category | File Count | Key Paths |
|----------|-----------|-----------|
| Draft routes | 20 | `app/[lang]/draft/**` |
| API routes | 6 | `app/api/guides/**` |
| Editorial/preview components | 7 | `routes/guides/guide-seo/components/*` |
| Authoring utilities | 2 | `routes/guides/guide-authoring/*` |
| Template integration | 3 | `_GuideSeoTemplate.tsx`, `GuideSeoTemplateBody.tsx`, `useGuideManifestState.ts` |
| Override system (write ops) | 2 | `guide-manifest-overrides.node.ts`, `guide-manifest-overrides.json` |
| SEO audit scripts | 4 | `lib/seo-audit/`, `scripts/audit-guide-seo.ts` |
| Status/preview utilities | 2 | `guide-seo/utils/preview.ts`, `utils/guideStatus.ts` |
| Config/robots | 2 | `config/env.ts` (partial), `seo/robots.ts` (partial) |
| Test files | 5+ | `test/routes/guides/`, `test/content-readiness/guides/` |
