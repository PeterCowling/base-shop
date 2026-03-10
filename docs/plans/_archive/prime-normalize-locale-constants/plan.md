---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-normalize-locale-constants
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Normalize Locale Constants — Plan

## Summary

`apps/prime` defines `SUPPORTED_LOCALES = ['en', 'it']` locally in two files (`normalizeLocale.ts` and `language-selector/page.tsx`), duplicating `UI_LOCALES` from `@acme/types/constants.ts`. The fix adds `normalizeUiLocale` (region-stripping BCP-47 variant of `resolveUiLocale`) to `@acme/i18n`, wires `@acme/i18n` into prime's package.json and tsconfig.json, deletes `normalizeLocale.ts`, and updates the two prime files that had local definitions. No user-visible behaviour changes — purely an internal deduplication.

## Active tasks
- [x] TASK-01: Add `normalizeUiLocale` to `@acme/i18n` and rebuild dist
- [x] TASK-02: Add `@acme/i18n` dependency and tsconfig paths to prime
- [x] TASK-03: Delete `normalizeLocale.ts` and update call site + test mock
- [x] TASK-04: Update `language-selector/page.tsx` to import from `@acme/i18n`

## Goals
- Eliminate all local `SUPPORTED_LOCALES = ['en', 'it']` definitions from prime.
- Expose `normalizeUiLocale` in `@acme/i18n` with BCP-47 region-stripping (matches prime's prior behavior: `'it-IT'` → `'it'`).
- Keep prime typecheck, lint, and jest CI green.

## Non-goals
- Migrating brikette scripts' `SUPPORTED_LOCALES` (filesystem/content scope, not UI locale).
- Migrating `dateUtils.ts` (Intl.DateTimeFormat locale set, different purpose).
- Migrating `apps/skylar` (uses deprecated `LOCALES`; separate scope).
- Touching `@acme/types/constants.ts` (source of truth is already correct).

## Constraints & Assumptions
- Constraints:
  - `@acme/i18n` build uses `tsc -b` into `dist/`; after src changes the dist must be rebuilt before prime can typecheck against it.
  - Prime's tsconfig.json has a local `paths` block that overrides all base config inheritance — `@acme/i18n` must be added explicitly with dist/ entries.
  - Tests run in CI only (testing-policy.md). No local test execution.
- Assumptions:
  - `@acme/i18n` tsconfig references `../types` — adding `normalizeUiLocale` to `locales.ts` introduces no new external references.
  - `jest.moduleMapper.cjs` already maps `^@acme/i18n$` → `packages/i18n/src/index.ts` at workspace root.

## Inherited Outcome Contract

- **Why:** Local locale constant is a recurring copy-paste risk as supported locales expand. Cross-package refactor needs scoping before implementation to avoid breaking haste-map resolution and other apps.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime no longer defines `SUPPORTED_LOCALES` locally in any file. The `normalizeLocale.ts` file is removed; the sole call site (`useUnifiedBookingData.ts`) imports `normalizeUiLocale` directly from `@acme/i18n`. `@acme/i18n` exports `normalizeUiLocale` with region-stripping semantics. `language-selector/page.tsx` uses `UI_LOCALES` and `normalizeUiLocale` from `@acme/i18n`.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-normalize-locale-constants/fact-find.md`
- Key findings used:
  - `resolveUiLocale` in `@acme/i18n` does exact-match only; `'it-IT'` → `'en'` (gap vs. prime's behavior).
  - Jest haste-map conflict comment in `normalizeLocale.ts` is historical; prime's jest config scopes `--rootDir apps/prime` and `roots: src + functions` — no cross-app haste collision.
  - `useUnifiedBookingData.test.tsx` mocks `../../lib/i18n/normalizeLocale` by relative path — will need update when file is deleted.
  - `packages/i18n/dist/locales.js` confirmed present; dist must be rebuilt after source change.

## Proposed Approach

- Option A: Add `normalizeUiLocale` to `@acme/i18n`; delete `normalizeLocale.ts`; update single call site to import `normalizeUiLocale` from `@acme/i18n`.
- Option B: Keep `normalizeLocale.ts` as a re-export shim (`export { normalizeUiLocale as normalizeLocale } from '@acme/i18n'`) to avoid changing the mock in `useUnifiedBookingData.test.tsx`.
- Chosen approach: **Option A** — direct replacement. Only one non-test call site. The mock in `useUnifiedBookingData.test.tsx` can be updated in the same task. Shim adds indirection for no benefit.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `normalizeUiLocale` to `@acme/i18n` + tests + rebuild dist | 90% | S | Complete (2026-03-09) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add `@acme/i18n` dep + tsconfig paths to prime | 90% | S | Complete (2026-03-09) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Delete `normalizeLocale.ts`; update call site + test mock | 85% | S | Complete (2026-03-09) | TASK-02 | - |
| TASK-04 | IMPLEMENT | Update `language-selector/page.tsx` to import from `@acme/i18n` | 90% | S | Complete (2026-03-09) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Add `normalizeUiLocale` to `@acme/i18n` |
| 2 | TASK-02 | TASK-01 | Wire prime config |
| 3 | TASK-03, TASK-04 | TASK-02 | Can run in parallel |

## Tasks

---

### TASK-01: Add `normalizeUiLocale` to `@acme/i18n` + tests + rebuild dist
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `packages/i18n/src/locales.ts`, `packages/i18n/src/index.ts`, `packages/i18n/src/__tests__/locales.test.ts`; rebuilt `packages/i18n/dist/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:**
  - `packages/i18n/src/locales.ts`
  - `packages/i18n/src/index.ts`
  - `packages/i18n/src/__tests__/locales.test.ts`
  - `packages/i18n/dist/` (rebuilt artifact, not directly edited)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Build evidence (TASK-01):**
  - Route: codex offload (`CODEX_OK=1`), exit 0
  - `normalizeUiLocale` added to `locales.ts` L53+; exported from `index.ts` L16; 7 test cases added to `locales.test.ts`
  - `dist/locales.d.ts` and `dist/locales.js` rebuilt (gitignored; rebuilt by CI/`pnpm --filter @acme/i18n build`)
  - `pnpm --filter @acme/i18n build` ✓; `pnpm --filter @acme/i18n lint` ✓ (pre-commit hooks)
  - Commit: `0216dd6ed2`
- **Confidence:** 90%
  - Implementation: 95% — logic is identical to prime's existing `normalizeLocale`; insertion point in `locales.ts` is clear (after `resolveUiLocale`); export pattern follows existing `resolveContentLocale` / `resolveUiLocale` pattern.
  - Approach: 90% — placing `normalizeUiLocale` in `@acme/i18n` (not `@acme/types`) follows the established split: types = constant + type guards; i18n = resolver utilities. Held-back test: no single unknown would drop below 90 — the function signature and insertion point are fully specified.
  - Impact: 90% — dist rebuild is a well-understood `pnpm --filter @acme/i18n build` invocation; `tsc -b` build is deterministic for this change.
- **Acceptance:**
  - `packages/i18n/src/locales.ts` exports `normalizeUiLocale(value: string | null | undefined): UiLocale`.
  - `normalizeUiLocale` strips region subtag: `'it-IT'` → `'it'`; `'en-GB'` → `'en'`.
  - `normalizeUiLocale` falls back to `'en'` for unsupported, null, undefined, empty.
  - `normalizeUiLocale` is re-exported from `packages/i18n/src/index.ts`.
  - `packages/i18n/src/__tests__/locales.test.ts` adds `describe('normalizeUiLocale', ...)` block with TC-N1 through TC-N5 (ported from prime's TC-08–TC-12).
  - `pnpm --filter @acme/i18n build` completes without errors (runs `tsc -b`; no dedicated `typecheck` script); `dist/locales.js` and `dist/locales.d.ts` updated.
  - `pnpm --filter @acme/i18n lint` passes.

- **Validation contract (TC-XX):**
  - TC-N1: `normalizeUiLocale('it')` → `'it'` (exact match)
  - TC-N2: `normalizeUiLocale('en')` → `'en'` (exact match)
  - TC-N3: `normalizeUiLocale('it-IT')` → `'it'` (regional variant stripped)
  - TC-N4: `normalizeUiLocale('en-US')` → `'en'`; `normalizeUiLocale('en-GB')` → `'en'`
  - TC-N5: `normalizeUiLocale('de')` → `'en'`; `normalizeUiLocale('fr')` → `'en'`; `normalizeUiLocale('ja')` → `'en'` (unsupported → fallback)
  - TC-N6: `normalizeUiLocale(undefined)` → `'en'`; `normalizeUiLocale(null)` → `'en'`; `normalizeUiLocale('')` → `'en'`
  - TC-N7: `normalizeUiLocale('zh-Hans')` → `'en'`; `normalizeUiLocale('de-AT')` → `'en'` (unsupported regional → fallback)
- **Execution plan:**
  - Red: Add TC-N1 through TC-N7 to `locales.test.ts` as `it.skip()` stubs.
  - Green: Add `normalizeUiLocale` function to `locales.ts` after `resolveUiLocale`; add to `index.ts` export list. Run `pnpm --filter @acme/i18n build`.
  - Refactor: Remove `.skip` from stubs. Confirm tests will pass in CI.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: all preconditions verified in fact-find.
- **Edge Cases & Hardening:**
  - `null` input: guard with `if (!value) return 'en'` (same as `resolveUiLocale`).
  - Input with multiple hyphens (e.g. `'zh-Hans-CN'`): split on `-` and take `[0]` — `'zh'` not in UI_LOCALES → falls back to `'en'`. Correct per spec (UI_LOCALES = `['en', 'it']` only).
  - Lowercase normalization: `'IT'` or `'IT-IT'` — split on `-`, `[0].toLowerCase()` before checking set. Add lowercase step to implementation.
- **What would make this >=90%:** Already at 90%. Rises to 95% once `pnpm --filter @acme/i18n build` runs clean in CI.
- **Rollout / rollback:**
  - Rollout: merged into `dev` as part of single PR.
  - Rollback: revert locales.ts, index.ts, test file, rebuild dist.
- **Documentation impact:** None: internal utility; JSDoc comment on `normalizeUiLocale` is sufficient.
- **Notes / references:**
  - Mirror pattern of `normalizeContentLocale` in `packages/types/src/constants.ts` — same region-strip logic.
  - Prime's original test cases: `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts`.

---

### TASK-02: Add `@acme/i18n` dependency and tsconfig paths to prime
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/prime/package.json`, `apps/prime/tsconfig.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence (TASK-02):**
  - `apps/prime/package.json`: `"@acme/i18n": "workspace:*"` added to dependencies.
  - `apps/prime/tsconfig.json`: `"@acme/i18n"` and `"@acme/i18n/*"` dist path entries added to `paths` block.
  - `pnpm install` ran clean; `pnpm-lock.yaml` updated.
  - `pnpm --filter @apps/prime typecheck` passed (TS2307 resolved).
  - Changes confirmed in HEAD (committed during previous session).
- **Affects:**
  - `apps/prime/package.json`
  - `apps/prime/tsconfig.json`
- **Depends on:** TASK-01 (dist must exist before tsconfig paths resolve)
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 90%
  - Implementation: 95% — two-line edit to package.json (add `"@acme/i18n": "workspace:*"`); two-line edit to tsconfig.json paths block (add `"@acme/i18n"` and `"@acme/i18n/*"` entries pointing to dist).
  - Approach: 90% — tsconfig pattern follows `@acme/ui` in the same file: `"@acme/ui": ["../../packages/ui/dist/index.d.ts"]` and `"@acme/ui/*": ["../../packages/ui/dist/*"]`. Held-back test: no single unknown would drop below 90; dist path structure (`dist/index.d.ts`) confirmed present.
  - Impact: 90% — pnpm workspace link established; tsconfig paths resolve to dist entries.
- **Acceptance:**
  - `apps/prime/package.json` contains `"@acme/i18n": "workspace:*"` in `dependencies`.
  - `apps/prime/tsconfig.json` paths block includes `"@acme/i18n": ["../../packages/i18n/dist/index.d.ts"]` and `"@acme/i18n/*": ["../../packages/i18n/dist/*"]`.
  - `pnpm --filter @apps/prime typecheck` resolves `@acme/i18n` imports without `TS2307` errors.
  - `pnpm install` (or lockfile-only update) completes without error.
- **Validation contract (TC-XX):**
  - TC-W1: `import { normalizeUiLocale } from '@acme/i18n'` in a prime file does not produce TS2307 error after this change.
  - TC-W2: `pnpm --filter @apps/prime typecheck` exits 0.
- **Execution plan:**
  - Red: Add `@acme/i18n` import in one prime file; run `pnpm --filter @apps/prime typecheck` to confirm TS2307 before fix.
  - Green: Add package.json dep + tsconfig paths; run `pnpm install --filter @apps/prime` or workspace install.
  - Refactor: Confirm typecheck passes; remove the temporary import if added only for validation.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: dist path structure confirmed (`packages/i18n/dist/index.d.ts` confirmed present).
- **Edge Cases & Hardening:**
  - If `pnpm install` produces lockfile drift, commit `pnpm-lock.yaml` update as part of this task.
- **What would make this >=90%:** Already at 90%. Rises to 95% once typecheck CI confirms TS2307 is gone.
- **Rollout / rollback:**
  - Rollout: part of single PR.
  - Rollback: remove package.json dep + tsconfig entries, reinstall.
- **Documentation impact:** None.
- **Notes / references:**
  - tsconfig paths pattern reference: `apps/prime/tsconfig.json` L28-29 (`@acme/ui` entries).

---

### TASK-03: Delete `normalizeLocale.ts`; update call site and test mock
- **Type:** IMPLEMENT
- **Deliverable:** code-change: delete `apps/prime/src/lib/i18n/normalizeLocale.ts`; update `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts`; update `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx`; delete `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence (TASK-03):**
  - `normalizeLocale.ts` deleted; `normalizeLocale.test.ts` deleted.
  - `useUnifiedBookingData.ts`: import changed from `../../lib/i18n/normalizeLocale` → `@acme/i18n`; call site updated `normalizeLocale` → `normalizeUiLocale`.
  - `useUnifiedBookingData.test.tsx`: `jest.mock` path updated to `@acme/i18n`; `mockNormalizeLocale` renamed to `mockNormalizeUiLocale` throughout.
  - TC-D1: `grep -r "from '../../lib/i18n/normalizeLocale'"` → empty ✓
  - TC-D2: `normalizeUiLocale` import present in `useUnifiedBookingData.ts` ✓
  - TC-D3: `jest.mock('@acme/i18n', ...)` present with `normalizeUiLocale` mock ✓
  - TC-D4: `pnpm --filter @apps/prime typecheck` → exit 0 ✓
  - Commit: `c45ac7f5d9`
- **Affects:**
  - `apps/prime/src/lib/i18n/normalizeLocale.ts` (deleted)
  - `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts` (deleted — tests now live in `@acme/i18n`)
  - `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts`
  - `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — single call site confirmed (`useUnifiedBookingData.ts` L21); mock at `../../lib/i18n/normalizeLocale` needs update to `@acme/i18n` import path.
  - Approach: 85% — direct import replacement and mock path update is the correct approach. The mock must change from `jest.mock('../../lib/i18n/normalizeLocale', ...)` to `jest.mock('@acme/i18n', ...)` with a partial mock (only `normalizeUiLocale`). Partial mocking requires care to not accidentally mock other `@acme/i18n` exports in the same test file. Held-back test: if the test file imports other `@acme/i18n` exports directly, a full mock could break them. Current test file does not import from `@acme/i18n` — this risk is low but present until verified in build.
  - Impact: 85% — the test's mock of `normalizeLocale` is used in multiple test cases; the renamed function (`normalizeUiLocale`) must be reflected in the mock and all `mockNormalizeLocale.*` usages in the test file.
- **Acceptance:**
  - `apps/prime/src/lib/i18n/normalizeLocale.ts` does not exist.
  - `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts` does not exist.
  - `useUnifiedBookingData.ts` imports `normalizeUiLocale` from `'@acme/i18n'` (not from `'../../lib/i18n/normalizeLocale'`).
  - `useUnifiedBookingData.test.tsx` mocks `'@acme/i18n'` (not `'../../lib/i18n/normalizeLocale'`); uses `normalizeUiLocale` mock name throughout.
  - `pnpm --filter @apps/prime typecheck` passes.
  - `pnpm --filter @apps/prime lint` passes.
  - No remaining import of `normalizeLocale` from the deleted path: `grep -r "lib/i18n/normalizeLocale" apps/prime/src` returns empty.
- **Validation contract (TC-XX):**
  - TC-D1: `grep -r "from '../../lib/i18n/normalizeLocale'" apps/prime/src` → empty (old import gone).
  - TC-D2: `grep -r "from '@acme/i18n'" apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` → contains `normalizeUiLocale` import.
  - TC-D3: `jest.mock('@acme/i18n', ...)` present in `useUnifiedBookingData.test.tsx`; `normalizeLocale` mock name updated to `normalizeUiLocale`.
  - TC-D4: `pnpm --filter @apps/prime typecheck` exits 0.
- **Execution plan:**
  - Red: Confirm current test passes with existing mock path (CI baseline exists).
  - Green: Delete `normalizeLocale.ts` and test file. Update `useUnifiedBookingData.ts` import. Update `useUnifiedBookingData.test.tsx` mock path and rename `mockNormalizeLocale` → `mockNormalizeUiLocale` throughout.
  - Refactor: Run `grep -r "normalizeLocale" apps/prime/src` to confirm no stale references remain.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:**
  - Verify `useUnifiedBookingData.test.tsx` does not import any other symbol from `@acme/i18n` (if it does, a scoped factory mock is needed). Current evidence: test file imports only from `../../lib/i18n/normalizeLocale` and `react-i18next` / `@testing-library/react`.
- **Edge Cases & Hardening:**
  - Partial mock of `@acme/i18n`: use `jest.mock('@acme/i18n', () => ({ normalizeUiLocale: jest.fn() }))`. This replaces the whole module; since the test doesn't use any other `@acme/i18n` exports, this is safe. If future tests in this file need real exports, add `jest.requireActual` spread.
- **What would make this >=90%:** Confirming test file has no other `@acme/i18n` imports (verified in Scouts) and CI passes green.
- **Rollout / rollback:**
  - Rollout: part of single PR.
  - Rollback: restore `normalizeLocale.ts` and test file from git; revert useUnifiedBookingData imports.
- **Documentation impact:** None.
- **Notes / references:**
  - `useUnifiedBookingData.test.tsx` L6: `import { normalizeLocale } from '../../lib/i18n/normalizeLocale';`
  - `useUnifiedBookingData.test.tsx` L18-20: `jest.mock('../../lib/i18n/normalizeLocale', () => ({ normalizeLocale: jest.fn() }));`
  - Rename throughout: `mockNormalizeLocale` → `mockNormalizeUiLocale`.

---

### TASK-04: Update `language-selector/page.tsx` to import from `@acme/i18n`
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/prime/src/app/(guarded)/language-selector/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence (TASK-04):**
  - `language-selector/page.tsx`: removed local `const SUPPORTED_LOCALES`, local `type UiLocale`, and local `function normalizeUiLocale`. Added `import { UI_LOCALES, normalizeUiLocale, type UiLocale } from '@acme/i18n'`. Changed `SUPPORTED_LOCALES.map(...)` to `UI_LOCALES.map(...)`.
  - TC-L1: `grep "SUPPORTED_LOCALES" language-selector/page.tsx` → empty ✓
  - TC-L2: `grep "from '@acme/i18n'" language-selector/page.tsx` → contains `UI_LOCALES`, `normalizeUiLocale` ✓
  - TC-L3: `pnpm --filter @apps/prime typecheck` → exit 0 ✓
  - `pnpm --filter @apps/prime lint` → 0 errors ✓
  - Commit: `c45ac7f5d9`
- **Affects:**
  - `apps/prime/src/app/(guarded)/language-selector/page.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — file confirmed; local `SUPPORTED_LOCALES` + local `normalizeUiLocale` are replaced by imports from `@acme/i18n`. Template loop `SUPPORTED_LOCALES.map(...)` continues to work with the `readonly string[]` typed `UI_LOCALES`.
  - Approach: 90% — the existing hardcoded `normalizeUiLocale` (`base === 'it' ? 'it' : 'en'`) is inferior (only handles `'it'`); replacing with `normalizeUiLocale` from `@acme/i18n` is a strict improvement. Held-back test: no single unknown would drop below 90.
  - Impact: 90% — UI locale resolution is now correct for all supported locales (not just Italian); `SUPPORTED_LOCALES.map` continues to render the same two buttons since `UI_LOCALES = ['en', 'it']`.
- **Acceptance:**
  - `language-selector/page.tsx` does not contain `const SUPPORTED_LOCALES = ['en', 'it']`.
  - `language-selector/page.tsx` imports `UI_LOCALES` and `normalizeUiLocale` from `'@acme/i18n'`.
  - Local `normalizeUiLocale` function is removed.
  - `pnpm --filter @apps/prime typecheck` passes.
  - `pnpm --filter @apps/prime lint` passes.
  - **Expected user-observable behavior:**
    - Language selector page renders exactly two buttons (English, Italian) — unchanged.
    - Locale detection still falls back to `'en'` for unsupported languages — unchanged.
    - No visible behaviour change: this is a deduplication refactor only. The prior local `normalizeUiLocale` already handled `'it-IT'` via split-on-hyphen; the shared function has identical semantics.
- **Validation contract (TC-XX):**
  - TC-L1: `grep "SUPPORTED_LOCALES" apps/prime/src/app/\(guarded\)/language-selector/page.tsx` → empty.
  - TC-L2: `grep "from '@acme/i18n'" apps/prime/src/app/\(guarded\)/language-selector/page.tsx` → contains `UI_LOCALES` and `normalizeUiLocale`.
  - TC-L3: `pnpm --filter @apps/prime typecheck` exits 0.
- **Execution plan:**
  - Red: Confirm existing local definitions present.
  - Green: Replace local `const SUPPORTED_LOCALES` and local `normalizeUiLocale` function with imports from `@acme/i18n`; update `SUPPORTED_LOCALES.map(...)` to `UI_LOCALES.map(...)`.
  - Refactor: Confirm no unused local variable warnings in lint.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: file content confirmed in fact-find.
- **Edge Cases & Hardening:**
  - `UI_LOCALES` is `readonly ['en', 'it']`; `.map(...)` on `readonly` arrays is supported in TypeScript — no cast needed.
- **What would make this >=90%:** Already at 90%. Rises to 95% once typecheck CI passes.
- **Rollout / rollback:**
  - Rollout: part of single PR.
  - Rollback: revert the file.
- **Documentation impact:** None.
- **Notes / references:**
  - The existing local `normalizeUiLocale` function at L11-14 in the file only handles `'it'` explicitly; the `@acme/i18n` version handles all current and future supported locales generically.

---

## Risks & Mitigations
- `pnpm install` lockfile drift after adding `@acme/i18n` dep: low — workspace:* dependencies resolve without network fetch. Commit updated `pnpm-lock.yaml`.
- `@acme/i18n` dist rebuild fails: low — `tsc -b` is deterministic. If it fails, check `packages/i18n/tsconfig.json` composite references.
- `jest.mock('@acme/i18n', ...)` partial mock breaks future tests that import real `@acme/i18n` exports: low — mitigated by using `jest.requireActual` pattern if needed.

## Observability
- Logging: None.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `packages/i18n/src/locales.ts` exports `normalizeUiLocale(value: string | null | undefined): UiLocale`
- [ ] `packages/i18n/src/index.ts` re-exports `normalizeUiLocale`
- [ ] `packages/i18n/dist/` rebuilt and includes `normalizeUiLocale` in `locales.js` and `locales.d.ts`
- [ ] `apps/prime/package.json` includes `"@acme/i18n": "workspace:*"`
- [ ] `apps/prime/tsconfig.json` paths block includes `@acme/i18n` and `@acme/i18n/*` dist entries
- [ ] `apps/prime/src/lib/i18n/normalizeLocale.ts` deleted
- [ ] `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts` deleted
- [ ] `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` imports `normalizeUiLocale` from `'@acme/i18n'`
- [ ] `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx` mocks `'@acme/i18n'` (not old relative path)
- [ ] `apps/prime/src/app/(guarded)/language-selector/page.tsx` uses `UI_LOCALES` and `normalizeUiLocale` from `'@acme/i18n'`
- [ ] `grep -r "SUPPORTED_LOCALES" apps/prime/src/lib/i18n apps/prime/src/app --include="*.ts" --include="*.tsx"` returns empty (scoped to i18n + app dirs; `utils/dateUtils.ts` is out of scope per non-goals)
- [ ] `pnpm --filter @apps/prime typecheck` passes
- [ ] `pnpm --filter @acme/i18n build` passes (runs `tsc -b`; validates types)
- [ ] `pnpm --filter @apps/prime lint` passes
- [ ] `pnpm --filter @acme/i18n lint` passes

## Decision Log
- 2026-03-09: Option A (delete + direct import) chosen over Option B (shim). One call site; shim adds indirection for no benefit.

## Overall-confidence Calculation
- All 4 tasks are S-effort (weight=1 each).
- Task confidences: 90%, 90%, 85%, 90%.
- Raw = (90+90+85+90) / 4 = 88.75%.
- Downward bias rule (uncertain between adjacent multiples of 5): 88.75% → **85%**.
- `Overall-confidence: 85%` (header updated).

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add normalizeUiLocale to @acme/i18n | Yes | None — `locales.ts` insertion point confirmed; `isUiLocale` already available in file scope | No |
| TASK-02: Wire prime package.json + tsconfig | Partial | [Ordering inversion] [Minor]: TASK-02 doc says "dist must exist before tsconfig paths resolve" but `tsc -b` is run at typecheck time, not at dep-install time. TASK-01 rebuild covers this. | No |
| TASK-03: Delete normalizeLocale.ts + update call site | Yes | None — sole call site confirmed; mock path confirmed; `@acme/i18n` jest mapping pre-exists | No |
| TASK-04: Update language-selector/page.tsx | Yes | None — file content confirmed; `UI_LOCALES` readonly array is `.map()`-compatible | No |
