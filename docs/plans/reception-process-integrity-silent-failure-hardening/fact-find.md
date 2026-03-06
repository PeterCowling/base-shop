---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: reception-process-integrity-silent-failure-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Related-Plan: docs/plans/reception-process-integrity-silent-failure-hardening/plan.md
Trigger-Why: Reception process re-audit surfaced silent-failure and partial-write gaps still present in prepayment, status-toggle, checkout, and email-recipient flows.
Trigger-Intended-Outcome: type: operational | statement: Critical reception mutations fail closed at the UI boundary, activity/email side effects are not duplicated or misclassified, and failure-path verification coverage is materially improved. | source: operator
---

# Reception Process Integrity Silent-Failure Hardening Fact-Find

## Scope
### Summary
Close high-impact reception flow gaps where failures can be silently ignored or misclassified.

### Goals
- Remove duplicate prepayment activity emission for successful payments.
- Ensure check-in status toggle treats `success: false` mutation outcomes as failures.
- Add fail-closed sequencing + compensation for checkout completion/reversal writes.
- Differentiate recipient-fetch infrastructure/data failures from true no-recipient outcomes.
- Replace placeholder verification with behavior assertions for status toggles.

### Non-goals
- Full backend transactional redesign for reception mutations.
- Re-architecture of all statistics/authentication data contracts in this cycle.

## Outcome Contract
- **Why:** Current reception paths still allow silent drift between UI state and persisted mutation state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Critical reception mutations fail closed at the UI boundary, activity/email side effects are not duplicated or misclassified, and failure-path verification coverage is materially improved.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx`
- `apps/reception/src/components/prepayments/MarkAsPaidButton.tsx`
- `apps/reception/src/components/checkins/StatusButton.tsx`
- `apps/reception/src/components/checkout/Checkout.tsx`
- `apps/reception/src/services/useBookingEmail.ts`
- `apps/reception/src/services/useEmailGuest.ts`

### Key Findings
- Prepayment success path could emit code `8` activity twice for one payment operation.
- Status toggle treated thrown errors as failures but not `{ success: false }` contract failures.
- Checkout completion/reversal used split writes (`activity` + `checkout`) with no compensation path.
- Recipient-fetch decode/access failures could collapse into deferred no-recipient semantics.
- Existing status-button test was non-behavioral placeholder coverage.

## Suggested Task Seeds (Non-binding)
- TASK-01: Remove duplicate prepayment code-8 emission path.
- TASK-02: Fail-closed status toggle contract handling for `success: false` results.
- TASK-03: Checkout write sequencing + compensation rollback.
- TASK-04: Guest-email recipient fetch hardening and failure classification.
- TASK-05: Add real verification for status-toggle failure path and checkout compensation path.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-process-integrity-silent-failure-hardening --auto`
