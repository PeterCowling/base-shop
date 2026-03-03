---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-room-detail-component-split
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-refactor
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: in-progress
---

# Brikette Room Detail Component Split Plan

## Summary
This plan executes the queued refactor idea from `lp-do-ideas` by decomposing `RoomDetailContent` into smaller room-detail modules while preserving booking and funnel behavior. The scope is intentionally bounded to structural extraction and import wiring. No booking-policy, analytics schema, SEO contract, or UX copy behavior changes are included.

## Active tasks
- [x] TASK-01: Extract room-detail presentation sections into dedicated components

## Goals
- Reduce route component complexity and file size.
- Isolate presentational room-detail sections from route orchestration logic.
- Preserve existing funnel behavior and current tests/contracts.

## Non-goals
- Booking contract or validation-policy changes.
- Analytics event payload changes.
- SEO/indexation changes.

## Inherited Outcome Contract
- **Why:** room-detail component remains oversized and mixes booking orchestration with rendering sections.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** split RoomDetailContent into smaller feature modules while preserving booking and handoff behavior.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-room-detail-component-split/fact-find.md`
- Key findings used:
  - `RoomDetailContent.tsx` still combines orchestration and rendering responsibilities.
  - `useRoomDetailBookingState` already isolates booking-state logic and should remain the state boundary.
  - Safe decomposition target is section/presentation extraction with stable props.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Split room-detail presentation sections into reusable modules and keep route orchestration thin | 85% | M | Complete (2026-03-01) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded extraction/refactor task |

## Tasks

### TASK-01: Extract room-detail presentation sections into dedicated components
- **Type:** IMPLEMENT
- **Deliverable:** `RoomDetailContent` orchestration slimmed by extracting presentation modules under `components/rooms/detail/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/components/rooms/detail/*`, `[readonly] apps/brikette/src/hooks/useRoomDetailBookingState.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - extraction boundaries are clear and low-risk.
  - Approach: 85% - component split keeps existing state/side-effect boundaries.
  - Impact: 90% - improves maintainability and reviewability without behavior drift.
- **Acceptance:**
  - New room-detail presentation modules exist and are consumed by route component.
  - Route component remains behaviorally equivalent for booking, notices, room card, and sticky handoff CTA.
  - `FeatureSection` remains exported from route module for existing tests/import compatibility.
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter brikette typecheck` passes.
  - TC-02: `pnpm --filter brikette lint` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: route/component structure audit and existing room-detail test import checks.
  - Validation artifacts: fact-find + current room-detail route implementation.
  - Unexpected findings: none at planning time.
- **Scouts:** `None: bounded internal refactor`
- **Edge Cases & Hardening:** preserve exact JSX and copy for booking notices/recovery prompts.
- **What would make this >=90%:**
  - Passing CI component tests touching room-detail + booking CTA contracts.
- **Rollout / rollback:**
  - Rollout: ship as internal refactor with no feature flag.
  - Rollback: restore prior in-file section definitions if any regression is observed.
- **Documentation impact:**
  - Update this plan with build evidence and completion state.
- **Build evidence (2026-03-01):**
  - Added `apps/brikette/src/components/rooms/detail/RoomDetailSections.tsx` to host room-detail presentation sections and copy-resolution helpers.
  - Refactored `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` into a thin orchestrator (246 lines) that delegates rendering to extracted modules while preserving the existing orchestration flow.
  - Preserved `FeatureSection` export compatibility from route module for existing test imports.
  - Validation contract:
    - `pnpm --filter brikette typecheck` passed.
    - `pnpm --filter brikette lint` passed.
  - Funnel smoke verification on local dev (`http://localhost:3012`) passed 6/6 checks:
    - `/en/book` absent disclosure visible.
    - `/en/book` invalid pax guidance visible.
    - `/en/book` expired resume rewrites to `rebuild_quote=1` and shows expiry notice.
    - `/en/dorms/room_10` absent indicative notice visible.
    - `/en/dorms/room_10` invalid pax guidance visible.
    - `/en/dorms/room_10` expired resume rewrites to `rebuild_quote=1` and shows expiry notice.

## Acceptance Criteria (overall)
- [x] Route/component split merged with no contract-level behavior changes.
- [x] Validation contract passes for affected package.
