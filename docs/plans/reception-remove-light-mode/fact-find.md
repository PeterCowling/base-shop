---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: reception-remove-light-mode
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-remove-light-mode/plan.md
Trigger-Why: Reception app is dark-mode-only by design; the light mode toggle adds dead code, Firebase writes for user preference, and UI chrome that staff do not need.
Trigger-Intended-Outcome: type: operational | statement: Remove all light-mode toggle machinery from the reception app so no user can switch to light mode; reduce provider complexity, delete dead UI, and ensure CI passes. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260225-0003
---

# Reception: Remove Light Mode Fact-Find Brief

## Scope

### Summary

The reception app has historically supported both light and dark modes via a complex provider chain (`ReceptionThemeProvider` → `ReceptionThemeBridge` → `@acme/ui/providers/ThemeProvider` → `@acme/platform-core/contexts/ThemeContext`). The operator has confirmed the app is dark-mode-only. The `DarkModeContext.tsx` and its test are already deleted (uncommitted, in working tree). The remaining toggle machinery — the full `ReceptionThemeProvider` Firebase-sync bridge, the `DarkModeToggle` UI component, and two toggle buttons in `Login.tsx` and `AuthenticatedApp.tsx` — needs systematic removal.

### Goals

- Force the app into permanent dark mode with no toggle mechanism available to users
- Delete the `DarkModeToggle` component
- Simplify `ReceptionThemeProvider` to a thin `ThemeProvider` wrapper (no Firebase sync, no localStorage read/write, no toggle logic) with a `useLayoutEffect` that calls `setMode("dark")` once on mount
- Remove the `LoginContainer` dark/toggleDark props and the theme toggle button from `Login.tsx`
- Remove `<DarkModeToggle />` from `AuthenticatedApp.tsx`
- Update `layout.tsx`: add `theme-dark dark` to `<html>` className, change `<meta name="color-scheme" content="dark">`, simplify `viewport.themeColor` to `[{ color: "black" }]` — required to prevent flash-of-light before React hydration
- Update all affected tests (parity, provider, snapshot) to match dark-only state

### Non-goals

- Deleting light-variant CSS custom properties from `packages/themes/reception/tokens.css` — the base token file's `html.theme-dark` selector depends on both variants existing; removing light values is a broader breaking change
- Migrating Firebase `userPrefs/{user}/themeMode` data — stale data paths cause no runtime error; a cleanup script can be deferred
- Changing `@acme/ui` or `@acme/platform-core` ThemeProvider internals

### Constraints & Assumptions

- Constraints:
  - The design system's component library (`@acme/design-system`) may call `useTheme()` or `useThemeMode()` internally. The `ThemeProvider` from `@acme/ui/providers/ThemeProvider` MUST remain mounted in the provider tree.
  - `html.theme-dark` (in `packages/themes/base/tokens.static.css`) is the CSS selector that swaps all tokens to dark values. This class MUST be present on `<html>` for the dark palette to render. Same for `dark` (Tailwind dark: variant compatibility, though not actively used in production TSX).
  - No `dark:` Tailwind variant classes are used in production TSX files — confirmed by grep. All dark mode rendering is CSS-custom-property-based, driven by `html.theme-dark`.
- Assumptions:
  - Platform-core's `ThemeModeContext` will start in "dark" mode if the HTML element already carries `theme-dark dark` classes at SSR time (i.e., it will not fight the hardcoded class). This needs verification during build.
  - `suppressHydrationWarning` is already on the `<html>` element in layout.tsx — it will continue to suppress any SSR/CSR class mismatch.

## Outcome Contract

