---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-remove-light-mode
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception: Remove Light Mode Plan

## Summary

Remove all light-mode toggle machinery from `apps/reception`. The provider chain currently carries 352 lines of Firebase-sync, localStorage, and toggle logic that is entirely unused in practice — the app always defaults to dark mode. The work deletes `DarkModeToggle.tsx`, strips toggle props from `Login.tsx` and `AuthenticatedApp.tsx`, replaces `ReceptionThemeProvider.tsx` with a 15-line dark-mode-only wrapper, hardens `layout.tsx` with SSR-safe dark classes, and updates all affected tests. All 7 tasks are S/M effort with ≥90% confidence. No feature flag, no data migration, rollback is a git revert.

## Active tasks

- [x] TASK-01: Strip toggle props from Login.tsx
- [x] TASK-02: Remove DarkModeToggle render from AuthenticatedApp.tsx
- [x] TASK-03: Delete DarkModeToggle.tsx
- [x] TASK-04: Simplify ReceptionThemeProvider.tsx to dark-only wrapper
- [x] TASK-05: Harden layout.tsx with SSR dark-mode classes and metadata
- [x] TASK-06: Rewrite ReceptionThemeProvider.test.tsx for dark-only provider
- [x] TASK-07: Update login parity test and regenerate snapshot

## Goals

- Force permanent dark mode — no user-facing toggle exists anywhere in the app
- Delete `DarkModeToggle.tsx`
- Simplify `ReceptionThemeProvider.tsx` from 352 lines to ~15 (no Firebase, no localStorage, no toggle)
- Update `layout.tsx`: `<html class="theme-dark dark">`, `<meta name="color-scheme" content="dark">`, simplified themeColor
- Pass `pnpm --filter reception typecheck` and `pnpm --filter reception test` on CI

## Non-goals

- Deleting light-variant token values from `packages/themes/reception/tokens.css`
- Firebase `userPrefs/{user}/themeMode` data migration
- Pruning category shade family CSS vars from `globals.css @theme` block
- Changes to `@acme/ui` or `@acme/platform-core` ThemeProvider internals

## Constraints & Assumptions

- Constraints:
  - `<ThemeProvider>` from `@acme/ui/providers/ThemeProvider` MUST remain mounted — DS components depend on it
  - `html.theme-dark` class is the CSS dark-mode trigger (`packages/themes/base/tokens.static.css:299`) — must always be present
  - Zero `dark:` Tailwind variant classes in production TSX — confirmed; dark mode is CSS-custom-property-based only
  - `suppressHydrationWarning` stays on `<html>` — valid for SSR/CSR class differences
- Assumptions:
  - `ThemeModeProvider` initialises to `readStoredMode() ?? "system"` (confirmed from source). Calling `setMode("dark")` in `useLayoutEffect` on mount permanently forces dark. After first mount, `THEME_MODE_KEY` is written to localStorage, so subsequent loads initialise directly to `"dark"`.
  - Hardcoding `theme-dark dark` in SSR `<html>` prevents flash-of-light before hydration fires.
  - **Why `DarkModeBridge` is needed even with the hardcoded layout.tsx class:** `ThemeModeProvider` reads `readStoredMode() ?? "system"` on init. If no stored value exists (first-time user) and system preference is light, `ThemeModeProvider`'s `useLayoutEffect` will overwrite the hardcoded `theme-dark` class with light-mode classes during hydration. `DarkModeBridge` calling `setMode("dark")` runs in the same hydration phase and permanently overrides this, writing `"dark"` to localStorage so all subsequent loads start correctly.

## Inherited Outcome Contract

