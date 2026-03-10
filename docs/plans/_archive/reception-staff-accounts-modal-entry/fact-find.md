---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-staff-accounts-modal-entry
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-staff-accounts-modal-entry/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Staff Accounts Modal Entry Fact-Find Brief

## Access Declarations
- None (repo-only investigation)

## Scope
### Summary
Staff Accounts exists as a route (`/staff-accounts`) but is not exposed through the active reception modal navigation. This creates discoverability and workflow friction for authorized operators.

### Goals
- Verify active reception navigation surfaces and route wiring.
- Identify the smallest safe change to expose Staff Accounts in modal navigation.
- Define regression coverage required for modal route parity.

### Non-goals
- Changing Staff Accounts permissions or backend policy.
- Implementing account lifecycle features.

### Constraints & Assumptions
- Constraints:
  - Must preserve existing modal permission model (`interactive` gating via role checks).
  - Must not broaden access beyond existing page-level gate.
- Assumptions:
  - `AppModals` + icon modals are the canonical runtime navigation (not `AppNav`).

## Outcome Contract
- **Why:** User-management actions are operationally important but currently hidden from the primary reception navigation flow, causing friction and discoverability failures for authorized users.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** MAN modal exposes Staff Accounts as a permission-gated action so authorized operators can open the screen without manual URL entry.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/AppModals.tsx` - runtime modal entrypoint.
- `apps/reception/src/components/appNav/ManModal.tsx` - MAN modal action list.
- `apps/reception/src/app/staff-accounts/page.tsx` - Staff Accounts route.

### Key Modules / Files
- `apps/reception/src/components/AppModals.tsx`
  - Active modals are Operations/Till/Management/Man.
- `apps/reception/src/components/appNav/ManModal.tsx`
  - Current actions omit `/staff-accounts`.
- `apps/reception/src/hoc/withIconModal.tsx`
  - Handles route push per action; no extra wiring needed once action is listed.
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
  - Page internally enforces access gate; non-authorized users see nothing.
- `apps/reception/src/lib/roles.ts`
  - `Permissions.USER_MANAGEMENT` already defined.

### Patterns & Conventions Observed
- Modal route actions are declarative `actions: ModalAction[]` arrays (`ManModal`, `ManagementModal`, etc.).
- Authorization for modal clicks uses `interactive={canAccess(...)}` at modal-wrapper level.
- Sensitive page gate is additionally enforced at screen level (`StaffAccountsForm` returns `null` unless `USER_MANAGEMENT`).

### Dependency & Impact Map
- Upstream dependencies:
  - `withIconModal` click behavior.
  - `canAccess` + role resolution in `AuthContext`.
- Downstream dependents:
  - MAN modal test suite (`appNav/__tests__/Modals.test.tsx`) route assertions.
- Likely blast radius:
  - MAN modal only (plus tests).

### Test Landscape
- Existing modal tests validate route labels/actions in `apps/reception/src/components/appNav/__tests__/Modals.test.tsx`.
- Gap: Add assertion for Staff Accounts action visibility and navigation behavior.

## Questions
### Resolved
- Q: Is Staff Accounts already routed in Next app?  
  - A: Yes, route exists at `apps/reception/src/app/staff-accounts/page.tsx`.
  - Evidence: route file imports and renders `StaffAccountsForm`.

- Q: Is modal navigation currently authoritative at runtime?  
  - A: Yes, `AppModals` is mounted by `AuthenticatedApp` and provides the active navigation flow.
  - Evidence: `App.tsx` -> `AuthenticatedApp` -> `AppModals`.

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 95%  
  - Evidence basis: additive action-list update, existing route and gate already present.
- Approach: 93%  
  - Evidence basis: follows existing modal pattern with minimal code-path risk.
- Impact: 88%  
  - Evidence basis: immediate discoverability improvement, no behavior regression expected.
- Delivery-Readiness: 95%  
  - Evidence basis: required files and patterns already established.
- Testability: 92%  
  - Evidence basis: existing modal tests can be extended directly.

What raises scores:
- >=80: already met.
- >=90: add explicit modal test coverage for new action and permission behavior.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Staff Accounts action appears for users who cannot execute it | Low | Low | Keep modal `interactive` role gate + page-level gate unchanged |
| Route parity drift between modal and sidebar definitions | Medium | Low | Add/maintain route assertions in modal tests |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep action declaration in `ManModal` action list.
  - Preserve role-based `interactive` behavior.
- Rollout/rollback expectations:
  - Additive UI route entry; rollback is action removal only.

## Suggested Task Seeds (Non-binding)
- Add Staff Accounts action to `ManModal` list.
- Add/adjust modal tests for action visibility and navigation.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Runtime modal nav entrypoints (`AppModals`, `ManModal`) | Yes | None | No |
| Route target (`/staff-accounts`) and page gate | Yes | None | No |
| Permission boundary (`Permissions.USER_MANAGEMENT`) | Yes | None | No |
| Test coverage for modal action set | Partial | [Moderate] Existing tests do not yet cover new action | Yes |

## Scope Signal
- Signal: right-sized
- Rationale: narrow additive change with clear entrypoints and low blast radius.

## Evidence Gap Review
### Gaps Addressed
- Confirmed runtime nav path vs unused sidebar path.
- Confirmed route exists and is protected by page-level gate.

### Confidence Adjustments
- Reduced Testability from 96 to 92 pending explicit test updates.

### Remaining Assumptions
- MAN modal remains the intended long-term nav surface for admin actions.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan reception-staff-accounts-modal-entry --auto`
