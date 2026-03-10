---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Platform
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: startup-loop-synthetic-dispatch-stubs
---

# Startup Loop Synthetic Dispatch Stubs Briefing

## Executive Summary
The stub problem is real, but it is narrower than "most queued ideas are fake." The queue is being populated by three synthetic `source_mechanical_auto` bridges registered in the standing registry: codebase structural signals, repo maturity signals, and agent session findings. Those bridges are intentional, but the current system treats their output as ordinary idea backlog items.

On the 2026-03-09 snapshot, `docs/business-os/startup-loop/ideas/trial/queue-state.json` contained 462 dispatches total and 248 surfaced enqueued items with non-empty `area_anchor`. Of those 248 surfaced queue items, 176 (71.0%) came from the three BOS synthetic bridges:

- 146 `BOS-BOS-AGENT_SESSION_FINDINGS`
- 27 `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`
- 3 `BOS-BOS-REPO_MATURITY_SIGNALS`

The largest problem is not exact duplication. It is that the synthetic bridges, especially agent-session findings, emit fresh cluster fingerprints for new deltas and the downstream process-improvements generator imports every enqueued dispatch as an idea without filtering synthetic/noise-prone sources.

## Questions Answered
- Are these entries intended to be synthetic?
- Are they pure duplicates or fresh-but-low-value packets?
- Which bridge is responsible for most of the noise?
- Where do these packets become operator-visible backlog items?
- Do existing tests cover this failure mode?

## High-Level Architecture
- `docs/business-os/startup-loop/ideas/standing-registry.json`
  - Registers the three BOS synthetic artifacts as active `source_process` entries with `propagation_mode: "source_mechanical_auto"`. Evidence: `standing-registry.json` lines 538-580.
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`
  - Emits artifact-delta events for codebase structural changes and repo maturity regressions/caps. Evidence: `lp-do-ideas-codebase-signals-bridge.ts` lines 429-470 and 536-665.
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts`
  - Scans recent Claude transcript files, extracts assistant "findings", hashes the aggregate, and emits one synthetic artifact-delta event whenever that hash changes. Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 225-278, 281-344, and 520-692.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
  - Converts those artifact-delta events into dispatch packets. When the event is not a direct micro-build candidate, the packet gets generic fallback text: `Investigate implications of ... delta`. Evidence: `lp-do-ideas-trial.ts` lines 1298-1317.
