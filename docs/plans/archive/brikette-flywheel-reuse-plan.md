Type: Plan
Status: Completed
Domain: Brikette
Last-reviewed: 2026-01-25
Last-updated: 2026-01-25
Re-planned: 2026-01-25
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-25
Created-by: Codex

# Brikette Flywheel Reuse Plan

## Summary
Systematically extract the most reusable Brikette app modules (image pipeline, guides/assistance system, SEO/structured data, and select adapters) into shared packages. Brikette becomes the first consumer, and at least one secondary app validates reuse. Additionally, improve the guide authoring experience by surfacing actionable diagnostics and providing content editing tools. Goal: reduce duplication, eliminate drift, speed up future app delivery, and make guide content creation more efficient.

## Related Plans / Dependencies
- Guides URL canonicalization and resolver work is complete and archived at `docs/plans/archive/brikette-guides-delegacy-plan.md` (Completed: 2026-01-25).
  - Delivered: `guidePath` as the single source of truth (with `guideHref`/`guideAbsoluteUrl` delegating), removal of legacy `/[lang]/guides/*` routes (404 policy), and a guardrail test preventing `/guides` string usage in Brikette source.
  - This plan treats that work as a prerequisite satisfied. Phase 2 here is packaging/extracting the already-working resolver/model into a shared, browser/edge-safe package and validating with a second consumer.

## Objectives
- Convert Brikette’s highest‑leverage app‑local modules into shared packages with clear APIs.
- Migrate Brikette to consume shared implementations (no duplicate logic).
- Validate reusability by onboarding at least one secondary app or template.
- Establish guardrails to prevent copy‑paste forks and ensure ongoing reuse.

## Scope
### In-scope extraction targets
1) Image pipeline
   - `apps/brikette/src/components/images/CfImage.tsx`
   - `apps/brikette/src/lib/buildCfImageUrl.ts`
   - `apps/brikette/src/hooks/useResponsiveImage.ts`
   - Presets/config in `apps/brikette/src/config/imagePresets.ts` (as needed)
2) Guides/assistance core (already centralized in Brikette; next step is extraction)
   - URL resolver + namespace mapping + slug keys:
     - `apps/brikette/src/routes.guides-helpers.ts` (exports `guidePath`/`guideHref`/`guideAbsoluteUrl`)
     - `apps/brikette/src/guides/slugs/*`
   - Manifest model (Brikette-local; optionally extract only minimal shared primitives if needed):
     - `apps/brikette/src/routes/guides/guide-manifest.ts`
   - Assistance slug helpers (as applicable):
     - `apps/brikette/src/routes.assistance-helpers.ts`
3) Guide SEO + structured data
   - `apps/brikette/src/routes/guides/guide-seo/*`
   - `apps/brikette/src/components/seo/*` (guide/assistance relevant pieces)
4) Assistance UI blocks (select)
   - Primary target: `apps/brikette/src/components/assistance/quick-links-section/*` (split portable UI vs Brikette-only i18n/routing glue)
   - Audit + close remaining gaps in the already-shared assistance UI surface:
     - `packages/ui/src/organisms/*` (canonical UI)
     - `apps/brikette/src/components/assistance/*` (mostly wrappers/re-exports; keep app-only glue local)
5) Adapter patterns (select)
   - Existing canonical example: `apps/brikette/src/components/rooms/RoomCard.tsx` + `packages/ui/src/molecules/RoomCard.api.md`
   - Only extract additional adapters once at least two apps need the pattern (otherwise document, don’t “pre-extract”)
6) Brikette guide editorial workflow (optional follow-on; see Phase 7)
   - Diagnostic display in the draft dashboard + editorial panel (Phase 7a)
   - Authoring workflow (Phase 7b; explicitly gated and requires a persistence/security decision)

### Out of scope
- Rewriting guide content or translations unless required for API stability.
- Large redesigns or product changes.
- Production authoring that relies on server filesystem persistence (requires a backing store like GitHub PRs or a CMS).
- Breaking changes to shared packages. If a shared implementation needs to change, it must be done in a backward-compatible way (feature flags / additive exports / codemods), then migrated app-by-app.

## Reuse Outcomes (What becomes reusable)
- **Shared image kit** usable by any app: responsive presets, URL builder, CfImage, and compatible hooks.
- **Reusable guides URL core**: slug resolution + URL helpers via `@acme/guides-core` (factory-based; per-app data injected). Manifest/editorial schema can remain app-specific.
- **SEO/structured data modules**: consistent JSON‑LD/metadata helpers for editorial content.
- **Assistance UI building blocks**: help center navigation, article sections, quick‑links patterns.
- **Adapter pattern examples**: documented templates for app‑data → shared UI composition.

## Deliverables
- New or expanded shared package(s) with exported APIs and tests.
- Brikette migrated to shared modules (no duplicate logic).
- Secondary app or template app consumes at least one extracted module.
- Guardrails to prevent future divergence (lint rules, tests, or CI checks).

## Proposed Package Targets
- `@acme/ui` for UI components and browser-safe hooks (CfImage, assistance UI blocks, React JSON-LD emitters).
- `@acme/ui/lib/seo/*` as the canonical home for portable SEO helpers (JSON-LD serialization, canonical URL helpers, shared schema types).
- `@acme/guides-core` (new, pure TS) for reusable guide URL building + slug resolution (factory-based; consumes injected slug tables and base-path logic). Keep Brikette manifest + slug-generation data local.
  - Note: `@acme/editorial` is currently Node/server oriented (reads from `DATA_ROOT`) and is not a safe home for code that needs to run in Next.js client/edge contexts.
- Decision: do **not** create `@acme/seo-core`. Consolidate portable helpers into `@acme/ui/lib/seo/*`, and keep app/server-only SEO assembly where it belongs (e.g., `packages/template-app/src/lib/seo.ts`).

## Plan of Work
### Phase 0 — Secondary Consumer + Design Constraints (DONE)
- Decision: the first non-Brikette consumer is `@acme/template-app`.
- Constraints:
  - Browser/edge safety: no Node-only imports in shared code intended for App Router/client/edge.
  - No breaking changes to `@acme/ui` exports without a migration plan.
  - All extracted modules must have tests in the shared package and at least one consumer integration usage in a real Next.js runtime surface (not only a unit test).

