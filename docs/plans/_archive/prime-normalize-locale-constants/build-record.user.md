---
Type: Build-Record
Status: Complete
Feature-Slug: prime-normalize-locale-constants
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Prime Normalize Locale Constants

## Outcome Contract

- **Why:** Local locale constant is a recurring copy-paste risk as supported locales expand. Cross-package refactor needs scoping before implementation to avoid breaking haste-map resolution and other apps.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime no longer defines `SUPPORTED_LOCALES` locally in any file. The `normalizeLocale.ts` file is removed; the sole call site (`useUnifiedBookingData.ts`) imports `normalizeUiLocale` directly from `@acme/i18n`. `@acme/i18n` exports `normalizeUiLocale` with region-stripping semantics. `language-selector/page.tsx` uses `UI_LOCALES` and `normalizeUiLocale` from `@acme/i18n`.
- **Source:** operator

## What Was Built

**TASK-01 — Add `normalizeUiLocale` to `@acme/i18n`:** Added `normalizeUiLocale(value: string | null | undefined): UiLocale` to `packages/i18n/src/locales.ts`. Unlike `resolveUiLocale` (exact-match only), the new function strips BCP-47 region subtags (`'it-IT'` → `'it'`) and falls back to `'en'` for unsupported locales, null, undefined, or empty input. Exported from `packages/i18n/src/index.ts`. Seven test cases added covering exact match, regional stripping, unsupported locales, and null/undefined. `@acme/i18n` rebuilt via `pnpm --filter @acme/i18n build`.

**TASK-02 — Wire `@acme/i18n` into prime:** Added `"@acme/i18n": "workspace:*"` to `apps/prime/package.json` dependencies. Added `"@acme/i18n"` and `"@acme/i18n/*"` dist path entries to `apps/prime/tsconfig.json` paths block, following the established `@acme/ui` pattern. `pnpm install` updated the lockfile. `pnpm --filter @apps/prime typecheck` confirmed TS2307 resolved.

**TASK-03 — Delete `normalizeLocale.ts` and update call sites:** Deleted `apps/prime/src/lib/i18n/normalizeLocale.ts` and its test file `apps/prime/src/lib/i18n/__tests__/normalizeLocale.test.ts` (tests migrated to `@acme/i18n`). Updated `useUnifiedBookingData.ts` to import `normalizeUiLocale` from `@acme/i18n`. Updated `useUnifiedBookingData.test.tsx` to mock `@acme/i18n` (not the old relative path) and renamed `mockNormalizeLocale` → `mockNormalizeUiLocale` throughout.

**TASK-04 — Update `language-selector/page.tsx`:** Removed local `const SUPPORTED_LOCALES = ['en', 'it'] as const`, local `type UiLocale`, and local `function normalizeUiLocale`. Replaced with a single import: `import { UI_LOCALES, normalizeUiLocale, type UiLocale } from '@acme/i18n'`. Changed `SUPPORTED_LOCALES.map(...)` to `UI_LOCALES.map(...)`. No visible behaviour change — the prior local function already handled `'it-IT'` via split-on-hyphen; the shared function has identical semantics.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @acme/i18n build` | Pass | `tsc -b`; dist rebuilt with `normalizeUiLocale` |
| `pnpm --filter @acme/i18n lint` | Pass | Pre-commit hook |
| `pnpm --filter @apps/prime typecheck` | Pass | After all 4 tasks; exit 0 |
| `pnpm --filter @apps/prime lint` | Pass | 0 errors; 34 pre-existing warnings in unrelated files |
| CI tests | Deferred to push | Per testing-policy.md — no local jest execution |

## Validation Evidence

### TASK-01
- `normalizeUiLocale` exported from `packages/i18n/src/locales.ts` and `packages/i18n/src/index.ts` ✓
- TC-N3: `normalizeUiLocale('it-IT')` → `'it'` (region-strip) ✓ (logic identical to prime's prior `normalizeLocale`)
- TC-N6: null/undefined/'' → `'en'` ✓
- `pnpm --filter @acme/i18n build` exit 0 ✓
- Commit: `0216dd6ed2`

### TASK-02
- `apps/prime/package.json` contains `"@acme/i18n": "workspace:*"` ✓
- `apps/prime/tsconfig.json` paths block has `@acme/i18n` and `@acme/i18n/*` dist entries ✓
- TC-W1/W2: `pnpm --filter @apps/prime typecheck` exit 0, no TS2307 ✓
- Changes in HEAD, confirmed via `git show HEAD`.

### TASK-03
- TC-D1: `grep -r "from '../../lib/i18n/normalizeLocale'" apps/prime/src` → empty ✓
- TC-D2: `normalizeUiLocale` import from `@acme/i18n` present in `useUnifiedBookingData.ts` ✓
- TC-D3: `jest.mock('@acme/i18n', () => ({ normalizeUiLocale: jest.fn() }))` in test file ✓
- TC-D4: `pnpm --filter @apps/prime typecheck` exit 0 ✓
- Commit: `c45ac7f5d9`

### TASK-04
- TC-L1: `grep "SUPPORTED_LOCALES" language-selector/page.tsx` → empty ✓
- TC-L2: `grep "from '@acme/i18n'" language-selector/page.tsx` → contains `UI_LOCALES`, `normalizeUiLocale` ✓
- TC-L3: `pnpm --filter @apps/prime typecheck` exit 0 ✓
- Overall acceptance: `grep -r "SUPPORTED_LOCALES" apps/prime/src/lib/i18n apps/prime/src/app` → empty ✓
- Commit: `c45ac7f5d9`

## Scope Deviations

None. All changes were within the plan scope. The `__tests__` directory deletion was explicitly listed in TASK-03 scope.
