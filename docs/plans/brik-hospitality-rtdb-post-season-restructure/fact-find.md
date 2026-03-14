---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: brik-hospitality-rtdb-post-season-restructure
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-hospitality-rtdb-post-season-restructure/plan.md
Dispatch-ID: IDEA-DISPATCH-20260313131601-0002
Trigger-Why: October 31, 2026 is the right kickoff window for the larger RTDB redesign because the operating season will be over. That avoids migration and backfill risk during live hostel operations, gives us a full season of real usage evidence, and creates an off-season runway for validation and rollback planning before reopening.
Trigger-Intended-Outcome: type: operational | statement: Starting 2026-10-31, run a full fact-find and planning cycle for the hospitality RTDB redesign so the canonical target model, migration sequence, validation gates, and rollback plan are ready before the next season. | source: operator
---

# Brik Hospitality Rtdb Post Season Restructure Fact-Find Brief

## Scope
### Summary
Do not start this redesign before 2026-10-31 unless the operator explicitly overrides that gate. On that date, begin the fact-find and planning cycle for a canonical post-season RTDB redesign, including migration sequencing, dual-write or backfill strategy, rollback planning, and cutover timing before the next season.

### Goals
- Validate the larger RTDB redesign scope against the real operational evidence gathered during the 2026 season.
- Trace the affected seams listed in the dispatch payload and any launch-season alignment artifacts produced under `brik-hospitality-rtdb-current-contract-alignment`.
- Produce a migration-ready planning baseline rather than jumping straight into implementation.

### Non-goals
- Deliver implementation changes in this artifact.
- Change the launch-season current-shape contract while the hostel is still operating at season cadence.
- Start a backfill, dual-write, or cutover before the October 31 kickoff gate.

### Constraints & Assumptions
- Constraints:
  - This brief was created from a queue-backed operator action.
  - Queue route and source evidence should remain authoritative unless disproven.
  - The redesign is intentionally deferred until the hostel is closed for the year.
- Assumptions:
  - The queued route `lp-do-fact-find` remains the correct next step.
  - The launch-season alignment wave should leave behind evidence about the live contract, drift fixes, and remaining structural pain.

## Timing Gate
- Kickoff date: `2026-10-31`
- Why then:
  - It avoids schema migration and backfill risk during live guest operations.
  - It gives the redesign a full season of observed data and edge cases.
  - It creates an off-season window for dual-write, validation, rollback rehearsal, and cutover planning before the next reopening.
- Hold-until rule: treat this brief as a queued future lane until `2026-10-31`, unless an explicit operator decision brings it forward.

## Outcome Contract

- **Why:** October 31, 2026 is the first sensible kickoff point for the larger RTDB redesign because the operating season will be over. That avoids live migration risk while the hostel is busy, gives us a full season of real usage evidence to design from, and creates an off-season runway for backfill, dual-write, validation, and rollback planning before the next reopening.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Starting 2026-10-31, run a full fact-find and planning cycle for the hospitality RTDB redesign so the canonical target model, migration sequence, validation gates, and rollback plan are ready before the next season.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts` - source location anchor
- `apps/reception/src/hooks/mutations/useAddGuestToBookingMutation.ts` - source location anchor
- `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts` - source location anchor
- `apps/reception/src/lib/inbox/guest-matcher.server.ts` - source location anchor
- `apps/prime/functions/api/guest-booking.ts` - source location anchor
- `apps/prime/src/lib/owner/SCORECARD_LINEAGE.md` - source location anchor

### Data & Contracts
- Evidence refs:
- operator-stated: the larger data-model project should kick off on 2026-10-31 after the hostel closes for the year
- operator-stated: October 31 is the right window because schema migration and backfill are safer when guest volume is down and a full season of real usage evidence is available
- apps/prime/src/lib/owner/SCORECARD_LINEAGE.md already points toward a more canonical nested booking model than the live code currently uses
- coverage-hint: migration-planning
- coverage-hint: rollback
- coverage-hint: data-contracts

## Dispatch Handoff
- Dispatch ID: IDEA-DISPATCH-20260313131601-0002
- Business: BRIK
- Created At: 2026-03-13T13:16:01.306Z
- Provisional Deliverable Family: multi

## Starting Evidence for 2026-10-31
- Launch-season alignment lane to feed into this redesign:
  - `docs/plans/brik-hospitality-rtdb-current-contract-alignment/micro-build.md`
- Core technical seams already identified:
  - Prime mixes direct RTDB reads with server snapshot handling.
  - Reception guest add/delete flows fan out across many roots.
  - Booking email and inbox guest matching still infer guest context from broad RTDB trees.
  - Internal lineage docs already point toward a more canonical nested model than the live code currently uses.