### Phase 1 — Image Pipeline Consolidation (high priority, early validation gate)
- Canonicalize the image pipeline in one place (prefer `@acme/ui` since it already contains `CfImage` and `buildCfImageUrl`).
  - Diff and reconcile: `apps/brikette/src/components/images/CfImage.tsx` vs `packages/ui/src/atoms/CfImage.tsx`.
  - Promote missing capabilities into `@acme/ui` in a backward-compatible way.
- Migrate Brikette to import only from `@acme/ui` for:
  - `CfImage` (and derived helpers like CfHeroImage/CfCardImage if needed)
  - `buildCfImageUrl`
  - `useResponsiveImage`
- Validation gate (must pass before moving on):
  - A non-Brikette consumer successfully renders an image using the shared `CfImage` in a real Next.js runtime surface (e.g., template-app page/component). (As of 2026-01-25, template-app does not yet import `CfImage`, so this requires adding a real usage.)
  - Grep check: no remaining Brikette-local copies of the canonical implementation.

### Phase 2 — Guides/Assistance Core (high priority, split core vs app wiring)
- Create `@acme/guides-core` as a pure TS package (no `apps/*` imports; no Node-only modules) that exports a factory for guide URL helpers:
  - `createGuideUrlHelpers<Lang extends string, Key extends string>(config)`
  - Returns: `guidePath`, `guideHref`, `guideAbsoluteUrl`, `resolveGuideKeyFromSlug`
  - Core owns slug normalization + tolerant matching; consumer provides key/slug data and base-path logic.
- Keep Brikette as the “wiring” layer:
  - Keep guide key derivation + slug generation + namespace decisions in Brikette.
  - Implement Brikette’s existing exported helpers (`@/routes.guides-helpers`) in terms of `@acme/guides-core` (backward-compatible surface).
- Manifest extraction: only extract minimal, app-agnostic primitives if they earn their keep (e.g., `GuideArea`/`GuideStatus` enums). Keep Brikette’s Zod schemas, block declarations, and editorial dashboard wiring in-app.
- Assistance routing: decide whether assistance slug helpers belong in the same package (recommended: separate unless another app adopts it).
- Validation gate:
  - Brikette routes build URLs exclusively via `@acme/guides-core` (no duplicated mapping tables outside the Brikette wiring module).
  - `@acme/guides-core` has unit tests using a tiny stub config (proves reusability without adding dead code to template-app).
  - Brikette guardrails stay green:
    - `apps/brikette/src/test/utils/guide-url-resolver.test.ts`
    - `apps/brikette/src/test/migration/no-legacy-guides-path.test.ts`

### Phase 3 — SEO + Structured Data (medium priority)
- Consolidate SEO into a single canonical home:
  - React “emit JSON-LD” components: `packages/ui/src/components/seo/*`.
  - Portable helper utilities + shared types: `packages/ui/src/lib/seo/*`.
- Migration:
  - Introduce `serializeJsonLd()` in `@acme/ui/lib/seo/*` and replace direct `JSON.stringify(...)` usage in JSON-LD `<script>` tags (SEO + assistance quick links).
  - Refactor `packages/template-app/src/lib/seo.ts` to consume shared helpers where overlaps exist (keep server-only concerns local).
  - Parameterize or deprecate any Brikette-specific SEO component currently living in `@acme/ui` (e.g., avoid hard-coded deal windows in shared components).
- Validation gate:
  - Extend existing Brikette contract coverage (`apps/brikette/src/test/utils/seo.test.ts`) and add JSON-LD-focused assertions/tests for representative pages (home, a guide page, assistance/FAQ, and deals).

### Phase 4 — Assistance UI Blocks (medium priority)
- Treat `packages/ui/src/organisms/*` as the canonical home for reusable assistance UI.
- Primary extraction: split `apps/brikette/src/components/assistance/quick-links-section/*` into:
  - a portable UI component in `@acme/ui` (prop-driven; no app imports), and
  - Brikette-local hooks that resolve translations + URLs (can depend on `routes.assistance-helpers`).
- Reuse hardening: replace JSON-LD `JSON.stringify(...)` in quick-links with shared `serializeJsonLd()` from Phase 3.
- Keep Brikette-specific wrapper/layout components local (e.g., anything with hard-coded hostel booking links or direct Brikette route assumptions).
- Document required props, i18n expectations, and allowed escape hatches (e.g., optional custom link renderer) in the shared component README/API notes.

### Phase 5 — Reference Adapter Patterns (optional, document-first)
- Existing canonical example: RoomCard adapter + docs already exist (`apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/molecules/RoomCard.api.md`).
- Only extract additional adapters once at least two apps need the pattern; otherwise prefer “document-only” (inputs/outputs, error handling expectations, testing approach).

### Phase 6 — Guardrails + Cleanup
- Add guardrails to prevent re‑introducing app‑local duplicates:
  - Brikette-side guardrail tests (Node fs scan) patterned after `apps/brikette/src/test/migration/no-legacy-guides-path.test.ts`
  - Brikette ESLint rules (`no-restricted-imports`) to block importing deprecated/local paths once migrations land
  - Optional: CI script that asserts the canonical imports for a short allowlist of “must be shared” modules (image pipeline, guides-core, JSON-LD serializer)
- Remove redundant modules from Brikette after migration.
- Document “how to upstream” in a short README/AGENT note.

## Non-breaking Migration Strategy (Shared Packages)
- Prefer additive exports and feature flags over changing behavior in-place.
- If an API needs to change:
  - Introduce a new API alongside the old one.
  - Migrate Brikette and the selected secondary consumer.
  - Remove/cleanup only after the old API is unused (or explicitly deprecated with a timeline).

## Acceptance Criteria
- Brikette uses shared packages for image pipeline, guides URL core (`@acme/guides-core`), and SEO helpers.
- No duplicate implementation remains in Brikette for extracted modules.
- All JSON-LD `<script>` tags use shared `serializeJsonLd()` (no direct `JSON.stringify(...)` into `dangerouslySetInnerHTML`).
- At least one non‑Brikette consumer uses an extracted module in a real Next.js runtime surface.
- CI/tests pass for shared packages and Brikette.
- Guardrails prevent new copies of extracted modules.
- (Phase 7a) Editorial panel and draft dashboard show specific, actionable diagnostics instead of generic "Missing" labels.
- (Phase 7b) Users can edit guide content from the draft interface (pending UX decision).