- **Why:** Reception app staff operate exclusively in dark mode. The toggle adds dead code weight, Firebase writes, and UI chrome that creates confusion.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All light-mode toggle UI removed; app renders exclusively in dark mode; TypeScript and all tests pass on CI.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-remove-light-mode/fact-find.md`
- Key findings used:
  - `useReceptionTheme` has exactly 2 production consumers: `Login.tsx` and `DarkModeToggle.tsx`
  - `ThemeModeProvider` has no `defaultMode` prop; uses `setMode("dark")` in `useLayoutEffect`
  - `html.theme-dark` at `tokens.static.css:299` is the CSS trigger — no Tailwind `dark:` variant usage
  - All 6 provider tests and 3 parity test assertions become extinct

## Proposed Approach

- Option A (consumers-first, incremental): Strip consumers (`Login.tsx`, `AuthenticatedApp.tsx`) first so `useReceptionTheme` has zero callers, then simplify the provider and delete the toggle.
- Option B (provider-first with stub): Simplify provider but keep `useReceptionTheme` as a stub returning `{ dark: true, toggleDark: noop }`, then remove stub after consumers cleaned.
- **Chosen approach:** Option A — consumers first. Each task produces a green CI commit. No stub needed; the provider simplification happens in TASK-04 after TASK-01 and TASK-03 have removed all consumers. This is the safer incremental path.

## Plan Gates

- Foundation Gate: **Pass** — Deliverable-Type, Execution-Track, Primary-Execution-Skill present; Delivery-Readiness 88%; test landscape and testability documented.
- Sequenced: **Yes** — topological order enforced; Wave 1 tasks are independent, each downstream task has explicit depends-on.
- Edge-case review complete: **Yes** — SSR flash risk addressed by layout.tsx hardening; ThemeModeContext fight addressed by setMode("dark") on mount; snapshot mismatch addressed in TASK-07 acceptance.
- Auto-build eligible: **Yes** — all IMPLEMENT tasks ≥90% confidence, no blocking DECISION tasks, no unresolved inputs.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Strip toggle props from Login.tsx | 91% | S | Pending | — | TASK-07 |
| TASK-02 | IMPLEMENT | Remove DarkModeToggle render from AuthenticatedApp | 95% | S | Pending | — | TASK-03 |
| TASK-03 | IMPLEMENT | Delete DarkModeToggle.tsx | 95% | S | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Simplify ReceptionThemeProvider to dark-only wrapper | 90% | M | Pending | TASK-01, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Harden layout.tsx with SSR dark-mode classes | 92% | S | Pending | — | — |
| TASK-06 | IMPLEMENT | Rewrite ReceptionThemeProvider.test.tsx | 90% | S | Pending | TASK-04 | — |
| TASK-07 | IMPLEMENT | Update login parity test + regenerate snapshot | 91% | S | Pending | TASK-01 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-05 | — | Fully independent; can run in parallel |
| 2 | TASK-03, TASK-07 | TASK-01 (for TASK-07), TASK-02 (for TASK-03) | TASK-03 depends on TASK-02 only |
| 3 | TASK-04 | TASK-01 + TASK-03 complete | Provider simplification; safe once all useReceptionTheme consumers gone |
| 4 | TASK-06 | TASK-04 | Provider test rewrite |

## Tasks

---

### TASK-01: Strip toggle props from Login.tsx

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/Login.tsx` — `useReceptionTheme` import and all toggle machinery removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/Login.tsx`
  - `[readonly] apps/reception/src/providers/ReceptionThemeProvider.tsx`
- **Depends on:** —
- **Blocks:** TASK-07
- **Confidence:** 91%
  - Implementation: 92% — exact lines identified (L129, L303, L375, L418, L471, L583–596); `LoginContainer` props and toggle JSX are isolated
  - Approach: 90% — remove import + destructuring + prop thread; no architectural change
  - Impact: 91% — self-contained in Login.tsx; parity test depends on result (TASK-07)
- **Acceptance:**
  - `import { useReceptionTheme }` removed from Login.tsx
  - `toggleDark` and `dark` not referenced anywhere in Login.tsx
  - `LoginContainer` no longer accepts `dark` or `toggleDark` props
  - Theme toggle SVG button removed from `LoginContainer` JSX
  - `pnpm --filter reception typecheck` passes for Login.tsx
- **Validation contract (TC-01):**
  - TC-01: Login renders without theme toggle button → no element with aria-label matching `/switch to (dark|light) mode/i`
  - TC-02: Login compiles without `useReceptionTheme` in scope → `pnpm --filter reception typecheck` exits 0
- **Execution plan:** Red → Green → Refactor
  - Red: Note current: Login.tsx L129 destructs `{ toggleDark, dark }` from `useReceptionTheme()`; L303/375/418/471 pass `dark={dark} toggleDark={toggleDark}` to LoginContainer; L583-596 define `LoginContainerProps` with those fields and render the toggle button.
  - Green:
    1. Remove `import { useReceptionTheme } from "../providers/ReceptionThemeProvider"` (L18)
    2. Remove L129 `const { toggleDark, dark } = useReceptionTheme()` destructuring
    3. Remove `dark: boolean` and `toggleDark: () => void` from `LoginContainerProps` interface
    4. Remove `dark={dark} toggleDark={toggleDark}` props from all 4 `<LoginContainer ...>` call sites
    5. Remove the toggle button JSX block inside `LoginContainer` (the `onClick={toggleDark}` button and its SVG icons)
  - Refactor: Remove the two inline SVG icon components (`SunIcon`, `MoonIcon` or equivalent) if they were added solely for the dark mode toggle and are no longer used elsewhere in Login.tsx.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: single file, changes fully mapped at fact-find time`
