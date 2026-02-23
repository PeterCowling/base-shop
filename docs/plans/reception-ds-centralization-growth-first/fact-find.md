---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: reception-ds-centralization-growth-first
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system, lp-refactor
Related-Plan: docs/plans/reception-ds-centralization-growth-first/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: operator-requested DS centralization constraint for Reception app
---

# Reception DS Centralization (Growth-First) Fact-Find Brief

## Scope
### Summary
Define a centralization approach for `apps/reception` where variation comes from expanding shared design-system capabilities, not from changing existing Reception look/behavior. Centralization must be additive and non-regressive.

### Goals
- Move Reception away from app-local/hand-rolled UI patterns by expanding shared DS/UI surface.
- Preserve existing visual output and runtime behavior for current Reception routes during migration.
- Create enforceable migration gates so future centralization does not become big-bang UI rewrites.

### Falsifiable Success Conditions
- For the parity route set, visual baseline diffs remain at `0` approved regressions per migration wave.
- Keyboard/modal interaction checks pass for the parity route set before and after each wave.
- DS centralization progress is additive: shared component/API surface grows first, and only then does app-local usage decrease.

### Non-goals
- A single-pass replacement of all native elements/components in Reception.
- Unscoped visual redesign of Reception operational screens.
- Forcing DS primitives that change DOM/layout contracts without compatibility shims.

### Constraints & Assumptions
- Constraints:
  - Reception is an active operational tool with `26` route entry pages (`apps/reception/src/app/**/page.tsx`).
  - Current codebase still has high native element usage at HEAD: `270` `<button>` tags, `134` `<input|select|textarea>` tags, `561` table-structure tags (`<table|thead|tbody|tr|th|td`).
  - Reception lint policy is explicitly phased and still disables key DS structural rules (`eslint.config.mjs:2342`).
