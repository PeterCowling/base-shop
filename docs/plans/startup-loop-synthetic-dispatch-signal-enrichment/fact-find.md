---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-synthetic-dispatch-signal-enrichment
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/startup-loop-synthetic-dispatch-signal-enrichment/plan.md
Trigger-Why: Synthetic startup-loop signal bridges are a legitimate source of work, but the dispatch pipeline currently strips too much detail and downstream consumers surface the resulting packets as generic ideas.
Trigger-Intended-Outcome: "type: operational | statement: Synthetic signal dispatches retain enough structured narrative to produce well-formed idea cards without suppressing legitimate signals. | source: operator"
---

# Startup Loop Synthetic Dispatch Signal Enrichment Fact-Find Brief

## Scope
### Summary
The startup-loop ideas pipeline has three active BOS synthetic bridges: bug scan, codebase structural signals, repo maturity signals, and agent-session findings. Those bridges are intentional and should remain. The current defect is that the agent-session bridge, and to a lesser extent other synthetic bridges, lose too much explanatory detail before the packet reaches the queue and `process-improvements` surface. The result is a large volume of enqueued synthetic packets whose title/body are too generic to function as well-formed ideas.

This fact-find scopes a bounded repair, not a redesign. The goal is to preserve synthetic signal intake while carrying richer narrative through the existing dispatch contract and using that richer narrative in downstream idea surfacing.

### Goals
- Keep synthetic bridges active; do not suppress legitimate mechanical signals wholesale.
- Identify the narrowest contract seam where richer narrative can be preserved.
- Ensure downstream process-improvements entries can surface meaningful titles/bodies from synthetic dispatches.
- Keep the fix additive and backward-compatible for existing queue-state consumers.

### Non-goals
- Redesigning the entire ideas pipeline or replacing synthetic bridges with manual operator intake.
- Changing queue lifecycle semantics or introducing a new queue format.
- Reworking self-evolving governance or repeat-detection logic beyond what this enrichment requires.
- Running local Jest; CI remains the test authority.

### Constraints & Assumptions
- Constraints:
  - Limit scope to startup-loop scripts and direct downstream consumers.
  - Keep dispatch.v2 backward-compatible; additive changes only.
  - Validation must be targeted typecheck/lint plus deterministic inspection, not local Jest.
- Assumptions:
  - The main operational pain is not the existence of synthetic signals, but their low-information presentation.
  - Agent-session findings are the highest-value target for enrichment because they dominate the noisy surfaced queue.

## Outcome Contract
- **Why:** Synthetic startup-loop signal bridges are a legitimate source of work, but the dispatch pipeline currently strips too much detail and downstream consumers surface the resulting packets as generic ideas.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Synthetic signal dispatches retain enough structured narrative to produce well-formed idea cards without suppressing legitimate signals.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` - extracts agent-session findings and emits synthetic artifact-delta events.
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts` - emits synthetic codebase and repo-maturity artifact-delta events.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - converts artifact-delta events into dispatch packets.
- `scripts/src/startup-loop/build/generate-process-improvements.ts` - imports enqueued queue packets into the operator-facing process-improvements dataset.

### Key Modules / Files
- `docs/business-os/startup-loop/ideas/standing-registry.json`
  - The synthetic BOS artifacts are active `source_process` entries with `propagation_mode: "source_mechanical_auto"`. Evidence: lines 538-580.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
  - `ArtifactDeltaEvent` currently carries only delta metadata, changed sections, and evidence fields; no narrative override fields exist. Evidence: lines 262-282.
  - Dispatch packets are built with generic fallback `current_truth`, `next_scope_now`, `why`, and `intended_outcome` values derived only from `artifact_id`, `area_anchor`, and route. Evidence: lines 1298-1317.
  - `deriveAreaAnchor()` falls back to the artifact id when there is no code location anchor, which is exactly what happens for agent-session and repo-maturity artifacts. Evidence: lines 833-851.
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts`
  - `extractFindingsFromAssistantText()` accepts broad issue-language bullets/sentences. Evidence: lines 225-278.
  - `parseSessionFile()` captures up to five findings per session from recent transcript files when the user intent looked like walkthrough/review/test work. Evidence: lines 281-344.
  - `deriveEvent()` emits only artifact-level delta metadata plus `changed_sections` and `session:<id>` refs; it does not preserve structured summaries from findings. Evidence: lines 520-548.
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`
  - Structural and repo-maturity bridges already hold more concrete evidence internally, but still rely on the trial orchestrator’s generic packet narrative. Evidence: lines 429-470 and 536-665.
