---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Mixed
Created: 2026-02-24
Last-updated: 2026-02-24
Last-reviewed: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-startup-loop-integration
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-briefing
Related-Plan: docs/plans/lp-do-ideas-startup-loop-integration/plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: User requested direct fact-find write-up for a new lp-do-ideas trial-first integration concept.
---

# lp-do-ideas Trial-First Fact-Find Brief

## Scope
### Summary
Design `lp-do-ideas` as a standalone trial pipeline now (not integrated into startup-loop runtime yet), while engineering it so go-live integration into startup-loop can be enabled later with minimal rework.

This revision explicitly reflects the current `lp-do-fact-find` contract: planning-only output, no built-in idea-card promotion intake, and minimum intake requirements that must be satisfied by any upstream `lp-do-ideas` handoff.

### Goals
- Align `lp-do-ideas` output contract to the revised `lp-do-fact-find` intake requirements.
- Define a trial operating model that auto-generates ideas from standing artifact changes without modifying startup-loop orchestration yet.
- Define a go-live seam so startup-loop can consume the same artifacts/contracts later.
- Preserve full traceability from standing artifact delta -> idea dispatch -> fact-find -> plan -> build.

### Non-goals
- Integrating `lp-do-ideas` into startup-loop `advance`/stage gating in this phase.
- Editing loop graph topology (`loop-spec.yaml`) or stage ordering.
- Replacing existing IDEAS-stage docs/semantics during trial.
- Implementing code changes in this fact-find cycle.

### Constraints & Assumptions
- Constraint: Trial mode must not mutate startup-loop stage state or gates.
- Constraint: `lp-do-ideas` dispatches must include intake fields required by current `lp-do-fact-find` (`area_anchor`, `location_anchors`, `provisional_deliverable_family`).
- Constraint: For understanding-only outcomes, handoff must route to `lp-do-briefing` (not `lp-do-fact-find`).
- Constraint: Event processing must be deterministic, idempotent, and auditable.
- Assumption: Existing queue and delta-mapping patterns are reusable for trial-mode orchestration.
- Assumption: Go-live can be treated as a mode switch (`trial` -> `live`) over a stable artifact contract.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- `.claude/skills/startup-loop/modules/cmd-advance.md`
- `.claude/skills/lp-do-fact-find/SKILL.md`
- `.claude/skills/idea-scan/SKILL.md`
- `.claude/skills/idea-develop/SKILL.md`
- `scripts/src/startup-loop/map-artifact-delta-to-website-backlog.ts`
- `packages/mcp-server/src/tools/loop.ts`
- `docs/business-os/startup-loop/ideas/scan-proposals.schema.md`
- `docs/business-os/startup-loop/loop-output-contracts.md`

### Key Modules / Files
- `loop-spec.yaml` defines IDEAS as a standing pipeline with `layer_a_pack_diff` triggers and IDEAS-03 promotion to DO.
- `stage-operator-dictionary.yaml` documents IDEAS as event-driven.
- `cmd-advance.md` currently has no IDEAS auto-dispatch gate for standing artifact changes.
- Revised `lp-do-fact-find/SKILL.md` now:
  - is planning-output oriented,
  - requires concrete intake anchors,
  - routes understanding-only work to `/lp-do-briefing`,
  - does not include the earlier explicit IDEAS-03 idea-card promotion fast-path contract.
- `idea-scan` remains proposal-only (`scan-proposals.md`) and non-mutating.
- `idea-develop` remains API-centric raw idea -> card workflow.
- `map-artifact-delta-to-website-backlog.ts` provides deterministic changed-path -> action seed mapping pattern.
- `loop.ts` provides guarded enqueue/status lifecycle patterns suitable for idempotent trial queues.

### Patterns & Conventions Observed
- Spec and operator docs describe event-driven IDEAS, but active runtime orchestration remains mostly manual.
- Upstream handoff to `lp-do-fact-find` must now satisfy its revised intake contract explicitly.
- Existing deterministic mapper and guarded queue patterns can be reused for trial implementation.
- Current IDEAS artifacts are markdown-first; adjacent orchestration patterns already support JSON artifacts for machine handoff.

### Data & Contracts
- Existing: IDEAS trigger semantics in spec and dictionary.
- Existing: canonical DO artifact namespace under `docs/plans/<feature-slug>/`.
- Gap: no standardized `lp-do-ideas` dispatch packet aligned to revised `lp-do-fact-find` intake.
- Gap: no explicit trial/live mode contract governing when startup-loop stage orchestration is permitted to consume `lp-do-ideas` events.

### Dependency & Impact Map
- Upstream dependencies:
  - Standing artifact deltas from MARKET/SELL/PRODUCTS/LOGISTICS and other registered standing docs.
- Downstream dependents:
  - `lp-do-fact-find` / `lp-do-briefing` routing.
  - `lp-do-plan` and `lp-do-build` lineage fields.
- Likely blast radius (trial):
  - New trial queue + dispatch artifacts.
  - Minimal/no change to startup-loop stage advancement.
