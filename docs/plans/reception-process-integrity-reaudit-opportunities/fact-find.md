---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: reception-process-integrity-reaudit-opportunities
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Related-Plan: docs/plans/reception-process-integrity-reaudit-opportunities/plan.md
Trigger-Why: Re-audit still finds silent mutation-failure behavior and async integrity gaps in reception critical flows.
Trigger-Intended-Outcome: type: operational | statement: Reception activity and financial side effects fail closed and no longer silently drift from UI success states. | source: operator
---

# Reception Re-Audit Opportunities Fact-Find

## Scope
### Summary
Convert latest re-audit findings into fail-closed mutation behavior and targeted verification upgrades.

### Goals
- Enforce fail-closed behavior for activity writes that return `success: false`.
- Remove fire-and-forget critical writes in keycard and loans orchestration paths.
- Fix async removal race in loans mutation cleanup path.
- Improve failure-path verification where current tests only assert call presence.

### Non-goals
- Full backend transaction refactor for all reception domains.
- Stage-wide redesign of reception data model.

## Outcome Contract
- **Why:** Current reception flows can claim success despite failed side effects.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception activity and financial side effects fail closed and no longer silently drift from UI success states.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`
- `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
- `apps/reception/src/components/loans/LoansContainer.tsx`
- `apps/reception/src/hooks/mutations/useLoansMutations.ts`
- `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
- `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx`

### Key Findings
- `logActivity` suppresses `success:false` outcomes.
- Multiple operator flows `await` activity writes but do not validate returned success payloads.
- Keycard/loans paths issue critical writes without awaiting completion.
- Loan cleanup removes transactions in an async race (`forEach` + non-awaited remove).
- Several tests validate invocation only, not behavior on non-throwing mutation failure.

## Suggested Task Seeds (Non-binding)
- TASK-01: Activity fail-closed contract hardening + coverage for non-throwing failures.
- TASK-02: Keycard/loans orchestrations sequencing hardening for async writes.
- TASK-03: Loans cleanup race fix + targeted regression coverage.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-process-integrity-reaudit-opportunities --auto`
