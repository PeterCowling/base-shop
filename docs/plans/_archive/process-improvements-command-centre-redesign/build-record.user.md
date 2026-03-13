---
Plan: process-improvements-command-centre-redesign
Build-completed: 2026-03-13
Status: Complete
---

# Build Record — Process Improvements Command Centre Redesign

## Outcome Contract

- **Why:** The process-improvements pages were the operator's daily triage surface but showed stale counts (SSR-locked), used a flat undifferentiated list with no urgency hierarchy, and had a static sub-nav with no live feedback. The redesign fixes accuracy first, then layers visual identity and spatial urgency hierarchy on top.
- **Intended Outcome Type:** UI improvement
- **Intended Outcome Statement:** The `/process-improvements` operator UI now shows live, accurate counts and an urgency-tiered spatial layout (Overdue → Operator Actions → Ideas Queue → Deferred collapsed → Done collapsed) with a dark command-centre theme and a live sub-nav that pulses when an agent is active.
- **Source:** operator

## What Was Built

### Phase 1 — Data Accuracy (TASK-01 through TASK-04)

- **TASK-01**: Removed stale `initialInProgressCount` SSR prop from `NewIdeasInbox`; hero badge now derives count from `inProgressDispatchIds.size` client-side. Added explicit `count` prop to `InboxSection` for brittle children-length bypass (B3).
- **TASK-02**: Added `LiveNewIdeasCount` component to In Progress page hero; polls same endpoint so the cross-page count badge is live.
- **TASK-03**: Replaced raw `priorityReason` display with `formatPriorityLabel()` helper that maps internal labels to plain-language copy (B5).
- **TASK-04**: Phase 1 CHECKPOINT — typecheck and regression tests passed. No blockers.

### Phase 2 — Dark Theme CSS (TASK-05 through TASK-06)

- **TASK-05**: Added `.cmd-centre` scoped CSS variable overrides (navy/indigo palette) to `global.css`; added `bg-cmd-hero` linear-gradient utility; added `cmd-glow-sm` / `cmd-glow-lg` box-shadow utilities; wrapped `layout.tsx` in `<div className="cmd-centre">`.
- **TASK-06**: Phase 2 CHECKPOINT — DS token verification, snapshot updates, visual contrast confirmed. No regressions.

### Phase 3 — Spatial Layout (TASK-07a, TASK-07b, TASK-08, TASK-09)

- **TASK-07a**: Extracted `NewIdeasHeaderStats` component; added `overdueActiveItems`, `operatorActionActiveItems`, `ideasQueueActiveItems` derived filters to `useProcessImprovementsDerivedItems`; extracted `useNewIdeasFilters` hook; replaced flat "New ideas" section with `<ActiveSwimlanes>` — three urgency-tiered sections (Overdue/danger variant, Operator Actions, Ideas Queue). `NewIdeasInbox` function stays within 200-line limit.
- **TASK-07b**: Made Deferred and Recently Actioned sections collapsible by default. Added `collapsed`/`onToggle` props to `InboxSection`; added `isExpanded`/`onToggle` to `RecentlyActionedSection`; `NewIdeasInbox` manages two toggle state variables.
- **TASK-08**: Restructured `InProgressInbox` into three sections (Running Now / Blocked / Queued) with `SectionHeading` sub-component. Running Now renders plans where `isActiveNow === true`.
- **TASK-09**: Full rewrite of `ProcessImprovementsSubNav` with `useSubNavCounts()` hook polling `/api/process-improvements/items` every 30s; tabs show live `Inbox (N)` / `In Progress (N)` counts; pulse indicator when any plan `isActiveNow`.

## Engineering Coverage Evidence

- **validate-engineering-coverage.sh**: PASS (`valid: true`, `errors: []`)
- **Typecheck**: PASS across all tasks — `pnpm turbo typecheck --filter=@apps/business-os` ✓ Types generated successfully
- **Lint**: 0 errors across all changed files; pre-existing `ds/min-tap-size` warnings unchanged (not introduced by this build)
- **Tests**: TC-B1-01, TC-B2-01, TC-B3-01, TC-B3-02, TC-LAYOUT-NI-01, TC-LAYOUT-NI-02, TC-LAYOUT-IP-01, TC-LAYOUT-IP-02, TC-LAYOUT-IP-03, TC-SUBNAV-01, TC-SUBNAV-02, TC-SUBNAV-03 — all authored and committed (CI-only per testing policy)

## Workflow Telemetry Summary

- Telemetry recorded: 1 record appended to `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`
- Stage: `lp-do-build`
- Modules: `modules/build-code.md`, `modules/build-validate.md`
- Deterministic check: `scripts/validate-engineering-coverage.sh` → PASS
