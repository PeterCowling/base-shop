---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: brik-code-simplification
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-code-simplification/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
direct-inject: true
direct-inject-rationale: Operator-initiated codebase simplification audit with comprehensive evidence gathered in-session
---

# Brikette Code Simplification Fact-Find Brief

## Scope

### Summary

The Brikette app (`apps/brikette`) has accumulated dead code, copy-paste duplication, unused dependencies, and stale scaffolding across its ~100K lines. This fact-find documents verified opportunities to reduce maintenance surface without changing behavior.

### Goals

- Delete verified dead code (re-export wrappers, unused hooks/utils, scaffold pages)
- Remove unused npm dependencies from `apps/brikette/package.json`
- Delete stale infrastructure (`test/jest-baselines/`)
- Consolidate copy-paste duplication in how-to-get-here sub-routes
- Consolidate overlapping translation fallback utilities

### Non-goals

- Restructuring `@acme/ui` or `@acme/design-system` package boundaries (separate effort)
- Refactoring the `guide-seo` 98-file subsystem (separate effort, higher risk)
- Replacing the 29 SEO structured-data components (behavior change risk)
- Startup-loop script consolidation (separate domain, different owners)

### Constraints & Assumptions

- Constraints:
  - Zero behavior change — deletions and consolidations only
  - All changes must pass targeted Brikette validation (`pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint && pnpm --filter @apps/brikette test`), plus targeted test files for touched modules
  - Dead code claims verified via import search (grep for path-based and alias-based imports)
