---
Type: Note
Status: Active
Domain: Platform
Last-reviewed: 2026-03-10
Relates-to:
  - /Users/petercowling/base-shop/docs/plans/startup-loop-results-review-queue-unification/plan.md
---

# Canonical Queue Surface Decision

## Decision

For this plan, the canonical queue surface is:

- `docs/business-os/startup-loop/ideas/trial/queue-state.json`

The real automation seam for build-origin idea admission is:

- `scripts/src/startup-loop/build/generate-process-improvements.ts`

This plan does **not** move build-origin backlog onto `live/queue-state.json`. The live queue remains part of the broader `lp-do-ideas` go-live seam and is outside the scope required to kill the results-review backlog split.

## Why This Is The Correct Scope

The user problem in this thread is narrow and concrete:

- build-generated idea candidates currently sit in results-review archives
- `process-improvements.user.html` shows a backlog derived from those archives
- those build-origin ideas should instead enter the regular queue pipeline

The active code paths for that workflow are already trial-mode paths. Pushing this thread onto `live/queue-state.json` would expand scope into the general `lp-do-ideas` go-live program rather than solving the build-review backlog split itself.

## Current Code Trace

### Trial queue is the active workflow surface for this thread

- `generate-process-improvements.ts` reads `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- `lp-do-ideas-build-origin-bridge.ts` defaults to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- `lp-do-ideas-completion-reconcile.ts` defaults to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- `lp-do-ideas-keyword-calibrate.ts` fast-track reconcile runs against the queue path passed in, and the current defaults used by this thread point at the trial queue.
- `lp-do-ideas-queue-state-completion.ts` defaults to the trial queue.
- `self-evolving-from-ideas.ts` now preserves canonical `build_origin` identity once build-origin dispatches exist in that queue.

### Live queue is a separate advisory/go-live seam

- `lp-do-ideas-build-commit-hook.ts` defaults to `docs/business-os/startup-loop/ideas/live/queue-state.json`.
- That hook converts standing-registry git diff events into live advisory dispatches.
- It does not accept `planDir`, and it does not read `results-review.signals.json` or `pattern-reflection.entries.json`.

### The current gap

- `lp-do-ideas-build-origin-bridge.ts` exists, but repo search shows it is only referenced by its package script, tests, docs, and plan artifacts.
- There is no runtime caller that automatically admits build-review sidecars into queue.
- `rg` over both `docs/business-os/startup-loop/ideas/trial/queue-state.json` and `docs/business-os/startup-loop/ideas/live/queue-state.json` found no persisted `build_origin` dispatches.

## Why The Commit Hook Is The Wrong Admission Seam

`lp-do-ideas-build-commit-hook.ts` is the wrong seam for build-origin backlog admission because:

1. It is driven by standing-registry artifact deltas, not by per-plan build-review sidecars.
2. It has no `planDir` input, so it cannot reliably locate `results-review.signals.json` or `pattern-reflection.entries.json` for the build that just completed.
3. It writes the live queue by default, while the active backlog/report/closure workflow for this thread remains trial-mode.

Using it here would create a second cross-surface backlog instead of removing one.

## Why `generate-process-improvements.ts` Is The Right Admission Seam

`generate-process-improvements.ts` is already the best automation point because:

1. The canonical build flow already runs it after results-review sidecar generation.
   - `.claude/skills/lp-do-build/SKILL.md` requires `pnpm --filter scripts startup-loop:generate-process-improvements` during post-build completion.
2. It already hosts other ideas-bridge automation.
   - It runs the codebase signals bridge and the agent-session bridge.
3. It already reads the same plan/build artifact tree that contains:
   - `results-review.signals.json`
   - `pattern-reflection.entries.json`
   - `build-record.user.md`
4. It is the same place that materializes the operator-facing process-improvements backlog, so admitting build-origin ideas there keeps queue write and backlog read in one deterministic pass.

## Chosen Model

### Canonical queue surface

- Canonical backlog queue for this thread: `trial/queue-state.json`

### Canonical admission seam

- `generate-process-improvements.ts` should invoke `runBuildOriginSignalsBridge(...)` against the trial queue before collecting queue-backed idea items for report rendering.

### Non-chosen surface

- `live/queue-state.json` remains a separate advisory/go-live surface.
- This plan does not make claims about live queue canonicality.
- If the product later wants one canonical queue across trial and live modes, that is a separate project.

## Consequences For Remaining Tasks

### TASK-14

Implement the automated bridge inside `generate-process-improvements.ts`:

- run `runBuildOriginSignalsBridge(...)` during the same pass that already runs the other queue bridges
- target `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- preserve duplicate suppression and warnings

### TASK-15

Tighten report/closure defaults around the same trial queue surface:

- keep `generate-process-improvements.ts`, `lp-do-ideas-completion-reconcile.ts`, `lp-do-ideas-keyword-calibrate.ts`, and `lp-do-ideas-queue-state-completion.ts` on the same trial queue default
- update any wording/docs/tests that still imply this thread is queue-canonical across both trial and live surfaces

### TASK-07

The readiness checkpoint should now test a narrower and honest claim:

- build-review-derived ideas are admitted automatically into the trial queue
- the process-improvements backlog reads from that same queue
- completion/calibration for this thread use that same queue
- raw results-review backlog sourcing is gone

It should **not** require the entire `lp-do-ideas` live-governance program to be solved first.

## Recommendation

Proceed with TASK-14 and TASK-15 using the trial queue plus `generate-process-improvements.ts` automation seam exactly as described above.