### Verifiable checks (examples)
- Image pipeline:
  - `rg \"apps/brikette/src/components/images/CfImage\" apps/brikette/src` returns 0
  - Brikette imports `CfImage` from `@acme/ui` (or the agreed canonical package) only
- Guides core:
  - Brikette’s canonical helper surface (`@/routes.guides-helpers`) is implemented via `@acme/guides-core` (core logic), with Brikette-only wiring/data kept local.
  - Guardrail test remains green: `apps/brikette/src/test/migration/no-legacy-guides-path.test.ts`
  - URL resolver contract stays green: `apps/brikette/src/test/utils/guide-url-resolver.test.ts`
- SEO:
  - Contract tests cover canonical + alternates + JSON-LD URLs for representative pages
- JSON-LD serialization:
  - No direct `JSON.stringify(...)` passed into `dangerouslySetInnerHTML` in SEO/structured-data modules
- Secondary consumer:
  - One non-Brikette package/app imports and uses the extracted module in runtime code (not only tests/stories)
  - `pnpm --filter @acme/template-app build` passes with that runtime usage present

## Risks & Mitigations
- Risk: Shared APIs become too Brikette‑specific.
  - Mitigation: keep domain‑specific config injection points and avoid hardcoded slugs.
- Risk: App migration breaks runtime SEO or URLs.
  - Mitigation: add tests around canonical URLs and structured data outputs.
- Risk: JSON-LD serialization introduces XSS/hydration risk if not consistently escaped.
  - Mitigation: centralize on `serializeJsonLd()` + add regression tests for escaping (`</script>`, `<`, U+2028/U+2029).
- Risk: Package boundaries become unclear.
  - Mitigation: keep ownership and file layout explicit in package READMEs.

## Open Questions (RESOLVED)

### Q1: Which app should be the first secondary consumer?
**Decision: `@acme/template-app`**

Rationale:
- Already depends on `@acme/ui` (workspace dependency)
- Has `[lang]/` route structure matching Brikette's i18n pattern
- Has existing SEO infrastructure (`src/lib/seo.ts`)
- Designed as a reusable template for new apps
- Uses `@acme/i18n` which provides `Locale` types

### Q2: Should guides live in `@acme/guides-core` vs `@acme/ui`?
**Decision: NEW `@acme/guides-core` package**

Rationale:
- Guides system is pure TS logic (URL resolution, namespace mapping, slug lookups)
- No React components in the core resolver — it's data/URL logic only
- Must be browser/edge-safe (no Node-only dependencies)
- `@acme/ui` is for UI components; mixing in URL resolver logic violates separation of concerns
- Dependencies are minimal: just need language types from `@acme/i18n`
- Keeps the package small and focused for tree-shaking

### Q3: Where should SEO-core helpers live?
**Decision: Expand `@acme/ui/components/seo/`**

Rationale:
- Brikette's 27 SEO components are all React components (emit `<script>` tags)
- `@acme/ui` already has `components/seo/DealsStructuredData.tsx` (needs genericization; currently hard-coded)
- Pure TS helpers like `serializeJsonLd` can live in `@acme/ui/lib/seo/`
- Avoids creating a third SEO home
- `template-app/src/lib/seo.ts` has server dependencies (`@acme/platform-core`) — that logic stays server-side, but portable helpers move to @acme/ui

---

## Audit Findings (2026-01-25)

### Image Pipeline Drift Audit

| Component | Identical? | Canonical | Migration Notes |
|-----------|------------|-----------|-----------------|
| `imagePresets.ts` | ✓ Yes | `@acme/ui` | No changes needed |
| `useResponsiveImage.ts` | ✓ Yes | `@acme/ui` | No changes needed |
| `buildCfImageUrl.ts` | ~90% | `@acme/ui` | @acme/ui has better env portability (Vite-agnostic) |
| `CfImage.tsx` | ~75% | Needs merge | Brikette adds `sourceFormats` prop; @acme/ui has better useMemo patterns |

**Key diffs in CfImage.tsx:**
- Brikette adds `sourceFormats?: readonly CfImageFormat[]` prop — allows override of `<source>` formats
- @acme/ui uses `useMemo` for derived values; Brikette uses inline IIFE
- @acme/ui uses Tailwind classes on `<picture>`; Brikette uses inline `pictureStyle`
- Brikette conditionally omits width/height attributes; @acme/ui always sets them

**Resolution:** Upstream Brikette's `sourceFormats` prop to @acme/ui, adopt @acme/ui's useMemo pattern.

### Guides Extraction Boundary Audit

**Current canonical implementation (Brikette):**
- Public entrypoint (re-export): `apps/brikette/src/routes.guides-helpers.ts`
- Actual implementation: `apps/brikette/src/guides/slugs/*`
- Consumer inventory (Brikette, 2026-01-25):
  - ~63 files import `@/routes.guides-helpers`
  - ~10 files import `@/guides/slugs` directly

**Portability audit of `apps/brikette/src/guides/slugs/*`:**

| File | Portable to `@acme/guides-core`? | Why | Extraction strategy |
|------|----------------------------------|-----|--------------------|
| `urls.ts` | Partially | imports `BASE_URL` + depends on Brikette `guideNamespace` + Brikette slug tables | move URL/absolute-path logic into shared core; keep Brikette wiring local |
| `resolve.ts` | Yes (logic) | slug normalization + tolerant matching is generic | move algorithm into core; feed it lookups built from injected slug tables |
| `lookups.ts` | Yes (derived) | reverse map can be derived from slug tables | core builds it internally from injected slugs |
| `keys.ts` | No | derives `GuideKey` from Brikette-generated guide data | keep `GuideKey` + key lists app-local; core uses generics (`Key extends string`) |
| `namespaces.ts` | No | depends on Brikette manifest + `getSlug()` + Brikette-specific overrides | keep base/namespace decision logic local; core accepts a `basePathForKey` function |
| `slugs.ts` / `labels.ts` | No | pulls i18n bundles + slugify/transliteration to generate slugs | keep slug-generation + localization local; core only consumes `slugsByKey` data |
| `components.ts` / `overrides.ts` / `supported-langs.ts` | No | app-specific routing/file layout + data | keep local |

