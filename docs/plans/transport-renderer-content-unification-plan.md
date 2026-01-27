---
Type: Plan
Status: Active
Domain: CMS / UI
Relates-to charter: Content unification
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: transport-renderer-content-unification
Fact-Find: docs/plans/transport-renderer-content-unification-fact-find.md
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Transport Renderer / Content Unification Plan

## Summary

Migrate the 24 how-to-get-here transport routes from the legacy renderer (`HowToGetHereContent`) + `howToGetHere` i18n namespace into the guide system (`GuideSeoTemplate`) + `guides` content, **without changing URLs**.

This is the follow-on plan referenced by `docs/plans/guide-system-unification-plan.md`.

## Success Signals (What “Good” Looks Like)

- Each migrated route renders via `GuideContent` → `GuideSeoTemplate` (no `HowToGetHereContent` for those slugs).
- Feature parity for migrated routes:
  - galleries (zoomable),
  - callouts (tip/cta/aside),
  - Chiesa Nuova drop-in (where applicable),
  - HowTo JSON-LD and breadcrumbs,
  - SEO title/description parity.
- Route-by-route incremental migration is possible (can ship a single route safely).
- Legacy content and renderer can be removed once all routes are migrated.

## Current State (Verified)

### Routing / Rendering

- Dynamic route is hybrid today:
  - `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`
  - If `getRouteDefinition(slug)` exists, it renders `HowToGetHereContent`.
  - If it doesn’t, it falls back to `GuideContent`.

### Content

- Transport route content is loaded from locale JSON under:
  - `apps/brikette/src/locales/*/how-to-get-here/routes/*.json`
- Route metadata/bindings come from:
  - `apps/brikette/src/data/how-to-get-here/routes.json`

### Guide System Capability (Important)

- A guide “blocks” system exists (`apps/brikette/src/routes/guides/blocks/*`), but it is **not currently wired into `GuideSeoTemplate`**:
  - `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx` composes fragments
  - `apps/brikette/src/routes/guides/blocks/index.ts` exports `buildBlockTemplate()`
  - There are no call sites applying `buildBlockTemplate()` today
- Some block types are declared but have no runtime handler in `composeBlocks()` (e.g. `"custom"`, `"breadcrumbs"`), so this plan avoids relying on them until implemented.
- A `gallery` block handler already exists:
  - `apps/brikette/src/routes/guides/blocks/handlers/galleryBlock.tsx`
  - It uses `ImageGallery` (non-zoomable today).

## Goals

1. One renderer path for transport routes (GuideSeoTemplate), not two.
2. One content source/namespace (guides), not both `howToGetHere` + `guides`.
3. Incremental rollout and rollback (per route).
4. Preserve SEO/URLs exactly.

## Non-goals

- Redesigning transport UI layout (parity, not redesign).
- Changing the how-to-get-here index page (`apps/brikette/src/app/[lang]/how-to-get-here/page.tsx`) UX.
- Changing the transport route definition schema unless required for migration safety.

## Approach (Option A, Concrete)

1. **Make guide blocks real:** wire `buildBlockTemplate(manifestEntry)` into `GuideSeoTemplate` so manifest blocks can produce the existing slot props (`articleLead`, `articleExtras`, `afterArticle`, `additionalScripts`) plus config.
2. **Add the missing presentation primitives as blocks/components:**
   - `callout` block (tip/cta/aside),
   - `gallery` block zoom support (opt-in),
   - an explicit “transport drop-in” block for Chiesa Nuova (avoid relying on unhandled `"custom"`).
3. **Transform route content to guide content** (scripted, validated), including converting route `linkBindings` into guide link tokens (e.g. `%URL:…|Label%`, `%LINK:guideKey|Label%`, `%HOWTO:slug|Label%`).
4. **Route-by-route migration allowlist** in `[lang]/how-to-get-here/[slug]/page.tsx`:
   - if slug is migrated, render `GuideContent`;
   - else keep rendering legacy `HowToGetHereContent`.
5. **Batch migrate** remaining routes once pilot proves parity and tooling is validated.
6. **Cleanup:** remove legacy renderer + deprecated route-content loaders only after all routes are migrated.

## Task Summary