- **Edge Cases & Hardening:**
  - Login.tsx has 4 `<LoginContainer>` call sites (L303, L375, L418, L471) — all must have the props removed; grep for `toggleDark` after edit to confirm zero remaining occurrences
  - The inline icon comment "Icon components for password visibility toggle and dark mode" (L37) should be simplified to "Icon components for password visibility toggle" if the dark mode icons are removed
- **What would make this ≥90%:** Already at 91%
- **Rollout / rollback:**
  - Rollout: direct commit, no flag
  - Rollback: git revert
- **Documentation impact:** None
- **Notes / references:** `apps/reception/src/parity/__tests__/login-route.parity.test.tsx` mocks `useReceptionTheme` and asserts the toggle button exists — this test updates in TASK-07 after this task.

---

### TASK-02: Remove DarkModeToggle render from AuthenticatedApp.tsx

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/AuthenticatedApp.tsx` — DarkModeToggle import and `<DarkModeToggle />` render removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/AuthenticatedApp.tsx`
  - `[readonly] apps/reception/src/components/common/DarkModeToggle.tsx`
- **Depends on:** —
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 96% — file is 43 lines; change is remove import (L6) + remove `<DarkModeToggle />` (L28); trivial
  - Approach: 95% — one import, one JSX element, no logic
  - Impact: 95% — prerequisite for TASK-03 (file must have zero consumers before deletion)
- **Acceptance:**
  - `import DarkModeToggle` removed from AuthenticatedApp.tsx
  - `<DarkModeToggle />` removed from JSX
  - `pnpm --filter reception typecheck` passes
- **Validation contract (TC-02):**
  - TC-01: AuthenticatedApp renders nav without toggle button
  - TC-02: TypeScript finds no DarkModeToggle reference in AuthenticatedApp → typecheck exits 0
