---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-17
Last-updated: 2026-02-17
Last-reviewed: 2026-02-17
Feature-Slug: brikette-modal-system-remake
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-replan,lp-refactor
Related-Plan: docs/plans/brikette-modal-system-remake/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Relates-to charter: none
---

# Brikette Modal System Remake Fact-Find Brief

## Scope
### Summary
This fact-find formalizes the modal-system audit using the existing policy-fee panel briefing plus additional evidence requested in review feedback.

Core conclusion: the panel visibility incident was a symptom of broader modal architecture fragility (contracts, orchestration ownership, lifecycle coupling, semantic drift, and missing integration/a11y coverage).

### Goals
- Establish proof-backed root causes with reproducible behavior and evidence anchors.
- Define product, analytics, and accessibility invariants that planning/build must preserve.
- Provide a staged migration path to avoid replacing one fragile system with another.

### Non-goals
- Immediate visual redesign of modal UI.
- Implementing the remake in this fact-find run.
- Changing booking commercial policy without product decision.

### Constraints & Assumptions
- Constraints:
  - Modal flows are conversion-critical; behavioral regressions are high-cost.
  - Existing worktree already contains uncommitted modal fixes; immutable SHA anchors for those exact edits are not yet available.
- Assumptions:
  - Brikette remains modal-first for booking entry in the short term.
  - Existing analytics event families (`modal_open`, `modal_close`, `handoff_to_engine`) remain in use.

## Impact & Reproduction
### User Impact and Severity
- Affected flow: `booking2` modal path opened from room-rate CTAs.
  - Evidence: `apps/brikette/src/components/rooms/RoomCard.tsx:184`, `apps/brikette/src/components/rooms/RoomCard.tsx:198`, `packages/ui/src/organisms/RoomsSection.tsx:205`.
- Affected audience: users attempting room-selected booking handoff (all supported locales).
  - Locale audit result: 18/18 supported locales include `bookPage.policies.title`, `bookPage.policies.items[5]`, `bookPage.policies.footer`.
  - Evidence: `apps/brikette/src/i18n.config.ts:7` and local JSON shape audit (2026-02-17).
- Severity: High (conversion-trust and disclosure visibility risk on a booking-critical step).

### Reproduction (pre-fix behavior)
1. Start on a page with room-card booking2 CTA.
2. Use a short viewport (for example 390x640).
3. Open booking2 modal immediately after page load, before `bookPage` is warm.
4. Observe expected vs observed:
   - Expected: policy panel fully visible with list items.
   - Observed: panel area clipped off-screen and/or list omitted due to unresolved `bookPage` namespace.

### Validation (post-fix behavior)
1. Repeat the same steps.
2. Modal panel is scrollable and bounded to viewport (`max-h-[90dvh]`, `overflow-y-auto`).
3. `bookPage` namespace preload starts from always-mounted provider, reducing first-open empty-state risk.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/context/modal/provider.tsx:46` - app-level modal state + effects host.
- `apps/brikette/src/context/modal/global-modals.tsx:20` - app-level active-modal switcher.
- `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:25` - booking2 orchestration wrapper.
- `packages/ui/src/organisms/modals/BookingModal2.tsx:34` - booking2 modal UI component.

### Key Modules / Files
- `packages/ui/src/context/modal/context.ts:20` - shared modal contract (`modalData: unknown`).
- `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx:46` - `t("policies.items", { returnObjects: true })` + array guard.
- `apps/brikette/src/i18n.namespaces.ts:64` - core preload namespaces omit `bookPage`.
- `apps/brikette/src/i18n.ts:181` - `useSuspense: false` behavior.
- `packages/ui/src/organisms/modals/primitives.tsx:53` - shared frame baseline and modal primitives.

### Evidence Anchors (Proof Payload)
| ID | Claim | Evidence |
|---|---|---|
| E1 | Modal payload contract is untyped and cast-heavy | `packages/ui/src/context/modal/context.ts:22`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:36`, `apps/brikette/src/context/modal/global-modals/BookingModal.tsx:30` |
| E2 | Policy list rendering depends on object-return translation and array shape | `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx:46` |
| E3 | Missing namespace with `returnObjects: true` resolves to key string, not array | Local i18next repro (2026-02-17): `{ "returnObjectsTrue": "policies.items", "isArray": false }` |
| E4 | `bookPage` excluded from core preload set | `apps/brikette/src/i18n.namespaces.ts:64` |
| E5 | Namespace preload patched in provider lifecycle effect | `apps/brikette/src/context/modal/provider.tsx:82` |
| E6 | Booking intent payload can be dropped in booking v1 path | `apps/brikette/src/components/landing/BookingWidget.tsx:186`, `apps/brikette/src/context/modal/global-modals/BookingModal.tsx:29` |
| E7 | Two orchestration stacks exist in parallel | `apps/brikette/src/context/modal/global-modals.tsx:20`, `packages/ui/src/organisms/GlobalModals.tsx:77`, `apps/brikette/src/components/modals/GlobalModals.tsx:1` |
| E8 | Viewport clipping fix currently lives in booking2-specific classes, not centralized contract | `packages/ui/src/organisms/modals/BookingModal2.tsx:62`, `packages/ui/src/organisms/modals/primitives.tsx:53` |
| E9 | Current modal fixes are uncommitted in working tree (no immutable SHA yet) | `git status --short` on `apps/brikette/src/context/modal/provider.tsx` and `packages/ui/src/organisms/modals/BookingModal2.tsx` |
| E10 | Existing tests pass but remain smoke-level for integration risk | `apps/brikette/src/test/components/policy-fee-clarity-panel.test.tsx`, `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` |