- Assumptions:
  - Shared DS packages are mature enough to absorb new compatibility components.
  - Behavior-safe migration requires compatibility-first APIs, not direct primitive swaps.

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/layout.tsx` - app shell and global UI frame.
- `apps/reception/src/App.tsx` - top-level interaction container and notification wiring.
- `apps/reception/src/components/**` - primary UI surface area.
- `eslint.config.mjs:2342` - Reception DS rule posture.

### Key Modules / Files
- `apps/reception/src/App.tsx:13` - deep import of NotificationCenter internals (`@acme/ui/components/organisms/...`) indicates central API surface mismatch.
- `packages/design-system/src/primitives/input.tsx:101` - `Input` always wraps with `FormField` + wrapper structure.
- `packages/design-system/src/primitives/textarea.tsx:79` - `Textarea` also wraps with `FormField`.
- `packages/design-system/src/primitives/table.tsx:23` - `Table` injects an extra wrapper `<div className="w-full overflow-x-auto">`.
- `eslint.config.mjs:2348` - `ds/enforce-layout-primitives` remains off for Reception.
- `docs/plans/archive/reception-ui-theme-centralization-fact-find.md` - prior phase documented this same migration class as phased/non-big-bang.

### Verification Snapshot (2026-02-23)
- Route-entry count command:
  - `find apps/reception/src/app -name 'page.tsx' | wc -l`
  - Observed: `26`
- Native element footprint at `HEAD` commands:
  - `git grep -n "<button\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `270`
  - `git grep -n "<input\\b\\|<select\\b\\|<textarea\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `134`
  - `git grep -n "<table\\b\\|<thead\\b\\|<tbody\\b\\|<tr\\b\\|<th\\b\\|<td\\b" HEAD -- apps/reception/src/components apps/reception/src/app | wc -l` -> `561`
- Probe disruption signal:
  - Broad codemod touched `121` files (`changed=121` from migration script output).
  - Follow-up lint run produced `159` errors (`pnpm --filter @apps/reception lint`).

### Patterns & Conventions Observed
- Reception already centralizes tokens and some DS components, but still relies heavily on local UI composition.
- DS primitives are not always drop-in equivalents for native tags because they can change wrapper/layout structure.
- Lint posture confirms intentional phased migration, not complete conformance at current state.

### Data & Contracts
- UI contract to preserve:
  - Existing class-driven layout/output in operational tables/forms/buttons.
  - Existing dark/light behavior and user preference persistence.
- Migration contract to add:
  - "No visual/behavior change" baseline for current UI.
  - New shared components must be parity-capable before replacement is allowed.

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/design-system`
  - `@acme/ui`
  - `@themes/base`
  - `eslint-plugin-ds` rule set
- Downstream dependents:
  - Reception route UIs and modal-heavy workflows.
  - Existing tests across hooks/components.
- Likely blast radius:
  - Login/auth UI, modal flows, data tables, reconciliation screens.

### Test Landscape
#### Test Infrastructure
- Jest for Reception package (`apps/reception/package.json`).
- Extensive unit/integration coverage under `apps/reception/src/**/__tests__`.
- No established reception-specific visual parity suite for DS centralization migrations.

#### Existing Test Coverage
- Strong logic and data-layer test coverage.
- Limited explicit screenshot/visual contract coverage for unchanged UI rendering.

#### Coverage Gaps
- Missing migration-specific "before/after visual parity" gate.
- Missing interaction-parity contract for major operational flows during DS extraction.

#### Recommended Test Approach
- Add parity harness before migration waves:
  - Route-level screenshot baselines for top operational pages.
  - DOM-structure snapshots for high-risk shared wrappers (buttons/tables/forms).
  - Focus/keyboard interaction parity checks for modal and table flows.

### Recent Git History (Targeted)
- `8f3af9bb0c` - DS compliance escalation for Reception selective rules.
- `0b4e4ae4de` / `4ade2a21e0` - Reception DS override restructuring history.
- `97f2350726` / `9cb48b1d4c` - recent Reception stabilization/fixes indicating active churn.

### Probe Finding (Non-regressive Constraint Validation)
- A broad mechanical codemod probe (native -> DS `Button` and table primitives) touched `121` files and produced `159` lint errors immediately (import ordering + unused imports + structural mismatches).
- This probe is evidence that direct replacement is not a safe migration mechanism for Reception.
- Conclusion: big-bang conversion changes implementation shape too aggressively; growth-first compatibility layer is required.

## Hypothesis & Validation Landscape
### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Centralization can be done without visible/behavioral regressions if shared DS grows compatibility primitives first. | Shared DS extension path | Medium | 1-2 weeks |
| H2 | Direct native-to-DS primitive replacement is too disruptive for Reception and should be avoided. | Current DS primitive contracts | Low | <1 day (already probed) |
| H3 | Reception can adopt strict DS structural rules after compatibility migration waves. | Wave-based rollout + parity tests | Medium | 2-4 weeks |

### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Existing DS primitives are structurally non-drop-in; prior phased plan succeeded on narrower scopes | `packages/design-system/src/primitives/*.tsx`, archive fact-find/plan | Medium |
| H2 | Probe created high immediate breakage with mechanical conversion | Current lint probe result (`159` errors) | High |
| H3 | Lint config already tracks phased migration posture | `eslint.config.mjs:2342` | Medium |

### Recommended Validation Approach
- Quick probes:
  - Build "compatibility primitives" in shared DS/UI for one vertical (button + table cell actions) and validate no visual deltas.
- Structured tests:
  - Add baseline screenshots + interaction checks for 5 highest-risk Reception routes.
- Deferred validation:
  - Re-enable stricter DS lint rules only after each migration wave reaches parity.

## Questions
### Resolved
- Q: Can we centralize via direct broad primitive replacement safely?
  - A: No; probe evidence indicates high disruption.
  - Evidence: broad codemod probe + lint failure profile.
- Q: Does Reception already have phased DS migration precedent?
  - A: Yes.
  - Evidence: `docs/plans/archive/reception-ui-theme-centralization-fact-find.md`.

### Open (User Input Needed)
- Q: Which routes are the mandatory "zero-change" parity set for sign-off (minimum recommended: login, checkin, checkout, till-reconciliation, safe-management)?
  - Why it matters: defines required screenshot/interaction baselines.
  - Decision impacted: wave acceptance criteria and release gating.
  - Decision owner: operator.
  - Default assumption (if none): use the 5-route set above; risk is missing a high-churn route.

## Confidence Inputs
- Implementation: 82%
  - Evidence basis: clear architecture path (compatibility-first growth), prior phased precedent.
  - To >=90: complete one full wave with parity tests green and no visual diffs.
- Approach: 90%
  - Evidence basis: direct replacement failed quickly; growth-first matches constraints.
  - To >=90+: lock compatibility contract in shared DS and enforce in plan gates.
- Impact: 78%
  - Evidence basis: Reception surface is broad and operationally sensitive.
  - To >=90: define route-tier blast radius matrix and wave-specific rollback playbooks.
- Delivery-Readiness: 74%
  - Evidence basis: no dedicated visual parity harness yet.
  - To >=90: establish parity CI jobs before migration tasks start.
- Testability: 76%
  - Evidence basis: strong unit tests exist; migration parity tests do not.
  - To >=90: add deterministic screenshot + keyboard interaction suites for migration waves.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Shared primitives alter DOM/layout unexpectedly | High | High | Add compatibility variants/components first; prove parity on pilot routes |
| Big-bang codemods create large mechanical churn | High | High | Ban broad replacement without parity harness and per-wave scope limits |
| Rule escalation before compatibility readiness blocks delivery | Medium | Medium | Escalate lint rules only per migrated directories |
| Deep import usage bypasses stable DS APIs | Medium | Medium | Add/expand public exports in `@acme/ui` and migrate call sites gradually |
| Missing visual baselines hides regressions | Medium | High | Add route-level screenshot and interaction parity checks as gate |

## Planning Constraints & Notes
- Must-follow patterns:
  - Centralization must be additive: grow shared component capability before replacing app-local usage.
  - Replacement wave cannot merge without visual + behavior parity evidence.
  - Use public package entrypoints (`@acme/ui`, `@acme/design-system/*`) only.
- Rollout/rollback expectations:
  - Wave-based migration by route/feature domain.
  - Rollback by wave (no cross-wave bundling).
  - Pre-committed rollback trigger: any parity-route visual/interaction regression that is not fixed in-wave reverts that wave before progressing.
- Observability expectations:
  - Report DS adoption deltas and parity test results per wave.

## Suggested Task Seeds (Non-binding)
- Add shared compatibility primitives in DS/UI for Reception-critical patterns:
  - `ButtonCompat` (style-neutral default mode)
  - `TableCompat` (optional no-wrapper mode)
  - `InputCompat` / `TextareaCompat` (no implicit `FormField` wrapper mode)
- Define "Parity Contract Pack" for top Reception routes (visual snapshots + interaction specs).
- Create migration waves by domain:
  - Wave 1: shared export/API growth + deep import cleanup.
  - Wave 2: low-risk wrappers/components.
  - Wave 3: table/form-heavy operational screens.
- Escalate DS rules per-wave after parity passes.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-system`, `lp-refactor`
- Deliverable acceptance package:
  - Shared DS/API growth merged first.
  - No-regression parity evidence for each migration wave.
  - Reception route behavior unchanged for approved parity set.
- Post-delivery measurement plan:
  - Per-wave DS adoption metrics.
  - Visual/interaction parity pass rate.
  - Regression incident count by route.

## Evidence Gap Review
### Gaps Addressed
- Verified actual DS primitive wrapper behavior from source (input/textarea/table).
- Verified current Reception DS lint posture from active config.
- Verified current native-element footprint at HEAD and broad-sweep disruption signal.

### Confidence Adjustments
- Reduced Impact and Delivery-Readiness confidence due missing visual parity harness.
- Kept Approach high because evidence strongly favors growth-first over replacement-first.

### Remaining Assumptions
- Shared DS maintainers will accept compatibility-surface growth for operational apps.
- Route parity baseline set will be confirmed by operator before `/lp-do-plan`.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None (default parity route set will be used unless operator overrides during planning).
- Recommended next step:
  - `/lp-do-plan docs/plans/reception-ds-centralization-growth-first/fact-find.md`