- `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - Queue dispatch collection uses `area_anchor` as title and `why` as body for every enqueued packet. It does not inspect `artifact_id`, `current_truth`, or any synthetic-source marker when forming the surfaced idea item. Evidence: lines 572-616.
- `scripts/src/startup-loop/__tests__/lp-do-ideas-agent-session-bridge.test.ts`
  - Confirms that extracted findings enqueue a dispatch, but does not assert anything about narrative quality. Evidence: lines 116-149.
- `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
  - Confirms queue packets surface as idea items using existing title/body assumptions. Evidence: lines 685-780.

### Patterns & Conventions Observed
- Synthetic bridges are first-class by design, not accidental backlog pollution.
  - Evidence: `standing-registry.json` lines 538-580.
- Dispatch.v2 intentionally distinguishes operator-authored `why`/`intended_outcome` from auto-generated values, and auto-generated values are allowed but tracked as lower quality.
  - Evidence: `lp-do-ideas-dispatch.v2.schema.json` lines 5-18 and `lp-do-ideas-trial.ts` lines 348-420.
- Existing queue consumers are tolerant of additional queue packet data as long as current required fields remain intact.
  - Evidence: `generate-process-improvements.ts` queue parser only reads a subset of packet fields; current tests build minimal packets directly.

### Data & Contracts
- Types/schemas/events:
  - `ArtifactDeltaEvent` in `lp-do-ideas-trial.ts` is the upstream contract seam for synthetic bridges.
  - `TrialDispatchPacket` / dispatch.v2 schema already include `current_truth`, `next_scope_now`, `why`, and `intended_outcome`.
