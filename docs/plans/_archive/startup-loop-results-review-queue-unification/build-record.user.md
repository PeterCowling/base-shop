---
Type: Build-Record
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-updated: 2026-03-10
Feature-Slug: startup-loop-results-review-queue-unification
Completed-date: 2026-03-10
artifact: build-record
Build-Event-Ref: docs/plans/_archive/startup-loop-results-review-queue-unification/build-event.json
Relates-to charter: docs/business-os/business-os-charter.md
---

# Build Record: Startup Loop Results-Review Queue Unification

## Outcome Contract

- **Why:** The visible process-improvements backlog was structurally split: queue state held one pipeline, while build-review sidecars and `completed-ideas.json` still fed a parallel report-only backlog outside normal grading and closure.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Queue state is the only canonical actionable backlog for idea items, while build-review outputs enter that queue through the normal ideas path and historical archive carry-over is handled explicitly without reviving legacy backlog reads.
- **Source:** operator

## What Was Built

The live path was rebuilt around one canonical build-origin contract. The build-review emitters now produce normalized build-origin fields, a deterministic bridge admits those signals into the trial ideas queue, `process-improvements` reads idea backlog from queue state only, `completed-ideas.json` no longer controls active backlog visibility, and self-evolving now treats queue-backed build-origin dispatches as the authoritative idea-intake path instead of recreating a second authority rail from raw sidecars.

The queue-path readiness seam was then closed on real repository inputs. The report generator now runs the build-origin bridge automatically, report and closure consumers share one queue-surface constants module, and active non-archive sidecars were refreshed so the real generator could admit queue-backed build-origin items from live plan directories rather than only from fixtures.

The historical endgame was handled honestly instead of by fallback. The archive carry-over audit showed that the legacy archive is still manual and non-deterministic against the canonical build-origin contract, so the plan did not fake an in-thread cutover. Instead it emitted a dedicated follow-on project, `startup-loop-results-review-historical-carryover`, for the six worthwhile unresolved archive candidates and closed this thread on the split path.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec tsc -p scripts/tsconfig.json --noEmit` | Pass | Re-run on each code task touching startup-loop runtime files. |
| `pnpm exec eslint --max-warnings=0 <touched startup-loop files>` | Pass | Targeted ESLint used on each code tranche. |
| `pnpm plans:lint` | Pass | Re-run across planning and close-out artifact updates. |
| `bash scripts/validate-changes.sh` | Pass | Staged-scope validation used throughout this thread. |
| `pnpm --filter scripts startup-loop:generate-process-improvements` | Pass | Proved queue-backed build-origin admission on current repo inputs. |
| `pnpm --filter scripts check-process-improvements` | Pass | Confirmed generated report/data artifacts were current after generator reruns. |
| `Jest / e2e` | Skipped | Repo policy says tests run in CI only. |

## Validation Evidence

### TASK-03 through TASK-05

- Canonical build-origin queue admission landed in `lp-do-ideas-build-origin-bridge.ts`.
- `process-improvements` idea backlog now comes from queue state only.
- `completed-ideas.json` remains a derived compatibility artifact rather than an active backlog control surface.

### TASK-11

- `self-evolving-from-ideas.ts` now preserves queue-backed `build_origin` provenance, `recurrence_key`, and `build-origin-signal:<id>` evidence refs.
- `self-evolving-from-build-output.ts` no longer recreates a second authoritative build-origin idea rail from raw build-review sidecars.

### TASK-13 through TASK-16

- The canonical queue surface for this thread is `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- `generate-process-improvements.ts` now invokes the build-origin bridge before backlog rendering.
- The active report, build-origin admission, completion reconcile, keyword calibration, and queue-state completion defaults now share one trial-queue path constants module.
- Refreshing active sidecars plus rerunning the generator produced real queue-backed build-origin admissions and queue-backed process-improvements items.

### TASK-07

- The readiness checkpoint passed on real repo evidence rather than on fixtures:
  - queue-backed build-origin dispatches were persisted
  - `process-improvements.json` and `process-improvements.user.html` reflected queue-backed build-origin items from the same run

### TASK-08 through TASK-12

- The historical audit established that the archive still contains `12` human-normalized thematic candidates and `6` worthwhile unresolved items, but `0` deterministic mappings to the canonical contract.
- The split checkpoint selected the dedicated follow-on path because the archive remains manual and non-deterministic.
- The follow-on project now exists at `docs/plans/startup-loop-results-review-historical-carryover/`.

## Scope Deviations

- The original plan had to grow explicit precursor tasks for queue-surface choice, automated admission, consumer alignment, and active-sidecar refresh after the first readiness checkpoints proved the live path was not actually wired on real repo inputs.
- The final endgame did not execute historical carry-over in-thread. This was not a shortcut; it was the audit-backed split required to keep the current thread honest and keep the live backlog path canonical.
