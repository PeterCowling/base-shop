---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Automation
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: legacy-booking-gas-takeover
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: ops-inbox
Related-Plan: docs/plans/legacy-booking-gas-takeover-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-ENG-0020
---

# Legacy Booking GAS Takeover Fact-Find Brief

## Scope
### Summary
Take over remaining legacy booking-processing behavior currently tied to Google Apps Script (GAS), and move it into the MCP/Node stack so booking monitoring and guest-facing drafting run from one runtime with testable code paths.

### Goals
- Replace remaining booking-processing GAS dependencies in reception and inbox workflows.
- Preserve required booking behavior (reservation parsing, booking-source logic, payment-term messaging, agreement flow triggers).
- Keep manual review control while removing split-brain operations between GAS and MCP.
- Remove hardcoded GAS booking endpoints from active booking-processing paths.

### Non-goals
- Migrating Alloggiati and unrelated statistics scripts in this phase.
- Full redesign of branded booking email template visuals.
- Fully automated send without human review.

### Constraints and Assumptions
- Constraints:
  - Existing booking draft behavior must not regress for current reception workflows.
  - Inbox organize pass must continue to process all unread items (no date-window restriction by default).
  - If classification confidence is low, items must be deferred and surfaced for manual instruction.
- Assumptions:
  - Booking email draft creation via MCP (`mcp_send_booking_email`) is production-ready and remains the baseline.
  - Gmail API credentials and label hierarchy remain available.

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/services/useEmailGuest.ts` - active guest-email GAS call.
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` - invokes `useEmailGuest` on activity codes.
- `packages/mcp-server/src/tools/gmail.ts` - inbox organizer and booking-monitor routing logic.
- `apps/brikette-scripts/src/email-monitor/Code.gs` - legacy inbox labeling monitor.
- `apps/brikette-scripts/src/booking-monitor/_RunBookingMonitor.gs` + helper files - legacy booking monitor components.

