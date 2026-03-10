---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-staff-accounts-modal-entry
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Reception Staff Accounts Modal Entry Plan

## Summary
Staff Accounts already exists as a protected page, but it is missing from the active MAN modal navigation used by reception operators. The safest delivery is a narrow additive change: expose the route through the existing MAN modal action list, keep the current page-level permission gate intact, and add regression coverage so route parity does not drift again. No backend or policy broadening is required.

## Active tasks
- [ ] TASK-01: Add Staff Accounts action to the MAN modal route list
- [ ] TASK-02: Add modal navigation regression coverage for the new action

## Goals
- Make Staff Accounts discoverable from the active reception modal navigation.
- Preserve the existing `USER_MANAGEMENT` gate without broadening access.
- Add explicit regression coverage for MAN modal route parity.

## Non-goals
- Changing Staff Accounts authorization policy.
- Implementing account lifecycle or permission editing features.
- Reworking the wider modal taxonomy.

## Constraints & Assumptions
- Constraints:
  - Keep the existing modal permission gating pattern.
  - Preserve the existing page-level gate in `StaffAccountsForm`.
- Assumptions:
  - `AppModals` plus `ManModal` remain the canonical runtime navigation surface.

## Inherited Outcome Contract
- **Why:** User-management actions are operationally important but currently hidden from the primary reception navigation flow, causing friction and discoverability failures for authorized users.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** MAN modal exposes Staff Accounts as a permission-gated action so authorized operators can open the screen without manual URL entry.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-staff-accounts-modal-entry/fact-find.md`
- Key findings used:
  - `ManModal` action definitions are declarative and are the smallest safe edit surface.
  - Existing route wiring already supports modal action navigation once the action exists.
  - The page itself already guards `Permissions.USER_MANAGEMENT`.

## Proposed Approach
- Option A: Add a new navigation surface elsewhere in the app.
- Option B: Extend the existing MAN modal action list and add route tests.
- Chosen approach: Option B. It is the smallest change, follows the current runtime navigation model, and avoids duplicating admin entry points.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add the Staff Accounts MAN modal action with existing permission gating | 95% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add regression coverage for modal action visibility and route navigation | 85% | S | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Additive modal action |
| 2 | TASK-02 | TASK-01 | Lock route parity with tests |

## Tasks

### TASK-01: Add Staff Accounts action to the MAN modal route list
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/components/appNav/ManModal.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/ManModal.tsx`, `[readonly] apps/reception/src/app/staff-accounts/page.tsx`, `[readonly] apps/reception/src/lib/roles.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% - The action list is already the runtime entrypoint.
  - Approach: 95% - Existing permission and route wiring can be reused directly.
  - Impact: 90% - Small additive navigation change with low blast radius.
- **Acceptance:**
  - MAN modal lists a Staff Accounts action.
  - The action routes to `/staff-accounts`.
  - Existing permission gating remains unchanged.
  - No unauthorized path is opened beyond the current page-level gate.
- **Validation contract (TC-01):**
  - TC-01: Authorized operator sees the action and can navigate to `/staff-accounts`.
  - TC-02: Existing MAN modal actions remain unchanged.

### TASK-02: Add modal navigation regression coverage for the new action
- **Type:** IMPLEMENT
- **Deliverable:** code-change in modal tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/appNav/__tests__/Modals.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Existing test suite already covers modal action sets.
  - Approach: 90% - Extend current route assertions instead of inventing a new harness.
  - Impact: 85% - Prevents future route parity regression.
- **Acceptance:**
  - Tests assert Staff Accounts action visibility in MAN modal.
  - Tests assert Staff Accounts action navigates to `/staff-accounts`.
  - Existing modal coverage remains green.
- **Validation contract (TC-02):**
  - TC-01: MAN modal includes Staff Accounts label/action.
  - TC-02: Clicking the action pushes the correct route.

## Risks & Mitigations
- Route parity could drift again if MAN modal is edited without tests.
  - Mitigation: explicit modal action regression coverage.

## Observability
- Logging: None
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Staff Accounts is reachable from the MAN modal for authorized operators.
- [ ] Existing permission boundaries remain intact.
- [ ] Modal route parity is covered by tests.

## Decision Log
- 2026-03-09: Chose the MAN modal additive action approach instead of adding a second admin navigation surface.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = (95*1 + 85*1) / (1 + 1) = 180 / 2 = 90%
