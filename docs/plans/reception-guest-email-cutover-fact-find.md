---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Automation
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-guest-email-cutover
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: wf-build
Supporting-Skills: ops-inbox
Related-Plan: docs/plans/reception-guest-email-cutover-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-ENG-0020
---

# Reception Guest Email Cutover Fact-Find Brief

## Scope
### Summary
Cut over remaining reception guest-email behavior from direct Google Apps Script calls into the MCP/Node path, specifically:
- `useEmailGuest` (direct GAS URL call)
- `useActivitiesMutations` activity-triggered guest-email path

### Goals
- Remove direct `script.google.com` dependency from reception guest-email flow.
- Preserve current activity-trigger semantics (which activity codes trigger guest-email actions).
- Route activity-triggered email behavior through a testable, repo-owned MCP/API contract.
- Keep behavior deterministic and observable (draft/send outcome and failure paths).

### Non-goals
- Migrating unrelated GAS systems (Alloggiati, statistics).
- Refactoring all reception activity-code architecture.
- Replacing inbox monitor triggers in this work item.

### Constraints and Assumptions
- Constraints:
  - Existing front-end entry points must continue working (same user flows in reception).
  - No direct GAS URL usage in new live path.
  - Validation gate applies for `@apps/reception` and `@acme/mcp-server`.
- Assumptions:
  - MCP booking draft route (`/api/mcp/booking-email`) is the canonical in-repo pattern for reception -> MCP email actions.
  - Activity codes remain source of truth for trigger intent.

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/services/useEmailGuest.ts` - current guest-email hook.
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` - activity logging + guest-email trigger.
- `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx` - logs payment attempt activities (5/6/7).
- `apps/reception/src/hooks/orchestrations/emailAutomation/useEmailProgressActions.ts` - logs T&C progression activities (1->2->3->4, and 21).

### Key Modules / Files
- `apps/reception/src/services/useEmailGuest.ts:36`
  - Direct GET to GAS deployment URL with `bookingRef` query param.
- `apps/reception/src/services/useEmailGuest.ts:17`
  - `enableEmail` defaults to `false` (simulated success path unless explicitly enabled).
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:34`
  - Trigger list hardcoded to `[2, 3, 4, 21, 5, 6, 7, 8]`.
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:52`
  - Calls `sendEmailGuest(reservationCode)` when relevant activity is logged.
- `apps/reception/src/app/api/mcp/booking-email/route.ts:5`
  - Existing MCP-backed route pattern (POST -> `sendBookingEmail`).
- `packages/mcp-server/src/tools/booking-email.ts:8`
  - Existing booking-email MCP contract (`bookingRef`, `recipients`, `occupantLinks`) creates Gmail drafts.

### Patterns and Conventions Observed
- Reception already migrated booking email to MCP-only route path:
  - `apps/reception/src/services/useBookingEmail.ts:117`.
- Guest-email path is still legacy direct-GAS style:
  - `apps/reception/src/services/useEmailGuest.ts:36`.
- Activity logging is the orchestration trigger boundary:
  - `useActivitiesMutations` decides whether to call guest-email side effect.

### Data and Contracts
- Current `useEmailGuest` contract:
  - input: `bookingRef: string`
  - output: plain text status in hook state.
  - no activity-code context is passed to downstream email sender.
- Current activity trigger contract in `useActivitiesMutations`:
  - input: `(occupantId, code)`
  - resolution: `occupantId -> reservationCode` via `guestsByBooking/{occupantId}`.
  - side effect: one call to `sendEmailGuest(reservationCode)`.

### Dependency and Impact Map
- Upstream dependencies:
  - Firebase `guestsByBooking` for `reservationCode` lookup.
  - Activity-code emitters (`addActivity`) across prepayment and email-progress workflows.
- Downstream dependents:
  - Any UX path that logs codes in `[2,3,4,21,5,6,7,8]` expects guest-email side effects.
- Blast radius:
  - `apps/reception` hook and mutation layer.
  - `packages/mcp-server` if new tool/route contract is added.
  - Existing tests that currently assert GAS URL behavior.

### Test Landscape
#### Test Infrastructure
- `@apps/reception`: Jest + typecheck + lint.
- `@acme/mcp-server`: Jest + typecheck + lint.

#### Existing Coverage
- `apps/reception/src/services/__tests__/useEmailGuest.test.tsx:51`
  - Asserts direct GAS URL call when `enableEmail: true`.
- `apps/reception/src/hooks/orchestrations/emailAutomation/__tests__/useEmailProgressActions.test.ts:55`
  - Validates progression activity writes via `addActivity` (mocked `useActivitiesMutations`).
- `apps/reception/src/services/__tests__/useBookingEmail.test.ts`
  - Confirms MCP route behavior for booking-email path.

#### Coverage Gaps
- No direct test for `useActivitiesMutations` email side effects per code.
- No integration test covering: `addActivity(code)` -> guest-email route call -> MCP outcome.
- No contract test for guest-email MCP route (because route does not exist yet).