- Likely blast radius (go-live later):
  - `startup-loop` orchestration modules, IDEAS gate handling, and transition automation.

### Recent Git History (Targeted)
Not investigated: no history analysis required for this discovery-only fact-find.

## Findings
| ID | Finding | Evidence | Impact |
|---|---|---|---|
| FND-01 | Current runtime does not enforce automatic IDEAS dispatch on every standing artifact change, despite standing-pipeline intent in spec. | `loop-spec.yaml`, `stage-operator-dictionary.yaml`, `cmd-advance.md` | Full auto-trigger behavior is not yet operationally guaranteed. |
| FND-02 | Revised `lp-do-fact-find` intake contract no longer assumes direct idea-card promotion path and now requires explicit area/location/deliverable anchors. | `.claude/skills/lp-do-fact-find/SKILL.md` | `lp-do-ideas` must emit intake-ready dispatch fields or use an adapter layer. |
| FND-03 | Trial-first requirement changes architecture priority: build standalone dispatch generation now, defer startup-loop orchestration integration to a go-live phase. | User directive + current orchestration state | Reduces immediate blast radius and allows controlled validation before loop integration. |
| FND-04 | Deterministic mapping and guarded queue semantics already exist and can be reused in trial mode. | `map-artifact-delta-to-website-backlog.ts`, `packages/mcp-server/src/tools/loop.ts` | Lowers implementation risk and avoids inventing new orchestration primitives. |
| FND-05 | IDEAS scan/proposal/card flows are split across tools; without a shared dispatch contract, automated handoff quality is inconsistent. | `idea-scan/SKILL.md`, `idea-develop/SKILL.md`, `scan-proposals.schema.md` | Requires a single `lp-do-ideas` dispatch schema as trial contract source of truth. |

## Proposed Trial-First Contract (Planning Input)
### Mode Model
- `mode: trial` (now):
  - run `lp-do-ideas` off standing artifact deltas,
  - generate dispatch artifacts,
  - do not hook into startup-loop stage transitions/gates.
- `mode: live` (future):
  - startup-loop consumes same dispatch artifacts,
  - IDEAS stage automation enabled via controlled integration path.

### Trial Trigger Rule
- Any semantic delta in registered standing artifacts creates a trial event.
- Trial event processing is idempotent by `event_id`/artifact hash pair.
- Trial event outcomes:
  - `fact_find_ready`
  - `briefing_ready`
  - `auto_executed`
  - `logged_no_action`

### `lp-do-ideas` Dispatch Packet (aligned to revised fact-find)
```json
{
  "dispatch_id": "IDEA-DISPATCH-<timestamp>-<seq>",
  "mode": "trial",
  "business": "<BIZ>",
  "trigger": "artifact_delta",
  "artifact_id": "<artifact_key>",
  "before_sha": "<sha>",
  "after_sha": "<sha>",
  "area_anchor": "<feature/component/system>",
  "location_anchors": ["<path|route|endpoint|flow>"],
  "provisional_deliverable_family": "code-change|doc|multi|...",
  "current_truth": "<what is now true>",
  "next_scope_now": "<what to investigate now>",
  "adjacent_later": ["<future opportunity>"],
  "recommended_route": "lp-do-fact-find|lp-do-briefing",
  "status": "fact_find_ready|briefing_ready|auto_executed|logged_no_action",
  "priority": "P1|P2|P3",
  "confidence": 0.0,
  "evidence_refs": ["<artifact path/anchor>"]
}
```

### Trial Handoff Behavior
- If `recommended_route = lp-do-fact-find` and `status = fact_find_ready`:
  - invoke `lp-do-fact-find` with dispatch-derived topic/intake anchors.
- If `recommended_route = lp-do-briefing` and `status = briefing_ready`:
  - invoke `lp-do-briefing`.
- All outcomes are recorded without startup-loop stage mutation.

### Go-Live Predisposition Requirements (define now, activate later)
- Keep dispatch schema versioned and stable across trial and live.
- Add explicit `mode` field to all artifacts/events.
- Add integration boundary contract documenting how startup-loop will consume trial-proven dispatches.
- Define go-live switch criteria before wiring `cmd-advance`/stage automation.

## Suggested Task Seeds (Non-binding)
- TASK-01 (INVESTIGATE): Define standing-artifact registry and semantic-delta classifier for trial triggers.
- TASK-02 (IMPLEMENT): Create `lp-do-ideas` trial contract + schema (`dispatch.v1`) aligned to revised `lp-do-fact-find` intake.
- TASK-03 (IMPLEMENT): Build handoff adapter that maps dispatch packets to `lp-do-fact-find` or `lp-do-briefing` invocation paths.
- TASK-04 (IMPLEMENT): Implement trial queue lifecycle using guarded/idempotent request semantics.
- TASK-05 (CHECKPOINT): Define go-live contract (integration seam, mode switch, rollback path, activation checklist).
- TASK-06 (CHECKPOINT): Run trial telemetry review and establish minimum go-live criteria.