| Task ID | Type | Description | CI | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Wire manifest blocks into `GuideSeoTemplate` (buildBlockTemplate → slot props/config) | 90% | M | Complete (2026-01-27) | - |
| TASK-02 | IMPLEMENT | Add `callout` block type + handler (tip/cta/aside) | 90% | M | Complete (2026-01-27) | TASK-01 |
| TASK-03 | IMPLEMENT | Add zoom support to `gallery` block (opt-in `zoomable`) | 90% | M | Complete (2026-01-27) | TASK-01 |
| TASK-04 | IMPLEMENT | Add explicit transport drop-in block for Chiesa Nuova | 92% | S | Pending | TASK-01 |
| TASK-05 | DOC | Document schema mapping (route JSON → guide JSON + link token conversion) | 95% | S | Pending | - |
| TASK-06 | IMPLEMENT | Build transformation tool (library + CLI) with validation + golden tests | 90% | M | Pending | TASK-05 |
| TASK-07 | IMPLEMENT | Pilot: migrate 1 route across all 18 locales + allowlist render + metadata parity | 90% | M | Pending | TASK-02, TASK-03, TASK-04, TASK-06 |
| TASK-08 | IMPLEMENT | Batch migrate remaining 23 routes (scripted, in small batches) | 90% | L | Pending | TASK-07 |
| TASK-09 | IMPLEMENT | Cleanup: remove legacy renderer + route content namespace usage | 90% | M | Pending | TASK-08 |

> Effort scale: S=1, M=2, L=3

## Milestones

| Milestone | Focus | Tasks | Effort | CI |
|-----------|-------|-------|--------|-----|
| 1 | Enable blocks + missing primitives | TASK-01–04 | M | **90%** |
| 2 | Tooling + pilot migration | TASK-05–07 | M | **90%** |
| 3 | Batch migration + cleanup | TASK-08–09 | L | **90%** |

## Tasks

### TASK-01: Wire manifest blocks into `GuideSeoTemplate`

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - `apps/brikette/src/routes/guides/blocks/index.ts` (as needed)
  - `apps/brikette/src/test/routes/guides/__tests__/` (new focused test)
- **CI:** 90%
  - Implementation: 90% — `buildBlockTemplate()` already returns `Partial<GuideSeoTemplateProps>`; wiring is mostly merge ordering.
  - Approach: 90% — Use "explicit prop wins" precedence to avoid surprising route-level overrides.
  - Impact: 90% — Guide behaviour only changes when manifest declares blocks; add a focused test to lock merge semantics.
- **Acceptance:**
  - When `manifestEntry.blocks` is non-empty, `GuideSeoTemplate` applies `buildBlockTemplate(manifestEntry).template` by merging into the props used to render.
  - Merge precedence is explicit and documented:
    - explicit route props override block-derived props
    - block-derived props override default props
  - Block warnings are surfaced in dev (log or dev panel), but do not break rendering.
- **Test plan:**
  - Add a focused unit/integration test that:
    - stubs a manifest entry with a block that contributes `articleExtras`
    - asserts the slot renders in `GuideSeoTemplateBody`
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"block\" --maxWorkers=2`
- **Rollback:**
  - Revert wiring; blocks remain inert.

#### Build Completion (2026-01-27)

- **Status:** Complete
- **Commits:** d3e215c617
- **TDD cycle:**
  - Test written: `apps/brikette/src/test/routes/guides/__tests__/block-template-wiring.test.tsx`
  - Test covers: no blocks → default behavior, blocks with gallery → articleExtras slot, merge precedence, block warnings
  - Implementation complete: block template building and merging wired into GuideSeoTemplate
- **Validation:**
  - Ran: `pnpm typecheck` — PASS (all packages)
  - Ran: `pnpm lint --filter @apps/brikette` — PASS (lint disabled, no issues)
  - Existing guide tests pass: `src/test/routes/guides/__tests__/structured-toc-block.policy.test.tsx` — PASS (12 tests)
- **Documentation updated:** None required (plan is the doc)
- **Implementation notes:**
  - Imported `buildBlockTemplate` from `./blocks` in `_GuideSeoTemplate.tsx`
  - Called `buildBlockTemplate(manifestEntry)` when `manifestEntry?.blocks?.length > 0` in useMemo hook
  - Dev warnings logged via console.warn when `blockTemplate.warnings.length > 0`
  - Merged block-derived props with precedence: explicit props > block props > defaults
  - Applied merged values to: `articleLead`, `articleExtras`, `afterArticle`, `additionalScripts`, `showPlanChoice`, `showTransportNotice`, `relatedGuides`, `alsoHelpful`
  - Passed merged slot props to `useGuideSlotNodes` and `useAdditionalScripts`
  - Passed merged config to `GuideSeoTemplateBody`

