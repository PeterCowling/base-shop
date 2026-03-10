---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-normalize-locale-constants
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-normalize-locale-constants/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309120000-0002
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Normalize Locale Constants — Fact-Find Brief

## Scope

### Summary

`apps/prime/src/lib/i18n/normalizeLocale.ts` defines `SUPPORTED_LOCALES = ['en', 'it']` locally, duplicating `UI_LOCALES` from `@acme/types/constants.ts`. The comment in the file cites Jest haste-map conflicts with `@acme/types` as the reason it wasn't imported directly. A second local definition exists in `apps/prime/src/app/(guarded)/language-selector/page.tsx`. The refactor will: (1) add `normalizeUiLocale` (or equivalent) to `@acme/i18n` that handles regional variants, (2) update prime to import the shared constant and utility, and (3) add `@acme/i18n` to prime's package.json and tsconfig.json paths.

### Goals

- Eliminate `SUPPORTED_LOCALES = ['en', 'it']` local definitions in prime (at minimum two files: `normalizeLocale.ts` and `language-selector/page.tsx`).
- Expose a `resolveUiLocale` or `normalizeUiLocale` from `@acme/i18n` that handles BCP-47 regional variants (`it-IT` → `it`), matching prime's existing behavior.
- Ensure prime's tests continue to pass without a Jest haste-map conflict.

### Non-goals

- Migrating the brikette scripts' `SUPPORTED_LOCALES` (those are content/filesystem scripts, not UI locale constants).
- Migrating `apps/prime/src/utils/dateUtils.ts` `SUPPORTED_LOCALES` (that is a different set — Intl.DateTimeFormat locales, not UiLocale).
- Migrating `apps/skylar` (uses deprecated `LOCALES` from its own lib; separate scope).
- Touching `@acme/types/constants.ts` itself (source of truth is already correct).

### Constraints & Assumptions

- Constraints:
  - `@acme/i18n` is not currently in prime's `package.json` dependencies. It must be added.
  - `apps/prime/tsconfig.json` has a local `paths` block that completely overrides the base config. `@acme/i18n` must be added there explicitly (matching the base tsconfig pattern: `dist/` path to avoid `TS6059 rootDir` errors).
  - The Jest haste-map concern mentioned in the comment is historically about running Jest from a workspace root that included `apps/xa/.open-next`. With `--rootDir apps/prime` and `roots: ["<rootDir>/src", "<rootDir>/functions"]`, haste map scope is limited to prime's own src. The conflict is not a current real constraint.
  - `@acme/i18n`'s current `resolveUiLocale` does exact-match only — `'it-IT'` returns `'en'`, not `'it'`. A new `normalizeUiLocale` (or enhancement to `resolveUiLocale`) that strips the region subtag is needed, or prime must implement the subtag-stripping locally using `isUiLocale` + `UI_LOCALES`.
- Assumptions:
  - `@acme/i18n` dist is already built (`packages/i18n/dist/locales.js` confirmed present).
  - The global jest `moduleMapper.cjs` already maps `^@acme/i18n$` → `packages/i18n/src/index.ts`, so jest resolution for prime will work once `@acme/i18n` is in prime's package.json.

## Outcome Contract