- **Execution plan:** Red → Green → Refactor
  - Red: L6 `import DarkModeToggle from "./common/DarkModeToggle"`, L28 `<DarkModeToggle />` inside `<nav>`.
  - Green: Delete import line; remove `<DarkModeToggle />` from the `<nav>` element.
  - Refactor: The `<nav>` is now empty (no other children). Remove it entirely — an empty `<nav className="mb-4 flex justify-end">` is dead markup with no semantic or visual purpose.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: trivial change`
- **Edge Cases & Hardening:** `None: single import + single JSX element`
- **What would make this ≥90%:** Already at 95%
- **Rollout / rollback:** Direct commit; git revert
- **Documentation impact:** None

---

### TASK-03: Delete DarkModeToggle.tsx

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/common/DarkModeToggle.tsx` deleted
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/common/DarkModeToggle.tsx` (deleted)
  - `[readonly] apps/reception/src/providers/ReceptionThemeProvider.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 96% — file deletion; confirmed only AuthenticatedApp consumed it and TASK-02 removes that
  - Approach: 95% — delete the file; no refactor needed
  - Impact: 95% — unblocks TASK-04 (safe to remove `useReceptionTheme` export once this file is gone)
- **Acceptance:**
  - `apps/reception/src/components/common/DarkModeToggle.tsx` no longer exists
  - `pnpm --filter reception typecheck` exits 0 — no orphan imports
- **Validation contract (TC-03):**
  - TC-01: File does not exist at path → `ls apps/reception/src/components/common/DarkModeToggle.tsx` returns non-zero
  - TC-02: No remaining imports of DarkModeToggle anywhere in `apps/reception/src` → `grep -r "DarkModeToggle" apps/reception/src --include="*.tsx" --include="*.ts"` returns no production files
- **Execution plan:** Red → Green → Refactor
  - Red: File exists at `apps/reception/src/components/common/DarkModeToggle.tsx`, importing `useReceptionTheme`.
  - Green: `rm apps/reception/src/components/common/DarkModeToggle.tsx`
  - Refactor: None.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: prerequisite consumer removal verified in TASK-02`
- **Edge Cases & Hardening:** Confirm no test file imports DarkModeToggle directly (parity test mocks `useReceptionTheme`, not DarkModeToggle — safe).
- **What would make this ≥90%:** Already at 95%
- **Rollout / rollback:** Direct commit; git revert (restores file)
- **Documentation impact:** None

---

### TASK-04: Simplify ReceptionThemeProvider.tsx to dark-only wrapper

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `apps/reception/src/providers/ReceptionThemeProvider.tsx` — 352 lines → ~15 lines; exports only `ReceptionThemeProvider` component
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/providers/ReceptionThemeProvider.tsx`
  - `[readonly] apps/reception/src/components/Providers.tsx`
  - `[readonly] packages/ui/src/providers/ThemeProvider.tsx`
  - `[readonly] packages/platform-core/src/contexts/ThemeModeContext.tsx`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 92% — full API of `ThemeModeContext` confirmed (`setMode` is the correct call); simplified structure is well-defined; `Providers.tsx` mount point is unchanged
  - Approach: 90% — useLayoutEffect + setMode("dark") on mount is the proven path for forcing dark mode without a `defaultMode` prop
  - Impact: 90% — `Providers.tsx` uses `ReceptionThemeProvider` as a wrapper; its interface (`React.FC<React.PropsWithChildren>`) is unchanged; no blast radius
- **Acceptance:**
  - File is ≤25 lines
  - Exports: `ReceptionThemeProvider` (component) only — `useReceptionTheme`, `ReceptionThemeContext`, `ReceptionThemeContextValue` are all removed
  - `<ThemeProvider>` from `@acme/ui/providers/ThemeProvider` is still mounted inside
  - `setMode("dark")` called in `useLayoutEffect` on mount (inside the bridge or directly)
  - No imports of `firebase/database`, `@/context/AuthContext`, or localStorage utilities
  - `pnpm --filter reception typecheck` exits 0
- **Validation contract (TC-04):**
  - TC-01: Provider mounts and children render → smoke test passes in TASK-06
  - TC-02: `html.theme-dark` class present after mount → asserted in TASK-06 smoke test
  - TC-03: No `useReceptionTheme` export → `grep "useReceptionTheme" apps/reception/src/providers/ReceptionThemeProvider.tsx` returns empty
  - TC-04: No firebase/database import → `grep "firebase/database" apps/reception/src/providers/ReceptionThemeProvider.tsx` returns empty
