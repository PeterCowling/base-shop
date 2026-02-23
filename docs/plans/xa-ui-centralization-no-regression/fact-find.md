---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Last-reviewed: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-ui-centralization-no-regression
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-refactor, lp-design-system
Related-Plan: docs/plans/xa-ui-centralization-no-regression/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: user requested direct XA UI centralization with explicit non-regression behavior/visual guardrail
---

# XA UI Centralization Without Behavior Drift Fact-Find Brief

## Scope
### Summary
Centralize remaining hand-rolled UI controls in `apps/xa-b` onto shared `@acme/design-system` atoms/molecules so the XA app consumes broader shared primitives without changing current UX behavior, layout, or copy.

### Goals
- Remove remaining local `button`/`input`/`textarea` implementations where shared primitives exist.
- Keep existing app behavior and appearance stable (non-regression by contract).
- Make future variation happen by extending shared primitives, not by ad hoc local controls.

### Non-goals
- Re-theme XA or change visual direction.
- Change copy, routing, API contracts, or business logic.
- Introduce new product behavior.

### Constraints & Assumptions
- Constraints:
  - Existing interactions and affordances must remain unchanged.
  - Preserve existing accessibility labels and control semantics.
  - Keep refactor scope to `apps/xa-b`.
- Assumptions:
  - Existing design-system components can be class-composed to match current visuals.
  - Current XA tests plus targeted lint/typecheck are sufficient for this refactor pass.

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-b/src/components/XaBuyBox.client.tsx` - product detail purchase controls and quantity interaction.
- `apps/xa-b/src/components/XaFiltersDrawer.client.tsx` - filter controls and toggle clusters.
- `apps/xa-b/src/app/access/page.tsx` - access key submission form.
- `apps/xa-b/src/app/access/AccessGate.client.tsx` - invite request form.
- `apps/xa-b/src/app/access/admin/AdminConsole.client.tsx` - admin auth + invite/request actions.

### Key Modules / Files
- `apps/xa-b/src/components/XaFilterChip.tsx` - local remove-chip button.
- `apps/xa-b/src/components/XaMegaMenu.tsx` - local trigger button.
- `apps/xa-b/src/components/XaImageGallery.client.tsx` - local image trigger + prev/next controls.
- `apps/xa-b/src/components/XaProductListing.client.tsx` - local clear-filters control.
- `apps/xa-b/src/components/XaSupportDock.client.tsx` - local dock toggle button.
- `apps/xa-b/src/components/XaShell.tsx` - local theme toggle button.

### Patterns & Conventions Observed
- XA already uses shared DS widely (109 DS imports in `apps/xa-b/src`).
- Remaining local controls are concentrated in 14 files and mostly map directly to `Button`, `IconButton`, `Input`, `Textarea`, `OptionPill`, `QuantityInput`.
- Existing files already rely on DS class composition (`className` overrides), so parity-preserving migration is feasible.

### Data & Contracts
- UI-only refactor scope; no schema/API/storage contract changes required.
- Existing component state contracts remain:
  - Listing filter draft/apply state in `useXaListingFilters`.
  - Cart/wishlist dispatch contracts in `XaCartContext` and `XaWishlistContext`.
  - Access/admin API contracts in `/api/access*` routes.

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/design-system/atoms`, `@acme/design-system/molecules`.
  - `@acme/design-system/primitives/*`.
- Downstream dependents:
  - XA route components rendering these controls.
  - Existing interaction behavior expected by users and tests.
- Likely blast radius:
  - Styling/state props passed to DS primitives.
  - Keyboard/focus behavior if raw controls are swapped incorrectly.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + Next/TS tooling (`apps/xa-b/package.json` scripts).
- Commands:
  - `pnpm --filter @apps/xa-b typecheck`
  - `pnpm --filter @apps/xa-b lint`
  - targeted `pnpm --filter @apps/xa-b test -- <path>`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Core app security/config | unit | `apps/xa-b/src/__tests__/middleware.security.test.ts`, `apps/xa-b/src/__tests__/nextConfig.security.test.ts` | Covers middleware/config behavior, not component-level visual parity |