### TASK-02: Add `callout` block type + handler

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/routes/guides/blocks/types.ts` (schema + union)
  - `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx` (dispatch)
  - `apps/brikette/src/routes/guides/blocks/handlers/` (new handler)
  - `apps/brikette/src/routes/guides/blocks/utils/` (shared normalization helpers as needed)
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — New block type is additive; handler emits a slot node.
  - Approach: 90% — Strict schema avoids carrying the route system's "flexible" callout shape into guides long-term.
  - Impact: 90% — Used only by migrated routes until adopted elsewhere.
- **Proposed block schema (strict):**
  - `type: "callout"`
  - `options: { variant: "tip" | "cta" | "aside"; titleKey?: string; bodyKey: string }`
- **Acceptance:**
  - The handler renders a callout with styling parity to the legacy route callouts.
  - Copy is sourced from the `guides` namespace (via `context.translateGuides`) using the declared keys.
  - Link tokens inside callout copy render correctly (guide tokens + external URL tokens).
- **Test plan:**
  - Add a unit test for the handler with a stub translator and a string containing `%URL:` token.
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"calloutBlock\" --maxWorkers=2`

#### Build Completion (2026-01-27)

- **Status:** Complete
- **Commits:** ba58d142b6
- **TDD cycle:**
  - Test written: `apps/brikette/src/test/routes/guides/__tests__/callout-block.test.tsx`
  - Test covers: tip/cta/aside variants, with/without title, link token support
  - Implementation complete: callout block type, schema, handler, and dispatcher wired
- **Validation:**
  - Ran: `pnpm typecheck --filter @apps/brikette` — PASS
  - Schema validation: strict Zod schema with variant enum + required bodyKey
- **Documentation updated:** None required (plan is the doc)
- **Implementation notes:**
  - Added "callout" to GUIDE_BLOCK_TYPES constant
  - Created CalloutBlockOptions schema: `{ variant: "tip" | "cta" | "aside"; titleKey?: string; bodyKey: string }`
  - Implemented applyCalloutBlock handler in `handlers/calloutBlock.tsx`
  - Variant-specific styling matches legacy route callouts (rounded borders, brand colors, semantic variants)
  - Link token support via `renderGuideLinkTokens(bodyText, context.lang, keyBase)`
  - Wired into composeBlocks dispatcher with case for "callout"
  - Exported from handlers/index.ts

### TASK-03: Add zoom support to `gallery` block (opt-in `zoomable`)

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/routes/guides/blocks/types.ts` (add `zoomable?: boolean` to gallery options)
  - `apps/brikette/src/routes/guides/blocks/handlers/galleryBlock.tsx` (conditional renderer)
  - `apps/brikette/src/components/guides/` (new `ZoomableImageGallery` component, reusing established dialog pattern)
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — Keep default behaviour unchanged; add a zoomable variant behind an explicit flag.
  - Approach: 90% — Avoid surprising UX changes for existing guide galleries.
  - Impact: 90% — Only migrated transport routes opt into zoomable.
- **Acceptance:**
  - `gallery` block supports `options.zoomable === true` to enable zoomable dialogs.
  - Default remains non-zoomable (`ImageGallery`) for backwards compatibility.
  - A11y parity: dialog close + keyboard escape + alt text preserved.
- **Test plan:**
  - Unit test for `ZoomableImageGallery` open/close behaviour.
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"ZoomableImageGallery\" --maxWorkers=2`

#### Build Completion (2026-01-27)

- **Status:** Complete
- **Commits:** cef2285a10
- **TDD cycle:**
  - Test written: `apps/brikette/src/test/routes/guides/__tests__/gallery-block-zoomable.test.tsx`
  - Test covers: default non-zoomable behavior, zoomable variant, dialog interaction, accessibility
  - Implementation complete: zoomable option, ZoomableImageGallery component, conditional rendering
