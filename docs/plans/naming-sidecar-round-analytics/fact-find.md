---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Operations
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: naming-sidecar-round-analytics
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/naming-sidecar-round-analytics/plan.md
Trigger-Why: The naming pipeline already emits structured per-candidate sidecar events, but there is no standing analytics dataset or review cadence to convert those logs into reusable self-improvement signals.
Trigger-Intended-Outcome: type: operational | statement: Produce a deterministic naming analytics dataset and recurring review process so naming rounds feed measurable pattern, yield, and operator-preference learning. | source: operator
---

# Naming Sidecar Round Analytics Fact-Find Brief

## Scope
### Summary
Progress the BOS P3 idea "Naming pipeline sidecar logs for per-round naming analytics" from idea-candidate to an execution-ready plan. The target is to turn existing sidecar JSONL logs into a deterministic, repeatable analytics output plus a formal review cadence that feeds the startup-loop self-improvement process.

### Goals
- Create a single analytics extraction flow that reads all naming sidecars across businesses.
- Produce stable per-round and cross-round metrics (yield, funnel, stage mix, operator-result coverage).
- Define where analytics outputs live in repo and how often they are refreshed.
- Define the operator review cadence after each new naming round.

### Non-goals
- Rebuilding or replacing naming generation/scoring models in this cycle.
- Changing RDAP/TM CLI runtime behavior.
- Retrofitting historical rounds beyond what sidecars already contain.

### Constraints & Assumptions
- Constraints:
  - Existing sidecar schema remains source-of-truth (`v1`); this work is additive.
  - Analytics must operate on current path layout under `assessment/naming-workbench/*-sidecars/`.
  - Outputs must be deterministic and commit-friendly (no external DB dependency).
- Assumptions:
  - Existing three sidecar round files are sufficient to ship v1 analytics structure.
  - `operator_result` may be null for many TM events initially; metrics must handle sparse labels.