### Patterns & Conventions Observed
- Modal wrapper components mix concerns (copy resolution, analytics, navigation policy, business rules, and data shaping) instead of isolating them.
  - Evidence: `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:52`, `apps/brikette/src/context/modal/global-modals/LanguageModal.tsx:129`.
- Provider is effect-heavy and responsible for unrelated concerns.
  - Evidence: `apps/brikette/src/context/modal/provider.tsx:53` through `apps/brikette/src/context/modal/provider.tsx:132`.
- Shared primitives exist but are not the single source of modal behavior invariants.
  - Evidence: `packages/ui/src/organisms/modals/primitives.tsx:99`, while modal-specific classes still duplicate behavior.

### Data & Contracts
- Types/schemas/events:
  - `ModalType` discriminant only; payload is `unknown`.
    - Evidence: `packages/ui/src/context/modal/context.ts:10`.
  - `BookingModal2Props` accepts form values and callbacks, but wrapper composes payload semantics.
    - Evidence: `packages/ui/src/organisms/modals/BookingModal2.tsx:18`.
- Persistence:
  - No durable modal state persistence; modal payload is transient context state.
- API/contracts:
  - Booking handoff URL generation is duplicated and policy-dependent between modal variants.
    - Evidence: `apps/brikette/src/context/modal/global-modals/BookingModal.tsx:72`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:68`.

### Dependency & Impact Map
- Upstream dependencies:
  - `react-i18next` namespace loading behavior, Radix Dialog, app i18n boot order.
- Downstream dependents:
  - Booking conversion flow, GA4 funnel continuity, disclosure compliance perception.
- Likely blast radius for remake:
  - `apps/brikette/src/context/modal/*`
  - `packages/ui/src/context/modal/*`
  - `packages/ui/src/organisms/modals/*`
  - modal trigger callsites in booking/rooms/header/home surfaces.

### Accessibility Risk Surface
- Existing baseline:
  - Radix Dialog provides strong primitives for focus scope and aria linking.
  - Evidence: `packages/ui/src/organisms/modals/primitives.tsx:76`.
- Risk gaps:
  - No explicit integration tests for tab loop, initial focus, focus return, escape close behavior under stacked effects, or iOS scroll-lock interactions.
  - Existing modal tests assert click behavior only.
  - Evidence: `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx:54`.

### Product and Analytics Invariants (for planning gate)
- Product invariant P1: modal intent payload preservation must be deterministic (if payload includes check-in/out/guests, first render reflects it).
- Product invariant P2: booking handoff mode per modal type must be explicit and stable (`same_tab` or `_blank`), not mixed by wrapper side effects.
- Analytics invariant A1: one canonical handoff event contract per booking path.
- Analytics invariant A2: `modal_open` and `modal_close` must remain source-attributed.
- Accessibility invariant X1: focus trap, keyboard escape, visible scroll affordance, and focus return are mandatory acceptance criteria.

### Staged Migration Path (non-binding, architecture-first)
1. Phase 0 - Invariant lock
   - Add failing contract tests for payload preservation, overflow, namespace race, and focus/escape behavior.
2. Phase 1 - Typed modal registry
   - Replace `unknown` payload with discriminated payload map keyed by modal type.
3. Phase 2 - Single orchestration owner
   - Pick one owner (`apps/brikette` or `packages/ui`) and deprecate the other stack.
4. Phase 3 - Effect decomposition
   - Split provider concerns into state host vs effect modules (telemetry, preload, focus/scroll).
5. Phase 4 - Primitive normalization
   - Move viewport and scroll behavior into a shared modal layout contract.
6. Phase 5 - Legacy removal
   - Remove deprecated wrappers and compatibility payload casts.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + Testing Library.
- Commands run in this fact-find:
  - `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/policy-fee-clarity-panel.test.tsx --maxWorkers=2` (PASS)
  - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx --maxWorkers=2` (PASS)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Policy panel variant rendering | unit | `apps/brikette/src/test/components/policy-fee-clarity-panel.test.tsx` | Verifies hostel/apartment item filtering only |
| Modal primitives smoke interactions | unit/integration-smoke | `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` | Verifies click handlers; not viewport, race, or focus lifecycle |
| Modal lifecycle telemetry | unit | `apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx` | Verifies event emission from provider |
| Booking2 handoff telemetry | unit | `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx` | Verifies event payload callbacks, not rendered UX behavior |

#### Coverage Gaps
- Untested paths:
  - First-open namespace race behavior for `PolicyFeeClarityPanel`.
  - Viewport clipping/scroll-reachability assertions.
  - Payload preservation from producers to consumers for booking v1 path.
  - Focus and keyboard interaction invariants.
- Extinct tests:
  - Not investigated in this run.

#### Recommended Test Approach (executable specs)
- Unit tests for:
  - Typed payload registry exhaustiveness (`openModal` producer/consumer compile-time guard).
- Integration tests for:
  - `BookingWidget -> openModal("booking") -> BookingModal` value hydration.
  - `Booking2GlobalModal` first-open with delayed namespace load (assert eventual populated list without reopen).
  - Viewport-constrained modal where policy panel remains reachable via scroll container.
- A11y interaction tests for:
  - Initial focus target, tab loop containment, escape close, focus return to trigger.
- Contract tests for:
  - Booking handoff policy per modal (`same_tab` vs `_blank`) and event invariants.

### Recent Git History (Targeted)
- `516fd6dd70` (`apps/brikette/src/context/modal/provider.tsx`) - modal lifecycle analytics instrumentation baseline.
- `be083505dc` (`packages/ui/src/organisms/modals/BookingModal2.tsx`) - latest committed baseline on this file path.
- Current 2026-02-17 fixes referenced in the briefing are presently in working tree (not yet immutable via commit SHA).

## Questions
### Resolved
- Q: Is the policy panel integration itself broken?
  - A: No. Wiring and render slot are present.
  - Evidence: `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:123`, `packages/ui/src/organisms/modals/BookingModal2.tsx:118`.

- Q: Is the namespace race explanation technically coherent?
  - A: Yes. Missing namespace can yield key-string return for object expectation, producing non-array branch.
  - Evidence: `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx:46` and local i18next repro output.

- Q: Is this isolated to one bug class?
  - A: No. Contract/orchestration/semantics gaps are independent regression multipliers.

### Open (User Input Needed)
- Q1: Which stack is authoritative after remake (`apps/brikette` or `packages/ui`)?
  - Why it matters: determines migration direction and delete path.
  - Decision impacted: architecture plan tasks and ownership.
  - Decision owner: product/engineering lead.
  - Default assumption + risk: default to `apps/brikette` ownership; risk is reduced reusability for other apps.

- Q2: Should booking v1 and booking v2 converge to one product flow?
  - Why it matters: determines payload schema, UI contract, and analytics taxonomy.
  - Decision impacted: migration complexity and backward compatibility.
  - Decision owner: product + growth analytics.
  - Default assumption + risk: keep both temporarily; risk is prolonged semantic drift.

- Q3: Is `bookPage` preload policy global (`CORE_LAYOUT`) or modal-scoped with explicit loading UI?
  - Why it matters: bundle/runtime trade-off and first-open correctness.
  - Decision impacted: i18n architecture and UX behavior.
  - Decision owner: frontend platform + product.
  - Default assumption + risk: modal-scoped explicit preload contract; risk is implementation complexity.

## Confidence Inputs
- Implementation: 84%
  - Basis: clear file-level causes and bounded blast radius.
  - To >=80: already met.
  - To >=90: lock ownership decision (Q1) and v1/v2 convergence decision (Q2).

- Approach: 82%
  - Basis: architecture-first remake path is clear; end-state boundaries still decision-dependent.
  - To >=80: already met.
  - To >=90: approved single-owner architecture and accepted invariants.

- Impact: 88%
  - Basis: booking2 conversion relevance and repeatability of failure modes are well evidenced.
  - To >=80: already met.
  - To >=90: add production telemetry quantifying affected session share.

- Delivery-Readiness: 79%
  - Basis: evidence is strong, but two key product decisions are still open.
  - To >=80: resolve Q1 or declare interim default in plan.
  - To >=90: resolve Q1-Q3 and approve migration phases.

- Testability: 81%
  - Basis: deterministic seams identified and existing jest infra is available.
  - To >=80: already met.
  - To >=90: add one integration harness for viewport + namespace timing.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Partial migration leaves dual orchestration active | Medium | High | Enforce single-owner milestone before deprecations are paused |
| Typed registry adopted but wrappers continue `unknown` casts | Medium | High | Add compile-time contract tests and forbid cast-based payload reads |
| Booking flow standardization breaks existing analytics dashboards | Medium | High | Define event invariants and migration mapping before rollout |
| Accessibility regressions during orchestration rewrite | Medium | High | Add focus/tab/escape/scroll interaction tests in Phase 0 |
| Namespace strategy change increases first-load cost or flicker | Medium | Medium | Decide global vs scoped preload with measurable budget criteria (Q3) |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve conversion behavior while replacing architecture.
  - Treat accessibility invariants as release-blocking criteria.
  - Keep analytics event semantics explicit and versioned.
- Rollout/rollback expectations:
  - Stage rollout by migration phase with kill-switch via owner switcher.
  - Rollback path must retain previous modal host until parity tests pass.
- Observability expectations:
  - Track modal open/close, handoff outcome, and first-open translation readiness signals.

## Suggested Task Seeds (Non-binding)
- Define and implement typed modal payload registry.
- Build single modal host ownership adapter and remove duplicate switchers.
- Decompose provider effects into dedicated modules.
- Add modal integration test harness for viewport, namespace, and a11y interactions.
- Standardize booking handoff semantics and document analytics mapping.

## Execution Routing Packet
- Primary execution skill:
  - `lp-build`
- Supporting skills:
  - `lp-replan`, `lp-refactor`
- Deliverable acceptance package:
  - Type-safe modal contract, single host, invariant tests, migration notes.
- Post-delivery measurement plan:
  - Compare modal conversion and abandonment metrics before/after migration.

## Evidence Gap Review
### Gaps Addressed
- Added impact scope and severity framing.
- Added deterministic repro and post-fix validation workflow.
- Added proof anchors with line-level references and command-backed observations.
- Added product/analytics/a11y invariants and staged migration path.

### Confidence Adjustments
- Approach confidence increased from narrative-level to evidence-linked architecture diagnosis.
- Delivery-readiness remains below 80 until ownership/flow decisions are resolved.

### Remaining Assumptions
- Assumes modal-first booking remains near-term product posture.
- Assumes current uncommitted fixes are intended to be committed without semantic reversal.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - Confirm owner stack decision (Q1).
  - Confirm booking v1/v2 convergence policy (Q2).
- Recommended next step:
  - `/lp-plan docs/plans/brikette-modal-system-remake/fact-find.md`