- Assumptions:
  - Files with zero non-test imports are safe to delete (along with their test files)
  - The `chiesaNuovaDepartures` re-export pattern is a partial consolidation model — it fully covers `selectors.ts` and `breadcrumb.ts`; `content.ts` still has an export-shape variant (`normaliseTocItems` alias + default trim behavior), and files referencing per-route `GUIDE_KEY` (`i18n.ts`, `guideFaqFallback.ts`) require parameterization, not simple re-export

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/` — Next.js App Router pages (67 page files)
- `apps/brikette/src/routes/` — route logic modules (243 files)
- `apps/brikette/src/components/` — shared components (153 files)
- `apps/brikette/package.json` — dependency declarations

### Key Modules / Files

1. `apps/brikette/src/components/ui/Button.tsx` — dead re-export, 1 line, zero imports
2. `apps/brikette/src/components/ui/Spinner.tsx` — dead re-export, 2 lines, zero imports
3. `apps/brikette/src/components/header/ThemeToggle.tsx` — dead re-export, 1 line, zero imports
4. `apps/brikette/src/components/header/LanguageSwitcher.tsx` — dead re-export, 2 lines, zero imports
5. `apps/brikette/src/components/landing/HeroSection.tsx` — dead re-export, 2 lines, zero imports
6. `apps/brikette/src/components/landing/Highlights.tsx` — dead re-export, 2 lines, zero imports
7. `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/selectors.ts` — identical to 3 other copies
8. `apps/brikette/src/utils/translation-fallback.ts` — overlaps with `translationFallbacks.ts`
9. `apps/brikette/src/utils/translationFallbacks.ts` — overlaps with `translation-fallback.ts`
10. `apps/brikette/src/utils/prefetchInteractive.ts` — dynamically imports `swiper` + `swiper/react`
11. `apps/brikette/src/app/[lang]/HomeContent.tsx` — imports `swiper/css` + `swiper/css/navigation`
12. `test/jest-baselines/` — 15 JSON files (+ README), 15,855 lines, zero non-doc consumers

### Patterns & Conventions Observed

- **Re-export wrappers**: Brikette has a layer of `components/<domain>/Foo.tsx` files that are 1-2 line re-exports from `@acme/ui`. Some are actively used by parent components (e.g., `Header.tsx` imports `DesktopHeader.tsx` which re-exports from `@acme/ui`). Many are dead — consumers import directly from `@acme/ui`. Evidence: grep for import paths shows zero consumers for 11 files.
- **Sub-route boilerplate pattern**: Each how-to-get-here guide sub-route has ~10 files (`selectors.ts`, `breadcrumb.ts`, `i18n.ts`, `content.ts`, `types.ts`, `constants.ts`, `guideFaqFallback.ts`, `guideExtras.ts`, `labels.ts`, `articleLead.tsx`). The `chiesaNuovaDepartures` directory uses re-exports from `chiesaNuovaArrivals` for `selectors.ts`, `breadcrumb.ts`, and `content.ts`, but all five routes still carry full standalone copies of `i18n.ts` and `guideFaqFallback.ts` (which depend on local `constants.ts` via `GUIDE_KEY`). `content.ts` also has one variant export shape (`normaliseTocItems`) that must be normalized before broad re-exporting.
- **Translation fallback proliferation**: 3 files in `utils/` implement "try locale, fall back to EN" with different i18n substrates. `translation-fallback.ts` (184 lines, 3 consumers) and `translationFallbacks.ts` (177 lines, 10+ consumers) both work against i18next `TFunction` with overlapping APIs. `localeFallback.ts` (84 lines, 3 consumers) works against raw JSON bundles — architecturally distinct.
- **Dependency reality check**: `@tiptap/*`, `react-datepicker`, and `markdown-it` have zero matches in `apps/brikette/src`; `swiper` is actively imported (`HomeContent.tsx`, `prefetchInteractive.ts`), and `@anthropic-ai/sdk` is used by `apps/brikette/scripts/translate-guides.ts`.

### Data & Contracts

Not investigated: pure deletion/consolidation work, no schema or API changes.

### Dependency & Impact Map

- Upstream dependencies affected:
  - Candidate removals from `apps/brikette/package.json`: `@tiptap/*` (5 packages), `react-datepicker`, `markdown-it`
  - Keep for now: `swiper` (runtime + tests + Jest mapper usage), `@anthropic-ai/sdk` (translation script dependency)
- Downstream dependents: none (brikette is a leaf app)
- Likely blast radius:
  - **Dead code deletion**: zero — no consumers exist
  - **Dependency removal**: low for the candidate set (`@tiptap/*`, `react-datepicker`, `markdown-it`) — verified zero imports in `src/`
  - **Sub-route consolidation**: medium — 5 route directories touched, but `chiesaNuovaDepartures` already proves the re-export pattern
  - **Translation fallback merge**: medium — 13+ consumer files would need import path updates
  - **jest-baselines deletion**: zero — no non-doc script or config references them

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Cypress (E2E)
- Commands: `pnpm --filter @apps/brikette test`, `pnpm --filter @apps/brikette typecheck`, `pnpm --filter @apps/brikette lint`
- CI integration: reusable-app.yml runs test + typecheck + lint

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Dead re-export wrappers | None or test-only | 2 test files for dead code (`DetailsSection.test.tsx`, `useScrolledPast.test.tsx`) | Tests exercise dead code — delete alongside source |
| How-to-get-here routes | Unit tests | Scattered | No direct tests for `selectors.ts`, `breadcrumb.ts`, or per-route `i18n.ts` modules; add a route parity smoke assertion before broad consolidation |
| Translation fallbacks | Component tests + mocks | `guide-i18n-hydration.test.tsx`, `ga4-35-sticky-begin-checkout.test.tsx` | No dedicated unit tests for `translation-fallback.ts` or `translationFallbacks.ts`; current coverage is indirect |

#### Coverage Gaps

- No integration test verifying all 5 how-to-get-here sub-routes render identically after consolidation
- No focused unit tests for translation fallback utility modules
- No test asserting `@tiptap/*` is unused (a lint rule or unused-dep check would prevent regression)

#### Testability Assessment

- Easy to test: dead code deletion (typecheck + existing tests catch regressions), candidate dependency removal (build + typecheck)
- Hard to test: translation fallback merge and route-module consolidation without dedicated parity tests

#### Recommended Test Approach

- Unit tests: add focused tests for fallback helpers and route-module normalizers before merge
- Integration tests: run full Brikette test suite after each tier
- E2E tests: not needed — no user-facing behavior changes

### Recent Git History (Targeted)

Not investigated: simplification targets are long-standing, not recently changed.

## Questions

### Resolved

- Q: Are the 11 re-export wrapper files truly dead?
  - A: Yes. Verified via comprehensive import search (path-based + alias-based) across all of `apps/brikette/src`. Zero non-test imports for all 11.
  - Evidence: grep for component names, file paths, and `@/components/` alias patterns

- Q: Are `test/jest-baselines/` files consumed by anything?
  - A: No. Zero references in any `.ts`, `.js`, `.cjs`, `.mjs`, or `.sh` file. The `capture-jest-baselines.sh` script referenced in the README does not exist.
  - Evidence: grep for `jest-baselines` across entire repo

- Q: Are how-to-get-here sub-route files truly identical?
  - A: `selectors.ts` — 4 byte-for-byte copies + 1 re-export. `breadcrumb.ts` — 4 copies + 1 re-export. `i18n.ts` — 5 copies differing only in local `GUIDE_KEY` source. `content.ts` — 3 `trimBodyLines: true` copies + 1 default/alias variant (`normaliseTocItems`) + 1 re-export.
  - Evidence: direct file comparison across all 5 directories

- Q: Is `translation-fallback.ts` vs `translationFallbacks.ts` genuine overlap?
  - A: Yes. Both provide "get a translator for lang+namespace" and "resolve string with fallback" against i18next `TFunction`. Different function signatures but identical semantics.
  - Evidence: function signatures and body comparison

### Open (User Input Needed)

- Q: Should the how-to-get-here consolidation use the re-export pattern (like `chiesaNuovaDepartures`) or extract to a shared module with config objects?
  - Why it matters: Re-export is simpler and proven; shared module is cleaner long-term
  - Decision impacted: Task structure for sub-route consolidation
  - Decision owner: operator
  - Default assumption: phase 1 uses proven re-export consolidation for route-agnostic files (`selectors.ts`, `breadcrumb.ts`) and defers shared-module extraction for `GUIDE_KEY`-dependent files to a follow-up spike + risk: leaves some duplication in place short-term

## Confidence Inputs

- Implementation: 85% — deletion targets and dependency candidates are mechanically safe; consolidation still has behavior-parity risk in route/i18n modules. Would reach 90% with one prototype PR that proves parity on a representative route.
- Approach: 85% — tier-based ordering is sound, but the long-term shared-module path still needs an explicit operator decision. Would reach 90% once that decision is locked before planning.
- Impact: 75% — estimated ~18,000+ lines and ~90+ files eliminated is still dominated by verified jest-baselines cleanup (15,855 lines), while non-baseline savings remain rough estimates. Would reach 80% with per-target `wc -l` evidence and 90% with measured CI/runtime improvements.
- Delivery-Readiness: 85% — no API/data migrations, but consolidation path requires tighter acceptance checks. Would reach 90% with branch-per-tier execution and explicit route-parity validation.
- Testability: 80% — existing suite catches many regressions, but key consolidation surfaces lack dedicated tests. Would reach 90% with new parity tests for route modules and fallback utilities.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Dead code file is actually imported via dynamic `require()` or `import()` | Very Low | Medium | Verified: searched for `lazy()`, `import()`, and `require()` patterns — zero matches for any target file |
| A dependency marked “unused” is actually active (`swiper` class of mistake) | Low | High | Gate dependency removals with package-name search + package-level build/typecheck/test before merge |
| Removing `@tiptap/*` breaks `@acme/ui` peer dep resolution | Low | Low | `@tiptap/*` is peer dep of `@acme/ui` CMS components. Brikette never loads those paths. If pnpm strict mode flags it, keep as optional peer dep |
| Sub-route consolidation changes rendering for one guide | Medium | Medium | Add route parity smoke tests before merge + manual spot-check one guide per sub-route |
| Translation fallback merge introduces subtle behavioral difference | Medium | Medium | Add dedicated utility tests and run all known consumers before merge; ship as isolated commit for clean revert |

## Planning Constraints & Notes

- Must-follow patterns:
  - One commit per tier (dead code, deps, jest-baselines, sub-routes, translation fallbacks) for clean revert boundaries
  - Run `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint && pnpm --filter @apps/brikette test` after each tier
- Rollout/rollback expectations:
  - Each tier is independently revertable
  - No feature flags needed — pure elimination of unused code
- Observability expectations:
  - None — no runtime behavior changes

## Suggested Task Seeds (Non-binding)

1. **Delete dead re-export wrappers** — Remove 11 dead component files + 2 associated test files. ~30 lines.
2. **Delete dead utils/hooks** — Remove `_i18n.ts`, `useLocationCompat.ts`, `useScrolledPast.ts` + test, `guideStatus.ts`, `perfHints.ts`, `formatDisplayDate.ts` + test, `RoomImage.tsx` (in components/rooms/). ~250 lines.
3. **Delete `app/app-router-test/page.tsx`** — Marked "DELETE THIS FILE". 19 lines.
4. **Remove unused brikette dependencies** — Remove `@tiptap/*` (5), `react-datepicker`, `markdown-it` from package.json. Keep `swiper` and `@anthropic-ai/sdk` (both currently used). Run `pnpm install`.
5. **Delete `test/jest-baselines/`** — 15 JSON baseline files (+ README), 15,855 lines. Zero non-doc consumers.
6. **Delete revert-*.sh scripts** — 5 files, 92 lines. One-shot rollback scripts, dead.
7. **Consolidate how-to-get-here sub-route shared logic** — Three sub-tasks: (a) apply re-export consolidation to route-agnostic files (`selectors.ts`, `breadcrumb.ts`), (b) normalize `content.ts` export shape so all routes expose the same API, (c) evaluate optional factory extraction for `GUIDE_KEY`-dependent files (`i18n.ts`, `guideFaqFallback.ts`) as a follow-up spike. Update 5 directories. ~600-800 lines eliminated.
8. **Merge translation fallback utilities** — Consolidate `translation-fallback.ts` and `translationFallbacks.ts` into a single module and add dedicated unit tests before import migration. Update 13+ consumer imports. ~180 lines eliminated.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `pnpm --filter @apps/brikette typecheck` passes
  - `pnpm --filter @apps/brikette lint` passes
  - `pnpm --filter @apps/brikette test` passes
  - `git diff --stat` confirms only deletions/consolidations (no new files except shared module in task 7)
- Post-delivery measurement plan:
  - Confirm reduced file count with `find apps/brikette/src -name '*.ts' -o -name '*.tsx' | wc -l`
  - Confirm dependency reduction in `pnpm ls --filter @apps/brikette --depth 0`

## Evidence Gap Review

### Gaps Addressed

- All 16 dead code files verified via comprehensive import search (path-based, alias-based, dynamic import patterns)
- `test/jest-baselines/` verified as zero-consumer in non-doc code/config/script files; references are documentation-only
- How-to-get-here duplication verified via direct file content comparison across all 5 directories
- Translation fallback overlap verified via function signature and body comparison
- Dependency audit split into removals vs active deps: `@tiptap/*`, `react-datepicker`, `markdown-it` show zero `src/` imports; `swiper` and `@anthropic-ai/sdk` are active and excluded from removal

### Confidence Adjustments

- Implementation reduced from 90% to 85% after correcting dependency classification (`swiper` is active and cannot be removed)
- Approach reduced from 95% to 85% until operator locks whether shared-module extraction is in scope for this cycle
- Impact reduced from 80% to 75% because non-jest-baseline savings are still coarse estimates pending per-target line accounting

### Remaining Assumptions

- `@tiptap/*` removal will not trigger pnpm strict peer dependency errors (mitigated: can keep as optional peer deps if needed)
- Route-agnostic files can be consolidated via re-export; shared-module extraction for `GUIDE_KEY`-dependent files remains optional follow-up work pending operator decision
- Any dependency-removal pass must treat package usage in app scripts (`apps/brikette/scripts/*`) as load-bearing, not just `src/` usage

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan` to structure implementation tasks by tier
