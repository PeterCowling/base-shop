---
Type: Fact-Find
Outcome: Planning
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
Related-Plan: docs/plans/archive/reception-ui-theme-centralization-plan.md
---

# Reception UI Theme Centralization Fact-Find Brief

## Scope
### Summary
Centralize Reception UI primitives, theme state, and token usage onto shared platform packages (`@acme/design-system`, `@acme/ui`, `@acme/platform-core`) and remove the current ESLint design-system exclusion for the app.

### Goals
- Remove Reception-wide DS lint exclusion and make DS governance enforceable.
- Migrate local modal/input/theme patterns to shared primitives/providers.
- Standardize on token-driven styling and shared component entrypoints.
- Preserve current Reception UX and auth/theme behavior during migration.

### Non-goals
- Replatform Reception data hooks/business logic.
- Rewrite all Reception UI in one release.
- Full i18n rewrite in the same pass (can be phased separately if needed).

### Constraints & Assumptions
- Constraints:
  - Reception is production operational tooling with 25 route entry pages.
  - Existing behavior (especially login, modal actions, and dark mode) must not regress.
  - CI currently runs `@apps/reception test` but this script is a stub.
- Assumptions:
  - Phased migration (slice-by-slice) is required; big-bang replacement is too risky.
  - Existing shared primitives are sufficient to start (ConfirmDialog, Dialog/AlertDialog, Popover, form primitives, theme providers).

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/layout.tsx` - root app shell and viewport theme colors.
- `apps/reception/src/app/globals.css` - imports base tokens and local alias bridge.
- `apps/reception/src/components/Providers.tsx` - app provider composition.
- `apps/reception/src/App.tsx` - auth gate, app shell composition, notification provider.
- `apps/reception/src/app/**/page.tsx` - 25 route entry pages.

### Key Modules / Files
- `eslint.config.mjs` - app-level DS suppression via `...offAllDsRules` for Reception.
- `apps/reception/src/context/DarkModeContext.tsx` - app-local theme state, class toggling, localStorage + Firebase sync.
- `apps/reception/src/context/DialogContext.tsx` - app-local alert/confirm orchestration.
- `apps/reception/src/components/common/ConfirmModal.tsx` - local confirm UI; uses raw Tailwind color classes.
- `apps/reception/src/components/common/AlertModal.tsx` - local alert UI; uses raw Tailwind color classes.
- `apps/reception/src/components/Login.tsx` - large local auth UI with local icon/render logic.
- `packages/ui/src/providers/ThemeProvider.tsx` - shared theme provider wrapper over platform-core contexts.
- `packages/platform-core/src/contexts/ThemeModeContext.tsx` - shared mode handling (`light|dark|system`) + class application.
- `packages/design-system/src/atoms/ConfirmDialog.tsx` - shared confirm dialog primitive.

### Patterns & Conventions Observed
- Reception is explicitly excluded from DS lint governance:
  - `eslint.config.mjs` Reception overrides disable all `ds/*` rules.
- Reception has partial centralization already:
  - Shared theme tokens imported in globals (`@themes/base/tokens.css`).
  - Shared NotificationCenter used in `App.tsx`.
  - Some shared primitives adopted (`SimpleModal`, `Popover`, `DropdownMenu`, `Grid`, `Cluster`).
- Deep imports are still used for shared UI internals (e.g. NotificationCenter path), contrary to handbook import guidance.
- Reception still relies heavily on app-local component surface:
  - 418 TSX files under `apps/reception/src`.
  - 9 TSX files import `@acme/ui`.
  - 6 TSX files import `@acme/design-system`.
  - 407 TSX files import neither shared UI package.

### Data & Contracts
- Types/schemas:
  - UI-side contracts live mostly in app-local types and component props.
- Persistence:
  - Theme preferences stored in localStorage keys (`darkMode`, `darkMode:user:<name>`).
  - Theme preferences synced to Firebase `userPrefs/<user_name>`.
- API/event contracts:
  - No backend contract changes required for UI centralization itself.
  - Must preserve theme preference write semantics and auth-gated behavior.

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/design-system`, `@acme/ui`, `@acme/platform-core`, `@themes/base`, `@acme/tailwind-config`.
- Downstream dependents:
  - 25 Reception route pages.
  - 34 modal component files (54 including test files).
  - 131 production `<input|select|textarea>` occurrences.
  - 324 Reception test files.
- Likely blast radius:
  - Login and global provider wiring.
  - Modal interactions across operational workflows.
  - Dark mode styling assertions in many tests.
  - Lint policy and CI quality gates.

### Performance Patterns
- Large UI modules increase migration risk and retest scope:
  - `apps/reception/src/components/inventory/StockManagement.tsx` (870 lines)
  - `apps/reception/src/components/reports/EndOfDayPacket.tsx` (800 lines)
  - `apps/reception/src/components/Login.tsx` (627 lines)
- App-level keyboard handler and modal state routing in `App.tsx` are high-frequency UI paths; migration should avoid rerender churn/regressions.

### Security Boundaries
- Theme centralization touches auth-adjacent UI behavior:
  - `apps/reception/src/App.tsx` handles authenticated vs login surface.
  - `apps/reception/src/context/DarkModeContext.tsx` reads/writes user preference data to Firebase.
- Migration must preserve:
  - No unauthorized preference writes.
  - Existing auth gating and logout timeout behavior.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (via `@acme/config/jest.preset.cjs`), Firebase emulator for rules tests.
- Commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
  - `pnpm --filter @apps/reception test` (currently stubbed)
  - `pnpm --filter @apps/reception test:rules`
- CI integration:
  - `.github/workflows/reception.yml` -> reusable app pipeline.
  - CI runs lint + typecheck + `test:rules` + `test` (stubbed script).

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Theme bridge | unit | `apps/reception/src/app/__tests__/theme-bridge.test.tsx` | Asserts base token import + hospitality aliases in globals.css. |
| Shared UI integration | unit | `apps/reception/src/components/__tests__/shared-readiness-badge.test.tsx` | Verifies shared `@acme/ui` hospitality badge renders in Reception context. |
| Dark mode context | unit | `apps/reception/src/context/__tests__/DarkModeContext.test.tsx` | Covers mode toggling, class sync, local + remote preference behaviors. |
| Firebase rules | integration | `apps/reception/src/rules/__tests__/databaseRules.test.ts` | Emulator-backed policy tests for critical write paths. |

#### Test Patterns & Conventions
- Heavy unit-test footprint exists across hooks/components.
- Many tests assert legacy dark classes directly (`dark:bg-darkSurface`, `dark:text-darkAccentGreen`).
- Rules/security testing is mature and executable (`test:rules` passing).

#### Coverage Gaps (Planning Inputs)
- Untested paths:
  - Centralized migration paths for shared form/modal abstractions are not yet covered as a coherent suite.
- Extinct tests / false confidence risks:
  - CI `test` step currently passes without running app tests due stub script in `apps/reception/package.json`.

#### Testability Assessment
- Easy to test:
  - Isolated UI primitives and context behavior via existing Jest setup.
  - Theme/token bridge assertions.
- Hard to test:
  - Cross-route modal workflows with keyboard navigation.
  - Incremental migration across many legacy class-based components.
- Test seams needed:
  - Shared wrappers/adapters for modal + form fields to reduce repetitive assertions and improve deterministic tests.

#### Recommended Test Approach
- Unit tests for:
  - New shared Reception wrappers/adapters (modal, form controls, theme bridge adapter).
- Integration tests for:
  - Provider composition (`Providers`/`App`) and key route flows after each migration slice.
- E2E/smoke tests for:
  - Login, major modal workflows, dark-mode toggle persistence.
- Contract tests for:
  - Theme preference persistence behavior (local + Firebase path compatibility).

### Recent Git History (Targeted)
- `b142a51dc6` (2026-01-22): added Reception DS exclusion and relaxed lint posture.
- `c181c2ac10` (2026-02-07): added Reception theme bridge import/aliases in globals.
- `2c350744af` (referenced in `docs/plans/design-system-plan.md`): Reception toast migrated to shared NotificationCenter.

## External Research (If needed)
- Not needed. Repository evidence is sufficient for planning.

## Questions
### Resolved
- Q: Is Reception currently excluded from centralized DS lint governance?
  - A: Yes, globally for `apps/reception/**` and again for `apps/reception/src/**/*`.
  - Evidence: `eslint.config.mjs` Reception override blocks.
- Q: Does Reception already consume some centralized UI/theme capabilities?
  - A: Yes, partially (base token import, NotificationCenter, SimpleModal/Popover usage).
  - Evidence: `apps/reception/src/app/globals.css`, `apps/reception/src/App.tsx`, shared imports in component files.
- Q: Are shared replacements available for core migration targets?
  - A: Yes (`ThemeProvider` stack, `ConfirmDialog`, dialog/popover primitives, shared tokenized Tailwind preset).
  - Evidence: `packages/ui/src/providers/ThemeProvider.tsx`, `packages/platform-core/src/contexts/ThemeModeContext.tsx`, `packages/design-system/src/atoms/ConfirmDialog.tsx`, `packages/tailwind-config/src/index.ts`.

### Open (User Input Needed)
- None currently blocking planning.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 76%
  - Why: migration path is clear but broad; Reception surface area is large and mostly app-local.
  - Raise to >=80: define phased slices (theme/provider, modal stack, form controls, route clusters) with explicit file lists.
  - Raise to >=90: complete one pilot slice end-to-end and prove repeatable migration recipe + codemod support.
- **Approach:** 88%
  - Why: shared DS/theme infrastructure exists and is already partially adopted.
  - Raise to >=90: lock an ADR-level decision for preserving remote user theme preference semantics during provider migration.
- **Impact:** 74%
  - Why: wide UI blast radius (25 routes, many local components/tests).
  - Raise to >=80: produce route-by-route impact matrix and dependency graph for modal/input-heavy screens.
  - Raise to >=90: add per-slice smoke test pack and rollback toggles/feature flags.
- **Delivery-Readiness:** 79%
  - Why: CI pipeline exists, but app test command is stubbed and DS lint is currently disabled.
  - Raise to >=80: replace stub `test` script with targeted runnable suites for migrated slices.
  - Raise to >=90: enforce DS rule subset gates per migrated directory and add visual smoke validation in CI.
- **Testability:** 72%
  - Why: strong existing unit tests, but migration-specific integration coverage is fragmented.
  - Raise to >=80: establish shared migration test harnesses and targeted route smoke suites.
  - Raise to >=90: add deterministic e2e checks for login/modals/dark mode across migrated slices.

## Planning Constraints & Notes
- Must-follow patterns:
  - Use public shared package entrypoints (`@acme/ui`, `@acme/design-system/*`) rather than deep internal imports where possible.
  - Use token-driven semantic utilities from shared Tailwind preset.
- Rollout/rollback expectations:
  - Phase migration by feature surface; remove lint suppression only after each slice is compliant.
  - Preserve current behavior for auth, modals, and theme preference persistence.
- Observability expectations:
  - Track lint violation deltas per slice.
  - Track runtime regression signals in high-traffic Reception routes.

## Suggested Task Seeds (Non-binding)
- Create migration inventory and slice plan for `theme`, `modals`, `forms`, `navigation shell`.
- Introduce a Reception theme adapter/provider that composes shared ThemeProvider while preserving current user preference semantics.
- Replace local alert/confirm flows with shared `ConfirmDialog`/dialog primitives and retire app-local wrappers progressively.
- Build reusable Reception form-field wrappers on DS atoms/molecules and migrate high-volume input surfaces.
- Replace legacy color utility usage with semantic token classes; remove `apps/reception/src/constants/colors.ts` consumption.
- Remove deep shared imports (e.g. NotificationCenter internals) in favor of approved public entrypoints.
- Re-enable DS lint rules in stages: start with selected directories and a reduced mandatory subset, then broaden.
- Replace `@apps/reception test` stub with targeted runnable suites used by CI.

## Execution Routing Packet
- Primary execution skill:
  - `build-feature`
- Supporting skills:
  - `create-ui-component`
- Deliverable acceptance package (what must exist before task can be marked complete):
  - Reception uses shared theme/provider stack for dark-mode semantics.
  - Modal and form slices migrated to shared primitives with passing tests.
  - Reception DS lint suppression removed or reduced to documented, temporary narrow exceptions.
  - `@apps/reception` validation gate runs meaningful tests (not stub-only).
- Post-delivery measurement plan:
  - DS violation trend (per rule and per directory).
  - Shared import adoption ratio across Reception TSX files.
  - Regression count on migrated routes over first release window.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - None.
- Recommended next step:
  - Proceed to `/plan-feature` using this brief as the execution baseline.