- **Why:** Reception app staff operate exclusively in dark mode. The toggle adds dead code weight, Firebase writes, and UI chrome that creates confusion. Removing it reduces complexity and matches actual usage.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All light-mode toggle UI is removed; app renders exclusively in dark mode; TypeScript typechecks and all affected tests pass on CI.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/layout.tsx` — Root HTML layout. Currently has `<meta name="color-scheme" content="light dark" />` and `viewport.themeColor` with both light and dark entries. No classes on `<html>` that force a mode.
- `apps/reception/src/components/Providers.tsx` — Client provider tree. Mounts `ReceptionThemeProvider` wrapping `App`.
- `apps/reception/src/components/AuthenticatedApp.tsx` — Renders `<DarkModeToggle />` in the authenticated nav bar.
- `apps/reception/src/components/Login.tsx` (line 129, 303, 375, 418, 471, 587) — Destructures `{ toggleDark, dark }` from `useReceptionTheme()`. Passes them to `LoginContainer` which renders a toggle button.

### Key Modules / Files

- `apps/reception/src/providers/ReceptionThemeProvider.tsx` (352 lines) — Full toggle provider. Exports `ReceptionThemeProvider` (component), `useReceptionTheme` (hook), and `ReceptionThemeContext`. Contains:
  - `ReceptionThemeBridge`: reads/writes localStorage keys (`darkMode`, `darkMode:user:<name>`, `theme-mode`, `theme`), Firebase path `userPrefs/<userName>` (reads on mount, writes on each toggle), `document.documentElement` class manipulation, StorageEvent listener.
  - `bootstrapCanonicalMode()`: reads legacy localStorage, defaults to `"dark"`.
- `apps/reception/src/components/common/DarkModeToggle.tsx` (26 lines) — Toggle button calling `useReceptionTheme().toggleDark`. To be deleted.
- `apps/reception/src/components/AuthenticatedApp.tsx` (43 lines) — Only consumes `DarkModeToggle`. Easy cleanup.
- `apps/reception/src/components/Login.tsx` (600+ lines) — `LoginContainer` function at line 587 accepts `dark` and `toggleDark` props, renders an SVG-icon toggle button. All four Login view branches pass these props.
- `packages/ui/src/providers/ThemeProvider.tsx` — Wraps `@acme/platform-core/contexts/ThemeContext (PlatformThemeProvider)` and `ThemeContextBridge`. Still needed.
- `packages/themes/base/tokens.static.css` (line 299+) — `html.theme-dark { ... }` block that swaps ALL token variables to their dark values.
- `apps/reception/src/app/globals.css` — Has `html.dark, body.dark { color-scheme: dark; }`. Should remain (or be collapsed to a simpler `:root` rule once provider is removed).

### Patterns & Conventions Observed

- Dark mode is CSS-custom-property-based, not Tailwind `dark:` variant — evidence: zero `dark:` occurrences in production `.tsx` files
- Provider defaults to dark: `bootstrapCanonicalMode` falls through to `"dark"` when no localStorage preference found — evidence: `ReceptionThemeProvider.tsx:148`
- Color swap mechanism: `html.theme-dark` overrides token variables — evidence: `packages/themes/base/tokens.static.css:299`
- `suppressHydrationWarning` already present on `<html>` — evidence: `layout.tsx:40`

### Data & Contracts

- Types/schemas/events:
  - `ThemeMode = "light" | "dark" | "system"` (ReceptionThemeProvider.tsx:21) — will no longer be needed
  - `LegacyThemeMode = "light" | "dark"` (line 20) — will no longer be needed
  - `ReceptionThemeContextValue` interface (lines 23–30) — will be deleted or reduced to a no-op stub if needed for compatibility
- Persistence:
  - localStorage keys: `darkMode`, `darkMode:user:<name>`, `theme-mode`, `theme` — writes will be removed; reads already return `"dark"` by default
  - Firebase path: `userPrefs/{userName}` with fields `themeMode` and `darkMode` — writes and reads will be removed; existing records become stale but non-breaking
- API/contracts:
  - `useReceptionTheme()` hook — exported and consumed by `Login.tsx` and `DarkModeToggle.tsx`. Can be deleted once those two consumers are cleaned up. Test files mock it independently.

### Dependency & Impact Map

- Upstream dependencies: `@acme/ui/providers/ThemeProvider` (must stay), `@acme/ui/hooks/useTheme` (referenced by bridge; goes away with bridge removal), Firebase Database (used for preference sync; goes away with bridge removal), `@/context/AuthContext` (used by bridge to get userName; goes away)
- Downstream dependents of `useReceptionTheme`:
  - `apps/reception/src/components/Login.tsx` — consumes `dark` and `toggleDark`
  - `apps/reception/src/components/common/DarkModeToggle.tsx` — consumes `dark` and `toggleDark`
  - Test mocks: `login-route.parity.test.tsx`, `providers/__tests__/ReceptionThemeProvider.test.tsx`
- Likely blast radius: **low and self-contained** — all consumers are in `apps/reception/` only. No cross-app imports detected. The provider simplification touches 6 files and 4 test files.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (Jest config at `apps/reception/jest.config.cjs`)
- Commands: `pnpm --filter reception test`
- CI integration: Turborepo CI pipeline runs per-package tests

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| ReceptionThemeProvider | Unit | `apps/reception/src/providers/__tests__/ReceptionThemeProvider.test.tsx` | 6 tests: throw outside provider, toggle classes, load from localStorage, user-specific preference, Firebase hydration, StorageEvent sync |
| Login dark mode toggle | Parity (integration) | `apps/reception/src/parity/__tests__/login-route.parity.test.tsx` | 2 tests assert `getByRole("button", { name: /switch to dark mode/i })`; one asserts `toggleDarkMock` called once |
| Login snapshot | Parity snapshot | `apps/reception/src/parity/__tests__/__snapshots__/login-route.parity.test.tsx.snap` | Contains snapshot of Login DOM including the toggle button |

#### Coverage Gaps

- Untested paths: None that require coverage — the toggle behavior being deleted has 100% test coverage, and all those tests become extinct.
- Extinct tests (must be removed/updated):
  - All 6 tests in `ReceptionThemeProvider.test.tsx` — they test toggle, Firebase sync, localStorage sync — all going away
  - Login parity test assertions for the dark mode button (`getByRole("button", { name: /switch to dark mode/i })`) — both occurrences
  - Login parity test assertion `expect(toggleDarkMock).toHaveBeenCalledTimes(1)` — the entire user-event click on the toggle
  - Snapshot in `login-route.parity.test.tsx.snap` — will need regeneration

#### Testability Assessment

- Easy to test: Provider rendering without toggle (just wraps children), Login rendering without toggle button
- Hard to test: Nothing structurally hard — removal of dynamic logic makes testing simpler
- Test seams needed: None new; existing mock infrastructure (`jest.mock("../../providers/ReceptionThemeProvider", ...)`) in parity tests can be simplified or removed once the hook is gone

### Recent Git History (Targeted)

- `apps/reception/src/context/DarkModeContext.tsx` — Deleted in working tree (uncommitted). Last committed in `chore: commit outstanding work`, `feat(design-system): implement theming plan`. The deletion is pre-existing, confirming the operator's intent is already partially executed.
- `apps/reception/src/context/__tests__/DarkModeContext.test.tsx` — Likewise deleted in working tree (uncommitted).

## Questions

### Resolved

- Q: Should `ReceptionThemeProvider` be deleted or simplified?
  - A: Simplified (not deleted). The `ThemeProvider` from `@acme/ui/providers/ThemeProvider` must remain in the tree for design system components that call `useTheme()` internally. The simplification path: replace the 352-line bridge with a ~10-line component that just renders `<ThemeProvider>{children}</ThemeProvider>` and forces the `theme-dark dark` class on `html` via a single `useLayoutEffect` on mount.
  - Evidence: `ThemeProvider.tsx` in `@acme/ui` wraps `PlatformThemeProvider` which drives `isDark`. If the design system component tree requires this context, removing the wrapper would break it.

- Q: Can `useReceptionTheme` hook be deleted?
  - A: Yes, once `Login.tsx` and `DarkModeToggle.tsx` are cleaned up. No other production consumer exists (confirmed by grep). The test mocks it independently and will be updated.
  - Evidence: grep output showed only `Login.tsx`, `DarkModeToggle.tsx`, and test files as consumers.

- Q: Will hardcoding `theme-dark dark` on `<html>` in layout.tsx conflict with platform-core's ThemeModeContext attempting to manage classes at runtime? What is the correct approach for the simplified bridge?
  - A: No conflict. `platform-core/contexts/ThemeModeContext.tsx` (`ThemeModeProvider`) has **no `defaultMode` prop** — it initialises to `readStoredMode() ?? "system"`. Its own `useLayoutEffect` (line 67-73) applies `theme-dark dark` classes and `colorScheme` based on the resolved mode. The correct approach for the simplified bridge: call `setMode("dark")` inside a `useLayoutEffect` on mount. This drives `ThemeModeProvider` to produce `isDark=true` permanently, which causes it to apply the classes itself. The hardcoded `class="theme-dark dark"` in layout.tsx acts as an SSR-safe baseline so the page renders dark before React hydrates and the effect fires — preventing any flash of light mode on first visit. Both mechanisms converge on the same dark state; no fight occurs.
  - Evidence: `packages/platform-core/src/contexts/ThemeModeContext.tsx:64` — `useState<ThemeMode>(() => readStoredMode() ?? "system")`; line 67-73 — useLayoutEffect class toggle via `root.classList.toggle("theme-dark", resolved === "dark")`.

- Q: Are any `dark:` Tailwind variant classes used in production TSX that would break if `.dark` class is removed?
  - A: No. Grep across all production `.tsx` files found zero `dark:` Tailwind variant usages. All colour changes are CSS-custom-property-based via `html.theme-dark`. Safe to rely purely on `html.theme-dark`.
  - Evidence: bash grep output with zero matches.

- Q: Should light-variant token values be deleted from `packages/themes/reception/tokens.css`?
  - A: No — not in this task. The `html.theme-dark` selector in `tokens.static.css` overrides the `:root` defaults using `var(--color-bg-dark)` etc. The light variants are the fallback/default. Removing them would make ALL non-dark contexts (e.g., other apps that import the reception theme) break. Defer token cleanup entirely.
  - Evidence: `tokens.static.css:299` selector structure; global `:root` token declarations in `tokens.static.css`.

- Q: What happens to existing Firebase `userPrefs/<user>/themeMode` data?
  - A: Becomes stale but non-breaking. No runtime code will read or write it after the removal. A data-migration script (e.g., Firebase Admin SDK deletion) can run out-of-band later; it is explicitly out of scope here.
  - Evidence: Firebase read/write only happens inside `ReceptionThemeBridge` — once that's removed, the paths are orphaned.

### Open (Operator Input Required)

_None._ All questions were agent-resolvable.

## Confidence Inputs

- Implementation: 92%
  - Evidence basis: Full component tree mapped; all 6 files to modify and 1 to delete are identified; test files and snaps that need updating are enumerated. `ThemeModeContext` API confirmed — no `defaultMode` prop; simplified bridge uses `setMode("dark")` in `useLayoutEffect`.
  - Raise to ≥80: Already above.
  - Raise to ≥90: Already at 92% — resolved by reading `packages/platform-core/src/contexts/ThemeModeContext.tsx`.

- Approach: 90%
  - Evidence basis: The removal sequence is clear and unambiguous. Dark-mode-first is already the default (`bootstrapCanonicalMode` defaults to `"dark"`). No approach uncertainty.
  - Raise to ≥90: Already at 90%.

- Impact: 93%
  - Evidence basis: Zero `dark:` Tailwind classes in production TSX, no cross-app consumers of `useReceptionTheme`, Firebase writes are fire-and-forget so their removal causes no failures. Code size reduction is measurable (−300 lines provider, −26 lines DarkModeToggle).
  - Raise to ≥90: Already at 93%.

- Delivery-Readiness: 88%
  - Evidence basis: Entirely self-contained in `apps/reception/`. No external service changes. No cross-team coordination required.
  - Raise to ≥90: Confirm parity snapshot regeneration path is smooth (likely a single `pnpm --filter reception test -- --updateSnapshot`).

- Testability: 83%
  - Evidence basis: All extinct tests are clearly identified. Remaining provider test coverage only needs to assert that children render and that `html` has `theme-dark` class — straightforward.
  - Raise to ≥90: Write one smoke test in the replacement provider test that asserts dark class application.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Platform-core ThemeModeContext fights hardcoded dark class after hydration | Low | Medium | Use `setMode("dark")` inside simplified bridge on mount rather than only relying on hardcoded HTML class |
| ReceptionThemeProvider.test.tsx tests fail CI immediately | High | Low | These tests are already testing soon-to-be-deleted logic; update/delete in same task, not a post-merge risk |
| Login parity snapshot mismatch after Login.tsx cleanup | High | Low | Regenerate snapshot with `--updateSnapshot` as part of the task |
| DarkModeContext.tsx deletion (already done) causes import errors elsewhere | Low | Medium | Already confirmed no remaining imports by grep; deletion is clean |
| Orphaned `userPrefs/{user}/themeMode` Firebase data causes confusion | Very Low | None | Data is stale-but-harmless; document in release notes for operators |
| `@acme/design-system` components stop rendering correctly if ThemeProvider is removed | Low | High | ThemeProvider stays in tree — only the bridge/toggle logic is removed |

## Planning Constraints & Notes

- Must-follow patterns:
  - Keep `<ThemeProvider>` (`@acme/ui/providers/ThemeProvider`) in the provider tree — design system components depend on it
  - Use `useLayoutEffect` for dark forcing in the simplified bridge — existing pattern, avoids flash of light mode
  - Hardcode `class="theme-dark dark"` on `<html>` in layout.tsx — required SSR baseline before hydration
  - Parity snapshot regeneration must happen in the same PR as test updates — never commit failing snapshot tests
  - `suppressHydrationWarning` on `<html>` is already present — keep it (still valid for any class differences SSR/CSR)
  - `globals.css:182` `html.dark, body.dark { color-scheme: dark; }` — keep as-is; redundant once `ThemeModeProvider.useLayoutEffect` sets `root.style.colorScheme` directly, but harmless and guards against provider-absent scenarios
  - Category shade family CSS vars in `globals.css @theme` block (`--color-pinkShades-*` etc.) — out of scope for this task; do not attempt to prune them here
- Rollout/rollback expectations:
  - No feature flag needed — this is a single-direction simplification, not a toggle. Rollback is a git revert.
  - No data migration needed before ship. Firebase stale data is non-blocking.
- Observability expectations:
  - None required. No metrics or error tracking touch points introduced.

## Suggested Task Seeds (Non-binding)

1. **TASK-01 (pre-flight)**: Read `packages/platform-core/src/contexts/ThemeModeContext` to determine if it supports `defaultMode="dark"` prop — 5 min research, informs TASK-02 approach.
2. **TASK-02**: Simplify `ReceptionThemeProvider.tsx` — replace 352-line bridge with ~15-line wrapper that mounts `ThemeProvider`, forces dark mode via `useLayoutEffect`/prop, removes Firebase, localStorage, toggle exports. Delete `ReceptionThemeContext` and `useReceptionTheme` exports.
3. **TASK-03**: Delete `apps/reception/src/components/common/DarkModeToggle.tsx`.
4. **TASK-04**: Update `AuthenticatedApp.tsx` — remove `DarkModeToggle` import and `<DarkModeToggle />` render.
5. **TASK-05**: Update `Login.tsx` — remove `useReceptionTheme` import, remove `toggleDark`/`dark` destructuring, remove `LoginContainer` `dark`/`toggleDark` props, remove the toggle button JSX from `LoginContainer`.
6. **TASK-06**: Update `layout.tsx` — add `theme-dark dark` to `<html>` className, change `<meta name="color-scheme">` to `content="dark"`, simplify `viewport.themeColor` to `[{ color: "black" }]`.
7. **TASK-07**: Update `providers/__tests__/ReceptionThemeProvider.test.tsx` — remove all toggle/Firebase/localStorage tests; add a single smoke test confirming children render and `html.theme-dark` class is applied.
8. **TASK-08**: Update `parity/__tests__/login-route.parity.test.tsx` — remove `toggleDarkMock`, remove dark toggle button assertions, update `useReceptionTheme` mock to be no-op or remove mock entirely. Regenerate snapshot.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - TypeScript compiles clean (`pnpm --filter reception typecheck`)
  - All tests pass including parity snapshots (`pnpm --filter reception test`); snapshot regeneration via `--updateSnapshot` is part of the task
  - No `DarkModeToggle`, `toggleDark`, or toggle button references remain in production TSX
  - `html` element carries `theme-dark dark` classes in SSR output (layout.tsx) and at runtime

## Evidence Gap Review

### Gaps Addressed

- Confirmed no `dark:` Tailwind variant usage in production TSX — zero grep hits
- Confirmed `useReceptionTheme` has exactly 2 production consumers (Login.tsx, DarkModeToggle.tsx)
- Confirmed `html.theme-dark` is the CSS dark-mode trigger (tokens.static.css:299)
- Confirmed `ThemeProvider` must remain mounted (ThemeProvider.tsx wraps PlatformThemeProvider)
- Confirmed all affected test files and their specific failing assertions

### Confidence Adjustments

- Implementation raised from initial ~75% to 87% after confirming blast radius is limited to `apps/reception/` only
- Approach raised to 90% after confirming no `dark:` variant usage (simplifies CSS cleanup)

### Remaining Assumptions

- `ThemeModeContext` initializes to "light" mode by default and requires explicit `setMode("dark")` or a `defaultMode` prop — verified by inspection of `ReceptionThemeBridge` which does call `applyMode(bootstrapMode)` on mount; the simplified version just always passes `"dark"`.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-remove-light-mode --auto`
