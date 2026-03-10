---
Type: Note
Status: Active
Domain: Platform
Last-reviewed: 2026-03-10
Relates-to:
  - /Users/petercowling/base-shop/docs/plans/_archive/startup-loop-results-review-queue-unification/plan.md
---

# Self-Evolving Build-Origin Alignment

## Decision

Use the canonical queue-backed build-origin dispatch as the only authoritative self-evolving intake for build-origin ideas.

Keep `self-evolving-from-build-output.ts` only for non-authoritative structural build observations. Remove its direct use of `results-review.signals.json` and `pattern-reflection.entries.json` as candidate-generating idea sources.

## Current Code Trace

### Queue-backed build-origin path

- `lp-do-ideas-build-origin-bridge.ts` merges `results-review.signals.json` and `pattern-reflection.entries.json` by canonical `build_signal_id`.
- The bridge emits `dispatch.v2` packets with `trigger: "operator_idea"` and `build_origin` provenance, including `build_signal_id`, `recurrence_key`, `review_cycle_key`, `plan_slug`, source precedence, and source paths.
- `generate-process-improvements.ts` now treats queue-backed idea items as canonical backlog and only surfaces build-review provenance when it arrives through queue state.

### Current self-evolving raw build path

- `self-evolving-from-build-output.ts` still reads `results-review.signals.json` directly and reconstructs idea observations from sidecar `title` values.
- The same file still reads `pattern-reflection.entries.json` directly and reconstructs pattern seeds from sidecar entries.
- Those observations are sent straight into the self-evolving orchestrator and then back into ideas follow-up dispatches via `self-evolving-backbone-consume.ts`.

### Current self-evolving queue path

- `self-evolving-from-ideas.ts` turns idea dispatch packets into `meta-observation.v2`.
- That path already sits on top of canonical queue dispatches and lifecycle state.
- It does not yet read `build_origin` provenance, so queue-backed build-origin ideas lose the canonical recurrence identity when they enter self-evolving.

## Problem

If raw build-output sidecars and queue-backed build-origin dispatches both feed self-evolving as idea sources, the same build-origin signal exists twice:

1. once as a raw sidecar observation
2. once as a canonical queue dispatch

That recreates the split-authority problem this plan is removing elsewhere.

The raw path is also materially weaker:

- `results-review.signals.json` intake only uses item titles, not the canonical `build_signal_id`
- `pattern-reflection.entries.json` intake reconstructs seeds from entry text, not the queue-admitted dispatch identity
- neither path preserves `dispatch_id` or queue lifecycle joins

## Options Considered

### Option A — Keep raw sidecar self-evolving intake and add shared join keys

Reject.

This would still leave two authoritative build-origin intake rails. Shared identity would reduce collision, but not remove the duplicated intake policy.

### Option B — Queue-backed build-origin intake for self-evolving; raw build bridge reduced to structural observation only

Choose this.

This keeps one authoritative backlog path:

- build-origin ideas enter queue first
- self-evolving observes those queue admissions through `self-evolving-from-ideas.ts`
- raw build-output remains useful only for non-backlog structural observation such as the existence of a build cycle or build-record context

### Option C — Remove `self-evolving-from-build-output.ts` entirely

Reject for now.

That is a larger behavior change than needed for this tranche. The file still has value as a structural execution-event bridge if it stops minting idea-candidate observations from raw build-review sidecars.

## Chosen Model

### Authority split

- Authoritative build-origin idea intake: `lp-do-ideas-build-origin-bridge.ts` -> queue dispatch -> `self-evolving-from-ideas.ts`
- Non-authoritative build structural observation: `self-evolving-from-build-output.ts`

### Required join surface

`build_origin` on the queue packet becomes the canonical join surface for self-evolving build-origin ideas.

`self-evolving-from-ideas.ts` should:

- accept `build_origin` on `IdeasDispatchPacket`
- derive recurrence from `build_origin.recurrence_key` when present
- carry `build_signal_id` into observation context/evidence so later audit and write-back can join back to the originating build signal

### Raw build bridge narrowing

`self-evolving-from-build-output.ts` should stop generating idea observations from:

- `results-review.signals.json`
- `pattern-reflection.entries.json`

It may retain:

- the `build-record` execution-event observation

That keeps build-cycle structural sensing without recreating a second idea authority rail.

## Minimal TASK-11 Change

1. Extend `IdeasDispatchPacket` and `dispatchToMetaObservation()` in `self-evolving-from-ideas.ts` to understand `build_origin`.
2. Use `build_origin.recurrence_key` as the preferred recurrence identity when present.
3. Add `build_signal_id` and related provenance into the observation context/evidence surface.
4. Remove raw candidate bullet ingestion and raw pattern-entry ingestion from `self-evolving-from-build-output.ts`.
5. Leave only the `build-record` structural seed in `self-evolving-from-build-output.ts`.
6. Add regression tests proving:
   - queue-backed build-origin dispatches retain canonical recurrence identity in self-evolving
   - raw build-output no longer creates duplicate idea observations from results-review/pattern-reflection sidecars

## Why This Is Minimal And Sufficient

- It removes duplicate idea authority without needing to redesign the whole self-evolving bridge layer.
- It reuses the build-origin contract already established in the queue.
- It keeps self-evolving aligned with queue lifecycle, dispatch IDs, and later completion joins.
- It avoids forcing a broader shutdown of build-output structural observation.

## Recommendation

Proceed with TASK-11 using Option B exactly as described above.
