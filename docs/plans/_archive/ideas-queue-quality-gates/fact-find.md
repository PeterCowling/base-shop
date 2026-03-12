---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: ideas-queue-quality-gates
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/ideas-queue-quality-gates/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312160000-PLAT-QUEUE-QUALITY
---

# Ideas Queue Quality Gates Fact-Find Brief

## Scope

### Summary

The lp-do-ideas pipeline has zero deterministic code-level guards on dispatch content quality. The routing adapter checks `area_anchor` is non-empty and the trial queue validates packet structure (dispatch_id, schema_version, mode, evidence_refs, status), but neither layer validates content quality, domain correctness, or content-similarity dedup. As a result, 29.3% of the queue (160 of 547 dispatches) is noise — duplicated agent-chatter fragments, malformed content, and slug-like path fragments. Additionally, 53.2% of dispatches (291) have missing domain classification, making the queue unreliable for decision-making or pattern analysis.

### Goals

- Add deterministic admission guards to the routing adapter and/or trial queue that reject noise before it enters the queue
- Clean existing queue data: purge noise dispatches, classify domains on legitimate entries, fix non-canonical domain values
- Produce a fresh pattern analysis on the cleaned data to identify which standing artifacts should be created

### Non-goals

- Migrating the queue file format from hand-authored to TS persistence layer (stable divergence per Known Issues)
- Adding LLM-based semantic validation (deterministic rules only)
- Changing the dispatch.v2 schema itself (guards work within current schema)

### Constraints & Assumptions

- Constraints:
  - Routing adapter is a pure function (no file I/O, no state mutation) — guards must be pure validation checks
  - `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts` is the canonical queue write entrypoint — all 4 bridges (agent-session, codebase-signals, build-origin, milestone) write through it; `TrialQueue.validatePacket()` is a separate validation path that bridges bypass. New guards must be in `enqueueQueueDispatches()` to protect all ingress paths.
  - Existing test suites (18+ routing adapter tests, 10+ queue tests) must not break
  - `domain` is NOT a field in the dispatch.v2 JSON schema or `TrialDispatchPacket` type — it exists upstream on `ArtifactDeltaEvent` and in the hand-authored queue entries; upstream `ArtifactDomain` enum includes 8 values (MARKET, SELL, PRODUCTS, LOGISTICS, STRATEGY, BOS, ASSESSMENT, LEGAL)
- Assumptions:
  - Noise is exclusively from `artifact_delta` trigger (confirmed: 0 noise from `operator_idea`)
  - Content-similarity dedup (area_anchor exact match) is sufficient; fuzzy matching is not needed for current noise patterns

## Outcome Contract

- **Why:** Right now, nothing checks whether an idea entering the backlog is real or just internal processing noise. Over half the entries have missing categories, and about 80 are duplicated fragments of the AI talking to itself. The operator cannot trust the backlog for decision-making. Adding automatic quality checks and cleaning up the existing data would make the ideas list reliable for prioritising what to work on next.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deterministic admission guards prevent noise entering the queue, existing queue data is cleaned and domain-classified, and a fresh pattern analysis on clean data is produced.
- **Source:** operator

## Current Process Map