- `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - Reads `queue-state.json` and promotes every `queue_state: "enqueued"` dispatch with a non-empty `area_anchor` into the process-improvements dataset as an idea item. Evidence: `generate-process-improvements.ts` lines 572-616.

## End-to-End Flow
### Primary flow
1. A bridge detects a source change and produces an `ArtifactDeltaEvent`.
   - Codebase structural signals emit when changed files imply route/API/schema/dependency tags. Evidence: `lp-do-ideas-codebase-signals-bridge.ts` lines 429-470.
   - Repo maturity emits only on first-run low score/cap state or later regressions/new caps/critical controls. Evidence: `lp-do-ideas-codebase-signals-bridge.ts` lines 600-665.
   - Agent-session emits whenever the aggregated transcript findings hash changes. Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 520-548.
2. `runTrialOrchestrator()` maps the event to a dispatch packet.
   - Non-direct-build packets get the generic `Investigate implications of <area_anchor> delta for <business>` text. Evidence: `lp-do-ideas-trial.ts` lines 1298-1317.
3. The bridge appends the packet to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
   - Agent-session bridge writes telemetry reason `agent_session_signal_bridge`; codebase/repo bridge writes `codebase_signal_bridge`. Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 656-692 and `lp-do-ideas-codebase-signals-bridge.ts` enqueue path.
4. `generate-process-improvements.ts` later imports the queued dispatch as an idea card.
   - It uses `title = area_anchor` and `body = why`, without checking whether the source artifact is synthetic or whether the packet contains only generic routing text. Evidence: `generate-process-improvements.ts` lines 579-615.

### What the current snapshot shows
1. The bridges are active by design, not accidental leftovers.
   - The standing registry notes explicitly call them synthetic artifacts. Evidence: `standing-registry.json` lines 538-580.
2. The queue pressure is dominated by synthetic signals.
   - Direct inspection of `docs/business-os/startup-loop/ideas/trial/queue-state.json` on 2026-03-09 found 248 surfaced enqueued items; 176 were from the three synthetic BOS artifacts.
3. Most of that synthetic volume is agent-session traffic.
   - The same queue snapshot contained 146 `BOS-BOS-AGENT_SESSION_FINDINGS` packets, spanning 2026-03-03 through 2026-03-09.
4. The process-improvements snapshot already reflects this pollution.
   - Direct inspection of `docs/business-os/_data/process-improvements.json` on 2026-03-09 found 234 `queue-state.json` idea items, including at least 159 synthetic-anchor titles (`145` agent-session, `11` codebase-structural, `3` repo-maturity).

## Data & Contracts
- Source of truth for bridge eligibility:
  - `docs/business-os/startup-loop/ideas/standing-registry.json`
- Queue persistence:
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- Synthetic artifacts:
  - `docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json`
  - `docs/business-os/startup-loop/ideas/trial/repo-maturity-signals.latest.json`
- Operator-facing aggregate:
  - `docs/business-os/_data/process-improvements.json`

Important contract observation: the queue format itself does not distinguish "actionable idea" from "synthetic advisory signal". Once a synthetic bridge packet is enqueued, the downstream collector treats it like any other idea candidate.

## Error Handling and Failure Modes
- The generic wording is not the root cause.
  - `lp-do-ideas-trial.ts` applies the same fallback wording to any fact-find-ready artifact delta. The wording makes low-information packets look worse, but it is not what creates the synthetic volume. Evidence: `lp-do-ideas-trial.ts` lines 1298-1317.
- Agent-session bridge has a relevance-quality problem.
  - `extractFindingsFromAssistantText()` accepts any bullet or sentence containing broad issue terms like `issue`, `problem`, `missing`, `blocked`, `error`. Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 225-278.
  - `parseSessionFile()` scans the most recent transcript files and keeps up to five findings per session whenever a user message matched a broad walkthrough/test intent. Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 281-344.
  - The current `agent-session-findings.latest.json` snapshot contained 16 sessions and 542 extracted finding strings. A quick classification pass found many meta/process utterances mixed with real product issues, including items like "I don't know..." and "Now let me fix..." alongside genuine defects.
- Codebase structural signals are noisy, but less severe.
  - They fire on broad tag classes such as `api endpoint`, `route change`, `schema change`, and `dependency update`. Evidence: `lp-do-ideas-codebase-signals-bridge.ts` lines 360-470.
  - In the current queue, only 3 of 27 structural packets were upgraded to `micro_build_ready`; the other 24 remained `fact_find_ready`, so most structural events still land as backlog items rather than bounded build tasks.
- Repo maturity is the strongest of the three.
  - It already suppresses emission unless there is first-run low-score/cap state or later regressions/new caps/critical controls. Evidence: `lp-do-ideas-codebase-signals-bridge.ts` lines 600-665.
  - The current `repo-maturity-signals.latest.json` is concrete and decision-relevant: score `70`, level `Level-3-Reliable`, cap reasons for CI velocity, structure hygiene, indexing hygiene, and zero-byte files.

## Tests and Coverage
- Existing coverage proves the bridges work, not that they stay high-signal.
  - Agent-session tests assert that transcript findings are extracted and a dispatch is enqueued, plus idempotent suppression when the hash is unchanged. Evidence: `lp-do-ideas-agent-session-bridge.test.ts` lines 116-149 and 151-170.
  - Codebase-signal tests assert that bug scan, structural signals, and repo maturity all emit and enqueue when triggered, and that repo maturity skips when inputs do not change. Evidence: `lp-do-ideas-codebase-signals-bridge.test.ts` lines 284-343 and 345-360.
- No test covers synthetic packet hygiene at the consumer boundary.
  - I did not find coverage asserting that `generate-process-improvements.ts` collapses, suppresses, or separately labels synthetic bridge packets before surfacing them to operators.
- No test covers semantic relevance quality for agent-session extraction.
  - Current tests validate detection mechanics, not whether extracted findings are actionable rather than meta commentary.

## Unknowns / Follow-ups
- Unknown: whether the process-improvements JSON snapshot is currently stale relative to the queue.
  - How to verify: run `pnpm --filter scripts startup-loop:generate-process-improvements` and compare `docs/business-os/_data/process-improvements.json` counts before and after.
- Unknown: whether the intended fix should be at bridge admission, queue routing, or UI aggregation.
  - How to verify: inspect the current plan for `startup-loop-ideas-pipeline-redesign` and any active follow-on plan before changing behavior.

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - Tighten agent-session extraction relevance in `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts`.
  - Add a synthetic-signal filter or separate surface in `scripts/src/startup-loop/build/generate-process-improvements.ts`.
  - Introduce a queue-level distinction between advisory synthetic signals and operator-ready ideas in the dispatch contract.
- Key risks:
  - Over-suppressing synthetic signals would hide real regressions, especially repo maturity drops and concrete structural regressions.
  - Fixing only the wording in `lp-do-ideas-trial.ts` would reduce cosmetic confusion but would not address queue volume or operator-surface pollution.