- **Execution plan:** Red → Green → Refactor
  - Red: `ReceptionThemeProvider.tsx` has `ReceptionThemeBridge` (Firebase sync, localStorage, StorageEvent listener, class manipulation), `bootstrapCanonicalMode`, `useReceptionTheme` hook, `ReceptionThemeContext`.
  - Green: Replace the entire file with:
    ```tsx
    "use client";
    import React, { useLayoutEffect } from "react";
    import { ThemeProvider } from "@acme/ui/providers/ThemeProvider";
    import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

    function DarkModeBridge({ children }: { children: React.ReactNode }) {
      const { setMode } = useThemeMode();
      useLayoutEffect(() => {
        setMode("dark");
      }, [setMode]);
      return <>{children}</>;
    }

    export const ReceptionThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
      <ThemeProvider>
        <DarkModeBridge>{children}</DarkModeBridge>
      </ThemeProvider>
    );
    ```
    _Note: `useThemeMode` is exported from `@acme/platform-core/contexts/ThemeModeContext` (confirmed at line 125). Alternatively, use the `useTheme` hook from `@acme/ui/hooks/useTheme` if it surfaces `setMode` — but `useThemeMode` is more direct._
  - Refactor: Verify the import path for `useThemeMode` works in the reception app's module resolution. If `@acme/platform-core/contexts/ThemeModeContext` is not in the reception tsconfig paths, use `@acme/ui/hooks/useTheme` instead (it re-exports the same interface via `ThemeContext`). Check tsconfig paths before writing final import.
- **Planning validation (M effort — consumer tracing):**
  - New output: simplified `ReceptionThemeProvider` component with identical external interface (`React.FC<React.PropsWithChildren>`)
  - Consumer: `apps/reception/src/components/Providers.tsx:18` — mounts `<ReceptionThemeProvider>`. Interface unchanged; consumer is safe.
  - Removed exports: `useReceptionTheme`, `ReceptionThemeContext`, `ReceptionThemeContextValue`
    - `useReceptionTheme` consumers: `Login.tsx` (removed in TASK-01), `DarkModeToggle.tsx` (deleted in TASK-03) → zero production consumers by the time TASK-04 runs ✓
    - `ReceptionThemeContext` consumers: test files only (updated in TASK-06/07) ✓
  - Modified behavior: Firebase reads/writes, localStorage reads/writes, class manipulation — all removed. Only `setMode("dark")` on mount remains. No callers depended on the side effects directly.
  - Unexpected finding: `useThemeMode` import path needs verification against the reception app's tsconfig (`apps/reception/tsconfig.json`). If `@acme/platform-core` is not in paths, use `@acme/ui/hooks/useTheme` (which exposes `{ setMode }` via the `ThemeContext`). Either path is correct — see Refactor note.
- **Scouts:** (1) Verify `@acme/platform-core/contexts/ThemeModeContext` resolution in reception app tsconfig before writing final import. Alternative: `@acme/ui/hooks/useTheme` (confirmed present at `packages/ui/src/hooks/useTheme.ts`). (2) **Verify `packages/ui/src/providers/ThemeProvider.tsx` renders `ThemeModeProvider` (or equivalent) as an ancestor** before relying on `useThemeMode()` inside `DarkModeBridge`. Check: `grep -n "ThemeModeProvider\|PlatformThemeProvider" packages/ui/src/providers/ThemeProvider.tsx`. If `ThemeProvider` does NOT provide that context, wrap `DarkModeBridge` in an explicit `<ThemeModeProvider>` instead of placing it inside `<ThemeProvider>`.
- **Edge Cases & Hardening:**
  - SSR: `useLayoutEffect` does not run on the server. The hardcoded `class="theme-dark dark"` added in TASK-05 handles SSR rendering. No flash-of-light risk.
  - First-time user with empty localStorage: `ThemeModeProvider` initialises to `"system"`. If system is light-mode, the brief period before `useLayoutEffect` fires could show a flash of light. Mitigated by TASK-05 (layout.tsx hardcodes the class). Combined: zero flash risk.
  - `setMode` in dependency array: the function reference from `useThemeMode` should be stable (from `useMemo` in ThemeModeContext). If it isn't, the effect re-runs — but calling `setMode("dark")` a second time is idempotent. No issue.