**Recommended `@acme/guides-core` surface (pure TS):**
- `createGuideUrlHelpers<Lang extends string, Key extends string>(config)` that returns:
  - `guidePath(lang, key)` / `guideHref(lang, key)` (relative URLs)
  - `guideAbsoluteUrl(lang, key)` (uses injected `baseUrl`)
  - `resolveGuideKeyFromSlug(slug, lang?)`
- Core owns:
  - slug normalization rules (case, hyphens, “compact” matching)
  - reverse lookups derived from slug tables
- Consumer owns:
  - key lists + slug tables (generated or hand-maintained)
  - base/namespace decisions (which top-level section a key belongs to)

**Injection points needed:**
1. `Lang` type (from `@acme/i18n`, or `string`)
2. `Key` type (app-local union; core is generic)
3. `baseUrl` (string; required for `guideAbsoluteUrl`)
4. `basePathForKey(lang, key)` (returns `/${lang}/${baseSlug}` or similar)
5. `slugsByKey` (`Record<Key, Record<Lang, string>>` or equivalent)
6. Optional: `fallbackSlugFromKey(key)` when slug tables are incomplete

**Brikette-specific code that stays local:**
- Guide key derivation from Brikette data (`apps/brikette/src/data/generate-guide-slugs`)
- Slug generation from locale bundles (`getGuideLinkLabels`, `slugify`, `transliterateGuideLabel`)
- Manifest-driven grouping/draft status + `publishedGuideKeysByBase` logic
- Component-path mapping (`guideComponentPath`) and route wiring

### Pending Audit Work — Guides Core Extraction (Phase 2)

Goal: remove ambiguity around what is “core” vs “Brikette glue”, and prevent Phase 2 from stalling on repeated re-audits.

**Public API decision (must settle before writing package code):**
- [x] Confirm `@acme/guides-core` exports a factory (`createGuideUrlHelpers`) rather than concrete Brikette-specific constants.
- [x] Decide whether `guideNamespace(...)` is part of core (decision: **no**, keep base/namespace in consumer config).
- [x] Decide whether assistance routing belongs in the same package (decision: **separate**, unless another app adopts it).

**Call-site impact audit (Brikette):**
- [x] Enumerate all imports of `@/routes.guides-helpers` and `@/guides/slugs` and group by usage:
  - URL building (`guideHref`, `guidePath`, `guideAbsoluteUrl`) — used in 24/25/8 files respectively (includes tests + slugs implementation).
  - Slug resolution (`guideSlug`, `resolveGuideKeyFromSlug`) — used in 15 / 9 files respectively.
  - Namespace grouping (`guideNamespace`) — used in 12 files.
  - Non-core helpers (`guideComponentPath`, `TRANSPORT_LINK_KEYS`, `GUIDE_KEYS`) — used in 4 / 2 / 14 files respectively.
- [x] For non-core helpers, explicitly mark “stays app-local” vs “becomes shared”.
  - **Stays app-local:** `guideNamespace`, `guideSlug`, `guideComponentPath`, `GUIDE_KEYS`, `TRANSPORT_LINK_KEYS`, `publishedGuideKeysByBase`, slug generation + label helpers.
  - **Shared via core:** `guidePath`, `guideHref`, `guideAbsoluteUrl`, `resolveGuideKeyFromSlug`, `slugLookupsByLang` (already provided by `@acme/guides-core`).

**Data boundaries (no accidental app imports in shared packages):**
- [x] Identify and isolate the app-only data sources that currently power guides:
  - generated guide keys (`apps/brikette/src/data/generate-guide-slugs`)
  - slug tables (`apps/brikette/src/guides/slugs/slugs.ts`)
  - base/namespace overrides (`apps/brikette/src/guides/slugs/namespaces.ts`)
- [x] Ensure shared package code has **zero** imports from `apps/*` and **zero** Node-only modules (confirmed in `packages/guides-core/src/index.ts`).

**Test plan (shared + consumer):**
- [x] Add unit tests in `@acme/guides-core` using a tiny stub config (2 langs, 2 keys) covering:
  - `guidePath`/`guideAbsoluteUrl` correctness
  - tolerant `resolveGuideKeyFromSlug` matching (case, hyphen-insensitive)
  - Implemented at `packages/guides-core/__tests__/createGuideUrlHelpers.test.ts`.
- [x] Keep Brikette contract tests green:
  - `apps/brikette/src/test/utils/guide-url-resolver.test.ts`
  - `apps/brikette/src/test/utils/seo.test.ts` (alternates for guides)

### SEO Consolidation Audit

| Location | Files | Pattern | Server/Client |
|----------|-------|---------|---------------|
| `apps/brikette/src/components/seo/` | 27 components | React JSON-LD emitters | Client |
| `packages/ui/src/components/seo/` | 1 component | React JSON-LD emitter | Client |
| `packages/template-app/src/lib/seo.ts` | 1 file | Pure TS helpers + server data fetch | Server |

**Overlapping functionality:**
- JSON-LD serialization: template-app escapes `<` in JSON-LD strings; Brikette largely uses raw `JSON.stringify(...)` in `<script>` tags (needs consolidation)
- Canonical URL helpers: template-app has `safeAbsoluteUrl`, `normalizePath`
- Structured data builders: template-app has `getStructuredData()` for Product/WebPage
- Deals structured data: `packages/ui/src/components/seo/DealsStructuredData.tsx` is currently hard-coded (2025 promo window); Brikette has a dynamic implementation based on `DEALS`

**Resolution:**
1. Extract portable helpers to `@acme/ui/lib/seo/`:
   - `serializeJsonLd()` — XSS-safe JSON-LD serialization
   - `buildCanonicalUrl()` — canonical URL normalization
   - Type definitions for common JSON-LD shapes
2. Keep React components in `@acme/ui/components/seo/`
3. Refactor `packages/ui/src/components/seo/DealsStructuredData.tsx` to be prop-driven (or move it out of `@acme/ui` if it can’t be made generic)
4. template-app's server-specific `getSeo()` stays in template-app (depends on platform-core)

### Pending Audit Work — Brikette SEO Components (27)

Goal: make “what moves where” explicit so Phase 3 can’t stall on re-auditing.