## Outcome Contract
- **Why:** The naming pipeline has telemetry, but without a standing analytics artifact and cadence the loop cannot reliably learn from round-to-round outcomes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic analytics dataset and update cadence so each naming round contributes to measurable pattern/yield/operator-preference learning.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/_data/process-improvements.json` — idea exists as BOS P3 candidate (`idea_key: 322c2fe54d86bc98f403ce301173d6450329e5f9`).
- `docs/plans/_archive/startup-loop-naming-pipeline-science-upgrade/results-review.user.md` — original source and trigger wording.
- `scripts/src/startup-loop/naming/event-log-writer.ts` — canonical sidecar event schema and stages.
- `scripts/src/startup-loop/naming/baseline-extractor.ts` — existing aggregate extractor limited to one sidecar directory.

### Key Modules / Files
- `scripts/src/startup-loop/naming/event-log-writer.ts`
  - Defines `SidecarStage` and event contract for `generated`, `rdap_checked`, `tm_prescreened`, etc.
- `scripts/src/startup-loop/naming/baseline-extractor.ts`
  - Aggregates one directory only; no cross-business/cross-pipeline output contract.
- `docs/business-os/strategy/HEAD/assessment/naming-workbench/naming-sidecars/2026-02-26-round-7.jsonl`
  - 501 events (250 generated, 250 rdap_checked, 1 finalist).
- `docs/business-os/strategy/HEAD/assessment/naming-workbench/product-naming-sidecars/2026-02-26-round-1.jsonl`
  - 40 events (20 generated, 20 tm_prescreened).
- `docs/business-os/strategy/HBAG/assessment/naming-workbench/product-naming-sidecars/2026-02-27-round-1.jsonl`
  - 330 events (165 generated, 165 tm_prescreened).

### Data & Contracts
- Sidecar event schema: `schema_version: v1`, append-only JSONL.
- Existing stage coverage in live files:
  - `generated`: 435 events
  - `rdap_checked`: 250 events
  - `tm_prescreened`: 185 events
  - `finalist`: 1 event
- Operator TM decision labels are currently sparse:
  - `operator_result: null` in all observed TM events (185/185).

### Dependency & Impact Map
- Upstream dependencies:
  - naming CLIs (`rdap-cli.ts`, `tm-prescreen-cli.ts`) continue emitting sidecars.
- Downstream dependents:
  - startup-loop review/process-improvement workflows need deterministic analytics artifacts.
  - future model calibration/retraining steps (`tools/naminglab`) benefit from normalized rollups.
- Likely blast radius:
  - `scripts/src/startup-loop/naming/` and startup-loop process docs only.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | 3 existing round files are enough to ship v1 analytics contract | sidecar inventory and parser coverage | Low | <1h |
| H2 | Existing sidecar schema captures enough fields for first preference/yield metrics | event schema + sample files | Low | <1h |
| H3 | A deterministic local artifact is sufficient for BOS self-improvement loops | process-improvement consumers use repo docs | Medium | 1-2h |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence |
|---|---|---|---|
| H1 | Three live sidecar files exist across HEAD/HBAG | sidecar directory scan | High |
| H2 | Stage, rdap status, scores, tm_prescreen fields present in schema/files | event-log-writer + JSONL files | High |
| H3 | BOS process improvements are repo-artifact driven | `_data/process-improvements.json` + existing loop docs | Medium |

### Test Landscape
- Existing:
  - `scripts/src/startup-loop/__tests__/naming-sidecar.test.ts` covers sidecar infrastructure.
  - `tools/naminglab/tests/*` covers replay/calibration/yield utilities.
- Gap:
  - No cross-business analytics contract test for combined naming-sidecar + product-naming-sidecar sources.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Sidecar source inventory | Yes | None | No |
| Cross-round metric viability | Partial | Moderate: current extractor is single-directory and RDAP-centric | Yes |
| Operator preference signal readiness | Partial | Moderate: labels currently null; metrics need explicit sparse-data handling | Yes |
| Process integration path | Yes | None | No |

## Scope Signal
Signal: right-sized
Rationale: The work can be bounded to additive analytics extraction + cadence documentation without changing naming runtime behavior.

## Questions
### Resolved
- Q: Is the idea still blocked by "currently empty" sidecar data?
  - A: No. That was true at 2026-02-26; as of 2026-03-04 there are three sidecar round files with 871 total events.
  - Evidence: sidecar file inventory and counts above.
- Q: Is existing extraction already sufficient?
  - A: Not for this objective. `baseline-extractor.ts` is single-directory and does not produce a standing cross-round artifact contract.
  - Evidence: `scripts/src/startup-loop/naming/baseline-extractor.ts`.

### Open (Operator Input Required)
- None. No operator-only decision is required for plan kickoff.

## Confidence Inputs
- Implementation: 86%
  - Evidence basis: concrete file paths, schema, and sample data exist.
  - To reach >=90: complete parser contract and fixture tests for mixed sidecar families.
- Approach: 84%
  - Evidence basis: additive artifact generation pattern already used in startup-loop scripts.
  - To reach >=90: lock output schema and acceptance tests before integration.
- Impact: 82%
  - Evidence basis: directly addresses an explicit BOS P3 idea and closes a known loop gap.
  - To reach >=90: one completed naming round consuming the new analytics cadence.
- Delivery-Readiness: 89%
  - Evidence basis: no external systems needed; all inputs in repo.
  - To reach >=90: finalize exact output paths and command integration.
- Testability: 85%
  - Evidence basis: deterministic JSONL fixtures and existing naming tests available.
  - To reach >=90: add end-to-end test from sidecar fixtures -> dataset artifact.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sparse operator labels reduce preference-signal quality | High | Medium | Emit coverage metrics and confidence flags; avoid over-claiming preference inference |
| Mixed company/product sidecar semantics can produce invalid aggregate comparisons | Medium | Medium | Separate pipeline-type metrics and only combine where contracts align |
| Path drift in future naming-workbench moves | Medium | Medium | Centralize glob paths in one module and cover by tests |

## Evidence Gap Review
### Gaps Addressed
- Confirmed sidecar data is no longer empty and now meets 3+ rounds threshold.
- Confirmed schema/stage fields available for initial analytics outputs.

### Confidence Adjustments
- Impact confidence raised from tentative to 82% after verifying live sidecar volume.

### Remaining Assumptions
- Preference analysis initially relies on sparse/no operator_result labels; outputs must expose this limitation.

## Planning Readiness
- Status: Go
- Recommended deliverable type: `multi-deliverable`
- Recommended execution skill: `lp-do-build`
- Ready-for-planning rationale: Evidence floor met (entry points, modules, data contracts, test landscape, risks), no unresolved operator-input blockers.