## Questions
### Resolved
- Q: Does startup-loop spec already define IDEAS as standing/event-driven?
  - A: Yes.
  - Evidence: `loop-spec.yaml`, `stage-operator-dictionary.yaml`.
- Q: Does revised `lp-do-fact-find` require explicit intake anchors and planning-oriented routing?
  - A: Yes.
  - Evidence: `.claude/skills/lp-do-fact-find/SKILL.md`.
- Q: Are reusable deterministic/guarded orchestration patterns already available?
  - A: Yes.
  - Evidence: `map-artifact-delta-to-website-backlog.ts`, `packages/mcp-server/src/tools/loop.ts`.

### Open (User Input Needed)
- Q: What semantic-delta threshold should separate `logged_no_action` from `fact_find_ready` in trial mode?
  - Why it matters: Controls trial signal quality and operator load.
  - Decision impacted: Classifier/routing policy.
  - Decision owner: Operator / startup-loop maintainers.
  - Default assumption (if any) + risk: Default to conservative threshold; risk is under-triggering useful opportunities.
- Q: Should trial mode auto-invoke `lp-do-fact-find`/`lp-do-briefing`, or only queue dispatches for operator confirmation?
  - Why it matters: Determines autonomy level and review burden.
  - Decision impacted: Runner design and safety controls.
  - Decision owner: Operator.
  - Default assumption (if any) + risk: Default to queued-with-confirmation; risk is slower throughput.
- Q: What are explicit go-live criteria for startup-loop integration?
  - Why it matters: Prevents indefinite trial drift and unclear activation decisions.
  - Decision impacted: Integration plan and release gating.
  - Decision owner: Operator / maintainers.
  - Default assumption (if any) + risk: Default to metric-based gate (precision/throughput/stability); risk is delayed activation if metrics undefined.

## Confidence Inputs
| Dimension | Score | Evidence basis | What would raise to >=80 | What would raise to >=90 |
|---|---:|---|---|---|
| Implementation | 83% | Trial mode reuses existing queue + deterministic mapping patterns and avoids immediate startup-loop mutation. | Confirm final dispatch schema and adapter behavior in one dry run. | Execute two end-to-end trial cycles with stable idempotency and correct routing. |
| Approach | 87% | Trial-first + go-live seam matches user directive and current orchestration reality. | Lock mode contract and activation path in plan tasks. | Validate on one business with measurable signal quality. |
| Impact | 79% | Trial mode should improve idea readiness while controlling risk; impact depends on trigger precision. | Define/track trial KPIs and baseline. | Demonstrate sustained improvement in fact-find-ready idea flow. |
| Delivery-Readiness | 81% | Scope is now constrained to trial architecture and adapter contract. | Resolve open autonomy/go-live criteria decisions. | Complete trial checklist and acceptance evidence pack. |
| Testability | 82% | Dispatch schema, queue idempotency, and routing decisions are testable in isolation. | Add contract tests for route selection and required intake fields. | Add integration tests for delta -> dispatch -> fact-find/briefing invocation path. |

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Trial dispatch misses required fact-find intake anchors | Medium | High | Enforce schema validation for `area_anchor`, `location_anchors`, `provisional_deliverable_family`. |
| Over-triggering from low-value artifact noise | Medium | Medium | Add semantic-delta classifier and confidence threshold tuning. |
| Under-triggering due to conservative thresholds | Medium | Medium | Monitor false-negative feedback during trial reviews. |
| Future go-live integration causes contract drift | Medium | High | Freeze dispatch schema version and mode semantics before integration work. |
| Ambiguous ownership between `lp-do-ideas`, `idea-scan`, and `idea-develop` | Medium | Medium | Define explicit role boundaries in plan tasks before implementation. |

## Planning Constraints & Notes
- Do not integrate with startup-loop stage orchestration in this phase.
- Design all trial artifacts for forward compatibility with future live integration.
- Keep direct-inject and manual override behaviors explicit and auditable.
- Preserve canonical DO artifact namespace and `fact-find.md` output path semantics.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-fact-find`, `lp-do-briefing`
- Deliverable acceptance package:
  - `lp-do-ideas` trial contract, dispatch schema, routing adapter, queue contract, and go-live seam doc.
- Post-delivery measurement plan:
  - Track dispatch precision, fact-find/briefing routing accuracy, and mean time delta->ready-dispatch.

## Evidence Gap Review
### Gaps Addressed
- Updated assumptions to match revised `lp-do-fact-find` contract.
- Reframed solution from immediate loop integration to trial-first architecture.
- Established forward-compatible go-live seam requirements.

### Confidence Adjustments
- Increased implementation and delivery-readiness confidence after reducing phase-1 scope to trial mode.
- Reduced impact certainty pending trial KPI calibration.

### Remaining Assumptions
- Standing artifact delta detection is available and reliable for trial processing.
- Maintainers will accept a mode-switched rollout (`trial` then `live`) instead of direct integration.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning kickoff; open questions are policy decisions for autonomy/threshold/go-live criteria.
- Recommended next step:
  - `/lp-do-plan` on `docs/plans/lp-do-ideas-startup-loop-integration/fact-find.md`