#### Testability Assessment
- Easy to test:
  - Hook-level route calls (`useEmailGuest`, `useActivitiesMutations`) with fetch mocks.
  - Route-level payload validation.
- Hard to test:
  - Parity of legacy GAS behavior (live script internals not fully in repo for this endpoint).

### Recent Git History (Targeted)
- `a763f9b102` - removed GAS fallback in booking-email service (`useBookingEmail`) and standardized MCP route.
- `b142a51dc6` - recent modifications touching reception mutation/services area.
- `docs/plans/archive/email-autodraft-world-class-upgrade-plan.md:876` explicitly deferred guest-email GAS migration and called for wf-fact-find.

## Questions
### Resolved
- Q: Is `useEmailGuest` still direct GAS in live code?
  - A: Yes (`apps/reception/src/services/useEmailGuest.ts:36`).
- Q: Is activity workflow currently wired to that hook?
  - A: Yes (`apps/reception/src/hooks/mutations/useActivitiesMutations.ts:25`, `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:52`).
- Q: Are trigger codes explicitly defined?
  - A: Yes, `[2,3,4,21,5,6,7,8]` in `useActivitiesMutations` (`apps/reception/src/hooks/mutations/useActivitiesMutations.ts:34`).

### Resolved from User Decisions
1. For this cutover, activity-triggered guest-email actions should create **drafts first** (review-first), not send immediately.
   - Captured user direction: "draft-first".
   - Build implication: route/tool defaults to draft generation for all trigger codes.

2. For codes `5/6/7/8`, implement **GAS wording parity first**.
   - Captured user direction: "GAS wording parity first".
   - Build implication: extract/encode legacy wording/structure as acceptance baseline before further tuning.

## Confidence Inputs (for /wf-plan)
- Implementation: 86%
  - Clear replacement seam exists (`useEmailGuest` + new route/tool), and reception already has MCP route precedent.
- Approach: 89%
  - Consolidating guest-email path to MCP matches current architecture direction.
- Impact: 84%
  - Broad activity-driven touchpoints remain, but policy and parity strategy are now explicit.
- Delivery-Readiness: 88%
  - Build path is unblocked after explicit mode and wording decisions.
- Testability: 83%
  - Hook/route seams are straightforward; parity tests need fixture decisions.

### What Would Raise Scores to >=90
- Side-by-side dry-run corpus comparing current output expectations vs MCP output for each trigger code.
- Explicit acceptance matrix by code (2,3,4,21,5,6,7,8) with expected subject/body intent.
- Production mailbox dry-run evidence with zero-regression sign-off.

### Remaining Risk to Track During Build
- Live parity verification for payment-related branches depends on capturing enough real examples from current mailbox history.

## Planning Constraints and Notes
- Must-follow pattern: reception service -> internal API route -> MCP server tool (no direct external script URLs).
- Keep activity trigger ownership in `useActivitiesMutations` unless explicitly redesigned.
- Preserve error visibility (no silent failures masked as success).

## Suggested Task Seeds (Non-binding)
- TASK-S1: Introduce `POST /api/mcp/guest-email-activity` route with typed payload (`bookingRef`, `activityCode`, optional occupant context).
- TASK-S2: Replace `useEmailGuest` direct GAS fetch with internal route call and remove `enableEmail` simulation mode.
- TASK-S3: Update `useActivitiesMutations` to pass activity code/context to the new route.
- TASK-S4: Implement MCP-side guest-email action selection for codes `[2,3,4,21,5,6,7,8]`.
- TASK-S5: Add tests:
  - `useEmailGuest` route call tests.
  - `useActivitiesMutations` side-effect tests by code.
  - route contract tests and failure-path coverage.

## Execution Routing Packet
- Primary execution skill:
  - `wf-build`
- Supporting skills:
  - `ops-inbox`
- Deliverable acceptance package:
  - No direct GAS URL usage in `useEmailGuest`.
  - Activity-trigger path uses MCP route/tool with code-aware payload.
  - Targeted reception + mcp-server tests pass.
  - Dry-run evidence for at least one booking per trigger family (T&C progression, payment progression).
- Post-delivery measurement plan:
  - Count activity-trigger email attempts, failures, and elapsed time to draft/send outcome.
  - Track per-code routing counts for `[2,3,4,21,5,6,7,8]`.

## Pending Audit Work
- Areas examined:
  - `useEmailGuest`, `useActivitiesMutations`, prepayment activity emitters, and existing MCP booking-email route/tool.
- Areas remaining:
  - Live GAS guest-email script internals (for strict output parity verification).
- Specific unknowns:
  - Exact current live wording/branching for activity codes `5/6/7/8` in deployed GAS endpoint.
- Remaining scope estimate:
  - ~1 parity-capture step + ~3 tests after decisions.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none
- Recommended next step:
  - Proceed to `/wf-plan` using the user-confirmed defaults:
    - draft-first delivery mode
    - GAS wording parity first for codes `5/6/7/8`
