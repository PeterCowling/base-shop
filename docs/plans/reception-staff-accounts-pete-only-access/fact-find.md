---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: API
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: reception-staff-accounts-pete-only-access
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-staff-accounts-pete-only-access/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Staff Accounts Pete-Only Access Fact-Find Brief

## Access Declarations
- None (repo-only investigation)

## Scope
### Summary
Current Staff Accounts authorization is role-based (`owner`/`developer`). Requested change is identity-specific restriction to Pete account only.

### Goals
- Map current auth boundaries for Staff Accounts UI and API.
- Identify safe architecture options for identity-specific gating.
- Surface irreducible operator inputs needed to define the policy without lockout risk.

### Non-goals
- Implementing identity gate in this phase.
- Defining account lifecycle UX.

### Constraints & Assumptions
- Constraints:
  - Must not weaken existing role-based boundaries.
  - Must remain enforceable on both UI and API paths.
- Assumptions:
  - "Pete account" must be represented as a stable identity key (uid or normalized email), not display name.

## Outcome Contract
- **Why:** User-account provisioning is high-risk; the operator requested strict ownership control to prevent unauthorized account or permission changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff Accounts actions are restricted to the Pete account under a clear, testable access policy with denied users blocked from executing management operations.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` - UI gate.
- `apps/reception/src/app/api/users/provision/route.ts` - provisioning endpoint gate.
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` - caller identity and role extraction.

### Key Modules / Files
- `apps/reception/src/lib/roles.ts`
  - `Permissions.USER_MANAGEMENT` is role-array based only.
- `apps/reception/src/context/AuthContext.tsx`
  - Runtime user object contains `uid`, `email`, `roles`.
- `apps/reception/src/services/firebaseAuth.ts`
  - User profiles loaded from `userProfiles/{uid}`; resolved identity fields available.
- `apps/reception/src/components/prepare/DateSelectorPP.tsx`
  - Existing pattern uses role privilege (`isPrivileged`) rather than identity-specific check.
- `apps/reception/database.rules.json`
  - DB rules already encode role-based access but not a Pete identity carve-out.

### Data & Contracts
- Auth identity available server-side:
  - `requireStaffAuth` returns `uid`, `email`, `roles`.
- Auth identity available client-side:
  - `useAuth().user` includes `uid`, `email`, `displayName`, `roles`.

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase Auth lookup + `userProfiles` role mapping.
- Downstream dependents:
  - Staff account provisioning endpoint and any future mutation endpoints.
- Likely blast radius:
  - Auth policy utility, StaffAccountsForm UI, `/api/users/provision`.

### Test Landscape
- Existing tests cover StaffAccountsForm role behavior and API route authorization.
- Gap: no tests for identity-specific restriction (uid/email allowlist) and denial states.

## Questions
### Resolved
- Q: Is current enforcement only role-based?  
  - A: Yes. UI and API gates check `Permissions.USER_MANAGEMENT` roles, not identity.
  - Evidence: `StaffAccountsForm.tsx`, `/api/users/provision/route.ts`.

### Open (Operator Input Required)
- Q: What is the canonical Pete identity key for enforcement? (`uid` preferred, fallback `email`)  
  - Why operator input is required (not agent-resolvable): repository contains no authoritative Pete uid/email policy source.
  - Decision impacted: hard authorization rule and fail-safe behavior.
  - Decision owner: Pete.
  - Default assumption (if any) + risk: assume email string match; risk is brittleness if email changes.

- Q: Is there an emergency break-glass secondary admin identity?  
  - Why operator input is required (not agent-resolvable): this is governance policy, not discoverable from code.
  - Decision impacted: lockout recovery design.
  - Decision owner: Pete.
  - Default assumption (if any) + risk: no break-glass; risk is full lockout if Pete identity unavailable.

## Confidence Inputs
- Implementation: 82%  
  - Evidence basis: identity fields exist both client/server.
- Approach: 68%  
  - Evidence basis: unresolved canonical identity key + break-glass policy.
- Impact: 90%  
  - Evidence basis: materially reduces unauthorized admin operations.
- Delivery-Readiness: 70%  
  - Evidence basis: blocked on policy constants.
- Testability: 84%  
  - Evidence basis: deterministic allow/deny tests feasible once identity input is fixed.

What raises scores:
- >=80: operator provides canonical Pete identity key.
- >=90: operator also confirms break-glass policy and auditing expectations.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hard-coded email gate breaks on account changes | Medium | High | Use uid-based allowlist constant with documented rotation path |
| No break-glass path causes admin lockout | Low | High | Define secondary owner identity or explicit recovery runbook |
| UI-only gating bypassed via API calls | Medium | High | Enforce identical gate in API layer and test directly |

## Planning Constraints & Notes
- Must-follow patterns:
  - Enforcement must be server-authoritative; UI gate is secondary.
  - Avoid display-name checks for authorization decisions.

## Suggested Task Seeds (Non-binding)
- Introduce centralized `isStaffAccountsOperator(user)` policy helper.
- Apply helper to StaffAccountsForm and `/api/users/provision` route.
- Add allow/deny tests for both surfaces.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Client gate (`StaffAccountsForm`) | Yes | None | No |
| API gate (`/api/users/provision`) | Yes | None | No |
| Identity source (`AuthContext`, `staff-auth`) | Yes | None | No |
| Governance constraints (canonical Pete key + break-glass) | No | [Critical] Missing operator-defined identity policy | Yes |

## Scope Signal
- Signal: constrained
- Rationale: technical path is clear, but critical governance input is missing; implementing without it risks lockout or brittle policy.

## Evidence Gap Review
### Gaps Addressed
- Confirmed all current auth boundaries and where identity fields are available.

### Confidence Adjustments
- Lowered Approach and Delivery-Readiness due to unresolved policy inputs.

### Remaining Assumptions
- Pete-only policy will be enforced by stable uid once provided.

## Planning Readiness
- Status: Needs-input
- Blocking items:
  - Canonical Pete identity key.
  - Break-glass policy decision.
- Recommended next step:
  - Provide blocking inputs, then run `/lp-do-plan reception-staff-accounts-pete-only-access --auto`.