- Trigger: A dispatch packet is emitted by lp-do-ideas (either from `artifact_delta` detection in `lp-do-ideas-trial.ts` or from `operator_idea` structured intake in the SKILL.md agent flow)
- End condition: Packet is written to `queue-state.json` with `queue_state: "enqueued"` and telemetry is appended

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Packet emission | 1. Delta detected or operator idea gathered 2. Agent builds dispatch packet with area_anchor, evidence_refs, etc. (Note: `domain` is NOT part of the dispatch.v2 schema or `TrialDispatchPacket` type — it exists only on `ArtifactDeltaEvent` upstream and in the persisted queue format) 3. Packet passed to routing adapter | lp-do-ideas agent (LLM) → routing adapter (TS) | `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` | Agent chatter can leak into area_anchor; no content quality check |
| Routing validation | 1. Check schema_version, mode, status, route consistency 2. Check area_anchor non-empty 3. Check evidence_refs non-empty array 4. Route-specific checks (location_anchors, deliverable_family) | Routing adapter (pure function) | `lp-do-ideas-routing-adapter.ts` lines 331–680 | No area_anchor content quality or forbidden patterns (domain is not in scope here — it's a queue-layer field) |
| Queue admission | 1. validatePacket() — dispatch_id, schema_version, mode, evidence_refs, status 2. Primary dedup by dispatch_id 3. Secondary dedup by cluster_key:cluster_fingerprint (v2) or artifact tuple (v1) 4. Create queue entry, register in indexes | Trial queue (`lp-do-ideas-trial-queue.ts`) | `lp-do-ideas-trial-queue.ts` lines 545–711 | Dedup is identity/hash-based only; identical area_anchors with different dispatch_ids pass through |
| Persistence | 1. Entry added to dispatches array 2. Counts updated 3. File written atomically | Queue file (`queue-state.json`) | `docs/business-os/startup-loop/ideas/trial/queue-state.json` | domain field is hand-set by agent, no canonical enforcement |

## Access Declarations

None. All evidence is in the local repository (TypeScript source, JSON queue file, JSON schema).

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` — Pure validation function that checks packet structure and routes to downstream skills
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts` — Universal queue write entrypoint (`enqueueQueueDispatches()`) used by all 4 bridges; this is where content quality guards must live
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts` — `TrialQueue` class with `validatePacket()` and `enqueue()` — a separate path that bridges bypass
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — Live queue file (547 dispatches, 25k lines)

### Key Modules / Files

- `lp-do-ideas-routing-adapter.ts` — 18 validation checks exist (schema, mode, status, route, field presence); area_anchor only checks non-empty (line 457–470); domain not validated at all
- `lp-do-ideas-queue-admission.ts` — `enqueueQueueDispatches()` is the universal queue write entrypoint; all 4 bridges (agent-session, codebase-signals, build-origin, milestone) call it; performs dispatch_id and cluster dedup but no content quality checks
- `lp-do-ideas-trial-queue.ts` — `TrialQueue` class with `validatePacket()` (lines 215–301) and `enqueue()` (lines 545–711); bridges bypass this class entirely; `normalizeKeyToken()` (lines 1152–1160) accepts any string
- `lp-do-ideas-trial.ts` — Main orchestrator; builds cluster keys and anchor keys; `ANCHOR_KEY_MAX_LENGTH = 80` constant exists but is only used for `buildAnchorKey()`, not for routing validation
- `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json` — 21 required fields; `domain` is NOT in the schema; `provisional_deliverable_family` has enum constraint but adapter only checks non-empty

### Patterns & Conventions Observed

- **Pure function pattern**: Routing adapter is stateless — all validation is synchronous, no I/O. New guards must follow this pattern.
- **Fail-closed with error codes**: Adapter uses typed error codes (`MISSING_AREA_ANCHOR`, `UNKNOWN_STATUS`, etc.) — new guards should follow this convention with new error codes.
- **Two-layer dedup**: Primary (dispatch_id) + secondary (cluster key/fingerprint). Evidence attachment on v2 dedup hit merges refs into canonical entry.
- **Hand-authored queue divergence**: Live queue uses `"dispatches"` array with root keys `last_updated`, `counts`, `dispatches` (no `queue_version` key in the current file); TS persistence layer uses `"entries"` array and `"schema_version"` key. The HTML viewer handles both formats via conditional branch.

### Data & Contracts

- Types/schemas/events:
  - `TrialDispatchPacket` type in trial-queue.ts — `Partial<>` typed, allows extra fields
  - dispatch.v2 schema at `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`
  - `ValidationFailureReason` type with 7 literals; needs new values for content quality gates
- Persistence:
  - `queue-state.json` — JSON file, atomically written, 547 entries
- API/contracts:
  - `validatePacket()` returns `{ valid: true } | { valid: false; reason; detail }`
  - `enqueue()` returns `{ ok: boolean; queue_state: string }`

### Dependency & Impact Map

- Upstream dependencies:
  - lp-do-ideas agent (produces packets) — will benefit from clearer rejection messages
  - lp-do-ideas-trial.ts (builds artifact_delta packets) — source of noise; guards catch its output
- Downstream dependents:
  - lp-do-fact-find (consumes `fact_find_ready` dispatches) — currently receives noise
  - ideas.user.html viewer (reads queue-state.json) — will show cleaner data
  - generate-process-improvements.ts (reads queue for pattern analysis) — accuracy improves
- Likely blast radius:
  - Low — validation is additive (new checks in existing validation path)
  - Queue cleanup is a one-time data edit to an append-only file

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner via `pnpm -w run test:governed`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas`
- CI integration: Tests run in CI only per testing policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Routing adapter validation | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` | 18+ test cases covering all 18 existing validation checks |
| Trial queue validation | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts` | 10+ test cases covering validatePacket, dedup, state transitions |
| Queue admission | Integration | Same as above | Covers enqueue flow with dedup and telemetry |

#### Coverage Gaps

- No tests for content quality validation (because it doesn't exist)
- No tests for domain canonical enforcement (because it doesn't exist)
- No tests for area_anchor forbidden patterns (because they don't exist)

#### Testability Assessment

- Easy to test: All validation is pure functions — new guards are trivially unit-testable
- Hard to test: Nothing — this is the simplest possible test surface
- Test seams needed: None — existing `validatePacket()` function is the natural extension point

#### Recommended Test Approach

- Unit tests for: Each new validation rule (forbidden patterns, domain enforcement, area_anchor dedup, minimum length)
- Integration tests for: End-to-end enqueue with invalid packets to confirm rejection
- Contract tests for: New `ValidationFailureReason` values align with telemetry schema

### Recent Git History (Targeted)

- `lp-do-ideas-routing-adapter.ts` — Last significant change added v2 why/intended_outcome propagation and status/route mismatch detection
- `lp-do-ideas-trial-queue.ts` — Last significant change added v2 cluster dedup and evidence attachment on dedup hit
- Neither file has had content quality guards added at any point in history

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A: no UI — this is backend validation logic | — | — | — |
| UX / states | N/A: no user-facing states | — | — | — |
| Security / privacy | N/A: no auth/sensitive data — validation of internal queue data | — | — | — |
| Logging / observability / audit | Required | Telemetry records emitted on enqueue, skip, and validation rejection (trial-queue.ts lines 700–708). All validation failures use a single `kind: "validation_rejected"` with the specific cause in the `reason` field. | New rejection reasons need new `ValidationFailureReason` values that flow into the existing `reason` field — no new telemetry `kind` values needed | Ensure new guards add `ValidationFailureReason` literals and the existing `"validation_rejected"` kind covers them |
| Testing / validation | Required | 18+ routing adapter tests, 10+ queue tests | Zero tests for content quality gates | Add unit tests for each new validation rule |
| Data / contracts | Required | `ValidationFailureReason` type, dispatch.v2 schema, `TrialDispatchPacket` type | New failure reasons need new enum values; domain not in schema | Add new `ValidationFailureReason` values; domain enforcement is queue-layer only |
| Performance / reliability | Required | Validation is synchronous pure functions; queue file is ~1.6MB | Forbidden-pattern regex must be fast; area_anchor dedup needs Set lookup | Keep regex simple; use pre-compiled patterns |
| Rollout / rollback | N/A: internal tooling, no deployment — code change to validation functions | — | — | — |

## Noise Analysis (Quantitative Evidence)

### Queue Composition

| Category | Count | % of 547 |
|---|---|---|
| Legitimate dispatches | 387 | 70.7% |
| Noise dispatches | 160 | 29.3% |
| Missing domain | 291 | 53.2% |
| Non-canonical domain (BUILD, Platform) | 10 | 1.8% |

### Noise Breakdown by Pattern

Note: Categories overlap — a single noise dispatch can match multiple patterns (e.g. a duplicate that is also agent reasoning). The 160 unique noise dispatches are caught by the union of these rules.

| Pattern | Matches (overlapping) | Catch Rule | Unique incremental catches |
|---|---|---|---|
| Duplicate area_anchors (3+ identical copies across 16 groups) | 154 | area_anchor Set lookup on enqueue | 154 (primary rule) |
| Agent reasoning fragments ("Now fix...", "TASK-04 depends on...") | 106 | Forbidden-pattern regex | ~6 (most already caught by dedup) |
| Malformed content (table rows, markdown headings in anchor) | 14 | Forbidden-pattern regex | ~0 (all already caught by dedup) |
| Slug-like path fragments (≤4 words, all lowercase) | 17 | Minimum word count + artifact_delta trigger check | ~0 (all already caught by dedup) |

### Noise Source

- 100% of noise originates from `trigger: "artifact_delta"` — the codebase signals bridge
- 0% from `trigger: "operator_idea"` — structured intake module is effective as LLM guardrail
- 156 of 195 artifact_delta dispatches (80%) are noise

### Proposed Validation Rules

| # | Rule | Implementation Layer | Catches | False Positive Risk |
|---|---|---|---|---|
| 1 | Area_anchor exact-match dedup (reject if identical anchor already in queue) | Trial queue `enqueue()` | 154 duplicates | None — identical text is always duplicate |
| 2 | Canonical domain enforcement (domain ∈ canonical set including MARKET, SELL, PRODUCTS, LOGISTICS, STRATEGY, BOS, ASSESSMENT, LEGAL) | Queue persistence layer (NOT `validatePacket()` — `domain` is not part of `TrialDispatchPacket` or dispatch.v2 schema; it exists only on `ArtifactDeltaEvent` upstream and in the hand-authored queue format; enforcement must be a separate write-time check on the persisted entry, not on the packet) | 291 unclassified + 10 non-canonical | Low — requires agent to set domain; upstream `ArtifactDomain` enum in trial.ts includes ASSESSMENT and LEGAL beyond the 6 core values |
| 3 | Forbidden-pattern regex on area_anchor | Routing adapter or trial queue | 106 agent reasoning | Low — patterns are specific to agent chatter |
| 4 | Minimum area_anchor word count (≥5 words for artifact_delta) | Routing adapter | 17 slug-like fragments | Low — real topics have ≥5 words |
| 5 | Malformed content detection (leading pipe, embedded markdown headings) | Routing adapter | 14 malformed entries | None — anchors should never contain tables/headings |

### Proposed Forbidden Patterns

```
/^(Now|Here are|But it|Let me|Looking at|Based on|Step \d)\s/i
/TASK-\d+/
/\bdepends\s+on\s+TASK/i
/Confidence\s+Inputs\s+section/i
/^\s*\|/          — table row
/###?\s/          — markdown heading
/…$/              — truncated text
/[✓✗✔✕]/u        — completion markers
/structural changes$/i  — auto-generated codebase signal label
```

## Questions

### Resolved

- Q: Should domain be added to the dispatch.v2 schema?
  - A: No. Domain is a queue-layer classification field, not a dispatch contract field. The schema serves the routing adapter (pure function); domain enforcement belongs at the queue persistence/write layer where the hand-authored format already carries it. Note: `domain` is used for cluster key building in `lp-do-ideas-trial.ts` (not trial-queue.ts), and the upstream `ArtifactDomain` enum already includes ASSESSMENT and LEGAL beyond the 6 core values.
  - Evidence: dispatch.v2 schema has no domain field; `ArtifactDomain` type in `lp-do-ideas-trial.ts` includes MARKET, SELL, PRODUCTS, LOGISTICS, STRATEGY, BOS, ASSESSMENT, LEGAL

- Q: Where should content quality guards live?
  - A: In `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts`. This is the universal queue write entrypoint — all 4 bridges (agent-session, codebase-signals, build-origin, milestone) write through it. `TrialQueue.validatePacket()` is a separate path that bridges bypass, so guards placed there would leave major ingress paths unprotected. The routing adapter is a pure function with no queue state access, so it cannot do dedup or domain lookups.
  - Evidence: `lp-do-ideas-queue-admission.ts` is imported by all 4 bridge modules; `TrialQueue` is not used by bridges

- Q: Will adding domain enforcement break existing dispatches that lack domain?
  - A: No — enforcement applies only to NEW dispatches on enqueue. Existing entries in the queue are untouched. The cleanup script handles retroactive classification separately.
  - Evidence: `validatePacket()` runs only during `enqueue()`, not on reads

- Q: Is the noise a one-time historical problem or ongoing?
  - A: Ongoing. The codebase signals bridge in lp-do-ideas-trial.ts generates artifact_delta packets from git diffs without content quality filtering. Any future build that triggers the bridge can produce noise.
  - Evidence: All 160 noise dispatches are artifact_delta; the bridge code has no content guards

### Open (Operator Input Required)

None. All questions are resolvable from code evidence and documented business requirements.

## Confidence Inputs

- Implementation: 90% — Pure function validation; clear extension points; existing test patterns to follow. Would reach 95% with a spike confirming regex performance on the 1.6MB queue file.
- Approach: 92% — Five rules ordered by impact; each rule is independent and can be rolled out incrementally.
- Impact: 85% — Eliminates 29.3% noise and 53.2% domain gaps. Would reach 95% after confirming the cleanup script correctly classifies all 291 unclassified entries.
- Delivery-Readiness: 88% — No external dependencies; no deployment needed; CI runs tests. Would reach 95% with test coverage for all new validation rules.
- Testability: 95% — Pure functions, existing test infrastructure, clear assertion patterns.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Forbidden-pattern regex false positive on legitimate dispatch | Low | Medium | Use specific patterns from noise analysis, not broad heuristics; test against all 387 legitimate dispatches |
| Domain enforcement blocks agent that hasn't been updated to set domain | Medium | Low | Make domain enforcement a warning-with-default for first 30 days, then hard gate |
| Cleanup script miscategorises a legitimate dispatch | Low | Medium | Produce diff for operator review before applying; domain classification follows the audit analysis |
| Queue file size (1.6MB) makes area_anchor dedup Set slow | Very Low | Low | Set lookup is O(1); 547 entries is trivial |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow existing `ValidationFailureReason` enum pattern for new error codes
  - New rejection reasons use the existing `kind: "validation_rejected"` telemetry path with new `ValidationFailureReason` literals in the `reason` field
  - Routing adapter must remain a pure function (no file I/O)
- Rollout/rollback expectations:
  - N/A — internal tooling, no deployment
- Observability expectations:
  - New telemetry records for each new rejection type, consistent with existing `"validation_rejected"` kind

## Suggested Task Seeds (Non-binding)

1. Add forbidden-pattern and minimum-length validation to `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts` (the universal write entrypoint all bridges use) + tests
2. Add area_anchor dedup gate to `enqueueQueueDispatches()` (reject if identical anchor already in queue) + tests
3. Add domain enforcement as a write-time check in `enqueueQueueDispatches()` — note: `domain` is not in `TrialDispatchPacket` or dispatch.v2 schema, so enforcement requires either extending the packet contract or validating the hand-authored entry format at write time + tests
4. Write and run queue cleanup script (purge noise, classify domains, fix non-canonical values)
5. Re-run operator idea pattern analysis on cleaned data

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All new validation rules have unit tests
  - Existing test suites pass
  - Queue cleanup diff reviewed and applied
  - Pattern analysis produced on clean data
- Post-delivery measurement plan:
  - Noise rate in queue drops from 29.3% to <1%
  - Domain classification coverage rises from 46.8% to >99%

## Scope Signal

- Signal: right-sized
- Rationale: The five validation rules are bounded, independently testable, and address the full noise taxonomy identified in the analysis. The cleanup script is a one-time data operation. No architecture changes, no external dependencies, no deployment required.

## Evidence Gap Review

### Gaps Addressed

- Identified all 160 noise dispatches with specific patterns and counts
- Mapped all validation checks in both routing adapter (18 checks) and trial queue (8 checks)
- Confirmed domain is not in dispatch.v2 schema — enforcement must be queue-layer
- Confirmed 100% of noise is from artifact_delta trigger, 0% from operator_idea
- Verified existing test infrastructure and extension patterns

### Confidence Adjustments

- Implementation confidence raised from initial 80% to 90% after confirming pure function extension points
- Impact confidence raised from initial 75% to 85% after quantifying exact noise patterns

### Remaining Assumptions

- Forbidden patterns derived from current noise will be sufficient for future noise (supported by: all noise follows a small set of patterns; new patterns can be added incrementally)
- Domain enforcement at queue layer (not schema) is sufficient (supported by: schema serves routing adapter which is domain-agnostic)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Routing adapter validation path | Yes | None | No |
| Trial queue validatePacket + enqueue | Yes | None | No |
| Noise taxonomy (all 160 dispatches) | Yes | None | No |
| Domain classification gap (291 entries) | Yes | None | No |
| Dispatch.v2 schema constraints | Yes | None | No |
| Existing test coverage and extension patterns | Yes | None | No |
| Queue file format divergence impact | Yes | None — guards work with hand-authored format | No |
| Downstream consumer impact (fact-find, viewer, process-improvements) | Yes | None — additive validation, no breaking changes | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Critique: 3 rounds, final raw score 3.0 (partially credible). All 3 Critical findings were architectural accuracy issues (wrong implementation seam) that were resolved in the artifact. Zero open questions, zero missing evidence, zero operator input needed. Proceeding to analysis as the evidence base is complete and all corrections applied.
- Recommended next step: `/lp-do-analysis ideas-queue-quality-gates`