- **What would make this ≥90%:** Already at 90%. Raise to 92% by confirming `@acme/platform-core` is in reception tsconfig paths — a one-line check during build.
- **Rollout / rollback:** Direct commit; git revert (restores original 352-line file)
- **Documentation impact:** The existing provider test file documents the old behavior — TASK-06 updates it.

---

### TASK-05: Harden layout.tsx with SSR dark-mode classes and metadata

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/app/layout.tsx` — `<html>` hardcodes dark mode; metadata updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/app/layout.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 92%
  - Implementation: 94% — file is 51 lines; exact changes identified
  - Approach: 92% — hardcoding SSR classes is the standard Next.js pattern for forcing theme; `suppressHydrationWarning` already present
  - Impact: 90% — prevents flash-of-light on first page load; no TS changes
- **Acceptance:**
  - `<html>` element has `className` including both `theme-dark` and `dark`
  - `<meta name="color-scheme">` has `content="dark"` (not `"light dark"`)
  - `viewport.themeColor` simplified to `[{ color: "black" }]` or just `{ color: "black" }`
  - `pnpm --filter reception typecheck` exits 0
- **Validation contract (TC-05):**
  - TC-01: SSR HTML includes `class="... theme-dark dark ..."` on `<html>` element
  - TC-02: `color-scheme` meta tag has `content="dark"` only
- **Execution plan:** Red → Green → Refactor
  - Red: `<html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>` (no dark classes), `<meta name="color-scheme" content="light dark" />`, `viewport.themeColor` has two entries.
  - Green:
    1. Change `<html>` className to `` `${inter.variable} ${jetbrainsMono.variable} theme-dark dark` ``
    2. Change `<meta name="color-scheme" content="light dark" />` → `<meta name="color-scheme" content="dark" />`
    3. Simplify `viewport.themeColor`: replace the array of two entries with `[{ color: "black" }]`
  - Refactor: None.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: pure HTML attribute change`
- **Edge Cases & Hardening:** `suppressHydrationWarning` already on `<html>` — keeps suppressing any class mismatch from ThemeModeProvider.useLayoutEffect.
- **What would make this ≥90%:** Already at 92%
- **Rollout / rollback:** Direct commit; git revert
- **Documentation impact:** None

---

### TASK-06: Rewrite ReceptionThemeProvider.test.tsx for dark-only provider

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx` — 6 toggle/Firebase tests replaced with dark-only smoke tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx`
  - `[readonly] apps/reception/src/providers/ReceptionThemeProvider.tsx`
- **Depends on:** TASK-04
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 90% — test infrastructure (jest, @testing-library/react) already present; pattern is straightforward
  - Approach: 90% — render provider with children, assert `html.theme-dark` class applied; mock `ThemeModeContext.setMode`
  - Impact: 90% — tests must pass before merge; no production impact
- **Acceptance:**
  - All 6 old tests (toggle, Firebase sync, localStorage sync) removed
  - At least 2 new tests: (1) provider renders children, (2) `html.theme-dark` + `dark` class present on document.documentElement after mount
  - `pnpm --filter reception test --testPathPattern=ReceptionThemeProvider` passes
- **Validation contract (TC-06):**
  - TC-01: `renderHook(() => {}, { wrapper: ReceptionThemeProvider })` — renders without throw
  - TC-02: After render, `document.documentElement.classList.contains("theme-dark")` → true
  - TC-03: After render, `document.documentElement.classList.contains("dark")` → true
