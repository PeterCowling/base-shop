---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-10
Last-updated: 2026-02-10
Feature-Slug: reception-ui-theme-centralization
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: create-ui-component
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
---

# Reception UI Theme Centralization Plan

## Summary
Centralize Reception UI primitives, theme state, and token usage onto shared platform packages (`@acme/design-system`, `@acme/ui`, `@acme/platform-core`) and progressively remove the ESLint DS suppression. The plan is phased: foundation work (theme provider, dialog, test enablement) first, then token bridge and pilot migration, with a checkpoint before broad rollout.

## Goals
- Remove Reception-wide DS lint exclusion and make DS governance enforceable.
- Migrate local modal/input/theme patterns to shared primitives/providers.
- Standardize on token-driven styling and shared component entrypoints.
- Preserve current Reception UX and auth/theme behavior during migration.

## Non-goals
- Replatform Reception data hooks/business logic.
- Rewrite all Reception UI in one release (phased migration).
- Full i18n rewrite (can be phased separately).
- Migrate all 185 files with raw color classes in this plan (only pilot slice).

## Constraints & Assumptions
- Constraints:
  - Reception is production operational tooling with 25 route entry pages.
  - Existing behavior (login, modal actions, dark mode) must not regress.
  - CI currently runs `@apps/reception test` but the script is a stub (`echo ... && exit 0`).
  - 418 TSX files, 185 with dark palette classes, 131 native form elements — too large for single pass.
- Assumptions:
  - Phased migration (slice-by-slice) is required; big-bang is too risky.
  - Existing shared primitives are sufficient to start (ConfirmDialog, ThemeProvider, form primitives).

## Fact-Find Reference
- Related brief: `docs/plans/archive/reception-ui-theme-centralization-fact-find.md`
- Key findings:
  - Reception has TWO ESLint override blocks disabling all DS rules (lines 1472-1484 and 2173-2188 in `eslint.config.mjs`).
  - DarkModeContext has only 2 consumers (`DarkModeToggle.tsx`, `Login.tsx`).
  - DialogProvider is NEVER mounted in the app tree — `useDialog()` calls in 2 components would throw at runtime.
  - 319 test files exist but none run due to stub script in `package.json`.
  - Dark palette colors (`darkSurface`, `darkBg`, `darkAccentGreen`, `darkAccentOrange`) are defined in `constants/colors.ts` but their Tailwind registration mechanism is unclear — the referenced `apps/reception/tailwind.config.mjs` does not exist.
  - Shared ThemeProvider supports `light|dark|system` mode but lacks Firebase sync and per-user localStorage.

## Existing System Notes
- Key modules/files:
  - `apps/reception/src/context/DarkModeContext.tsx` — local theme state with Firebase sync + per-user localStorage
  - `packages/platform-core/src/contexts/ThemeModeContext.tsx` — shared mode handling (`light|dark|system`)
  - `packages/ui/src/providers/ThemeProvider.tsx` — shared theme provider bridge
  - `apps/reception/src/context/DialogContext.tsx` — local dialog orchestration (Promise-based API)
  - `packages/design-system/src/atoms/ConfirmDialog.tsx` — shared confirm dialog (Radix-based)
  - `apps/reception/src/app/globals.css` — `@config "../../../../tailwind.config.mjs"` + base token imports + bridge vars
  - `apps/reception/src/constants/colors.ts` — local dark palette values (`darkBg: '#000000'`, `darkSurface: '#333333'`, etc.)
  - `eslint.config.mjs` — Reception overrides at lines 1472-1484 and 2173-2188
- Patterns to follow:
  - ESLint progressive re-enablement: `cover-me-pretty` pattern (downgrade to "warn" first, then "error")
  - Theme provider wrapping: `ThemeProvider` → `PlatformThemeProvider` → `ThemeModeProvider` composition
  - Token bridging: existing `globals.css` bridge pattern (`--reception-signal-*` → `--hospitality-*`)

## Proposed Approach
- **Option A: Extend shared provider + progressive migration** (Chosen)
  - Wrap shared `ThemeProvider` with `ReceptionThemeProvider` that adds Firebase sync, per-user storage, and body class mirroring.
  - Migrate dialog consumers to shared `ConfirmDialog` (only 2 call sites).
  - Define token bridge mapping dark palette → shared semantic tokens.
  - Pilot migrate one feature area, then checkpoint before broader rollout.
  - Re-enable DS lint rules per directory as areas are migrated.
