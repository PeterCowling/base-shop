---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-staff-accounts-lifecycle-permissions
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Reception Staff Accounts Lifecycle & Permissions Plan

## Summary
The current Staff Accounts flow only provisions new users and resends setup emails. This plan extends the feature into a full lifecycle surface: list current staff accounts, grant or revoke roles through validated server-side mutations, and support deactivation-first account removal with audit coverage and self-protection guards. The first release deliberately prefers deactivation over hard delete so auth/profile consistency and auditability stay tractable.

## Active tasks
- [ ] TASK-01: Add read model for current staff accounts
- [ ] TASK-02: Add validated role grant/revoke mutation path
- [ ] TASK-03: Add deactivation-first lifecycle mutation with audit protections
- [ ] TASK-04: Extend Staff Accounts UI and regression coverage

## Goals
- Support staff account listing, role mutation, and removal workflows in-app.
- Keep server-authoritative authorization and audit records for all lifecycle changes.
- Prevent self-deactivation and inconsistent auth/profile state.

## Non-goals
- Pete-only identity policy.
- Firebase provider replacement.
- Hard-delete-first lifecycle semantics.

## Constraints & Assumptions
- Constraints:
  - Firebase Auth and RTDB `userProfiles` must remain consistent.
  - Role storage must remain compatible with existing map-shaped rule expectations.
- Assumptions:
  - Deactivation-first is acceptable for v1 lifecycle control.

## Inherited Outcome Contract
- **Why:** Staff access management needs full lifecycle controls; create-only flows leave operational gaps and force manual backend intervention for revocation and permission updates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff Accounts screen supports account create/remove plus permission grant/revoke workflows through validated API paths and clear operator UX.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-staff-accounts-lifecycle-permissions/fact-find.md`
- Key findings used:
  - Current UI/API are create-only.
  - Existing role normalization utilities can support grant/revoke semantics.
  - Existing audit patterns can be extended for lifecycle events.

## Proposed Approach
- Option A: Add hard delete and direct profile mutation in one step.
- Option B: Introduce a deactivation-first lifecycle with explicit role mutation APIs, audited writes, and list UI.
- Chosen approach: Option B. It lowers operational risk, preserves recoverability, and fits the current auth/profile model better than immediate hard deletion.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add list/read model for current staff accounts and profile state | 85% | M | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add role grant/revoke mutation endpoint with audit writes | 85% | M | Pending | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add deactivation-first removal endpoint with self-protection guards | 80% | M | Pending | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Extend Staff Accounts UI for list/edit/deactivate flows and tests | 85% | M | Pending | TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish read model first |
| 2 | TASK-02, TASK-03 | TASK-01 | Role and lifecycle mutations can proceed in parallel once read model exists |
| 3 | TASK-04 | TASK-02, TASK-03 | UI depends on both mutation paths |

## Tasks

### TASK-01: Add read model for current staff accounts
- **Type:** IMPLEMENT
- **Deliverable:** server route(s) and shared types for current staff account listing
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/users/`, `apps/reception/src/types/domains/userDomain.ts`, `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - Existing user profile shape and auth utilities are already in place.
  - Approach: 85% - A list/read contract is the clean base for downstream mutations.
  - Impact: 90% - Establishes operator visibility over current staff state.
- **Acceptance:**
  - Server route returns current staff accounts with current role/profile state.
  - Route is protected by staff auth and appropriate permission checks.
  - Response is shaped for direct UI rendering and downstream mutation reuse.

### TASK-02: Add validated role grant/revoke mutation path
- **Type:** IMPLEMENT
- **Deliverable:** server role mutation contract with audit writes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/users/`, `apps/reception/src/types/domains/userDomain.ts`, `[readonly] apps/reception/database.rules.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - Existing normalize/map role helpers reduce risk.
  - Approach: 85% - Separate mutation path keeps authorization and audit enforcement explicit.
  - Impact: 90% - Closes a real operational gap.
- **Acceptance:**
  - Authorized operators can grant and revoke supported roles.
  - Role writes remain compatible with existing RTDB rule expectations.
  - Audit records are written for each role change.

### TASK-03: Add deactivation-first lifecycle mutation with audit protections
- **Type:** IMPLEMENT
- **Deliverable:** server lifecycle mutation contract for deactivate/remove workflows
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/users/`, `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% - Auth/profile consistency and self-protection rules need careful handling.
  - Approach: 85% - Deactivation-first is the safest first release.
  - Impact: 90% - Removes manual backend reliance for access revocation.
- **Acceptance:**
  - Authorized operators can deactivate a staff account from the UI.
  - Self-deactivation is blocked.
  - Audit records exist for lifecycle changes.
  - Failure paths surface partial-write risk instead of silently succeeding.

### TASK-04: Extend Staff Accounts UI and regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** expanded Staff Accounts management UI and tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`, `apps/reception/src/components/userManagement/__tests__/StaffAccountsForm.test.tsx`, `apps/reception/src/app/api/users/**/__tests__`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - UI grows, but on top of already-defined server contracts.
  - Approach: 85% - One screen can host list, role mutation, and deactivate flows without route sprawl.
  - Impact: 90% - Makes lifecycle features operator-usable.
- **Acceptance:**
  - Staff Accounts screen shows current staff list with role state.
  - Operators can grant/revoke permissions and deactivate accounts with clear feedback.
  - Tests cover success and failure paths for new operations.

## Risks & Mitigations
- Auth/profile writes could diverge on partial failure.
  - Mitigation: deactivation-first flow, explicit error surfacing, and audited server-side sequencing.
- Operators could remove their own access accidentally.
  - Mitigation: self-protection guard in mutation contract and UI.

## Observability
- Logging: audit records for role/lifecycle events
- Metrics: None in first release
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Staff Accounts supports list, role mutation, and deactivation workflows.
- [ ] Server-side authorization and audit coverage exist for all new operations.
- [ ] Tests cover core success/failure paths.

## Decision Log
- 2026-03-09: Chose deactivation-first lifecycle semantics for the first release.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = (85*2 + 85*2 + 80*2 + 85*2) / (2 + 2 + 2 + 2) = 670 / 8 = 83.75% -> 85%
