---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-staff-accounts-lifecycle-permissions
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-staff-accounts-lifecycle-permissions/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Staff Accounts Lifecycle & Permissions Fact-Find Brief

## Access Declarations
- None (repo-only investigation)

## Scope
### Summary
Current Staff Accounts UI/API supports only account creation + password reset email. Requested scope includes account subtraction (remove/deactivate) and permission grant/revoke operations.

### Goals
- Identify missing lifecycle operations across UI/API/data.
- Define safe scope for add/remove/permission management.
- Map required authz, auditing, and test coverage.

### Non-goals
- Implementing Pete-only identity policy (separate dispatch).
- Replacing Firebase Auth provider.

### Constraints & Assumptions
- Constraints:
  - Firebase Auth account lifecycle and RTDB `userProfiles` must stay consistent.
  - Role updates must remain compatible with RTDB rules that expect map-shaped roles.
- Assumptions:
  - "Subtraction" means deactivation or deletion with auditable history.

## Outcome Contract
- **Why:** Staff access management needs full lifecycle controls; create-only flows leave operational gaps and force manual backend intervention for revocation and permission updates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff Accounts screen supports account create/remove plus permission grant/revoke workflows through validated API paths and clear operator UX.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` - create-only UI.
- `apps/reception/src/app/api/users/provision/route.ts` - create-only API.

### Key Modules / Files
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
  - Form fields: email/display name/role; actions: create + resend setup email.
  - No account list, no edit permissions, no deactivate/delete path.
- `apps/reception/src/app/api/users/provision/route.ts`
  - Creates Firebase Auth user and writes `userProfiles/{uid}` with single role.
  - Audit writes only `user_provisioned`; no role-change or removal actions.
- `apps/reception/src/types/domains/userDomain.ts`
  - Roles support array/map normalization (`normalizeRoles`) useful for grant/revoke updates.
- `apps/reception/database.rules.json`
  - Security model is role-map driven and can support profile updates with proper authorization.

### Data & Contracts
- Existing create contract:
  - Request body: `{ email, user_name, displayName, role }`.
- Missing contracts:
  - list users
  - update roles (grant/revoke)
  - disable/remove user

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase Auth APIs (account lifecycle) and RTDB `userProfiles` storage.
- Downstream dependents:
  - `requireStaffAuth` role resolution (via `userProfiles`).
  - Any screen using `canAccess`.
- Likely blast radius:
  - Staff accounts UI, new admin API routes, audit event schema.

### Test Landscape
- Existing:
  - Provision route tests (`app/api/users/provision/__tests__/route.test.ts`).
  - Staff accounts form tests (`components/userManagement/__tests__/StaffAccountsForm.test.tsx`).
- Gaps:
  - No tests for role mutation, user deactivation/removal, audit for those operations.

## Questions
### Resolved
- Q: Does current screen already support subtraction / permission edits?  
  - A: No. It supports create + resend only.
  - Evidence: `StaffAccountsForm.tsx` UI/actions.

- Q: Is backend route capable of role updates or removals?  
  - A: No. Route is provisioning-only.
  - Evidence: `/api/users/provision/route.ts` behavior and response model.

### Open (Operator Input Required)
- None required to plan; implementation can proceed with deactivation-first design and explicit confirmations.

## Confidence Inputs
- Implementation: 87%  
  - Evidence basis: clear missing operations and existing auth/profile patterns reusable.
- Approach: 86%  
  - Evidence basis: additive API surface and UI table/actions are straightforward.
- Impact: 92%  
  - Evidence basis: closes operational gap for account governance.
- Delivery-Readiness: 85%  
  - Evidence basis: core primitives exist; no external dependency beyond Firebase APIs already used.
- Testability: 88%  
  - Evidence basis: route + UI tests already established for this domain.

What raises scores:
- >=80: already met.
- >=90: define explicit deletion vs deactivation policy and audit retention rules in plan.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Auth account deleted while profile remains (or reverse) | Medium | High | Use two-phase operation with rollback/error surfacing |
| Permission escalation without audit trail | Medium | High | Add mandatory audit records for grant/revoke/removal actions |
| Removing currently logged-in operator unexpectedly | Low | Medium | Prevent self-deactivation/deletion in API contract |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep server-authoritative authorization checks.
  - Use role-map storage shape in `userProfiles` for rules compatibility.
- Rollout/rollback expectations:
  - Prefer deactivation flag first; hard delete as optional follow-up.

## Suggested Task Seeds (Non-binding)
- Add staff list endpoint and UI table.
- Add role grant/revoke mutation endpoint + UI controls.
- Add deactivate/remove endpoint with confirmation and audit writes.
- Extend tests for all new operations and failure paths.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Existing UI capabilities and gaps | Yes | None | No |
| Existing API capabilities and gaps | Yes | None | No |
| Role model + auth dependencies | Yes | None | No |
| Lifecycle mutation safety model | Partial | [Moderate] Deactivate vs hard-delete semantics must be fixed in planning | Yes |

## Scope Signal
- Signal: right-sized
- Rationale: clear bounded feature area with explicit missing capabilities and manageable integration points.

## Evidence Gap Review
### Gaps Addressed
- Confirmed current UI/API are create-only.
- Confirmed role model and auth boundary reuse opportunities.

### Confidence Adjustments
- Reduced Approach from 90 to 86 pending explicit deactivation policy decision in plan.

### Remaining Assumptions
- Deactivation-first lifecycle is acceptable for first release.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan reception-staff-accounts-lifecycle-permissions --auto`