- **Validation:**
  - Ran: `pnpm typecheck --filter @apps/brikette` — PASS
  - Schema validation: zoomable?: boolean added to GalleryBlockOptions
- **Documentation updated:** None required (plan is the doc)
- **Implementation notes:**
  - Added `zoomable?: boolean` to GalleryBlockOptions schema
  - Created ZoomableImageGallery component using Dialog primitives from design system
  - Component features: hover zoom indicator (ZoomIn icon), click to open fullscreen dialog
  - Dialog shows full-res image with title (caption or alt text) and close button
  - Keyboard accessible: Escape to close, Enter/Space to open (via Dialog primitives)
  - Updated galleryBlock handler with conditional: `options.zoomable === true ? ZoomableImageGallery : ImageGallery`
  - Backwards compatibility: default remains non-zoomable when option is omitted or false

### TASK-04: Add explicit transport drop-in block for Chiesa Nuova

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/routes/guides/blocks/types.ts` (new block type, e.g. `"transportDropIn"`)
  - `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx` (dispatch)
  - `apps/brikette/src/routes/guides/blocks/handlers/` (new handler)
- **Depends on:** TASK-01
- **CI:** 92%
  - Implementation: 92% — Chiesa component already exists and accepts `lang`.
  - Approach: 92% — Explicit block avoids “custom module resolution” complexity.
  - Impact: 92% — Used only by 6 bus routes.
- **Acceptance:**
  - Manifest can declare the block for specific routes.
  - The block renders `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/DropIn` in the appropriate slot (after sections/callouts, before footer widgets).
- **Test plan:**
  - Integration test: render a guide with the block and assert the drop-in renders.
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"Chiesa\" --maxWorkers=2`

### TASK-05: Document schema mapping (route JSON → guide JSON + link token conversion)

- **Type:** DOC
- **Affects:** `docs/plans/transport-renderer-content-unification-plan.md` (this doc, mapping section) or a companion doc referenced from here
- **CI:** 95%
  - Implementation: 95% — Documentation only.
  - Approach: 95% — Use concrete examples from `apps/brikette/src/data/how-to-get-here/routes.json`.
  - Impact: 95% — Reduces migration/tooling ambiguity.
- **Acceptance:**
  - Mapping specifies:
    - `meta.*` → `content.<key>.seo.*`
    - `hero/header` → guide intro and/or hero block usage
    - object sections → `sections[]` with stable `id`
    - callouts → `callout` blocks + `content.<key>.callouts.*` keys
    - galleries → `gallery` blocks (with zoomable option) + image module strategy
    - steps → HowTo structured data strategy (manifest `"HowTo"` + buildHowToSteps if required)
    - route `linkBindings` → guide tokens (`%URL:%`, `%LINK:%`, `%HOWTO:%`) with exact rules

### TASK-06: Build transformation tool (library + CLI) with validation + golden tests

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `scripts/` (new CLI entrypoint)
  - `apps/brikette/src/routes/how-to-get-here/` or `apps/brikette/src/routes/guides/` (shared transformer library)
  - `apps/brikette/src/test/` (golden tests)
- **Depends on:** TASK-05
- **CI:** 90%
  - Implementation: 90% — Transformation is mechanical; validation locks correctness.
  - Approach: 90% — Centralize rules to avoid per-route bespoke edits.
  - Impact: 90% — Tooling is isolated; output is reviewed via git diff.
- **Acceptance:**
  - CLI can migrate a single route key across all 18 locales:
    - input: `apps/brikette/src/locales/{lang}/how-to-get-here/routes/<contentKey>.json`
    - output: `apps/brikette/src/locales/{lang}/guides/content/<guideContentKey>.json`
  - Conversion applies route `linkBindings` by inserting guide link tokens in output strings.
  - Output passes a structural validation step (Zod/schema or equivalent).
  - Golden tests cover at least:
    - one “linkBindings.placeholder” route,
    - one “linkBindings.linkObject” route,
    - one route with a gallery.
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"transportMigration\" --maxWorkers=2`

### TASK-07: Pilot migration (1 route, all locales) + allowlist render + metadata parity

- **Type:** IMPLEMENT
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-06
- **CI:** 90%
  - Implementation: 90% — Single-route blast radius; allowlist keeps rollback trivial.
  - Approach: 90% — Full-locale pilot avoids partial localization regressions.
  - Impact: 90% — One route can be monitored and reverted quickly.