- **Execution plan:** Red → Green → Refactor
  - Red: Test file has 6 tests importing `firebase/database`, `AuthContext`, and asserting toggle/Firebase/localStorage behavior — all invalid for simplified provider.
  - Green:
    1. Remove all firebase/database mocks and AuthContext wrapper.
    2. Remove all 6 existing tests.
    3. Write new test: `it("renders children without throwing")` — basic render smoke test.
    4. Write new test: `it("applies theme-dark and dark classes to html element")` — uses `renderHook` or `render` with `ReceptionThemeProvider` wrapper; asserts `document.documentElement.classList` after `act`.
    5. Keep the `@testing-library/jest-dom` import and any necessary `@acme/platform-core` mocks for `ThemeModeProvider`.
  - Refactor: Ensure mock for `@acme/platform-core/contexts/ThemeModeContext` (or `@acme/ui/providers/ThemeProvider`) is minimal — only mock what is needed to isolate the test.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: test patterns already established in reception test suite`
- **Edge Cases & Hardening:** `ThemeProvider` from `@acme/ui` wraps `PlatformThemeProvider` from platform-core. In Jest, `@acme/platform-core` may need mocking to avoid pulling in full platform dependencies. **Specific mock pattern:** mock `@acme/platform-core/contexts/ThemeModeContext` returning `{ useThemeMode: () => ({ setMode: jest.fn() }) }` to isolate `DarkModeBridge`. Alternatively, mount `ThemeModeProvider` directly in the test wrapper without mocking. **Class assertions (TC-02/TC-03) require `useLayoutEffect` to fire** — wrap renders in `act()` from `@testing-library/react`. Do NOT use `renderHook` without a provider wrapper that supplies `ThemeModeContext`.
- **What would make this ≥90%:** Already at 90%
- **Rollout / rollback:** Direct commit; git revert
- **Documentation impact:** None

---

### TASK-07: Update login parity test and regenerate snapshot

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/parity/__tests__/login-route.parity.test.tsx` and regenerated `__snapshots__/login-route.parity.test.tsx.snap`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/parity/__tests__/login-route.parity.test.tsx`
  - `apps/reception/src/parity/__tests__/__snapshots__/login-route.parity.test.tsx.snap`
- **Depends on:** TASK-01
- **Blocks:** —
- **Confidence:** 91%
  - Implementation: 92% — exact lines identified (mock at L19-24, assertions at L57, L87-90); snapshot update is mechanical
  - Approach: 91% — remove toggleDarkMock, simplify/remove useReceptionTheme mock, remove toggle button assertions, regenerate snapshot
  - Impact: 90% — parity tests must pass before merge; snapshot is a CI gate
- **Acceptance:**
  - `toggleDarkMock` removed
  - `useReceptionTheme` mock simplified to `() => ({})` or removed if no longer needed
  - Both `getByRole("button", { name: /switch to dark mode/i })` assertions removed
  - `expect(toggleDarkMock).toHaveBeenCalledTimes(1)` assertion and associated user-event click removed
  - Snapshot regenerated: `pnpm --filter reception test --testPathPattern=login-route.parity --updateSnapshot`
  - `pnpm --filter reception test --testPathPattern=login-route.parity` passes (no snapshot mismatch)
- **Validation contract (TC-07):**
  - TC-01: Login renders and matches updated snapshot → no snapshot diff on second run
  - TC-02: No assertion for dark mode toggle button remains → test passes without toggle element in DOM
- **Execution plan:** Red → Green → Refactor
  - Red: Test mocks `useReceptionTheme` returning `{ dark: false, toggleDark: toggleDarkMock }` (L19-24). Two `getByRole` assertions for the toggle button (L57, L87). One user-event click + `toggleDarkMock` assertion (L89-90). Snapshot includes toggle button DOM.
  - Green:
    1. Remove `const toggleDarkMock = jest.fn()` (L9).
    2. Simplify the `useReceptionTheme` mock to `() => ({})` — or remove the entire mock if no other part of Login.tsx uses the hook after TASK-01.
    3. Remove `screen.getByRole("button", { name: /switch to dark mode/i })` assertion from both test bodies (L57, L87).
    4. Remove `const themeToggle = screen.getByRole(...)` + `await user.click(themeToggle)` + `expect(toggleDarkMock)...` block.
    5. Run `pnpm --filter reception test --testPathPattern=login-route.parity --updateSnapshot` to regenerate snapshot.
    6. Commit updated `.snap` file alongside test file.
  - Refactor: Check whether the `useReceptionTheme` mock is still needed at all after TASK-01. If Login.tsx no longer imports `useReceptionTheme`, the mock can be removed entirely.
- **Planning validation:** Not required for S effort.
- **Scouts:** `None: lines explicitly identified`
- **Edge Cases & Hardening:**
  - The snapshot file itself must be committed — do not gitignore it or leave it stale.
  - Verify the test still covers arrow-key navigation and password visibility toggle behavior (these are independent of the theme toggle and must remain passing).
- **What would make this ≥90%:** Already at 91%
- **Rollout / rollback:** Direct commit; git revert (restores old test + old snapshot)
- **Documentation impact:** None

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `@acme/platform-core` not in reception tsconfig paths → `useThemeMode` import fails | Low | Medium | Use `@acme/ui/hooks/useTheme` as fallback — confirmed present; check tsconfig in TASK-04 Refactor step |
| ThemeModeProvider in Jest pulls in heavy platform-core deps → test fails with missing mock | Medium | Low | Follow existing reception test patterns; add minimal jest.mock for ThemeProvider/PlatformThemeProvider |
| Snapshot not committed → CI fails on next run | Medium | Low | Explicitly commit `.snap` file in TASK-07 acceptance criteria |
| Login.tsx retains a dead `// Icon components for... dark mode` comment → lint warning | Very Low | None | Remove comment in TASK-01 edge case handling |