- **Option B: Fork and gradually converge**
  - Keep DarkModeContext as-is, gradually migrate consumers.
  - Risk: divergence from shared infrastructure grows over time.
- **Chosen: A** because it aligns with platform direction and the blast radius for foundation work is small (2 theme consumers, 2 dialog consumers, 0 mounted dialog provider).

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | INVESTIGATE | Validate dark palette Tailwind color registration | 85% | S | Completed | - | TASK-06 |
| TASK-02 | IMPLEMENT | Enable Reception test runner | 85% | S | Completed | - | CHECKPOINT |
| TASK-03 | IMPLEMENT | Create ReceptionThemeProvider adapter | 80% | M | Completed | - | TASK-04 |
| TASK-04 | IMPLEMENT | Migrate theme consumers + retire DarkModeContext | 82% | S | Completed | TASK-03 | CHECKPOINT |
| TASK-05 | IMPLEMENT | Migrate dialog consumers + retire DialogContext | 85% | S | Completed | - | CHECKPOINT |
| TASK-06 | IMPLEMENT | Define Reception semantic token bridge | 78% ⚠️ | M | Completed | TASK-01 | TASK-07 |
| TASK-07 | CHECKPOINT | Reassess remaining plan after foundation phase | 95% | S | Completed | TASK-02, TASK-04, TASK-05, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Pilot color token migration on common components | 70% ⚠️ | M | Completed | TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Re-enable DS lint rules for migrated directories | 82% | S | Completed | TASK-08 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-03, TASK-05 | - | Independent foundation; TASK-01 is INVESTIGATE (unblocks TASK-06) |
| 2 | TASK-04, TASK-06 | W1: TASK-03, TASK-01 | TASK-04 needs provider adapter; TASK-06 needs color investigation |
| 3 | TASK-07 (CHECKPOINT) | W1: TASK-02, TASK-05; W2: TASK-04, TASK-06 | Foundation gate — reassess before pilot |
| 4 | TASK-08 | W2: TASK-06; W3: TASK-07 | Pilot color migration (post-checkpoint) |
| 5 | TASK-09 | W4: TASK-08 | Lint re-enablement for migrated dirs |

**Max parallelism:** 4 (Wave 1)
**Critical path:** TASK-03 → TASK-04 → TASK-07 → TASK-08 → TASK-09 (5 waves)
**Total tasks:** 9
**Auto-continue boundary:** CHECKPOINT at Wave 3 — build pauses for re-assessment

## Tasks