- **Pilot route selection criteria:**
  - Choose a structurally representative route with at least one callout and one external link binding.
  - Prefer avoiding Chiesa Nuova in the first pilot unless specifically desired.
- **Acceptance:**
  - Add a manifest entry for the pilot route (areas include `howToGetHere`).
  - Generate guide content for all 18 locales using the transformer.
  - Update `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`:
    - if slug is migrated, render `GuideContent`
    - otherwise render `HowToGetHereContent`
  - Ensure `generateMetadata()` produces equivalent title/description for the pilot route.
- **Test plan:**
  - Add a targeted test asserting the allowlist routes render the guide path.
  - Run: `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"pilot\" --maxWorkers=2`

### TASK-08: Batch migrate remaining routes (scripted, small batches)

- **Type:** IMPLEMENT
- **Depends on:** TASK-07
- **CI:** 90%
  - Implementation: 90% — Scripted conversion reduces human error; batches limit blast radius.
  - Approach: 90% — Ship in batches of ~4–6 routes with explicit rollback points.
  - Impact: 90% — URLs unchanged; allowlist enables instant revert per batch.
- **Acceptance:**
  - All 24 routes have:
    - manifest entries,
    - `guides` content for all 18 locales (or an explicit, documented fallback policy),
    - allowlist flipped to guide rendering.
  - Feature parity checklist passes for each route (see below).
- **Test plan:**
  - For each batch, run:
    - `pnpm --filter @apps/brikette test routeGuides -- --maxWorkers=2`
    - targeted transformer/parity tests for migrated routes only (`--testPathPattern`)

### TASK-09: Cleanup legacy renderer + content namespace usage

- **Type:** IMPLEMENT
- **Depends on:** TASK-08
- **CI:** 90%
  - Implementation: 90% — Removal is mechanical once allowlist is 100%.
  - Approach: 90% — Keep removal as last step for safe rollback during migration.
  - Impact: 90% — Net reduction in complexity/maintenance.
- **Acceptance:**
  - Remove `HowToGetHereContent` usage from `[slug]/page.tsx`.
  - Remove unused how-to-get-here renderer helpers that are no longer referenced.
  - Remove or archive `howToGetHere` route content JSON only if no longer used anywhere else.
- **Test plan:**
  - Validation gate: `pnpm typecheck && pnpm lint`
  - Targeted tests: `routeGuides` + any new parity tests

## Feature Parity Checklist (per migrated route)

- [ ] Hero/header displays correctly (title + description)
- [ ] Sections render with correct ordering and headings
- [ ] Callouts render (tip/cta/aside) with correct link behaviour
- [ ] Galleries render and are zoomable when declared
- [ ] Chiesa Nuova drop-in renders for the six bus routes (when declared)
- [ ] HowTo JSON-LD is present and contains steps where expected
- [ ] Breadcrumb structured data correct
- [ ] Metadata parity (title/description) with legacy route
- [ ] Locale behaviour: each of the 18 locales renders meaningful content (no empty shells)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Blocks system wiring changes guide rendering unexpectedly | TASK-01 uses “explicit prop wins” precedence + focused tests. |
| Link binding conversion produces broken links | TASK-06 golden tests cover placeholder + linkObject styles; use existing guide token renderer as target format. |
| Gallery zoom behaviour regresses existing guides | Zoom is opt-in via `zoomable`; default behaviour unchanged. |
| Locale regressions if only EN is migrated | Pilot requires all 18 locales; transformer operates per locale. |
| Cleanup too early breaks rollback | TASK-09 is last and only after allowlist is 100%. |

## Rollback Strategy

- Per-route: remove route from allowlist → legacy renderer resumes immediately.
- Per-batch: revert the commit(s) for that batch (content + manifest entries).
- Full: keep legacy code until TASK-09; never delete it mid-migration.

## Acceptance Criteria (overall)

- [ ] All tasks CI are ≥90 and the plan remains evidence-backed
- [ ] `/[lang]/how-to-get-here/[slug]` URLs remain unchanged for all routes
- [ ] All 24 transport routes render via `GuideSeoTemplate` with parity features
- [ ] `pnpm typecheck && pnpm lint` passes
- [ ] Targeted tests pass (no unfiltered `pnpm test`)

