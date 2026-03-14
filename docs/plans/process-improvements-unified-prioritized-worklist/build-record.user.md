---
Type: Build-Record
Status: Complete
Domain: Repo
Last-reviewed: 2026-03-11
Feature-Slug: process-improvements-unified-prioritized-worklist
Execution-Track: mixed
Completed-date: 2026-03-11
artifact: build-record
---

# Build Record: Process Improvements Unified Prioritized Worklist

## Outcome Contract

- **Why:** The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. The next step is to stop presenting multiple inboxes inside the route itself and give the operator one prioritized list of actions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS presents one prioritized operator worklist that unifies queue-backed process improvements and canonical operator actions behind one deterministic projection contract and one active-list UI.
- **Source:** operator

## What Was Built

The projection layer in [projection.ts](/Users/petercowling/base-shop/apps/business-os/src/lib/process-improvements/projection.ts) now emits one shared route-facing work-item contract across queue-backed and operator-action sources. The unified model carries shared grouping, ranking, and action metadata while preserving source-specific identifiers and write paths for queue decisions and operator-action decisions.

The route UI in [ProcessImprovementsInbox.tsx](/Users/petercowling/base-shop/apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx) was collapsed into one active worklist, one shared deferred section, and the existing recent-actions section. Card chrome is now shared, action buttons are driven by `availableActions`, and the route header in [page.tsx](/Users/petercowling/base-shop/apps/business-os/src/app/process-improvements/page.tsx) describes one prioritized worklist instead of two parallel streams.

The build also expanded deterministic coverage in [projection.test.ts](/Users/petercowling/base-shop/apps/business-os/src/lib/process-improvements/projection.test.ts) and [ProcessImprovementsInbox.test.tsx](/Users/petercowling/base-shop/apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx) to lock the mixed ordering policy, unified deferred behavior, and preserved source-specific actions.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `bash scripts/validate-engineering-coverage.sh docs/plans/process-improvements-unified-prioritized-worklist/plan.md` | Pass | Plan still validates as a mixed engineering artifact |
| `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os typecheck` | Pass | Targeted app typecheck |
| `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os lint` | Pass | Zero errors; existing projection copy warnings remain non-blocking |
| `pnpm --filter @apps/business-os exec tsx -e '(async () => { ...loadProcessImprovementsProjection()... })();'` | Pass | Captured live repo-state counts and top active ordering |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### TASK-01
- TC-01-A: pass — projection tests assert mixed ordering across overdue blockers, active stage gates, queue backlog, deferred items, and resolved operator actions.
- TC-01-B: pass — projection tests assert shared `statusGroup` handling and action metadata across deferred/snoozed/resolved states.
- TC-01-C: pass — targeted `typecheck`.
- TC-01-D: pass — targeted `lint`.

### TASK-02
- TC-02-A: pass — component tests assert one active worklist with mixed queue/operator ordering.
- TC-02-B: pass — component tests assert one shared deferred section for queue defers and operator snoozes.
- TC-02-C: pass — targeted `typecheck`.
- TC-02-D: pass — targeted `lint`.
- TC-02-E: pass — live route walkthrough loaded `/process-improvements` with no blocking overlay and exposed both operator and queue actions.

### TASK-03
- Checkpoint: pass — live projection probe reported `54` total items, `54` active, `0` deferred, `0` recent, with operator actions leading the ranked list.
- Checkpoint: pass — browser walkthrough reported `primaryHeading: "Operator Inbox"` and visible `Mark done`, `Snooze`, `Do`, `Defer`, and `Decline` actions on the same page.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Evidence | One active worklist plus shared card chrome in `ProcessImprovementsInbox.tsx` |
| UX / states | Evidence | Shared `statusGroup` drives active vs deferred vs recent behavior |
| Security / privacy | Evidence | Queue and operator writes remain scoped to existing source-specific services/routes |
| Logging / observability / audit | Evidence | Unified model preserves `itemKey`, dispatch IDs, action IDs, source paths, and recent-action traces |
| Testing / validation | Evidence | Projection + component coverage updated; targeted plan validation, typecheck, lint, and live route/projection probes run |
| Data / contracts | Evidence | Unified work-item contract shipped in `projection.ts` |
| Performance / reliability | Evidence | Empty-safe source loading retained; deterministic ranking moved into projection metadata |
| Rollout / rollback | Evidence | Change is additive to the read model and route UI; rollback remains app-only |

## Scope Deviations

No scope deviations.