- **Why:** Local locale constant is a recurring copy-paste risk as supported locales expand. Cross-package refactor needs scoping before implementation to avoid breaking haste-map resolution and other apps.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime no longer defines `SUPPORTED_LOCALES` locally in any file. The `normalizeLocale.ts` file is removed; the sole call site (`useUnifiedBookingData.ts`) imports `normalizeUiLocale` directly from `@acme/i18n`. `@acme/i18n` exports `normalizeUiLocale` with region-stripping semantics. `language-selector/page.tsx` uses `UI_LOCALES` and `normalizeUiLocale` from `@acme/i18n`.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/lib/i18n/normalizeLocale.ts` — exports `normalizeLocale(locale: string | null | undefined): SupportedLocale`. Defines `SUPPORTED_LOCALES = ['en', 'it'] as const` locally with comment citing haste-map conflicts.
- `apps/prime/src/app/(guarded)/language-selector/page.tsx` — defines its own `SUPPORTED_LOCALES = ['en', 'it'] as const` and a hardcoded `normalizeUiLocale` function (`base === 'it' ? 'it' : 'en'` — does not generalize).

### Key Modules / Files

- `packages/types/src/constants.ts` — exports `UI_LOCALES = ["en", "it"] as const` (readonly tuple), `UiLocale`, `isUiLocale()` (exact match only), `normalizeContentLocale()` (handles region stripping for ContentLocale). Does not export a `normalizeUiLocale` that strips region subtags.
- `packages/i18n/src/locales.ts` — re-exports `UI_LOCALES`, `UiLocale`, `isUiLocale` from `@acme/types/constants`. Adds `resolveUiLocale(value: string | undefined): UiLocale` — exact match only; `'it-IT'` returns `'en'`, not `'it'`. No `normalizeUiLocale` function exists.
- `packages/i18n/dist/locales.js` — built, confirmed present.
- `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` — the sole non-test call site of `normalizeLocale` (`occupantData.language` → normalize before passing to `i18n.changeLanguage`).
- `apps/prime/jest.config.cjs` — `roots: ["<rootDir>/src", "<rootDir>/functions"]` + `--rootDir apps/prime`. Haste map scope is prime-only; no cross-app conflict.
- `jest.moduleMapper.cjs` (workspace root) — already maps `^@acme/i18n$` → `packages/i18n/src/index.ts`.
- `packages/i18n/package.json` — exports `.` and `./*` with types/import/default pointing to `dist/`.

### Patterns & Conventions Observed

- `@acme/types/constants.ts` is the single source of truth for `UI_LOCALES`. `@acme/i18n/locales.ts` re-exports from it (correct chain).
- `@acme/i18n` is the conventional shared package for i18n utilities in this monorepo — it already exports `resolveUiLocale`, `isUiLocale`, `UI_LOCALES`, `UiLocale`.
- Prime's tsconfig has a local `paths` block (confirmed in `apps/prime/tsconfig.json` L24-30) with 5 path keys: `@/*`, `@acme/platform-core`, `@acme/platform-core/*`, `@acme/ui`, and `@acme/ui/*`. TypeScript does not merge `paths` — local wins entirely, overriding base config inheritance. Any new `@acme/*` package needs an explicit entry pointing to `dist/`.
- `@acme/i18n` is not in prime's `package.json` dependencies. Must be added as `workspace:*`.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/types/constants.ts` → `@acme/i18n/locales.ts` → prime (new chain)
- Downstream dependents:
  - `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` (imports `normalizeLocale`)
  - `apps/prime/src/app/(guarded)/language-selector/page.tsx` (inline `SUPPORTED_LOCALES` + `normalizeUiLocale`)
- Likely blast radius:
  - Small, fully enumerated. Six files need changes:
    1. `packages/i18n/src/locales.ts` — add `normalizeUiLocale` function
    2. `packages/i18n/src/index.ts` — export `normalizeUiLocale`
    3. `apps/prime/package.json` — add `@acme/i18n: workspace:*`
    4. `apps/prime/tsconfig.json` — add `@acme/i18n` path entries
    5. `apps/prime/src/lib/i18n/normalizeLocale.ts` — delete or convert to re-export shim
    6. `apps/prime/src/app/(guarded)/language-selector/page.tsx` — replace local SUPPORTED_LOCALES
  - Plus one test file update: `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx` (mock path update if normalizeLocale.ts is deleted).
  - Plus new tests: `packages/i18n/src/__tests__/locales.test.ts` (port prime's TC-08–TC-12).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (prime uses `@acme/config/jest.preset.cjs`)
- Commands: `pnpm -w run test:governed -- jest -- --config apps/prime/jest.config.cjs --rootDir apps/prime`
- CI integration: tests run in CI only (per testing-policy.md)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `normalizeLocale` | Unit | `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts` | 6 test cases covering exact match, fallback, regional variant (it-IT, en-US, en-GB), null/undefined/empty, unsupported regional variant |
| `useUnifiedBookingData` | Unit | `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx` | mocks `normalizeLocale` — will need path update if module moves |
| `resolveUiLocale` / `isUiLocale` | Unit | `packages/i18n/src/__tests__/locales.test.ts` | Tests deprecated `resolveLocale` + `assertLocales`. Does NOT test `resolveUiLocale` or `isUiLocale` (gap). |

#### Coverage Gaps

- `resolveUiLocale` in `@acme/i18n` has no test coverage.
- `isUiLocale` in `@acme/types` has no test coverage in the types package.
- If a new `normalizeUiLocale` is added to `@acme/i18n`, tests will be needed there.

#### Testability Assessment

- Easy to test: The `normalizeLocale` function is pure — existing prime test cases can be re-used or ported to `@acme/i18n`.
- Hard to test: None.
- Test seams needed: `useUnifiedBookingData.test.tsx` mocks `../../lib/i18n/normalizeLocale` by relative path — this mock path will need updating if `normalizeLocale` is replaced by an import from `@acme/i18n`.

#### Recommended Test Approach

- Unit tests for: `normalizeUiLocale` (or enhanced `resolveUiLocale`) added to `packages/i18n/src/__tests__/locales.test.ts` — port prime's TC-08 through TC-12.
- No integration or E2E tests needed for this refactor.

### Recent Git History (Targeted)

- `apps/prime/src/lib/i18n/normalizeLocale.ts` — created in commit `69da63b` (2026-02-11) "feat(prime): add locale normalization gate before changeLanguage (DS-06)". Written as a local-only utility at that point. The haste-map comment was added then.
- `packages/types/src/constants.ts` — commit `8fd0a67` "refactor: remove types package i18n dependency" in history — indicates types was previously dependent on i18n and was decoupled. The current clean direction is: types → source of truth, i18n → re-exports + utilities.

## Questions

### Resolved

- Q: Is the Jest haste-map conflict comment still valid?
  - A: No. Prime's jest config uses `--rootDir apps/prime` and `roots: ["<rootDir>/src", "<rootDir>/functions"]`. The haste map is scoped to prime's own src only. The `apps/xa/.open-next` copy of `@acme/types` is not in scope. The comment describes a historical risk that no longer applies with the current per-app rootDir approach.
  - Evidence: `apps/prime/jest.config.cjs` L2 (`roots`), CI test invocation in `apps/prime/package.json`.

- Q: Does `@acme/i18n`'s `resolveUiLocale` match prime's `normalizeLocale` behavior for regional variants?
  - A: No. `resolveUiLocale('it-IT')` returns `'en'` (falls back — exact match fails). Prime's `normalizeLocale('it-IT')` returns `'it'` (strips region subtag). A new function `normalizeUiLocale` must be added to `@acme/i18n` that applies the region-strip logic, OR prime retains a thin wrapper using `UI_LOCALES`/`isUiLocale` from `@acme/i18n`.
  - Evidence: `packages/i18n/src/locales.ts` L44-47; `apps/prime/src/lib/i18n/normalizeLocale.ts` L24-28.

- Q: Is `@acme/i18n` correctly mapped in the global jest moduleMapper for prime?
  - A: Yes. `jest.moduleMapper.cjs` has `"^@acme/i18n$": " /packages/i18n/src/index.ts"`. Once `@acme/i18n` is in prime's package.json, jest resolution works automatically.
  - Evidence: `jest.moduleMapper.cjs` line mapping `@acme/i18n`.

- Q: What is the correct home for the shared utility — `@acme/types` or `@acme/i18n`?
  - A: `@acme/i18n`. The constant (`UI_LOCALES`) is already in `@acme/types` (source of truth). The utility functions (`resolveUiLocale`, and the new `normalizeUiLocale`) belong in `@acme/i18n`, which already re-exports `UI_LOCALES` and `isUiLocale` and has `resolveUiLocale`. Adding `normalizeUiLocale` there follows the established pattern (`normalizeContentLocale` is in types, `resolveContentLocale` is in i18n).
  - Evidence: `packages/i18n/src/locales.ts` overall structure; `packages/types/src/constants.ts` `normalizeContentLocale` pattern.

- Q: Should `normalizeLocale` itself move to a shared package?
  - A: Partially. The function's logic (region-strip then fallback to 'en') should be canonicalized as `normalizeUiLocale` in `@acme/i18n`. Prime's `normalizeLocale.ts` can then become a thin re-export: `export { normalizeUiLocale as normalizeLocale } from '@acme/i18n'`, OR be removed and call sites updated to use `normalizeUiLocale` directly. Given there is only one call site (`useUnifiedBookingData.ts`), direct replacement is low-risk. Default: delete the file and update the one call site.
  - Evidence: `useUnifiedBookingData.ts` L21 (sole call site).

- Q: Shim or direct replacement for `normalizeLocale.ts`?
  - A: Direct replacement (delete `normalizeLocale.ts`, update call site in `useUnifiedBookingData.ts` to import `normalizeUiLocale` from `@acme/i18n`). There is only one non-test call site. The shim would add indirection with no benefit. This is a clear technical default, not a preference requiring operator input.
  - Evidence: grep confirms one call site at `useUnifiedBookingData.ts` L21.

- Q: Does `apps/prime/tsconfig.json` need updating to import `@acme/i18n`?
  - A: Yes. It has a local `paths` block (`apps/prime/tsconfig.json` L24-30) that completely overrides base config inheritance — TypeScript does not merge `paths` blocks. `@acme/i18n` needs explicit entries: `"@acme/i18n": ["../../packages/i18n/dist/index.d.ts"]` and `"@acme/i18n/*": ["../../packages/i18n/dist/*"]` (following the `@acme/ui` pattern already in that file).
  - Evidence: `apps/prime/tsconfig.json` L24-30 (only 4 `@acme/*` entries; no `@acme/i18n`).

### Open (Operator Input Required)

None — all questions resolved by evidence or clear technical defaults.

## Confidence Inputs

- Implementation: 93% — all 6 files identified, approach decided (delete + update call site), no open questions.
  - Raises to >=95: `pnpm --filter @apps/prime typecheck` and `pnpm --filter @acme/i18n typecheck` passing confirmed in CI.
- Approach: 93% — `normalizeUiLocale` to `@acme/i18n` is the correct home. Shim vs. direct resolved: direct replacement chosen.
  - Raises to >=95: build runs clean in CI.
- Impact: 95% — zero user-facing behavior change. Purely a refactor within one prime hook and one UI page.
- Delivery-Readiness: 92% — `@acme/i18n` dist is built, jest mapping is in place, all decisions made.
  - Raises to >=95: CI green on first attempt.
- Testability: 95% — pure function, existing test cases portable directly.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| tsconfig.json path missing causes typecheck failure | Low | Medium | Add `@acme/i18n` to prime's tsconfig paths; use dist/ path to avoid TS6059 rootDir error. |
| `normalizeUiLocale` region-stripping behavior diverges from prime's existing behavior | Low | Low | Port prime's TC-08 through TC-12 tests directly to `@acme/i18n` before deleting local file. |
| `useUnifiedBookingData.test.tsx` mock path becomes stale | Low | Low | Update mock path from `../../lib/i18n/normalizeLocale` to `@acme/i18n` after move. |
| Future locale expansion (e.g. adding 'de' to UI_LOCALES) still requires updating `@acme/types` | Not-a-risk | — | This is the correct behaviour: `@acme/types` is the source of truth. The refactor makes this explicit. |

## Planning Constraints & Notes

- Must-follow patterns:
  - `@acme/i18n` is the correct home for UI-locale utilities (confirmed by existing `resolveUiLocale` pattern).
  - Prime's tsconfig `paths` block uses dist/ entries for all `@acme/*` packages — match this for `@acme/i18n`.
  - The global `jest.moduleMapper.cjs` already covers `@acme/i18n` — no changes needed there.
  - Tests run in CI only. Do not run jest locally.
- Rollout/rollback expectations:
  - Single PR. No feature flag needed. Purely internal — no API surface change.
  - Rollback: revert the PR. The old `normalizeLocale.ts` can be restored in under 5 minutes.
- Observability expectations:
  - None required. No runtime behavior change.

## Suggested Task Seeds (Non-binding)

1. Add `normalizeUiLocale` to `packages/i18n/src/locales.ts` (region-stripping logic; export from `packages/i18n/src/index.ts`; add tests to `locales.test.ts`).
2. Add `@acme/i18n` to `apps/prime/package.json` dependencies (`workspace:*`).
3. Add `@acme/i18n` entries to `apps/prime/tsconfig.json` paths block (dist/ entries).
4. Update `apps/prime/src/lib/i18n/normalizeLocale.ts` to import from `@acme/i18n` (or delete file and update call sites).
5. Update `apps/prime/src/app/(guarded)/language-selector/page.tsx` to use `UI_LOCALES` and `normalizeUiLocale` from `@acme/i18n`.
6. Update `useUnifiedBookingData.test.tsx` mock path if `normalizeLocale.ts` is removed.
7. Rebuild `@acme/i18n` dist if locales.ts changes (`pnpm --filter @acme/i18n build`).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `@acme/i18n` exports `normalizeUiLocale` (regional variant stripping, returns `UiLocale`).
  - `apps/prime/src/lib/i18n/normalizeLocale.ts` no longer defines `SUPPORTED_LOCALES` locally (either deleted or imports from `@acme/i18n`).
  - `apps/prime/src/app/(guarded)/language-selector/page.tsx` no longer defines `SUPPORTED_LOCALES` locally.
  - `apps/prime/tsconfig.json` includes `@acme/i18n` path entries.
  - `pnpm --filter @apps/prime typecheck` passes.
  - `pnpm --filter @acme/i18n typecheck` passes.
  - `pnpm --filter @apps/prime lint` passes.
  - `pnpm --filter @acme/i18n lint` passes.
  - Existing prime normalizeLocale test cases pass (ported to `@acme/i18n` tests if file is removed).
- Post-delivery measurement plan: typecheck + jest CI pass is the only required gate.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `normalizeLocale.ts` local definition and comment | Yes | None | No |
| `@acme/types/constants.ts` exports (shape, type, values) | Yes | None | No |
| `@acme/i18n/locales.ts` exports and `resolveUiLocale` behavior gap | Yes | None | No |
| All prime files defining `SUPPORTED_LOCALES` locally | Yes | language-selector/page.tsx is a second instance not in dispatch anchors | No |
| `dateUtils.ts` SUPPORTED_LOCALES (different set — Intl locales) | Yes | Out of scope confirmed | No |
| Haste-map constraint validity | Yes | Comment is historical — not a current build constraint | No |
| tsconfig.json paths inheritance in prime | Yes | None — fix required and documented | No |
| Jest moduleMapper coverage for @acme/i18n | Yes | None — already mapped | No |
| Test coverage for normalizeLocale | Yes | None — tests exist and are portable | No |
| `@acme/i18n` dist availability | Yes | None — dist is built | No |

## Scope Signal

Signal: right-sized

Rationale: Two prime files to update, one `@acme/i18n` addition (1 function + tests), two prime config files (package.json, tsconfig.json). All dependencies confirmed resolvable. No cross-app blast radius. The scope matches a straightforward refactor with no architecture decisions outstanding.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all claims backed by direct file reads and grep evidence.
- Dependency claims traced to real import sites (`useUnifiedBookingData.ts`, `language-selector/page.tsx`).
- Haste-map constraint: resolved by inspecting jest config `roots` and invocation.
- Behavioral gap between `resolveUiLocale` and `normalizeLocale`: confirmed by reading both implementations.
- `@acme/i18n` dist availability: confirmed by directory listing.

### Confidence Adjustments

- Implementation confidence raised from dispatch's 0.79 to 0.92 — file set is fully enumerated and path is clear.
- Approach confidence 0.90 — one minor open question (shim vs. direct) with a clear default.

### Remaining Assumptions

- `pnpm --filter @acme/i18n build` will complete cleanly after the locales.ts addition (no current evidence of build failures in @acme/i18n).
- The `normalizeUiLocale` function added to `@acme/i18n` will have the same region-stripping semantics as prime's existing `normalizeLocale` (assumption: same logic, same tests — verifiable during build).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan prime-normalize-locale-constants --auto`