- Persistence:
  - Synthetic dispatches are persisted in `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
  - Process-improvements read model is regenerated into `docs/business-os/_data/process-improvements.json`.
- API/contracts:
  - Queue-state consumers currently assume `area_anchor` is the best human-facing title.
  - No existing contract forces synthetic sources to stay generic; this is current implementation behavior, not a schema requirement.

### Dependency & Impact Map
- Upstream dependencies:
  - Agent-session bridge transcript parsing and summarization.
  - Codebase/repo-maturity signal bridge event emission.
  - Trial orchestrator packet construction.
- Downstream dependents:
  - `generate-process-improvements.ts`
  - Self-evolving ingestion from queue packets in `self-evolving-from-ideas.ts`
  - Any operator workflow that reads process-improvements or queue-state directly
- Likely blast radius:
  - `scripts` package only.
  - Generated JSON/HTML process-improvements outputs after regeneration.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The main failure is information loss between synthetic bridge event emission and dispatch packet construction. | Agent-session bridge + trial orchestrator | Low | Low |
| H2 | The smallest correct repair is additive event-level narrative overrides, not a new dispatch schema version. | `ArtifactDeltaEvent` + dispatch builder + queue consumer subset-read behavior | Medium | Low |
| H3 | Surfaced idea quality will materially improve if process-improvements can prefer richer packet fields for synthetic sources instead of `area_anchor` only. | Queue consumer behavior | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Agent-session bridge extracts many findings, but emitted events keep only sections and session ids; trial builder then generates generic text. | `lp-do-ideas-agent-session-bridge.ts`, `lp-do-ideas-trial.ts` | High |
| H2 | Existing dispatch schema already contains the fields we need downstream; only event-to-packet construction is generic. | `lp-do-ideas-dispatch.v2.schema.json`, `lp-do-ideas-trial.ts` | High |
| H3 | Process-improvements queue collector ignores richer packet context and always uses `area_anchor` + `why`. | `generate-process-improvements.ts` | High |

#### Recommended Validation Approach
- Quick probes:
  - Add targeted unit tests for narrative enrichment in the agent-session bridge path.
  - Add targeted unit tests for process-improvements queue item title/body selection.
- Structured tests:
  - Typecheck `scripts` package after additive contract changes.
  - Lint `scripts` package after updating queue consumer logic.
- Deferred validation:
  - CI tests for broader startup-loop regression coverage.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest in `scripts/src/startup-loop/__tests__`
- Commands:
  - `pnpm --filter scripts typecheck`
  - `pnpm --filter scripts lint`
- CI integration:
  - Required tests run in GitHub Actions; local Jest is not permitted by repo policy.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Agent-session bridge extraction | Unit | `lp-do-ideas-agent-session-bridge.test.ts` | Confirms extraction and enqueue behavior, not narrative quality |
| Codebase/repo synthetic bridges | Unit | `lp-do-ideas-codebase-signals-bridge.test.ts` | Confirms emission/suppression rules |
| Queue-to-process-improvements ingestion | Unit | `generate-process-improvements.test.ts` | Confirms enqueued queue packets become idea items |

#### Coverage Gaps
- No test asserts that synthetic dispatches carry meaningful `current_truth` / `why` when the source bridge has richer information.
- No test asserts that process-improvements prefers richer queue packet narrative over generic `area_anchor` for synthetic sources.
- No test distinguishes “valid synthetic signal” from “well-formed surfaced idea.”

### Recent Git History (Targeted)
- `docs/plans/_archive/bos-ideas-dispatch-20260303-followthrough/plan.md`
  - Synthetic BOS registry entries were originally introduced as placeholders and later activated via bridges. Evidence: lines 94-95.
- `docs/plans/startup-loop-self-improvement-integrity-fixes/fact-find.md`
  - Earlier integrity work already recognized that the self-improving loop was losing signal quality and over-relying on generic fallbacks. Evidence: lines 29-34 and 110-120.

## Questions
### Resolved
- Q: Are the synthetic bridge packets themselves the wrong concept?
  - A: No. The bridges are intentional and active by design; the issue is narrative quality, not the existence of synthetic intake.
  - Evidence: `standing-registry.json` lines 538-580.
- Q: Is the packet schema itself missing downstream narrative fields?
  - A: No. Dispatch.v2 already has `current_truth`, `next_scope_now`, `why`, and `intended_outcome`. The loss happens before or during packet construction.
  - Evidence: `lp-do-ideas-dispatch.v2.schema.json` and `lp-do-ideas-trial.ts` lines 399-420.
- Q: Is `generate-process-improvements.ts` contributing to the poor surfaced idea quality?
  - A: Yes. It reduces each queue item to `area_anchor` title plus `why` body, even for synthetic packets whose better fields could be used if present.
  - Evidence: `generate-process-improvements.ts` lines 579-615.

### Open (Operator Input Required)
None. The design choice is bounded by existing repo contracts and can be resolved in engineering.

## Confidence Inputs
- Implementation: 88%
  - Basis: the likely fix is confined to `ArtifactDeltaEvent`, synthetic bridges, and `generate-process-improvements.ts`.
  - To reach >=90: confirm no hidden validator rejects additive event fields and complete consumer tracing for queue readers.
- Approach: 86%
  - Basis: enriching existing packet fields is cleaner than inventing a new schema tier, but title selection for surfaced ideas needs care.
  - To reach >=90: choose one canonical rule for synthetic-title selection and cover it with focused tests.
- Impact: 90%
  - Basis: the current operator-facing noise is directly caused by generic surfaced packets; richer packet narratives should materially improve usability.
  - To reach >=90: regenerate process-improvements after the build and inspect representative synthetic items.
- Delivery-Readiness: 91%
  - Basis: no external dependencies; all affected code is local and already well covered by adjacent tests.
  - To reach >=90: maintained.
- Testability: 84%
  - Basis: good local seams exist for unit tests, but local Jest execution is disallowed.
  - To reach >=90: add targeted tests before pushing and rely on CI for execution.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Enrichment logic bakes noisy free text directly into dedupe keys or area anchors | Medium | High | Keep cluster fingerprint inputs stable; use narrative fields for display, not dedupe |
| Process-improvements title selection changes operator sorting in unintended ways | Medium | Medium | Restrict the new title-selection rule to synthetic artifacts only and add regression tests |
| Agent-session summarization still captures meta chatter | Medium | Medium | Improve summary selection with deterministic filters and cap output to concrete findings only |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Synthetic artifact registration | Yes | None | No |
| Bridge event emission | Yes | None | No |
| Trial dispatch construction | Yes | None | No |
| Queue-to-process-improvements surfacing | Yes | None | No |
| Test seam availability | Yes | None | No |

## Evidence Gap Review
### Gaps Addressed
- Confirmed that the weak title/body shape is not required by schema; it is an implementation choice.
- Confirmed that the generic `area_anchor` fallback is driven by missing code-location anchors for synthetic sources.
- Confirmed that downstream queue surfacing is simple enough to accept a bounded title/body enrichment rule.

### Confidence Adjustments
- Approach confidence increased after tracing `ArtifactDeltaEvent` and verifying that dispatch.v2 already contains the necessary downstream narrative fields.

### Remaining Assumptions
- Synthetic-source detection in process-improvements can be done safely from existing queue packet fields without a new persistence layer.

## Scope Signal
Signal: right-sized

Rationale: The defect is concrete and localized. The likely build can stay additive: enrich synthetic event-to-dispatch narrative fields and teach the process-improvements collector to surface them more intelligently, without changing queue lifecycle semantics or redesigning the ideas system.