| Catalog/image/data utils | unit | `apps/xa-b/src/lib/__tests__/demoData.test.ts`, `apps/xa-b/src/lib/__tests__/xaImages.test.ts` | Domain/data coverage; UI controls mostly uncovered |

#### Coverage Gaps
- Untested paths:
  - component-level control semantics for access/admin and listing/PDP interactions.
- Extinct tests:
  - Not investigated.

#### Recommended Test Approach
- Unit/integration smoke around converted components:
  - Access form submit states.
  - Admin console button disabled states.
  - BuyBox quantity constraints.
  - Listing filter clear/apply actions.

### Recent Git History (Targeted)
- `f189a1660f` - DS compliance migration touched XA and indicates ongoing centralization direction.
- `2d7b2f4a36` - XA stealth/privacy hardening indicates access/admin flows are active and high-sensitivity.
- `b142a51dc6` - design-system stabilization commit indicates shared primitives are intended default path.

## Questions
### Resolved
- Q: Should centralization alter look/behavior?
  - A: No. Requirement is strict parity; variation must come from growing shared primitives, not changing XA UX.
  - Evidence: user instruction in current request.

### Open (User Input Needed)
- None for current refactor scope.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: direct primitive mapping exists for all remaining raw controls.
  - >=80 already met by available DS primitives.
  - To reach >=90: run targeted interaction tests for access/admin + gallery/buybox controls.
- Approach: 90%
  - Evidence basis: additive centralization strategy with class-composed parity.
  - To reach >=90: already met.
  - To exceed 95: add lint guard to block new local raw controls where DS alternatives exist.
- Impact: 84%
  - Evidence basis: improved consistency and maintainability with low functional risk.
  - To reach >=90: add regression tests verifying unchanged control behavior.
- Delivery-Readiness: 86%
  - Evidence basis: scope bounded to 14 files and established DS usage in app.
  - To reach >=90: finish targeted lint/typecheck/tests on touched files.
- Testability: 80%
  - Evidence basis: component behavior can be asserted with targeted tests.
  - To reach >=90: add/extend tests for control states and click handlers.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Visual drift from DS defaults | Medium | Medium | Preserve existing classes when swapping to DS primitives; compare before/after snapshots where available |
| Accessibility label regressions | Low | High | Keep existing `aria-label` strings and `aria-pressed` semantics unchanged |
| Disabled/loading state drift | Medium | Medium | Preserve existing disabled conditions and verify with targeted tests/manual checks |
| Unexpected spacing changes | Medium | Low | Use explicit class overrides (`h-auto`, `px`, `py`, `rounded-*`) on migrated controls |

## Planning Constraints & Notes
- Must-follow patterns:
  - Prefer DS atoms/molecules over native controls in app code.
  - Keep raw controls only when no DS equivalent exists (for example hidden inputs).
- Rollout/rollback expectations:
  - Single PR/commit scoped to XA UI controls; rollback is straightforward file-level revert.
- Observability expectations:
  - No telemetry changes expected.

## Suggested Task Seeds (Non-binding)
- Replace raw form controls in access and admin pages with DS `Input`/`Textarea`/`Button`.
- Replace local icon/toggle controls with DS `IconButton`.
- Replace PDP quantity and quick-add local controls with DS `QuantityInput` and `OptionPill`.
- Run targeted `typecheck`, `lint`, and component-relevant tests.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-refactor`, `lp-design-system`
- Deliverable acceptance package:
  - Updated XA components with no raw controls where DS equivalent exists.
  - Validation logs for typecheck/lint/tests.
- Post-delivery measurement plan:
  - Confirm no user-visible behavior changes in access, listing, PDP, gallery, and support dock flows.

## Evidence Gap Review
### Gaps Addressed
- Located and enumerated all remaining raw controls in `apps/xa-b/src`.
- Identified DS primitive/molecule equivalent for each class of control.

### Confidence Adjustments
- Raised approach confidence after confirming direct DS mapping coverage.
- Kept impact/testability below 90 pending targeted regression checks.

### Remaining Assumptions
- Existing class overrides are sufficient to keep visual parity in all viewports.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for implementation start.
- Recommended next step:
  - `/lp-do-plan` (or proceed directly with constrained build because scope and constraints are explicit).