### Key Modules / Files
- `apps/reception/src/services/useBookingEmail.ts:117` posts to `/api/mcp/booking-email`; GAS fallback already removed.
- `apps/reception/src/services/useEmailGuest.ts:36` still fetches deployed GAS endpoint directly.
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:52` triggers `sendEmailGuest(reservationCode)` for activity events.
- `packages/mcp-server/src/tools/gmail.ts:677` routes Octorate `NEW RESERVATION` to `booking_monitor` (no mutation), intentionally bypassing organizer labels.
- `packages/mcp-server/src/tools/gmail.ts:775` default organize query is `is:unread in:inbox` (all unread, no date restriction unless explicitly passed).
- `apps/brikette-scripts/src/email-monitor/Code.gs:96` still defines 30-min GAS inbox scanning and `Needs-Processing` labeling.
- `apps/brikette-scripts/src/booking-monitor/_RunBookingMonitor.gs:40` calls `scanNewEmailsForBookings(RUN_CONFIG)`, but this function is not present in checked-in `apps/brikette-scripts/src/booking-monitor/*.gs` files.

### Patterns and Conventions Observed
- Label-state workflow is canonical in MCP Gmail tools (`Brikette/*` labels and explicit `gmail_mark_processed` transitions).
- Organizer supports explicit `deferred` handling plus sender reporting for user instruction (`followUp.deferredNeedsInstruction`).
- Booking monitor legacy behavior is sender/subject driven (`noreply@smtp.octorate.com` + `NEW RESERVATION`).

### Data and Contracts
- MCP booking draft tool contract:
  - Input: `bookingRef`, `recipients[]`, `occupantLinks[]` (`packages/mcp-server/src/tools/booking-email.ts:8`).
  - Output: Gmail draft id/message id (`packages/mcp-server/src/tools/booking-email.ts:103`).
- Reception booking flow builds recipients from Firebase and links from occupant IDs (`apps/reception/src/services/useBookingEmail.ts:99`, `apps/reception/src/services/useBookingEmail.ts:115`).
- Legacy booking parsing/business rules currently represented in GAS helpers:
  - Reservation/guest/email extraction regexes (`apps/brikette-scripts/src/booking-monitor/_BookingUtilities.gs:8`).
  - Hostelworld commission adjustment (`apps/brikette-scripts/src/booking-monitor/_BookingUtilities.gs:61`).
  - Booking source by reservation-code shape (`apps/brikette-scripts/src/booking-monitor/_EmailsHelper.gs:49`).
  - Non-refundable action-required wording block (`apps/brikette-scripts/src/booking-monitor/_BookingImporterEmail.gs:54`).

### Dependency and Impact Map
- Upstream dependencies:
  - Gmail API auth and label permissions.
  - Firebase reservation/guest detail reads in reception.
  - Octorate notification format consistency.
- Downstream dependents:
  - Reception booking and activity email triggers.
  - `/ops-inbox` operational workflow and queue shape.
  - Inbox state seen by operators in Gmail.
- Likely blast radius:
  - `packages/mcp-server` (gmail tools + new booking processor module).
  - `apps/reception` (`useEmailGuest` replacement and call sites).
  - `apps/brikette-scripts` docs/scripts deprecation and migration notes.

### Test Landscape
#### Test Infrastructure
- `@apps/reception`: Jest + typecheck + lint (`apps/reception/package.json`).
- `@acme/mcp-server`: Jest suite + typecheck + lint (`packages/mcp-server/package.json`).
- `@apps/brikette-scripts`: no executable lint/typecheck for `.gs` logic (`apps/brikette-scripts/package.json`).

#### Existing Coverage
- `apps/reception/src/services/__tests__/useBookingEmail.test.ts:31` verifies MCP-only booking-email routing.
- `apps/reception/src/services/__tests__/useEmailGuest.test.tsx:52` still asserts GAS URL call.
- `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts:398` verifies NEW RESERVATION bypass to legacy booking monitor.
- `packages/mcp-server/src/__tests__/booking-email.test.ts:23` verifies draft creation with occupant links.

#### Coverage Gaps
- No parity tests against live GAS booking monitor behavior (especially missing `scanNewEmailsForBookings`).
- No MCP-native test for processing NEW RESERVATION end-to-end from inbox event to draft + label update.
- No auth/rate-limit guard tests for reception booking-email route (`apps/reception/src/app/api/mcp/booking-email/route.ts:5`).

#### Testability Assessment
- Easy to test:
  - Reception hooks and MCP tool units (existing patterns).
  - Gmail organizer classification decisions.
- Hard to test:
  - Exact parity with deployed GAS booking monitor code not fully mirrored in repo.
  - Cross-runtime behavioral equivalence (Apps Script trigger flow vs MCP polling loop).

### Recent Git History (Targeted)
- `a763f9b102` - removed booking-email GAS fallback in reception (`useBookingEmail`).
- `02d3e5a113` - added prepayment chase workflow changes in MCP gmail tooling.
- `a094e85d18` - checkpoint commit touching current workspace state.

## External Research
- Not required for this lp-fact-find; repository evidence was sufficient to define migration approach and blockers.

## Questions
### Resolved
- Q: Is booking-email draft sending already migrated off GAS?
  - A: Yes. Reception booking draft path is MCP-only (`apps/reception/src/services/useBookingEmail.ts:117`).
- Q: Is inbox organizer currently handling all unread messages by default?
  - A: Yes (`packages/mcp-server/src/tools/gmail.ts:775`).
- Q: Is NEW RESERVATION currently still delegated to legacy behavior?
  - A: Yes, organizer bypasses these messages (`packages/mcp-server/src/tools/gmail.ts:677`).

### Open (User Input Needed)
1. Do you want strict parity-first migration of legacy booking monitor behavior, or a simplified MCP-native redesign with only the essential rules?
   - Why it matters: determines whether we first replicate all legacy branches (higher effort, lower behavior risk) vs redesign (lower effort, higher behavior drift risk).
   - Decision impacted: task breakdown and acceptance criteria for booking notification handling.
   - Recommended default: parity-first for first cut, then simplify in a second pass.

2. Can we export the current live GAS `booking-monitor` project source (especially `scanNewEmailsForBookings`) into repo before build?
   - Why it matters: checked-in source is incomplete for true parity.
   - Decision impacted: confidence in migration correctness and test fixture completeness.
   - Recommended default: yes; make this the first implementation task.

## Confidence Inputs (for /lp-plan)
- Implementation: 78%
  - Strong for reception and MCP surfaces; reduced by incomplete live GAS source parity.
- Approach: 84%
  - Single-runtime MCP approach is coherent and aligns with completed TASK-10 direction.
- Impact: 76%
  - Touches organizer routing, reception activity flow, and inbox operations; regressions are possible without parity fixtures.
- Delivery-Readiness: 72%
  - Clear build path exists, but missing live GAS source and scope preference currently block high-confidence execution.
- Testability: 70%
  - Good unit-test base; weakest area is parity validation against currently deployed GAS behavior.

### What Would Raise Scores to >=80
- Export and commit current live GAS booking monitor source.
- Define acceptance matrix for NEW RESERVATION, NEW CANCELLATION, non-refundable action-required, and activity-triggered guest emails.
- Add end-to-end MCP integration test for reservation-notification intake to draft output.

### What Would Raise Scores to >=90
- Side-by-side replay test harness: same fixture corpus through legacy logic snapshot and MCP logic, diff outputs.
- Dry-run in production mailbox with sampling report and zero-regression sign-off.
- Rollout guard with feature flag and explicit rollback procedure for first production cut.

## Planning Constraints and Notes
- Must preserve current operator controls (`deferred`, manual review, label visibility).
- Remove hardcoded GAS IDs from active booking-processing code paths.
- Keep idempotency guarantees for repeated organizer/booking-processing runs.
- Do not classify reservation notifications as promotional/spam during migration.

## Suggested Task Seeds (Non-binding)
- TASK-S1: Capture live GAS parity baseline.
  - Export `booking-monitor` and `guest-email` live scripts into repo; build fixture corpus from real Octorate messages.
- TASK-S2: Implement MCP booking-notification processor.
  - New tool/service for Octorate NEW RESERVATION intake, parsing, and draft handoff.
- TASK-S3: Replace `useEmailGuest` GAS call with MCP route/tool.
  - Preserve current trigger points in `useActivitiesMutations`.
- TASK-S4: Rewire organizer from `booking_monitor` bypass to MCP booking pipeline enqueue/processing semantics.
- TASK-S5: Add safety rails and tests.
  - Idempotency tests, parity tests, and route hardening tests.
- TASK-S6: Remove/deprecate GAS booking-processing docs and stale flags.

## Execution Routing Packet
- Primary execution skill:
  - `lp-build`
- Supporting skills:
  - `ops-inbox`
- Deliverable acceptance package:
  - MCP-native booking-processing flow replaces legacy GAS booking monitor and guest-email endpoint for targeted scope.
  - Targeted test suites pass in `@acme/mcp-server` and `@apps/reception`.
  - Migration runbook documents cutover, validation, and rollback.
- Post-delivery measurement plan:
  - Track count of NEW RESERVATION events processed by MCP vs deferred/manual.
  - Track draft creation success/failure and processing latency.
  - Track misclassification/defer rate for booking notifications during first 2 weeks.

## Pending Audit Work
- Areas examined:
  - `apps/reception` booking + guest email hooks
  - `packages/mcp-server` organizer + booking-email tools + tests
  - `apps/brikette-scripts` email monitor and booking helper files
- Areas remaining:
  - Live GAS booking-monitor source currently deployed but not fully mirrored in repo (`scanNewEmailsForBookings` implementation missing in checked-in files).
- Specific questions needing answers:
  - Exact live trigger query/filtering logic and post-send labeling behavior in production GAS script.
  - Whether live script writes additional side effects (Firebase/logs/activities) not represented in repo files.
- Resumption entry points:
  - `apps/brikette-scripts/src/booking-monitor/_RunBookingMonitor.gs`
  - `apps/brikette-scripts/README.md`
  - script.google.com deployment referenced in `_RunBookingMonitor.gs` header
- Remaining scope estimate:
  - ~1 live script export + 3-5 integration tests to close parity unknowns.

## Planning Readiness
- Status: Needs-input
- Blocking items:
  - Confirm parity-first vs redesign-first migration strategy.
  - Provide/export live GAS booking-monitor source for missing runtime function parity.
- Recommended next step:
  - Answer the two open questions, then proceed to `/lp-plan` for atomic execution plan.
