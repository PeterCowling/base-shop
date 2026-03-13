---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-value-framing-test
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-006
Related-Plan: none
---

# Prime Value Framing Test Micro-Build

## Scope
- Change: Unskip TC-03 in `apps/prime/src/components/pre-arrival/__tests__/value-framing.test.tsx` and ensure the component renders the confidence cue (`t('confidenceCue.readyForArrival')`) when all 5 checklist items are complete.
- Non-goals: No changes to business logic, no new features, no changes to other test files.

## Execution Contract
- Affects: `apps/prime/src/components/pre-arrival/__tests__/value-framing.test.tsx`, `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`, `apps/prime/public/locales/en/PreArrival.json`
- Acceptance checks:
  - TC-03 passes: `screen.getByText('You are ready for arrival')` is found when all checklist items are complete
  - TC-02 continues to pass (no regression)
  - EN locale key `confidenceCue.readyForArrival` present and resolves to `'You are ready for arrival'`
  - Component renders confidence cue div when `completedCount === totalItems`
- Validation commands: CI Prime test suite
- Rollback note: Revert the unskip change in value-framing.test.tsx and remove the confidenceCue block from ReadinessDashboard.tsx if needed.

## Outcome Contract
- **Why:** TC-03 was skipped with no explanation, leaving the confidence cue rendering path completely untested. A bug in the path that shows guests a readiness signal when they are fully prepared for check-in would reach guests undetected.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** TC-03 passes. The confidence cue rendering path has working test coverage.
- **Source:** operator

## Build Evidence

### Changes Delivered (commit fb9e37369f)
- `apps/prime/src/components/pre-arrival/__tests__/value-framing.test.tsx`: Changed `it.skip('TC-03: ...')` to `it('TC-03: ...')` — test re-enabled.
- `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`: Added confidence cue block that renders when `completedCount === totalItems`, using `t('confidenceCue.readyForArrival')`.
- `apps/prime/public/locales/en/PreArrival.json`: Added `confidenceCue.readyForArrival` → `"You are ready for arrival"`.

### Validation
- i18n mock (`apps/prime/__mocks__/react-i18next.ts`) loads from `public/locales/en/` — key `confidenceCue.readyForArrival` resolves to `"You are ready for arrival"`.
- `baseData` in test has all 5 checklist items complete (`routePlanned`, `etaConfirmed`, `cashPrepared`, `rulesReviewed`, `locationSaved` = true), so `completedCount === totalItems` is satisfied.
- TC-02 unchanged — no regression risk.