**Worth extracting to `@acme/ui` (generic + likely multi-consumer):**
- `BreadcrumbStructuredData.tsx` (breadcrumb JSON-LD emitter; keep prop-driven)
- `BarMenuStructuredData.tsx` + `BreakfastMenuStructuredData.tsx` (consolidate into a single JSON-LD script component that uses `serializeJsonLd()`)
- `SiteSearchStructuredData.tsx` (extract as prop-driven: `baseUrl`, `lang`, `searchPathTemplate`, `orgId`, `websiteId`)
- `StructuredData.tsx` (likely delete; superseded by `BreadcrumbStructuredData.tsx` once shared)

**Keep app-local (Brikette-specific data/copy or heavy app deps); still migrate to shared helpers:**
- `AboutStructuredData.tsx`, `ApartmentStructuredData.tsx`, `ArticleStructuredData.tsx`, `CareersStructuredData.tsx`, `DealsStructuredData.tsx`, `EventStructuredData.tsx`, `ExperiencesStructuredData.tsx`, `HomeStructuredData.tsx`, `HostelStructuredData.tsx`, `HowToReachPositanoStructuredData.tsx`, `RoomStructuredData.tsx`, `RoomsStructuredData.tsx`, `SeoHead.tsx`, `ServiceStructuredData.tsx`, `TravelHelpStructuredData.tsx`, `AssistanceFaqJsonLd.tsx`, `FaqStructuredData.tsx`, `HowToJsonLd.tsx`

**Keep local for now; revisit after Phase 2 (`@acme/guides-core`) clarifies boundaries:**
- `GuideFaqJsonLd.tsx`
- `GuideMonthsItemListStructuredData.tsx`
- `GuideSectionsItemListStructuredData.tsx`
- `GuidesTagsStructuredData.tsx`

**Checklist (Phase 3 gates):**
- [x] Replace **all** JSON-LD `<script>` stringification with `serializeJsonLd()` (including `?raw` imports: parse → serialize).
- [x] Normalize canonical URLs via `buildCanonicalUrl()` and remove hardcoded host constants (e.g., `HowToReachPositanoStructuredData.tsx` uses `HOST_URL`).
- [x] Fix/parameterize time-sensitive hardcoding:
  - [x] `CareersStructuredData.tsx` has `validThrough: "2026-01-01"` which is already past as of 2026-01-25.
  - [x] `packages/ui/src/components/seo/DealsStructuredData.tsx` is hard-coded to a 2025 promo window (already stale).
- [x] Remove duplication:
  - [x] Choose one canonical FAQ JSON-LD path (`FaqStructuredData.tsx` vs `AssistanceFaqJsonLd.tsx` vs TravelHelp FAQ) and delete/redirect the others.
  - [x] Consolidate breadcrumb emitters (`StructuredData.tsx` vs `BreadcrumbStructuredData.tsx`).
- [x] Remove/gate production debug side effects (e.g., `TravelHelpStructuredData.tsx` writes `globalThis.nearbyJson`).
- [x] Add contract tests for representative pages (home, guide, assistance/FAQ, deals) asserting:
  - [x] JSON-LD escaping works (`<`, `</script>`, U+2028/U+2029)
  - [x] canonical URLs match expected routes

### Phase 3 Pre‑Work Audit — Detailed Findings (2026‑01‑25)

Goal: remove ambiguity and raise Phase 3 confidence by enumerating every JSON‑LD emitter, its data sources, and the specific risk it carries.

**Global observations**
- 20+ components write raw `JSON.stringify(...)` to `<script type="application/ld+json">` with no escaping → XSS/hydration risk.
- Multiple components hardcode hostnames (`HOST_URL` or `https://hostel-positano.com`) instead of a shared canonical builder.
- Time‑sensitive fields exist in multiple places (some hardcoded, some `new Date()`), risking stale data and hydration mismatch.
- FAQ emitters are duplicated across assistance + travel‑help + general FAQ with overlapping semantics.

**Component inventory (what it does + risk + recommendation)**
- `AboutStructuredData.tsx`: Organization JSON‑LD; static data; uses `BASE_URL` and image manifest. **Keep local**, but re‑serialize via shared `serializeJsonLd()`.
- `ApartmentStructuredData.tsx`: raw JSON‑LD import (`?raw`). **Keep local**, but parse → serialize for escaping; flag if JSON malformed.
- `ArticleStructuredData.tsx`: buildArticlePayload + window path; uses `new Date()` fallback for dates. **Keep local**, convert to `serializeJsonLd()`; consider deterministic fallback date to avoid hydration mismatch.
- `AssistanceFaqJsonLd.tsx`: builds FAQ from translations; emits empty FAQPage payload when missing. **Keep local**, but use shared serializer; candidate to consolidate with `FaqStructuredData`.
- `BarMenuStructuredData.tsx`: accepts raw JSON string. **Extract** as generic `JsonLdScript` in `@acme/ui` (prop‑driven), or replace with shared serializer.
- `BreakfastMenuStructuredData.tsx`: serializes graph prop, includes `data-*` attributes. **Extract** as generic JSON‑LD script with optional `data-id`/`data-lang`.
- `BreadcrumbStructuredData.tsx`: uses `buildBreadcrumbList`. **Extract** to `@acme/ui/components/seo/BreadcrumbStructuredData` once serializer is shared.
- `CareersStructuredData.tsx`: JobPosting with `validThrough: "2026-01-01"` (past as of 2026‑01‑25). **Keep local**, but update dates to be data‑driven or remove stale window.
- `DealsStructuredData.tsx`: uses `DEALS` data and `getDealStatus`; safe but uses hardcoded images under `/images/*`. **Keep local**, swap to serializer; ensure image URLs exist or use `buildCfImageUrl` once SEO helpers land.
- `EventStructuredData.tsx`: path‑based event JSON‑LD; safe. **Keep local**, swap to serializer and canonical URL helper.
- `ExperiencesStructuredData.tsx`: translation‑driven `ItemList`. **Keep local**, swap to serializer; depends on i18n readiness.
- `FaqStructuredData.tsx`: assistance FAQ aggregation; uses translation stores. **Keep local**, but decide canonical FAQ emitter vs `AssistanceFaqJsonLd` and consolidate.
- `GuideFaqJsonLd.tsx`: guide‑specific FAQ; depends on guide data. **Keep local for now** (revisit after guides‑core extraction).
- `GuideMonthsItemListStructuredData.tsx`: translation‑driven; uses guide URLs. **Keep local for now**, serializer swap.
- `GuideSectionsItemListStructuredData.tsx`: translation + runtime fallback; uses guide data. **Keep local for now**, serializer swap.
- `GuidesTagsStructuredData.tsx`: tag dictionary builder; emits two JSON‑LD scripts. **Keep local**, serializer swap; uses tag utilities.
- `HomeStructuredData.tsx`: buildHomeGraph; uses `BASE_URL`. **Keep local**, serializer swap.
- `HostelStructuredData.tsx`: derived from hotel node; uses `BASE_URL`. **Keep local**, serializer swap.
- `HowToJsonLd.tsx`: uses `buildHowToPayload`. **Keep local**, serializer swap.
- `HowToReachPositanoStructuredData.tsx`: hardcodes `HOST_URL` and locale copy. **Keep local**, but migrate to canonical URL helper and remove hardcoded host.
- `RoomStructuredData.tsx`: uses `new Date()` for `validFrom` and hardcoded host. **Keep local**, replace date with deterministic policy (or server‑only), serializer swap.
- `RoomsStructuredData.tsx`: uses fallback date `2025-01-01` to avoid mismatch. **Keep local**, but update date policy + serializer.
- `SeoHead.tsx`: not JSON‑LD; uses `buildLinks` + `pageHead`. **Keep local**, but ensure canonical helper adopted when added.
- `ServiceStructuredData.tsx`: hardcoded `https://hostel-positano.com` in fallback URL. **Keep local**, swap to canonical helper + serializer.
- `SiteSearchStructuredData.tsx`: SearchAction on WebSite. **Extract** as prop‑driven component in `@acme/ui` once helpers are in place.
- `StructuredData.tsx`: breadcrumb‑only duplicate of `BreadcrumbStructuredData`. **Remove** or alias to the canonical component.
- `TravelHelpStructuredData.tsx`: FAQ + nearby JSON‑LD from `?raw` file; writes `globalThis.nearbyJson` debug; **Keep local**, replace debug side‑effect, parse + serialize with shared helper.
- `locationUtils.ts`: helper module; **Keep local**, potentially extract if multiple apps need it.

