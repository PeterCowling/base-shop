---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: caryina-coverage-gap-fill-phase2
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-coverage-gap-fill-phase2/plan.md
Trigger-Source: direct-operator-decision: lp-do-ideas gap fill from caryina coverage review
artifact: fact-find
---

# Caryina Coverage Gap Fill (Phase 2) Fact-Find

## Scope
### Summary
A follow-on gap-fill wave is required after the archived Caryina coverage hardening cycle. Three residual gaps remain: conservative CI coverage thresholds, smoke-only e2e happy-path focus, and incomplete resilience assertions around reconciliation and checkout transition contracts.

### Goals
- Ratchet Caryina app coverage threshold upward without destabilizing CI.
- Add Playwright smoke coverage for unhappy checkout paths and admin session-guard behavior.
- Add route-level resilience tests for reconciliation and auto-reconcile handoff behavior.

### Non-goals
- Full end-to-end browser coverage of all checkout failure classes.
- Infrastructure changes outside Caryina app/workflow scope.

### Constraints & Assumptions
- Tests run in CI only; local validation limited to lint/typecheck/policy gates.
- Changes must remain bounded to Caryina + directly related workflow config/docs.

## Outcome Contract
- **Why:** The first Caryina hardening wave closed major gaps, but remaining weak spots still leave CI confidence below desired production safety for checkout/admin flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Raise Caryina threshold baseline, add targeted unhappy-path smoke tests, and broaden reconciliation/transition resilience assertions while keeping CI stable.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/jest.config.cjs`
- `apps/caryina/e2e/checkout.smoke.spec.ts`
- `apps/caryina/e2e/admin-product-edit.smoke.spec.ts`
- `apps/caryina/src/lib/checkoutSession.server.ts`
- `apps/caryina/src/lib/checkoutReconciliation.server.ts`
- `apps/caryina/src/lib/checkoutReconciliation.server.test.ts`
- `apps/caryina/src/app/api/checkout-session/route.test.ts`

### Key Findings
- Caryina coverage threshold is enforced but still low (`10/5/10/10`).
- Existing smoke e2e focuses on happy paths; no explicit browser-level decline/stock-conflict/admin-expiry assertions.
- Reconciliation server tests do not cover `release.reason === "committed"` or exception branch (`summary.errors += 1`).
- Checkout route tests do not assert auto-reconcile trigger behavior when `CARYINA_CHECKOUT_AUTO_RECONCILE=1`.

## Questions
### Resolved
- Q: Can all three gaps be addressed without runtime behavior refactors?
  - A: Yes. Targeted test additions plus threshold ratchet are sufficient.

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 91%
- Approach: 89%
- Impact: 86%
- Delivery-Readiness: 90%
- Testability: 90%

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Threshold ratchet causes flaky gate failures | Medium | Medium | Ratchet incrementally (phase-2 baseline) and keep branch increase modest |
| E2E unhappy-path tests become brittle | Medium | Medium | Use API interception and deterministic assertions rather than deep UI timing chains |
| Reconciliation coverage misses hidden branch | Low | Medium | Add explicit branch-focused unit tests for committed + exception paths |