## Observability

- Logging: None required — no metrics or tracing added
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `pnpm --filter reception typecheck` exits 0
- [ ] `pnpm --filter reception test` passes (all tests, including parity snapshots)
- [ ] No reference to `DarkModeToggle`, `toggleDark`, or `useReceptionTheme` in any production `.tsx` or `.ts` file in `apps/reception/src`
- [ ] `apps/reception/src/components/common/DarkModeToggle.tsx` does not exist
- [ ] `<html>` element in layout.tsx includes `theme-dark dark` in className
- [ ] `<meta name="color-scheme">` has `content="dark"` in layout.tsx
- [ ] `ReceptionThemeProvider.tsx` is ≤25 lines and has no Firebase or localStorage imports

## Decision Log

- 2026-02-25: Chose Option A (consumers-first incremental) over Option B (provider-first with stub). Rationale: each task produces a compilable intermediate state; no stub code required; lower risk of committing dead exports.
- 2026-02-25: `ThemeModeProvider` confirmed to have no `defaultMode` prop (source: `packages/platform-core/src/contexts/ThemeModeContext.tsx:64`). Approach: `setMode("dark")` in `useLayoutEffect` on mount inside `DarkModeBridge`.

## Overall-confidence Calculation

| Task | Confidence | Effort weight | Weighted |
|---|---|---|---|
| TASK-01 | 91% | 1 | 91 |
| TASK-02 | 95% | 1 | 95 |
| TASK-03 | 95% | 1 | 95 |
| TASK-04 | 90% | 2 | 180 |
| TASK-05 | 92% | 1 | 92 |
| TASK-06 | 90% | 1 | 90 |
| TASK-07 | 91% | 1 | 91 |
| **Total** | | **8** | **734** |

**Overall-confidence = 734 / 8 = 91.75% → 92%**