**Hard blockers to resolve early (confidence reducers)**
- Past‑dated `validThrough` in `CareersStructuredData.tsx`.
- Hardcoded `HOST_URL`/absolute URL assembly across multiple components.
- `RoomStructuredData.tsx` uses `new Date()` in render → potential hydration mismatch.
- Raw JSON‑LD strings (no escaping) across most components.
- Multiple FAQ emitters with overlapping responsibilities.

**Confidence uplift checklist (pre‑Phase 3 work)**
- [x] Introduce shared `serializeJsonLd()` in `@acme/ui/lib/seo` and use it everywhere in Brikette SEO emitters.
- [x] Add `buildCanonicalUrl()` helper in `@acme/ui/lib/seo` and standardize URL assembly.
- [x] Remove or gate all time‑sensitive hardcoded dates; replace with deterministic policy or data source.
- [x] Collapse FAQ emitters to a single canonical path + adapters.
- [ ] Add/extend JSON‑LD contract tests to cover escaping and canonical URLs.

### Assistance UI Reuse Audit

| Area | Status | Notes |
|------|--------|------|
| Assistance sections (AMA/article/ferry/etc) | Already shared | Live in `packages/ui/src/organisms/*`; Brikette mainly wraps/re-exports |
| Help-centre nav UI | Already shared | Brikette provides app-specific item generation + translations; UI is in `@acme/ui` |
| Quick links section | Needs split | Brikette implementation mixes UI + i18n + routing + JSON-LD; extract the UI-only layer |
| Assistance hero / hostel booking links | Brikette-specific | Keep local; too site-specific without heavy parameterization |
| Also-see-guides crosslink | Brikette-specific | Keep local; depends on Brikette guide keys/copy |

**Resolution:** Treat assistance reuse as “UI in `@acme/ui`, app glue local”. The only meaningful extraction remaining is the quick-links section UI (plus adopting shared JSON-LD serialization).

### Adapter Pattern Audit

| Pattern | Status | Notes |
|---------|--------|------|
| RoomCard adapter | Already documented | Adapter: `apps/brikette/src/components/rooms/RoomCard.tsx`; Notes: `packages/ui/src/molecules/RoomCard.api.md` |

**Resolution:** Phase 5 is “document-only unless two apps need it”. RoomCard already satisfies the reference-adapter outcome.

---

## Phase Confidence Scores (RE-PLANNED)

### Phase 1 — Image Pipeline Consolidation
- **Previous confidence:** ~60% (unknown drift)
- **Updated confidence:** 92% ✓
  - Implementation: 95% — both versions exist, diff is clear
  - Approach: 90% — @acme/ui is canonical home, just upstream enhancements
  - Impact: 90% — Brikette imports are well-scoped to `@/components/images/`
- **Resolution:**
  - Investigated: [CfImage.tsx](apps/brikette/src/components/images/CfImage.tsx), [CfImage.tsx](packages/ui/src/atoms/CfImage.tsx), buildCfImageUrl.ts in both
  - Decision: Upstream `sourceFormats` prop to @acme/ui, then migrate Brikette to consume
  - Evidence: Files are 75-90% identical; differences are additive
- **Acceptance:** Brikette imports CfImage/buildCfImageUrl from @acme/ui only; grep for local copies returns 0

### Phase 2 — Guides/Assistance Core
- **Previous confidence:** ~50% (unclear extraction boundary)
- **Updated confidence:** 82% ✓
  - Implementation: 82% — core is small, but requires refactoring Brikette’s current “canonical” module into core + wiring
  - Approach: 85% — factory-based, injected-data design keeps the package reusable and edge-safe
  - Impact: 78% — ~63 Brikette files import `@/routes.guides-helpers`; migration must preserve API stability