### TASK-01: Validate dark palette Tailwind color registration
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact — confirm whether `dark:bg-darkSurface`, `dark:text-darkAccentGreen`, etc. generate valid CSS, and document the registration mechanism.
- **Execution-Skill:** build-feature
- **Affects:** `[readonly] apps/reception/src/app/globals.css`, `[readonly] apps/reception/src/constants/colors.ts`, `[readonly] tailwind.config.mjs`, `[readonly] packages/tailwind-config/src/index.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — straightforward: build CSS and inspect output
  - Approach: 95% — only way to know is to test the actual build
  - Impact: 70% — findings may reshape token bridge approach significantly
- **Blockers / questions to answer:**
  - Are dark palette colors (`darkSurface`, `darkBg`, `darkAccentGreen`, `darkAccentOrange`) registered as valid Tailwind theme colors? How?
  - Does `dark:bg-darkSurface` produce any CSS in the current build? Or are these dead classes?
  - The test at `test/unit/__tests__/tailwind-build.spec.ts:79` references non-existent `apps/reception/tailwind.config.mjs` — is this test passing or broken?
  - Do the `theme('colors.darkSurface')` calls in `roomgrid/*.css` resolve correctly?
- **Acceptance:**
  - Built Reception CSS analyzed for dark palette utility presence
  - Color registration mechanism documented (or absence confirmed)
  - Impact on token bridge task (TASK-06) documented: additive bridge vs replacement strategy
  - Tailwind build test status verified (passing/failing/skipped)
- **Notes / references:**
  - `apps/reception/src/constants/colors.ts` — local palette definitions
  - `apps/reception/src/components/roomgrid/rvg.css:20-28` — `theme('colors.darkSurface')` usage
  - `test/unit/__tests__/tailwind-build.spec.ts:73-80` — build test referencing missing config
  - Dark palette used in 185+ files across Reception

### TASK-02: Enable Reception test runner
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/package.json` test script + CI validation
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/package.json`
- **Depends on:** -
- **Blocks:** TASK-07 (CHECKPOINT)
- **Confidence:** 85%
  - Implementation: 90% — replace stub with `jest --ci --passWithNoTests`, config already exists
  - Approach: 95% — standard pattern used across all other apps
  - Impact: 85% — may surface pre-existing test failures across 319 test files, but `--passWithNoTests` ensures empty runs don't fail
- **Acceptance:**
  - `pnpm --filter @apps/reception test` executes Jest (not stub echo)
  - Jest config is correctly loaded (`apps/reception/jest.config.cjs`)
  - At least the existing theme bridge and dark mode context tests pass
  - CI pipeline executes the new test command without failure
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/reception test` → exits 0, Jest output shown (not echo stub)
  - TC-02: `apps/reception/src/app/__tests__/theme-bridge.test.tsx` → passes
  - TC-03: `apps/reception/src/context/__tests__/DarkModeContext.test.tsx` → passes
  - TC-04: Run with `--listTests` → shows 319 test files discovered
  - **Acceptance coverage:** TC-01 covers "executes Jest", TC-02-03 cover "existing tests pass", TC-04 covers "config correctly loaded"
  - **Validation type:** unit
  - **Validation location:** `apps/reception/package.json`, `apps/reception/jest.config.cjs`
  - **Run/verify:** `pnpm --filter @apps/reception test -- --ci`
- **Execution plan:** Red → Green → Refactor
  1. Red: verify stub script, confirm tests don't currently run
  2. Green: replace stub with `jest --ci --passWithNoTests`, run tests, fix any failures
  3. Refactor: ensure jest config is clean, no unnecessary overrides
- **Scouts:**
  - Jest config loads correctly → doc lookup (`apps/reception/jest.config.cjs` imports shared preset) → confirmed
  - 319 test files exist → glob scan → confirmed
  - Shared jest preset compatible → read `packages/config/jest.preset.cjs` → confirmed (sets up jsdom, ts-jest, module mappers)
- **Planning validation:**
  - Tests run: N/A (stub script — this task enables them)
  - Unexpected findings: stub script means 319 test files have NOT been run in CI — some may have bitrotted
- **What would make this ≥90%:**
  - Run the full test suite locally and document pass/fail count before committing the change
- **Rollout / rollback:**
  - Rollout: direct replacement of stub script
  - Rollback: revert to stub if too many test failures block CI (add `|| true` as temporary measure if needed)
- **Documentation impact:** None
- **Notes / references:**
  - Current stub: `"test": "echo 'Reception tests temporarily skipped to unblock CI' && exit 0"`
  - Jest config: `apps/reception/jest.config.cjs`
  - Shared preset: `packages/config/jest.preset.cjs`

### TASK-03: Create ReceptionThemeProvider adapter
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/providers/ReceptionThemeProvider.tsx` (new) + adapter hook
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/providers/ReceptionThemeProvider.tsx` (new), `[readonly] packages/platform-core/src/contexts/ThemeModeContext.tsx`, `[readonly] packages/ui/src/providers/ThemeProvider.tsx`, `[readonly] apps/reception/src/context/DarkModeContext.tsx`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% — clear pattern (wrap shared provider), DarkModeContext test as reference, but Firebase sync layer adds complexity
  - Approach: 85% — extending shared provider is best long-term; avoids forking or coupling platform-core to Firebase
  - Impact: 80% — `body.dark` usage limited to `globals.css` rule, localStorage key migration has fallback strategy, no downstream consumers yet
- **Acceptance:**
  - `ReceptionThemeProvider` wraps shared `ThemeProvider` (from `@acme/ui`)
  - Firebase preference sync: reads `userPrefs/{userName}` on user login, writes on mode change
  - Per-user localStorage: reads/writes `darkMode:user:{userName}` key, falls back to global `darkMode` key
  - Legacy localStorage migration: reads old `"darkMode"` (JSON) key and maps to new format
  - Body class mirroring: applies `.dark` and `.theme-dark` to `document.body` in sync with `html`
  - `data-theme` attribute set on body for backward compat
  - `useReceptionTheme()` hook exports: `{ dark: boolean, mode, toggleDark, setMode, isDark, resolvedMode }`
- **Validation contract:**
  - TC-01: Provider renders children and applies theme class to html → dark/light toggle works
  - TC-02: `useReceptionTheme().toggleDark()` → mode flips, class updates on html AND body
  - TC-03: On user login, loads preference from per-user localStorage key → applies mode
  - TC-04: On mode change, writes to Firebase `userPrefs/{userName}` → verified via mock
  - TC-05: Legacy migration: `localStorage.setItem("darkMode", "true")` → resolves to `mode: "dark"`
  - TC-06: `body.dark` and `body[data-theme]` stay in sync with html → CSS `color-scheme: dark` applies
  - TC-07: Multi-tab sync via `storage` event → mode updates across tabs
  - **Acceptance coverage:** TC-01-02 cover toggle behavior, TC-03-04 cover persistence, TC-05 covers migration, TC-06 covers body sync, TC-07 covers multi-tab
  - **Validation type:** unit + integration
  - **Validation location:** `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx` (new)
  - **Run/verify:** `pnpm --filter @apps/reception test -- ReceptionThemeProvider`
- **Execution plan:** Red → Green → Refactor
  1. Red: write test file with TC-01 through TC-07, verify they fail
  2. Green: implement ReceptionThemeProvider and useReceptionTheme hook
  3. Refactor: clean up, ensure hook API is minimal and well-typed
- **Scouts:**
  - Shared ThemeProvider API compatible → read `packages/ui/src/providers/ThemeProvider.tsx` → confirmed (exports `ThemeContext` with `mode`, `setMode`, `isDark`, `resolvedMode`)
  - Firebase contract stable → read DarkModeContext test → confirmed (`userPrefs/{userName}` path with `themeMode` and `darkMode` fields)
  - `body.dark` selector usage → grep globals.css → confirmed (only `html.dark, body.dark { color-scheme: dark; }`)
- **Planning validation:**
  - Tests run: existing DarkModeContext tests document current behavior (5+ test cases covering toggle, localStorage, Firebase sync)
  - Unexpected findings: shared ThemeProvider uses `useLayoutEffect` (sync) while DarkModeContext uses `useEffect` (async) — adapter should preserve `useLayoutEffect` for class application
- **What would make this ≥90%:**
  - Complete one-pass implementation and see all TCs green locally before merging
- **Rollout / rollback:**
  - Rollout: new file, no existing code modified — zero risk until TASK-04 wires it in
  - Rollback: delete new file
- **Documentation impact:** None
- **Notes / references:**
  - DarkModeContext consumers: `DarkModeToggle.tsx`, `Login.tsx` (migrated in TASK-04)
  - API gap table documented in fact-find evidence audit

### TASK-04: Migrate theme consumers + retire DarkModeContext
- **Type:** IMPLEMENT
- **Deliverable:** code-change — update 3 files (`Providers.tsx`, `DarkModeToggle.tsx`, `Login.tsx`), delete `DarkModeContext.tsx`
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/components/Providers.tsx`, `apps/reception/src/components/common/DarkModeToggle.tsx`, `apps/reception/src/components/Login.tsx`, `apps/reception/src/context/DarkModeContext.tsx` (delete)
- **Depends on:** TASK-03
- **Blocks:** TASK-07 (CHECKPOINT)
- **Confidence:** 82%
  - Implementation: 85% — only 2 consumers + 1 provider swap, API compatibility shim defined
  - Approach: 88% — aligns with shared platform direction, reduces app-local surface
  - Impact: 82% — isolated to 3 files + 1 deletion; existing DarkModeContext test validates current behavior to protect against regressions
- **Acceptance:**
  - `Providers.tsx` wraps app with `ReceptionThemeProvider` instead of `DarkModeProvider`
  - `DarkModeToggle.tsx` uses `useReceptionTheme()` hook — `{ dark, toggleDark }` API preserved
  - `Login.tsx` uses `useReceptionTheme()` hook — `{ toggleDark, dark }` API preserved
  - `DarkModeContext.tsx` deleted (all consumers migrated)
  - Existing `DarkModeContext.test.tsx` updated to test new provider or replaced
  - Dark mode toggle works in login screen AND authenticated app
  - Theme preference persists across page reload
- **Validation contract:**
  - TC-01: Dark mode toggle in authenticated app → `useReceptionTheme().toggleDark()` works, classes update
  - TC-02: Dark mode toggle on login screen → Login.tsx toggle works before auth
  - TC-03: Provider swap in `Providers.tsx` → app renders correctly, no console errors
  - TC-04: Page reload → theme preference persisted and restored
  - TC-05: No remaining imports of `DarkModeContext` or `useDarkMode` → grep confirms deletion complete
  - **Acceptance coverage:** TC-01-02 cover consumer migration, TC-03 covers provider swap, TC-04 covers persistence, TC-05 covers cleanup
  - **Validation type:** unit + integration
  - **Validation location:** Updated `apps/reception/src/context/__tests__/DarkModeContext.test.tsx` → migrated to `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx`
  - **Run/verify:** `pnpm --filter @apps/reception test -- ReceptionTheme`
- **Execution plan:** Red → Green → Refactor
  1. Red: update DarkModeContext tests to import from new provider, verify they fail with old provider still in place
  2. Green: swap providers, update consumers, verify tests pass
  3. Refactor: delete DarkModeContext, clean up imports, verify no dead references
- **Planning validation:**
  - Tests run: `DarkModeContext.test.tsx` passes (covers toggle, localStorage, Firebase sync behaviors)
  - Unexpected findings: None — straightforward consumer migration
- **Rollout / rollback:**
  - Rollout: swap provider + update 2 consumers in single commit
  - Rollback: revert commit restores DarkModeContext
- **Documentation impact:** None
- **Notes / references:**
  - API shim: `{ dark: isDark, toggleDark: () => setMode(isDark ? "light" : "dark") }`

### TASK-05: Migrate dialog consumers + retire DialogContext
- **Type:** IMPLEMENT
- **Deliverable:** code-change — update 2 files, delete 4 files (DialogContext, AlertModal, ConfirmModal, ConfirmCancelModal)
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`, `apps/reception/src/components/checkins/docInsert/DOBSection.tsx`, `apps/reception/src/context/DialogContext.tsx` (delete), `apps/reception/src/components/common/ConfirmModal.tsx` (delete), `apps/reception/src/components/common/AlertModal.tsx` (delete)
- **Depends on:** -
- **Blocks:** TASK-07 (CHECKPOINT)
- **Confidence:** 85%
  - Implementation: 88% — 2 call sites, shared `ConfirmDialog` exists with compatible API, DialogProvider was never mounted anyway
  - Approach: 90% — design system alignment, removes dead/non-functional code
  - Impact: 85% — 2 call sites, removing code that currently throws (`useDialog must be used inside a DialogProvider`)
- **Acceptance:**
  - `BookingDetailsModal.tsx` uses shared `ConfirmDialog` (controlled component pattern) instead of `useDialog().showConfirm`
  - `DOBSection.tsx` uses shared `ConfirmDialog` instead of `useDialog().showConfirm`
  - `DialogContext.tsx`, `AlertModal.tsx`, `ConfirmModal.tsx` deleted
  - `ConfirmCancelModal.tsx` evaluated — if only used via DialogContext, also delete
  - No remaining imports of `DialogContext`, `useDialog`, `AlertModal`, or `ConfirmModal`
  - Confirm actions in both call sites work correctly (move guests, override date)
- **Validation contract:**
  - TC-01: `BookingDetailsModal` — confirm dialog opens, "Move" action completes guest move
  - TC-02: `BookingDetailsModal` — cancel dialog → no action taken
  - TC-03: `DOBSection` — confirm override dialog opens, "Override" action applies
  - TC-04: `DOBSection` — cancel override → date unchanged
  - TC-05: No remaining imports of `DialogContext` / `useDialog` → grep confirms
  - **Acceptance coverage:** TC-01-04 cover functional migration, TC-05 covers cleanup
  - **Validation type:** unit
  - **Validation location:** Existing or new test files for BookingDetailsModal and DOBSection
  - **Run/verify:** `pnpm --filter @apps/reception test -- BookingDetailsModal DOBSection`
- **Execution plan:** Red → Green → Refactor
  1. Red: write tests for confirm behavior in both components, verify they fail (useDialog throws since DialogProvider was never mounted)
  2. Green: replace with shared `ConfirmDialog` controlled component pattern
  3. Refactor: delete DialogContext, AlertModal, ConfirmModal, clean up imports
- **Scouts:**
  - DialogProvider not mounted → grep for `DialogProvider` in Providers.tsx / App.tsx → confirmed: NOT in component tree
  - Shared ConfirmDialog API → read `packages/design-system/src/atoms/ConfirmDialog.tsx` → confirmed: `{ open, onOpenChange, title, description, confirmLabel, cancelLabel, onConfirm, variant }`
  - `ConfirmCancelModal` usage → grep → only imported in `search/` area, uses `SimpleModal` directly → evaluate separately
- **Planning validation:**
  - Tests run: N/A (tests would throw due to missing DialogProvider — confirms current code is non-functional)
  - Unexpected findings: DialogProvider is never mounted, so `useDialog()` currently throws. This means the confirm flows in BookingDetailsModal and DOBSection are broken in production.
- **Rollout / rollback:**
  - Rollout: fix broken functionality by migrating to working shared component
  - Rollback: revert commit (but old code was broken anyway)
- **Documentation impact:** None
- **Notes / references:**
  - Pattern change: Promise-based `await showConfirm()` → controlled `<ConfirmDialog open={...} />`
  - Must add local state management for dialog open/close in each consumer

### TASK-06: Define Reception semantic token bridge
- **Type:** IMPLEMENT
- **Deliverable:** code-change — CSS token bridge in `globals.css` + documentation of color mapping
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/app/globals.css`, `apps/reception/src/constants/colors.ts`, `[readonly] packages/tailwind-config/src/index.ts`, `[readonly] packages/themes/base/tokens.css`
- **Depends on:** TASK-01
- **Blocks:** TASK-07 (CHECKPOINT), TASK-08
- **Confidence:** 78% ⚠️
  - Implementation: 80% — bridge pattern exists in globals.css already (`--reception-signal-*`), but dark palette registration mechanism is unclear
  - Approach: 82% — additive mapping (add semantic aliases, preserve old names) is safest
  - Impact: 78% — touches Tailwind color resolution which affects all 185+ files using dark palette classes
- **Acceptance:**
  - Dark palette colors mapped to shared semantic tokens in globals.css (additive — old class names continue working)
  - Mapping documented: `darkBg` → `bg` dark variant, `darkSurface` → `surface-2` dark variant, `darkAccentGreen` → `success` or custom hospitality token, `darkAccentOrange` → `warning` or custom hospitality token
  - New semantic class names available: e.g., `bg-surface-dark`, `text-accent-hospitality`
  - Existing `dark:bg-darkSurface` classes continue to resolve (no breakage)
  - Color mapping rationale documented in plan Decision Log
- **Validation contract:**
  - TC-01: New semantic tokens produce correct CSS output → build CSS and verify
  - TC-02: Old dark palette classes still resolve → build CSS and verify backward compat
  - TC-03: Theme bridge test updated to assert new token presence
  - TC-04: No visual regression in dark mode — dark palette values map to equivalent shared token values
  - **Acceptance coverage:** TC-01-02 cover build validation, TC-03 covers test coverage, TC-04 covers visual regression
  - **Validation type:** unit + integration (CSS build)
  - **Validation location:** `apps/reception/src/app/__tests__/theme-bridge.test.tsx` (updated)
  - **Run/verify:** `pnpm --filter @apps/reception test -- theme-bridge`
- **Execution plan:** Red → Green → Refactor
  1. Red: add assertions for new semantic tokens in theme-bridge test, verify they fail
  2. Green: add CSS custom property mappings in globals.css
  3. Refactor: document mapping rationale, update colors.ts with deprecation comments
- **Scouts:**
  - Dark palette registration → TASK-01 investigation (prerequisite) → pending
  - Shared token equivalents → read `packages/themes/base/tokens.css` → confirmed (surface tokens, status colors, semantic colors exist)
  - Existing bridge pattern → read `globals.css` → confirmed (`--reception-signal-*` → `--hospitality-*` bridge at lines 9-15)
- **Planning validation:**
  - Tests run: `theme-bridge.test.tsx` passes (tests base token import + hospitality aliases)
  - Unexpected findings: dark palette color registration mechanism unclear — blocks confidence above 78% until TASK-01 resolves
- **What would make this ≥90%:**
  - TASK-01 confirms color registration mechanism
  - Complete color equivalence mapping verified (hex values compared)
  - Theme bridge test extended with dark mode token assertions
- **Rollout / rollback:**
  - Rollout: additive CSS changes — old classes preserved, new aliases added
  - Rollback: revert CSS additions
- **Documentation impact:** None (mapping documented in plan Decision Log)
- **Notes / references:**
  - `globals.css:9-15` — existing bridge pattern
  - `constants/colors.ts` — current hex values: `darkBg: '#000000'`, `darkSurface: '#333333'`, `darkAccentGreen: '#a8dba8'`, `darkAccentOrange: '#ffd89e'`

### TASK-07: Horizon checkpoint — reassess remaining plan
- **Type:** CHECKPOINT
- **Depends on:** TASK-02, TASK-04, TASK-05, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
- **Acceptance:**
  - Run `/re-plan` on TASK-08 and TASK-09
  - Reassess confidence using evidence from completed foundation tasks
  - Confirm token bridge works and pilot migration approach is valid
  - Update plan with any new findings, splits, or abandoned tasks
- **Horizon assumptions to validate:**
  - Color token registration mechanism is understood (from TASK-01) and bridge is functional (from TASK-06)
  - Test runner is working and baseline test pass rate is known (from TASK-02)
  - Theme provider migration was successful and pattern is proven (from TASK-03/04)
  - Dialog migration was clean and shared ConfirmDialog works in Reception context (from TASK-05)

### TASK-08: Pilot color token migration on common components
- **Type:** IMPLEMENT
- **Deliverable:** code-change — migrate one small component area from raw dark palette classes to semantic tokens
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/components/common/DarkModeToggle.tsx`, `apps/reception/src/components/dashboard/ReceptionDashboard.tsx`, `apps/reception/src/components/dashboard/DashboardMetrics.tsx` (candidate files — confirmed at checkpoint)
- **Depends on:** TASK-06, TASK-07 (CHECKPOINT)
- **Blocks:** TASK-09
- **Confidence:** 70% ⚠️
  - Implementation: 75% — recipe not yet proven; depends on TASK-01/06 findings
  - Approach: 80% — token substitution is mechanical, but semantic mapping may require per-component decisions
  - Impact: 70% — pilot scope is small but establishes the repeatable pattern for 185 files
- **Acceptance:**
  - Selected pilot components use semantic token classes instead of raw dark palette classes
  - No visual regression in light or dark mode
  - Repeatable migration recipe documented (search/replace patterns, decision criteria for ambiguous mappings)
  - Lint violations reduced in pilot directory
- **Validation contract:**
  - TC-01: Pilot components render correctly in light mode → visual match
  - TC-02: Pilot components render correctly in dark mode → visual match with semantic tokens
  - TC-03: DS lint rules pass on pilot components (subset of rules enabled)
  - TC-04: Migration recipe documented with concrete search/replace patterns
  - **Acceptance coverage:** TC-01-02 cover visual regression, TC-03 covers lint compliance, TC-04 covers recipe documentation
  - **Validation type:** unit + visual
  - **Validation location:** Component test files for pilot area
  - **Run/verify:** `pnpm --filter @apps/reception test -- Dashboard` + manual dark mode verification
- **Execution plan:** Red → Green → Refactor
  1. Red: add assertions for semantic token classes in component tests
  2. Green: replace raw dark palette classes with semantic token classes
  3. Refactor: remove unused color constant imports, update CSS as needed
- **What would make this ≥90%:**
  - TASK-06 complete with verified token bridge
  - TASK-01 fully resolves color registration
  - One component fully migrated and visually verified end-to-end
- **Rollout / rollback:**
  - Rollout: per-component, isolated changes
  - Rollback: revert to raw dark palette classes
- **Documentation impact:** Migration recipe documented as inline plan update or separate doc
- **Notes / references:**
  - Candidate pilot area: `components/common/` and `components/dashboard/` — smaller files, already partially using shared components

### TASK-09: Re-enable DS lint rules for migrated directories
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `eslint.config.mjs` directory-scoped override for migrated area
- **Execution-Skill:** build-feature
- **Affects:** `eslint.config.mjs`
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — pattern well-documented from other apps (`cover-me-pretty` downgrade-to-warn pattern)
  - Approach: 90% — progressive re-enablement is the standard DS migration approach
  - Impact: 82% — directory-scoped, only affects migrated files; lint failures would be caught in CI
- **Acceptance:**
  - New ESLint override block AFTER Reception override (line 2188+) targets migrated directories
  - Migrated directories have DS token rules enabled (at minimum: `ds/no-raw-color`, `ds/no-raw-font`, `ds/no-raw-tailwind-color`)
  - Initial severity: "warn" for migrated areas (can escalate to "error" after validation)
  - `pnpm --filter @apps/reception lint` passes without new errors in migrated area
  - Non-migrated areas still have `offAllDsRules` (no false positives)
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/reception lint` → passes (no new errors)
  - TC-02: Intentionally add raw color in migrated area → lint warns/errors
  - TC-03: Raw color in non-migrated area → no lint warning (rules still off)
  - TC-04: ESLint config order correct → new override appears AFTER line 2188
  - **Acceptance coverage:** TC-01 covers no regression, TC-02 covers enforcement, TC-03 covers isolation, TC-04 covers config correctness
  - **Validation type:** integration (lint)
  - **Validation location:** `eslint.config.mjs`
  - **Run/verify:** `pnpm --filter @apps/reception lint`
- **Execution plan:** Red → Green → Refactor
  1. Red: verify raw color class in migrated area is NOT caught by linter
  2. Green: add new ESLint override block, verify lint catches raw colors in migrated area
  3. Refactor: ensure override is clean and documented
- **Scouts:**
  - ESLint flat config order → read `eslint.config.mjs` → confirmed (later rules override earlier; new override after line 2188 takes precedence for targeted paths)
  - cover-me-pretty pattern → lines 786-802 → confirmed (downgrade to "warn" pattern)
- **Planning validation:**
  - Tests run: `pnpm --filter @apps/reception lint` passes currently (all DS rules off)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: single config change, CI validates
  - Rollback: remove override block
- **Documentation impact:** None
- **Notes / references:**
  - ESLint Reception overrides: lines 1472-1484, 2173-2188
  - Target rules for first slice: `ds/no-raw-color`, `ds/no-raw-font`, `ds/no-raw-tailwind-color`

## Risks & Mitigations
- **Dark palette colors may not generate valid CSS:** TASK-01 investigates this first. If colors are dead, migration is simpler but dark mode may be visually degraded today. Mitigation: investigate before planning token bridge.
- **319 test files may be broken after enabling test runner:** Many tests may have bitrotted since the stub was introduced. Mitigation: use `--passWithNoTests`, triage failures in a follow-up if needed (not blocking for this plan).
- **Firebase sync regression:** Theme preference persistence could break if adapter doesn't match exact DarkModeContext behavior. Mitigation: TC-03/TC-04 in TASK-03 explicitly test Firebase sync paths.
- **Body class selector dependency:** Components may depend on `body.dark` selector. Mitigation: body class mirroring in ReceptionThemeProvider + grep confirmed only `globals.css` uses `body.dark`.
- **DialogContext migration may reveal other broken flows:** If DialogProvider was never mounted, other components might also try to use it. Mitigation: grep confirms only 2 call sites.

## Observability
- Logging: theme provider logs mode changes in development (matches existing DarkModeContext behavior)
- Metrics: DS lint violation count per directory (tracked via `pnpm --filter @apps/reception lint` output)
- Alerts/Dashboards: N/A (internal tooling)

## Acceptance Criteria (overall)
- [x] Reception uses shared theme/provider stack for dark-mode semantics
- [x] Dialog consumers migrated to shared `ConfirmDialog` with passing tests
- [x] Reception test runner executes real tests (not stub)
- [x] Semantic token bridge defined and backward-compatible
- [x] At least one component area migrated from raw dark palette to semantic tokens
- [x] DS lint rules re-enabled for migrated directories
- [x] No regressions in login, dark mode toggle, or modal workflows

## Decision Log
- 2026-02-10: Chose Option A (extend shared provider + progressive migration) over Option B (fork and converge) — shared provider is stable, only 2 consumers to migrate, and adapter pattern isolates Firebase coupling at app level.
- 2026-02-10: DialogProvider was never mounted — dialog migration is both a cleanup and a bug fix (useDialog() would throw in production).
- 2026-02-10: Dark palette color registration mechanism unclear — added TASK-01 as prerequisite investigation before token bridge work. Test at `tailwind-build.spec.ts:73-80` references non-existent `apps/reception/tailwind.config.mjs`.
- 2026-02-10: Implementation completed across TASK-01 through TASK-09 with validation green on targeted Reception tests, `@apps/reception` typecheck/lint, and `test/unit/__tests__/tailwind-build.spec.ts`.
