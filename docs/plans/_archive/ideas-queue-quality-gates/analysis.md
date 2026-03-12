---
Type: Analysis
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: ideas-queue-quality-gates
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/ideas-queue-quality-gates/fact-find.md
Related-Plan: docs/plans/ideas-queue-quality-gates/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Ideas Queue Quality Gates Analysis

## Decision Frame

### Summary

The ideas queue has no content quality gates. 29.3% of dispatches are noise (agent chatter, duplicates, malformed content) and 53.2% lack domain classification. The queue is unreliable for operator decision-making. We need to decide where to place deterministic guards, how to handle the domain field (which isn't part of the dispatch packet contract), and how to clean existing data.

### Goals

- Add deterministic admission guards that reject noise before it enters the queue
- Clean existing queue data: purge noise, classify domains, fix non-canonical values
- Produce a fresh pattern analysis on cleaned data

### Non-goals

- Migrating queue file format from hand-authored to TS persistence layer
- Adding LLM-based semantic validation
- Changing the dispatch.v2 schema

### Constraints & Assumptions

- Constraints:
  - `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts` is the write entrypoint for 4 of 5 bridges (agent-session, codebase-signals, build-origin, milestone). The 5th bridge (`lp-do-ideas-historical-carryover-bridge.ts`) writes directly via `queue.dispatches.push()` + `atomicWriteQueueState()`, bypassing `enqueueQueueDispatches()` entirely. `TrialQueue.validatePacket()` is a separate path also bypassed by bridges.
  - Routing adapter is a pure function (no file I/O, no state) — cannot do dedup or domain lookups
  - `domain` is NOT in `TrialDispatchPacket` or `TrialDispatchPacketV2` or dispatch.v2 schema — exists only on `ArtifactDeltaEvent` upstream and in hand-authored persisted queue entries. No current packet constructor attaches `domain` as an extra property on the packet object.
  - `enqueueQueueDispatches()` currently performs only dispatch_id dedup + cluster dedup + append + telemetry. It has no structural checks (schema_version, mode, etc.) — those exist only in `TrialQueue.validatePacket()` which bridges bypass.
  - Upstream `ArtifactDomain` enum has 8 values (MARKET, SELL, PRODUCTS, LOGISTICS, STRATEGY, BOS, ASSESSMENT, LEGAL)
- Assumptions:
  - Noise is exclusively from `artifact_delta` trigger (confirmed: 0% from `operator_idea`)
  - Area_anchor exact-match dedup is sufficient (all 154 duplicates have identical text)

## Inherited Outcome Contract

- **Why:** Right now, nothing checks whether an idea entering the backlog is real or just internal processing noise. Over half the entries have missing categories, and about 80 are duplicated fragments of the AI talking to itself. The operator cannot trust the backlog for decision-making. Adding automatic quality checks and cleaning up the existing data would make the ideas list reliable for prioritising what to work on next.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deterministic admission guards prevent noise entering the queue, existing queue data is cleaned and domain-classified, and a fresh pattern analysis on clean data is produced.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ideas-queue-quality-gates/fact-find.md`
- Key findings used:
  - `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts` is used by 4 of 5 bridges; the 5th (historical-carryover) writes directly to the queue file
  - `TrialQueue.validatePacket()` is a separate path bypassed by all bridges
  - 160 noise dispatches follow a small set of catchable patterns (duplicates, agent reasoning, malformed content)
  - `domain` field has a complex lifecycle: not in packet contract, present upstream on events and downstream in persisted entries
  - Existing `ValidationFailureReason` enum has 7 literals; telemetry uses single `kind: "validation_rejected"` with reason

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| All ingress paths protected | 5 bridges + skill path must all be gated | Critical |
| No existing test breakage | 18+ routing adapter + 10+ queue tests | Critical |
| Noise catch rate | Must eliminate the 160 known noise dispatches | High |
| Domain enforcement feasibility | domain isn't in packet type — approach must be implementable | High |
| Implementation simplicity | Fewer moving parts = less risk | Medium |
| Future extensibility | Easy to add new patterns | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Centralized in queue admission + historical-carryover alignment | Content guards extracted as a shared pure function called by `enqueueQueueDispatches()`, plus historical-carryover bridge refactored to use `enqueueQueueDispatches()` (or call the same guard function directly before its `queue.dispatches.push()`). Forbidden patterns, area_anchor dedup, domain check on persisted entry. | Single enforcement point; all 5 bridges protected; domain accessible at write time | `enqueueQueueDispatches()` grows; historical-carryover bridge needs a targeted change | Historical-carryover alignment is a small refactor (bridge already does its own dispatch_id + cluster dedup inline) | Yes |
| B: New shared validation function without bridge alignment | Extract `validateDispatchContent()` called by `enqueueQueueDispatches()` and routing adapter, but leave historical-carryover bridge unchanged | Clean separation; reusable; unit-testable pure function | Historical-carryover bridge still bypasses all guards; routing adapter still can't do dedup (no state); two call sites to maintain | Fails "all ingress paths" criterion unless historical-carryover is also changed | No — incomplete without bridge alignment |
| C: Guards in routing adapter only | Add forbidden patterns and min-length to the routing adapter | Early rejection; pure function; easy to test | Only protects skill path — all 5 bridges bypass routing adapter entirely; can't do dedup or domain (no state) | 80% of noise is from bridges (artifact_delta) — this misses the primary source | No — fails "all ingress paths" criterion |

## Engineering Coverage Comparison

| Coverage Area | Option A (centralized + bridge alignment) | Option B (shared function, no bridge alignment) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | N/A | N/A | N/A |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | New `ValidationFailureReason` literals flow into existing `kind: "validation_rejected"` telemetry | Same | Same for both — extend existing telemetry path |
| Testing / validation | Tests for guard function + `enqueueQueueDispatches()` + historical-carryover bridge alignment | Tests for `validateDispatchContent()` and callers; historical-carryover still unguarded | Option A: complete coverage of all 5 bridges |
| Data / contracts | Add `ValidationFailureReason` literals; domain canonical check on persisted entries only (domain not in packet type) | Same contract changes; historical-carryover still bypasses | Option A closes the gap |
| Performance / reliability | Regex runs once per enqueue; Set lookup for dedup | Same runtime cost | Negligible difference |
| Rollout / rollback | `enqueueQueueDispatches()` change + small historical-carryover bridge refactor | Two-file change but incomplete coverage | Option A slightly larger blast radius but complete |

## Chosen Approach

- **Recommendation:** Option A — Centralized guards in `enqueueQueueDispatches()` with historical-carryover bridge alignment
- **Why this wins:** It's the simplest approach that protects all ingress paths. 4 of 5 bridges already converge at `enqueueQueueDispatches()`. The 5th (historical-carryover) must be aligned — either by refactoring it to use `enqueueQueueDispatches()`, or by calling the same guard function from its write path. The guard logic itself is extracted as a pure function for testability, called from `enqueueQueueDispatches()` before append. Option C is eliminated because it misses all bridge paths.
- **What it depends on:**
  - **Historical-carryover alignment:** The bridge currently does its own dispatch_id + cluster dedup inline (lines 289–301) then pushes directly. It must either route through `enqueueQueueDispatches()` or call the same content guard function before `queue.dispatches.push()`. The simplest approach is to refactor the bridge to use `enqueueQueueDispatches()` since it already builds valid packets.
  - **Domain enforcement:** Since `domain` is NOT in `TrialDispatchPacketV2` and no current packet constructor attaches it as an extra property, domain enforcement cannot work by reading packet properties at admission time. Instead, domain enforcement operates at the cleanup/persistence layer only — the cleanup script classifies domains on existing persisted entries, and future domain presence is an LLM-instruction concern (agent-authored entries in queue-state.json include domain by convention, not by type contract). The admission guard validates domain canonicality only when the field is already present on the persisted entry.

### Rejected Approaches

- **Option B (shared function without bridge alignment)** — Still fails "all ingress paths" unless the historical-carryover bridge is also changed. If the bridge must be changed regardless, then Option A (centralize + align) is simpler than extracting a shared function and hoping all writers call it.
- **Option C (routing adapter only)** — Fundamentally insufficient. All 5 bridges bypass the routing adapter, and 80% of noise comes from bridge-emitted `artifact_delta` dispatches. This option would miss the primary noise source.

### Open Questions (Operator Input Required)

None. All decisions are resolvable from evidence and engineering constraints.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Queue admission | No content quality checks; any non-empty area_anchor accepted; no domain enforcement; dispatch_id + cluster dedup only; no structural checks in `enqueueQueueDispatches()` (those exist only in `TrialQueue.validatePacket()` which bridges bypass); historical-carryover bridge writes directly bypassing `enqueueQueueDispatches()` | Dispatch packet arrives at queue write path | 1. Existing dispatch_id + cluster dedup 2. **NEW: Forbidden-pattern check** on area_anchor (reject agent reasoning, malformed content) 3. **NEW: Minimum word count** (≥5 words for artifact_delta) 4. **NEW: Area_anchor dedup** (reject if identical anchor already in queue) 5. **NEW: Domain canonical check** (validate domain is in ArtifactDomain enum if present on persisted entry; warn-with-default if missing) 6. Persist to queue file 7. **NEW: Historical-carryover bridge aligned** to use `enqueueQueueDispatches()` or call the same guard function | Packet emission, routing adapter validation, telemetry format | Forbidden patterns derived from current noise; may need updates for future noise patterns; historical-carryover bridge refactor is small but must be tested |
| Queue data quality | 29.3% noise, 53.2% missing domain, 1.8% non-canonical domain | One-time cleanup script | 1. Load queue-state.json 2. Remove noise dispatches (area_anchor dedup + forbidden patterns) 3. Classify missing domains using audit analysis 4. Fix non-canonical values (BUILD→PRODUCTS, Platform→BOS) 5. Update counts 6. Write atomically | Dispatch content, evidence_refs, location_anchors — only queue_state metadata and noise removal | Domain classification requires judgment per dispatch; script must produce reviewable diff |

## Planning Handoff

- Planning focus:
  - Implement content validation guards in `enqueueQueueDispatches()` with forbidden patterns, min word count, area_anchor dedup, and domain canonical check (when present on persisted entry)
  - Align historical-carryover bridge to route through `enqueueQueueDispatches()` or call the same guard function
  - Write cleanup script for existing queue data (noise removal + domain classification)
  - Re-run pattern analysis on cleaned data
- Validation implications:
  - Unit tests for each validation rule in queue-admission.ts
  - Run new guards against all 547 existing dispatches to verify: 160 noise caught, 387 legitimate pass
  - Engineering coverage: `validate-engineering-coverage.sh` must pass
- Sequencing constraints:
  - Guards must be implemented and tested BEFORE cleanup (cleanup script can use the same validation functions)
  - Cleanup must complete BEFORE pattern analysis (analysis needs clean data)
- Risks to carry into planning:
  - Forbidden-pattern false positives on legitimate dispatches — mitigate by testing against full queue
  - Domain classification accuracy for 291 unclassified entries — mitigate by producing reviewable diff

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Forbidden-pattern regex false positive | Low | Medium | Patterns are derived from noise analysis; edge cases discoverable only by testing against full queue | Test all 547 dispatches against new guards; verify 0 false positives |
| Domain classification judgment calls | Medium | Low | 291 entries need manual classification; some may be ambiguous | Cleanup script should produce diff for operator review |
| Future noise patterns not covered | Low | Low | Guards catch current patterns; new patterns may emerge | Design guard function to be easily extensible (pattern list as constant array) |
| Historical-carryover bridge alignment | Low | Medium | Bridge writes directly to queue bypassing `enqueueQueueDispatches()` — must be refactored or must call the same guard function | Test existing historical-carryover test suite after refactor |

## Planning Readiness

- Status: Go
- Rationale: Single viable approach (centralized guards in queue admission + historical-carryover bridge alignment), all evaluation criteria met, no operator input needed, clear implementation path with 4 tasks (guards → bridge alignment → cleanup → pattern analysis).