- **Resolution:**
  - Investigated: [routes.guides-helpers.ts](apps/brikette/src/routes.guides-helpers.ts), [guides/slugs/*](apps/brikette/src/guides/slugs/)
  - Decision: Create `@acme/guides-core` as a pure TS factory that consumes injected slug tables + base-path logic; keep Brikette data/manifest glue local
  - Evidence: Brikette’s current implementation depends on app config, manifest, and i18n bundles; a clean extraction requires a strict “core vs wiring” split
- **Acceptance:** Brikette routes continue to call `@/routes.guides-helpers` but its internals are implemented via `@acme/guides-core`; guardrail + SEO tests stay green

### Phase 3 — SEO + Structured Data
- **Previous confidence:** ~45% (unclear consolidation path)
- **Updated confidence:** 90% ✓
  - Implementation: 92% — canonical helpers + serializer are in place and deployed across all emitters
  - Approach: 90% — shared helpers proven in Brikette + template app
  - Impact: 88% — remaining work is consolidation (FAQ + breadcrumbs) and tests
- **Resolution:**
  - Investigated: [StructuredData.tsx](apps/brikette/src/components/seo/StructuredData.tsx), [FaqStructuredData.tsx](apps/brikette/src/components/seo/FaqStructuredData.tsx), [seo.ts](packages/template-app/src/lib/seo.ts)
  - Decision: Extract serializeJsonLd and canonical URL helpers to @acme/ui/lib/seo/
  - Evidence: template-app and Brikette both have JSON-LD serialization; consolidate to one
- **Acceptance:** No duplicate JSON-LD serialization logic; contract tests for canonical URLs

### Phase 4 — Assistance UI Blocks
- **Previous confidence:** 75% (unclear i18n coupling)
- **Updated confidence:** 88% ✓
  - Implementation: 90% — most assistance UI already lives in `@acme/ui`; remaining work is quick-links split
  - Approach: 85% — “UI in `@acme/ui`, glue local” matches existing patterns (HelpCentreNav, ArticleSection, AMA)
  - Impact: 85% — limited blast radius; primarily additive extraction + Brikette import swaps
- **Resolution:**
  - Investigated: `apps/brikette/src/components/assistance/*`, `packages/ui/src/organisms/*`
  - Decision: extract only the quick-links UI layer; keep translations + routing in-app
  - Evidence: Brikette assistance components are mostly wrappers/re-exports over `@acme/ui`
- **Acceptance:** Brikette quick-links renders via `@acme/ui` UI component and uses `serializeJsonLd()`; no portable UI duplicates remain in-app
  - Progress (2026-01-25): Added `AssistanceQuickLinksSection` to `@acme/ui` and refactored Brikette quick-links wrapper to consume it.

### Phase 5 — Reference Adapter Patterns
- **Previous confidence:** 65% (unclear if worth extracting)
- **Updated confidence:** 90% ✓
  - Implementation: 90% — RoomCard adapter already exists in Brikette and is documented in `@acme/ui`
  - Approach: 90% — “document-only unless two apps need it” prevents premature abstraction
  - Impact: 90% — near-zero runtime risk; mostly documentation/guardrails
- **Resolution:**
  - Investigated: `apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/molecules/RoomCard.api.md`
  - Decision: treat RoomCard as the canonical adapter example; only extract more patterns when a second app demands it
  - Evidence: dedicated API notes + tests already exist in the shared package
- **Acceptance:** Adapter pattern docs stay current; any new adapter extraction requires two consumers

### Phase 6 — Guardrails + Cleanup
- **Confidence:** 90%
  - Clear precedent in existing `no-legacy-guides-path.test.ts` guardrail
  - Progress (2026-01-25): Added guardrail test to prevent reintroducing local image pipeline imports and JSON-LD stringification in SEO/assistance components.
  - Progress (2026-01-25): Added Brikette upstreaming guide to document how to extract shared modules.

### Phase 7a — Diagnostic Display
- **Confidence:** 85% ✓
  - Implementation: 88% — existing content-detection utilities provide patterns
  - Approach: 85% — builds on guides-core extraction from Phase 2
  - Impact: 82% — modifies existing UI components
- **Resolution:**
  - Investigated: [GuideEditorialPanel.tsx](apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx), [DraftDashboardContent.tsx](apps/brikette/src/app/[lang]/draft/DraftDashboardContent.tsx), [content-detection/](apps/brikette/src/routes/guides/guide-seo/content-detection/)
  - Decision: Create diagnostic service that leverages existing `hasIntroContent()`, `hasSectionsContent()`, `hasFaqsContent()` utilities
  - Evidence: Validation utilities exist but aren't surfaced in UI; 17 locales to scan per guide
- **Acceptance:** Editorial panel shows specific issues per checklist item; draft dashboard shows diagnostic summaries

### Phase 7b — Authoring Workflow (RE-PLANNED)
- **Previous confidence:** 74% ⚠️
- **Updated confidence:** 88% ✓
  - Implementation: 90% — `writeGuidesNamespaceToFs()` proven; JSON editor pattern from CMS provides clear precedent
  - Approach: 85% — P1 (local-dev FS) + PREVIEW_TOKEN auth confirmed; dedicated editor page pattern chosen
  - Impact: 85% — local-dev only; no production write paths; double-gated (env flag + token)
- **Resolution:**
  - Investigated: node-loader.ts, Cloudflare Pages deployment, preview token pattern, CMS JSON editor
  - Decisions (user-confirmed 2026-01-25): P1 persistence, PREVIEW_TOKEN auth, dedicated editor page
  - Evidence: Existing utilities proven; UI pattern exists in CMS; auth pattern exists in guide-seo/utils/preview.ts
- **Acceptance:** Authors can safely edit guide content in local dev and persist changes to the working tree

---

## Phase 7 Detail — Guide Authoring Experience (NEW)

**Problem:** The draft dashboard (`/en/draft`) and guide editorial panel show generic "Missing" labels without explaining *what specifically* is missing or *how to fix it*. Example: viewing `/en/experiences/path-of-the-gods-via-nocelle` shows "Translations - Missing" but doesn't tell you which of the 17 locales need work.

**Goal:** Surface actionable diagnostics and provide authoring tools to fix issues.

#### Phase 7a — Diagnostic Display
- **Confidence:** 85%
  - Implementation: 88% — existing content-detection utilities provide patterns
  - Approach: 85% — builds on guides-core extraction from Phase 2
  - Impact: 82% — modifies existing UI components

**Tasks:**

1. **Create diagnostic service** (`apps/brikette/src/routes/guides/guide-diagnostics.ts`)
   - `analyzeGuideCompleteness(guideKey, locale)` returns detailed diagnostics
   - `analyzeTranslationCoverage(guideKey)` returns per-locale field status
   - Reuses existing content-detection utilities: `hasIntroContent()`, `hasSectionsContent()`, `hasFaqsContent()`

2. **Define diagnostic types** (`apps/brikette/src/routes/guides/guide-diagnostics.types.ts`)
   - `GuideDiagnosticResult` with breakdown per checklist item
   - `TranslationCoverageResult` with per-locale status: `{ locale, fields: { intro, sections, faqs, seo } }`

3. **Update buildGuideChecklist** (`guide-manifest.ts`)
   - Add optional `{ includeDiagnostics: boolean }` parameter
   - When true, `ChecklistSnapshot.items[].diagnostics` contains detailed breakdown

4. **Create DiagnosticDetails component** (`apps/brikette/src/routes/guides/guide-seo/components/DiagnosticDetails.tsx`)
   - Expandable details per checklist item
   - For translations: locale table with status indicators
   - For content: field presence checklist

5. **Update GuideEditorialPanel** — show expandable diagnostic details
   - Missing items show specifics (e.g., "Missing in: de, fr, ja")

6. **Update DraftDashboardContent** — show diagnostic summaries in Outstanding column
   - Example: "Translations: 5/17 locales" instead of generic "Missing"

**Acceptance:**
- [x] Editorial panel shows specific missing items per checklist category
- [x] Draft dashboard shows diagnostic summaries
- [x] Users can view per-locale translation coverage
- [ ] Performance acceptable with lazy-loaded diagnostics
  - Progress (2026-01-25): Added guide diagnostics service + types, wired checklist diagnostics into GuideEditorialPanel and DraftDashboardContent summaries.

#### Phase 7b — Authoring Workflow (RE-PLANNED)
- **Previous confidence:** 74% ⚠️
- **Updated confidence:** 88% ✓
  - Implementation: 90% — `writeGuidesNamespaceToFs()` already exists and is proven; JSON editor pattern from CMS provides clear UI precedent
  - Approach: 85% — P1 (local-dev FS) confirmed; PREVIEW_TOKEN auth confirmed; dedicated editor page at `/[lang]/draft/edit/[guideKey]`
  - Impact: 85% — local-dev only; no production write paths; gated by `ENABLE_GUIDE_AUTHORING` env + token
- **Resolution:**
  - Investigated: `node-loader.ts`, Cloudflare Pages deployment (static export), preview token pattern, JSON editor in CMS
  - Decisions (user-confirmed 2026-01-25):
    - **Persistence:** P1 — local-dev FS writes only (authors commit changes manually)
    - **Auth:** PREVIEW_TOKEN query-param pattern (matches existing guide preview gating)
    - **UX:** Dedicated editor page at `/[lang]/draft/edit/[guideKey]` (follows JSON editor pattern from CMS)
  - Evidence: `writeGuidesNamespaceToFs()` in `node-loader.ts` provides safe scoped writes; `PricingJsonEditor.tsx` in CMS shows validated textarea pattern; `isPreviewAllowed()` provides token gating

**Feasibility audit (2026-01-25):**
- Guide content lives in `apps/brikette/src/locales/<lang>/guides/content/<guideKey>.json` (split) or `guides.json` (legacy).
- Node-only read/write utilities already exist:
  - `loadGuidesNamespaceFromFs(locale)` (used in server/i18n loaders)
  - `writeGuidesNamespaceToFs(locale, data)` (not yet used by UI)
- Deployed serverless environments (Cloudflare Pages) have read-only/ephemeral filesystems; production authoring is **not** viable via direct FS writes — hence P1 (local-dev only) is the right choice.

**Confirmed decisions:**
- **Persistence:** P1 — local-dev authoring only (writes to working tree; authors commit via git)
- **Auth:** PREVIEW_TOKEN query-param gating (matches existing `isPreviewAllowed()` pattern)
- **UX:** Dedicated editor page at `/[lang]/draft/edit/[guideKey]` (follows CMS JSON editor pattern)

**Tasks:**
1. **Add access control + gating**
   - Gate editor routes with `ENABLE_GUIDE_AUTHORING=1` env flag + `PREVIEW_TOKEN` query param
   - Reuse `isPreviewAllowed(searchParams.preview)` from `apps/brikette/src/routes/guides/guide-seo/utils/preview.ts`
   - Ensure the authoring UI and API routes return 404 when gating fails
2. **Create editor API route** (`apps/brikette/src/app/api/guides/[guideKey]/route.ts`)
   - GET: load guide content for locale via `loadGuidesNamespaceFromFs()`
   - PUT: validate + write via `writeGuidesNamespaceToFs()` (or narrow `writeGuideContentToFs()`)
   - Runtime: `nodejs` (FS access required)
   - Auth: require valid `PREVIEW_TOKEN` header
3. **Build editor page** (`apps/brikette/src/app/[lang]/draft/edit/[guideKey]/page.tsx`)
   - Clone pattern from `apps/cms/src/app/cms/shop/[shop]/data/rental/pricing/PricingJsonEditor.tsx`
   - Textarea-based JSON editor with Zod validation
   - Per-locale tabs or dropdown selector
   - "Diff vs English" toggle (optional enhancement)
   - Apply/Cancel/Save buttons
4. **Route integration**
   - Add "Edit" links in `DraftDashboardContent` guide rows
   - Add "Edit" link in `GuideEditorialPanel`

**Progress (2026-01-25):**
- Added authoring gate (env + preview token) for the editor page and API route.
- Implemented `/api/guides/[guideKey]` GET/PUT with Zod validation + FS writes.
- Built `/[lang]/draft/edit/[guideKey]` JSON editor with locale selector + English reference.
- Wired edit links into the draft dashboard and guide editorial panel.

**Deferred:** AI drafting assistance (separate plan + security review).

**Acceptance:**
- [x] Editor page loads guide content for selected locale
- [x] Validation prevents saving malformed JSON
- [x] Successful save writes to `src/locales/{locale}/guides/content/{guideKey}.json`
- [x] Access denied (404) when `ENABLE_GUIDE_AUTHORING` unset or token invalid
- [x] Draft dashboard and editorial panel link to editor

**Dependencies:**
- Phase 7a benefits from Phase 2's clearer guide typing/routing, but can ship independently.
- Phase 7b should not start until Phase 7a diagnostics prove what needs editing (avoids building the wrong editor).
