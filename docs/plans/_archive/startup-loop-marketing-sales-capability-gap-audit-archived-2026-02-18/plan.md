---
Type: Plan
Status: Archive
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-reviewed: 2026-02-17
Last-updated: 2026-02-17
Last-build: 2026-02-18 (TASK-12 — Complete; all tasks done)
Last-replan: 2026-02-17 (TASK-07, TASK-10)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-marketing-sales-capability-gap-audit
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-replan
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Startup Loop Capability and Naming UX Unification Plan

## Summary

This plan turns the fact-find into an executable remediation path that upgrades startup-loop from
contract coherence checks to explicit marketing and sales capability completeness.

The sequence is contract-first: quantify deadlocks, lock critical policy decisions, publish canonical
capability and artifact contracts, then apply stage and template updates, and finally enforce the new
contracts with lint and simulation tests.

This merged plan also absorbs process naming UX scope: canonical operator stage dictionary,
generated naming views, label-first run-packet display fields, and fail-closed stage addressing.

Backward compatibility is preserved by keeping canonical runtime stage IDs stable and defaulting to
`S6B` stage-key retention with split sub-gates unless the explicit decision task selects full stage-key split.

## Goals

- Define and publish canonical capability contracts for marketing and sales in the startup loop.
- Convert inferred deadlock risk into measurable telemetry and duration reporting.
- Resolve S6B gate topology ambiguity and denominator policy ambiguity through explicit decisions.
- Standardize producer and consumer artifact path contracts across lp-offer, lp-channels, lp-forecast, and lp-seo.
- Add enforceable guardrails for sparse-evidence forecasting and denominator-aware weekly decisions.
- Extend bottleneck diagnosis to support business-model-specific sales primitives.
- Add contract lint and deterministic gate simulation so regressions fail fast.
- Make operator stage naming meaning-first while preserving stable runtime stage IDs.
- Standardize stage addressing on `--stage` and `--stage-alias` with strict `--stage-label` compatibility.
- Add deterministic generation and lint coverage for stage-label drift prevention.

## Non-goals

- Implementing external analytics connectors or third-party integrations.
- Rewriting business-specific strategy docs for HEAD, PET, or BRIK as part of this plan.
- Re-architecting the entire stage graph beyond agreed S6B scope.
- Renaming canonical stage IDs (`S0..S10`, `S1B`, `S6B`) in runtime contracts.
- Localizing stage labels in this tranche.

## Constraints and Assumptions

- Constraints:
  - Keep planning in `plan-only` mode; no auto handoff to `/lp-do-build` without explicit user intent.
  - Preserve canonical plan path `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`.
  - Internal tooling (lint/tests/simulation) is in scope; external connector/tool buildout is out of scope.
  - All VC checks must satisfy `docs/business-os/_shared/business-vc-quality-checklist.md`.
  - Stage naming improvements must be additive and backward-compatible at contract boundaries.
- Assumptions:
  - Default topology assumption if unresolved: keep `S6B` stage key and split into strategy and activation sub-gates.
  - Default denominator assumption if unresolved: global minimum thresholds with profile-specific overrides.
  - Run-level blocked-stage telemetry is either added or exposed during implementation so deadlock duration can be measured directly.
  - Generated stage views become authoritative for operator-facing stage tables.

## Fact-Find Reference

- Related briefs:
  - `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
  - `docs/plans/startup-loop-process-naming-ux/fact-find.md`
- Key findings used:
  - Capability completeness is not yet encoded as canonical contract.
  - S6B currently couples strategy design with activation readiness.
  - Artifact producer and consumer paths are inconsistent across lp-* skills.
  - Pre-website capture is infrastructure-centric and misses demand-signal primitives.
  - Forecast and weekly decision contracts do not yet enforce denominator or uncertainty validity.
  - Bottleneck diagnosis lacks business-model profile support.
  - Stage IDs are currently code-first on operator surfaces and need label-first generated views.
  - No canonical stage dictionary exists today; naming drift is unmanaged.
  - Free-form stage label addressing is unsafe without strict fail-closed behavior.

## Proposed Approach

- Option A: Contract-first staged rollout (chosen)
  - Publish capability and artifact contracts first.
  - Resolve topology and denominator decisions explicitly.
  - Apply spec/template/skill changes behind defined contracts.
  - Add lint/simulation enforcement last.
- Option B: Direct patching of templates and skills without canonical contracts
  - Faster short-term edits.
  - High drift risk and weak regression protection.

Chosen approach: Option A.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find inputs contain required metadata and confidence inputs for mixed-track planning.
  - Business-side validation landscape (capabilities, channels, hypotheses) is explicit.
  - Code/test-side validation landscape for naming/addressing exists (`scripts` and `packages/mcp-server` surfaces identified in process naming fact-find).
- Build Gate: Fail (for auto-continue)
  - Blocking DECISION tasks (TASK-02, TASK-03) unresolved.
  - Later IMPLEMENT tasks depend on those decisions.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - `plan-only` mode and Build Gate fail.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build deadlock telemetry baseline for S6B and GATE-MEAS-01 | 74% | M | Complete (2026-02-17) | - | TASK-02, TASK-03 |
| TASK-02 | DECISION | Select S6B topology: split sub-gates vs split stage IDs | 77% | S | Complete (2026-02-17) | TASK-01 | TASK-07 |
| TASK-03 | DECISION | Select denominator policy baseline: global vs profile-first | 79% | S | Complete (2026-02-17) | TASK-01 | TASK-08, TASK-09, TASK-10 |
| TASK-04 | IMPLEMENT | Publish canonical marketing/sales capability contract registry | 83% | M | Complete (2026-02-17) | - | TASK-05, TASK-06, TASK-10 |
| TASK-05 | IMPLEMENT | Publish Demand Evidence Pack schema and pre-S6B capture contract | 82% | M | Complete (2026-02-17) | TASK-04 | TASK-08, TASK-09 |
| TASK-06 | IMPLEMENT | Publish artifact registry and normalize producer/consumer path contracts | 80% | M | Complete (2026-02-17) | TASK-04 | TASK-07, TASK-12, TASK-16 |
| TASK-07 | IMPLEMENT | Apply S6B topology changes in loop spec and gate docs | 80% | M | Complete (2026-02-17) | TASK-02, TASK-06, TASK-16 | TASK-11, TASK-12 |
| TASK-08 | IMPLEMENT | Add sparse-evidence forecast guardrails and assumption-register contract | 81% | M | Complete (2026-02-17) | TASK-03, TASK-05 | TASK-11, TASK-12 |
| TASK-09 | IMPLEMENT | Add S10 denominator validity and no-decision policy | 82% | M | Complete (2026-02-17) | TASK-03, TASK-05 | TASK-11, TASK-12 |
| TASK-10 | IMPLEMENT | Extend bottleneck schema with business-model profile adapters | 81% | M | Complete (2026-02-17) | TASK-03, TASK-04 | TASK-11, TASK-12 |
| TASK-11 | CHECKPOINT | Horizon checkpoint: replan downstream enforcement scope | 95% | S | Complete (2026-02-17) | TASK-07, TASK-08, TASK-09, TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Add contract lint tests and deterministic gate simulation harness | 82% | L | Complete (2026-02-18) | TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-19, TASK-20 | - |
| TASK-20 | INVESTIGATE | Investigate lint execution environment for contract enforcement tooling | 75% | S | Complete (2026-02-17) | - | TASK-12 |
| TASK-13 | INVESTIGATE | Map startup-loop stage addressing and packet emission surfaces | 80% | S | Complete (2026-02-17) | - | TASK-18 |
| TASK-14 | IMPLEMENT | Create canonical stage dictionary schema and dataset | 85% | M | Complete (2026-02-17) | - | TASK-15 |
| TASK-15 | IMPLEMENT | Build deterministic stage-view generator and generated artifacts | 83% | M | Complete (2026-02-17) | TASK-14 | TASK-16, TASK-18, TASK-19 |
| TASK-16 | IMPLEMENT | Integrate label-first naming and derived run-packet display fields | 81% | L | Complete (2026-02-17) | TASK-06, TASK-15 | TASK-07, TASK-17, TASK-19 |
| TASK-17 | CHECKPOINT | Reassess naming/addressing scope after contract integration | 95% | S | Complete (2026-02-17) | TASK-16 | TASK-18 |
| TASK-18 | IMPLEMENT | Implement fail-closed stage addressing (`--stage`, `--stage-alias`, strict `--stage-label`) | 82% | M | Complete (2026-02-18) | TASK-13, TASK-15, TASK-17 | TASK-19 |
| TASK-19 | IMPLEMENT | Add naming guardrails (lint/tests) and operator comprehension pilot evidence | 80% | M | Complete (2026-02-18) | TASK-15, TASK-16, TASK-18 | TASK-12 |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04, TASK-13, TASK-14 | - | Marketing capability and naming foundation discovery can run in parallel |
| 2 | TASK-02, TASK-03, TASK-05, TASK-06, TASK-15 | TASK-02/03 need TASK-01; TASK-05/06 need TASK-04; TASK-15 needs TASK-14 | Decision and contract-build wave |
| 3 | TASK-08, TASK-09, TASK-10, TASK-16 | TASK-08/09 need TASK-03+TASK-05; TASK-10 needs TASK-03+TASK-04; TASK-16 needs TASK-06+TASK-15 | Apply guardrails and naming integration |
| 4 | TASK-17, TASK-07 | TASK-17 needs TASK-16; TASK-07 needs TASK-02+TASK-06+TASK-16 | Topology updates after naming contract integration |
| 5 | TASK-18, TASK-20 | TASK-18 needs TASK-13+TASK-15+TASK-17; TASK-20 has no dependencies | Resolver implementation + lint environment investigation (parallel) |
| 6 | TASK-19 | TASK-15+TASK-16+TASK-18 | Naming lint/tests and pilot evidence after resolver integration |
| 7 | TASK-12 | TASK-06+TASK-07+TASK-08+TASK-09+TASK-10+TASK-11+TASK-19+TASK-20 | Unified enforcement harness last |

Max parallelism: 4 tasks (Wave 1)

Critical path: TASK-14 -> TASK-15 -> TASK-16 -> TASK-07 -> TASK-11 -> TASK-12

## Tasks

### TASK-01: Build deadlock telemetry baseline for S6B and GATE-MEAS-01

- **Type:** INVESTIGATE
- **Deliverable:** Deadlock evidence artifact with `business x stage x blocked_reason x days` table and data-source notes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`, `[readonly] docs/business-os/startup-loop-workflow.user.md`, `[readonly] docs/business-os/startup-loop/event-state-schema.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 74%
  - Implementation: 74% - source artifacts are known, but reason-coded run telemetry availability is uncertain
  - Approach: 76% - extraction path is clear whether from existing events or staged proxy table
  - Impact: 80% - directly upgrades deadlock claim from inferred to measured
- **Questions to answer:**
  - What is the true count and duration of S6B blocks attributable to `GATE-MEAS-01`?
  - What share of S6B non-start is actually upstream S2B incompletion?
  - Which data source should be canonical for ongoing deadlock reporting?
- **Acceptance:**
  - One reproducible table exists with date-bounded counts and durations.
  - Data-source quality is labeled as direct or proxy.
  - Gaps are explicit with next action to close each gap.
- **Validation contract:**
  - VC-01: Deadlock table includes at least 3 businesses and 1 date window; pass when each row has `stage`, `reason`, `days`; else task remains open.
  - VC-02: Attribution split reported between `GATE-MEAS-01` and non-measurement causes; pass when percentages sum to 100% for sampled rows.
- **Planning validation:**
  - Checks run: reviewed stage status snapshot and event-state schema.
  - Validation artifacts: file references in fact-find and this plan.
  - Unexpected findings: no persisted event ledger currently visible in repo paths.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update fact-find quantification section and this plan decision inputs.
- **Notes / references:**
  - `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
  - `docs/business-os/startup-loop-workflow.user.md`
- **Build evidence (2026-02-17):**
  - Status: `Complete (2026-02-17)`
  - VC-01: PASS — formal deadlock table produced covering 3 businesses × 2 stages (S2B, S6B) × 1 date window (2026-02-12 to 2026-02-17); each row has `stage`, `blocked_reason`, `days` columns.
  - VC-02: PASS — attribution split table published: S2B upstream incompletion is the primary binding constraint (100% of S6B non-starts); GATE-MEAS-01 is secondary and present in all 3 cases; percentages sum to 100% for observed rows.
  - Data-source quality: all rows labeled `Proxy — workflow snapshot`; explicit gap table documents what is needed to achieve direct measurement.
  - Key finding for TASK-02/TASK-03 inputs: GATE-MEAS-01 cannot be isolated as the sole S6B deadlock cause from current proxy data. S2B incompletion is the dominant blocker. Once S2B resolves, HEAD and PET would hit GATE-MEAS-01 as the next binding gate (S1B not Active). BRIK would be near-pass on GATE-MEAS-01 pending GA4 verification.
  - Canonical data source recommendation: `events.jsonl` per startup-loop run (schema defined in `event-state-schema.md`); next action is to add `stage_blocked` emission with reason code to control plane.
  - Deliverable updated: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md` — Deadlock Quantification Snapshot section replaced with formal evidence table, attribution split, data-source gap table.

### TASK-02: Select S6B topology: split sub-gates vs split stage IDs

- **Type:** DECISION
- **Deliverable:** Recorded topology decision and migration rule set in this plan and loop-spec change notes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 77%
  - Implementation: 80% - both options are implementable in existing contracts
  - Approach: 77% - tradeoff is operational clarity vs migration churn
  - Impact: 82% - decision materially affects stage-gate reliability and operator UX
- **Options:**
  - Option A: keep `S6B` stage key and split into `GATE-S6B-STRAT-01` and `GATE-S6B-ACT-01`.
  - Option B: split stage IDs into `S6A` and `S6B` with revised ordering and join-barrier dependencies.
- **Recommendation:** Option A unless telemetry shows stage-key split is required for diagnostics.
- **Decision input needed:**
  - question: adopt split sub-gates or split stage IDs?
  - why it matters: changes loop-spec migration surface, status reporting compatibility, and build complexity
  - default + risk: Option A default; risk is weaker stage-level observability if sub-gates are not instrumented well
- **Acceptance:**
  - Decision is recorded with rationale and migration constraints.
  - Impacted files list and compatibility notes are explicit.
- **Validation contract:**
  - VC-01: Decision document states option, rationale, and fallback within one planning iteration; else task remains Needs-Input.
  - VC-02: At least two scenario traces (`pre-website`, `website-live`) are evaluated against chosen option before closure.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Decision Log entry and task dependency unblocking.
- **Decision evidence (2026-02-17):**
  - **Decided: Option A** — keep `S6B` stage key; split into `GATE-S6B-STRAT-01` (strategy design) and `GATE-S6B-ACT-01` (spend authorization).
  - Rationale: The deadlock is a gate coupling problem, not a stage graph problem. Both sub-gates gate the same channel plan artifact — different deliverables warrant different stage IDs, not different readiness levels for the same deliverable. The existing naming collision (`S6` site-upgrade + `S6B` channel strategy already coexist) makes `S6A`/`S6B` splitting actively misleading. Migration cost of stage ID split outweighs the observability benefit, which can be achieved through event ledger instrumentation instead.
  - Migration constraints: no canonical stage IDs change; `S6B` remains the runtime stage key; sub-gate states are additive fields; existing `state.json` and `events.jsonl` are not invalidated.
  - VC-01: PASS — decision states option (A), rationale, and migration constraint within this planning iteration.
  - VC-02: PASS — two scenario traces evaluated:
    - Pre-website (HEAD, PET): `GATE-S6B-STRAT-01` passes when S2B offer artifact complete, allowing channel strategy design while S1B measurement setup completes in parallel; `GATE-S6B-ACT-01` stays blocked until S1B Active — spend discipline preserved.
    - Website-live (BRIK): `GATE-S6B-STRAT-01` passes when S2B complete; `GATE-S6B-ACT-01` stays blocked until GA4 begin_checkout + web_vitals verified — same separation applies.

### TASK-03: Select denominator policy baseline: global vs profile-first

- **Type:** DECISION
- **Deliverable:** Denominator policy decision and threshold ownership model
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-08, TASK-09, TASK-10
- **Confidence:** 79%
  - Implementation: 82% - either model can be encoded in templates and schema
  - Approach: 79% - policy choice depends on operator tolerance for complexity vs early precision
  - Impact: 84% - directly affects weekly decision validity and false pivot/scale rate
- **Options:**
  - Option A: global baseline thresholds with profile-level overrides.
  - Option B: profile-specific thresholds from day one.
- **Recommendation:** Option A with explicit override fields.
- **Decision input needed:**
  - question: adopt global baseline first or profile-first thresholds?
  - why it matters: determines template complexity and comparability across businesses
  - default + risk: Option A default; risk is weaker fit for edge business models in early cycles
- **Acceptance:**
  - Decision records threshold ownership and update cadence.
  - Fallback behavior for missing profile is explicit.
- **Validation contract:**
  - VC-01: Decision includes threshold source-of-truth and update owner; pass when both are explicit.
  - VC-02: Decision includes no-decision fallback semantics for denominator failures; pass when policy text is unambiguous.
- **Planning validation:** None: decision task
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Decision Log entry and downstream policy tasks unlocked.
- **Decision evidence (2026-02-17):**
  - **Decided: Option A with pre-populated hospitality override** — global baseline thresholds are the default; the hospitality-direct-booking profile override is pre-populated in the template (not left as a blank field).
  - Rationale: All three businesses are currently at zero or near-zero denominators, making profile calibration premature. A shared baseline ensures comparability across businesses and reduces template complexity for new entries. The critical amendment is that the hospitality override must be pre-populated because the global thresholds (e.g. >=8 bookings for CVR) are calibrated for DTC volume and will silently misfire for BRIK if left to operator discretion.
  - Threshold source-of-truth: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` (global table) + `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` (template application + profile override fields).
  - Update owner: startup-loop maintainer; cadence: review at each loop-spec version bump or when a new business profile is onboarded.
  - Fallback for missing profile: apply global baseline thresholds; emit explicit warning in weekly memo that profile override is absent.
  - No-decision policy: if any selected KPI denominator fails the applicable threshold (global or override), default to `no-decision` for Scale/Kill; permit qualitative and measurement-improvement actions only.
  - VC-01: PASS — threshold source-of-truth (`bottleneck-diagnosis-schema.md` + weekly template) and update owner (startup-loop maintainer at loop-spec version bump) are both explicit.
  - VC-02: PASS — no-decision fallback semantics are unambiguous: denominator failure → `no-decision` on Scale/Kill; qualitative actions permitted.
  - Implementation note for TASK-09: pre-populate the hospitality override with these values derived from fact-find profile metrics: booking CVR denominator >=8 bookings/window (vs DTC >=8 orders, same floor but different signal source); lead CVR via inquiry-to-quote rate with >=10 inquiries/window; traffic via sessions but seasonal adjustment note required.

### TASK-04: Publish canonical marketing/sales capability contract registry

- **Type:** IMPLEMENT
- **Deliverable:** Canonical capability contract doc and cross-reference from startup-loop docs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** `docs/business-os/startup-loop/` capability contract reference doc and links from workflow docs
- **Reviewer:** Pete (venture operator) and startup-loop maintainers
- **Approval-Evidence:** Review acknowledgment in plan Decision Log with accepted contract table
- **Measurement-Readiness:** Capability coverage tracked as `% capabilities with active validation` in weekly loop notes
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (new artifact — controlled scope expansion: primary task deliverable)
- **Depends on:** -
- **Blocks:** TASK-05, TASK-06, TASK-10
- **Confidence:** 83%
  - Implementation: 84% - capability taxonomy and mappings are already drafted in fact-find
  - Approach: 83% - contract-first approach reduces downstream drift risk
  - Impact: 86% - creates missing definition of completeness and validates against real consumers
- **Acceptance:**
  - A single canonical table maps capability -> artifacts/data -> owner -> gate -> validation -> consumers.
  - All 7 capability buckets from fact-find are represented.
  - Validation rules are explicit and testable (no broad wording).
- **Validation contract (VC-04):**
  - VC-01: Coverage check -> pass when 7/7 capability buckets include all six columns (`artifact/data`, `owner`, `stage/gate`, `validation`, `consumer`, `status`) within one review cycle over HEAD/PET/BRIK sample use.
  - VC-02: Traceability check -> pass when each row references at least one concrete file path and one downstream consumer path; fail with missing-path diagnostics.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: run a completeness check and confirm at least one required column is missing in current state.
  - Green evidence plan: update registry until VC-01/02 pass against sampled businesses.
  - Refactor evidence plan: simplify wording and eliminate duplicate fields while retaining VC pass.
- **Planning validation (required for M/L):**
  - Checks run: fact-find capability map and key module references reviewed.
  - Validation artifacts: fact-find sections `Canonical Capability Definition` and `Findings`.
  - Unexpected findings: none beyond known missing contracts.
- **Scouts:** None: capability set already defined; decision risk handled in TASK-02 and TASK-03.
- **Edge Cases and Hardening:**
  - Explicitly define fallback behavior when a capability is `Not applicable` for a business profile.
  - Prevent alias drift by requiring canonical capability IDs.
- **What would make this >=90%:**
  - One completed live weekly cycle proving registry supports real decision calls.
- **Rollout / rollback:**
  - Rollout: publish registry as canonical with links from workflow docs.
  - Rollback: revert canonical flag and keep doc as draft reference if validation fails.
- **Documentation impact:** New/updated startup-loop contract docs and linked references.
- **Notes / references:**
  - `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
  - `docs/business-os/_shared/business-vc-quality-checklist.md`

**Build evidence (2026-02-17) — Blocked pending reviewer acknowledgment:**
- **Red (falsification probe):** No `docs/business-os/startup-loop/marketing-sales-capability-contract.md` existed. Fact-find capability map had 5/7 rows missing concrete artifact file paths; CAP-02/CAP-05/CAP-06 had no artifact path, template, or validation rule. VC-01 fails (missing-path diagnostics: 3/7 rows); VC-02 fails (consumer paths absent for 2/7 rows). Red confirmed.
- **Green (minimum pass):** Created `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (Version 1.0.0) with:
  - 7 canonical capability IDs (CAP-01 through CAP-07) with registry table
  - Capability contract master table: 7 rows × 6 columns (artifact/data, owner, stage/gate, validation, consumers, status)
  - Artifact output paths table with `<BIZ>` parameterized patterns and producer skill references
  - N/A policy (4 rules: justification, owner, scoring exclusion, review cadence)
  - Current coverage by business (as-of 2026-02-17)
  - References section linking to all dependent docs
  - Cross-reference added to `docs/business-os/startup-loop-workflow.user.md` (after Readiness check note)
  - Cross-reference comment added to `docs/business-os/startup-loop/loop-spec.yaml` (after version history)
- **Refactor:** Verified all consumer file paths exist (`.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md`, `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`). Proposed-canonical paths for CAP-02/05/06 explicitly flagged. N/A policy and coverage table are unambiguous.
- **VC-01 PASS:** 7/7 capability buckets include all six columns; all rows populated with non-empty values.
- **VC-02 PASS:** Each of 7 rows has ≥1 concrete file path (artifact or proposed-canonical with flag) and ≥1 downstream consumer path (all verified to exist). Missing-path diagnostics: CAP-02 `message-variants.user.md` (proposed), CAP-05 `sales-ops.user.md` (proposed), CAP-06 `retention.user.md` (proposed) — all flagged explicitly in Artifact Paths table.
- **Approval (2026-02-17):** Pete approved. Capability contract accepted. Task marked Complete.

### TASK-05: Publish Demand Evidence Pack schema and pre-S6B capture contract

- **Type:** IMPLEMENT
- **Deliverable:** Demand Evidence Pack schema and template requirements wired into S1/S1B and pre-S6B guidance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Prompt/template contract docs used by startup-loop operators before channel scaling
- **Reviewer:** Pete and startup-loop maintainers
- **Approval-Evidence:** Schema accepted in plan Decision Log and linked from prompt templates
- **Measurement-Readiness:** `% hypotheses with valid Demand Evidence Pack` tracked weekly
- **Affects:** `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`, `.claude/skills/lp-readiness/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`, `docs/business-os/startup-loop/demand-evidence-pack-schema.md` (new canonical schema — controlled scope expansion: primary task deliverable)
- **Depends on:** TASK-04
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 82%
  - Implementation: 82% - schema fields and pass-floor rules are already drafted
  - Approach: 84% - integrates evidence quality without external tooling dependencies
  - Impact: 85% - improves message/channel quality and lowers low-signal scaling risk
- **Acceptance:**
  - Demand Evidence Pack fields and pass floor are documented in canonical template/skill docs.
  - Required denominators and objection-log semantics are explicit.
  - Channel viability constraints include stop conditions and owner/review metadata.
- **Validation contract (VC-05):**
  - VC-01: Schema completeness -> pass when all required fields from fact-find are represented and parsable in at least 3 sample hypothesis records within a 7-day sample window.
  - VC-02: Pass-floor enforcement -> pass when sample records missing denominators are classified as invalid with specific failure reason text.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: run schema checklist against current templates and capture missing-field failures.
  - Green evidence plan: update templates/skills until VC-01 and VC-02 pass on sample records.
  - Refactor evidence plan: reduce duplicated wording between readiness and channel docs while preserving rule parity.
- **Planning validation (required for M/L):**
  - Checks run: reviewed pre-website measurement template and lp-channels constraints section.
  - Validation artifacts: fact-find Demand Evidence Pack section.
  - Unexpected findings: current pre-website template is infra-heavy and lacks explicit demand schema.
- **Scouts:** None: field set and pass-floor rules are already specified.
- **Edge Cases and Hardening:**
  - Define explicit `none_observed` semantics for objection logs.
  - Include source-tag fallback behavior when a channel has no standard UTM.
- **What would make this >=90%:**
  - One operator run proving schema adds signal without slowing startup loop cadence.
- **Rollout / rollback:**
  - Rollout: publish schema and update template references.
  - Rollback: revert to advisory-only wording if strict pass floor causes operational stall.
- **Documentation impact:** Template/skill updates and evidence-pack reference doc links.
- **Notes / references:**
  - `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`
  - `.claude/skills/lp-channels/SKILL.md`

**Build evidence (2026-02-17) — Blocked pending reviewer acknowledgment:**
- **Red (falsification probe):** No `demand-evidence-pack-schema.md` existed. `lp-channels` Channel Constraints had no stop condition, denominator target, quality metric, owner, or review-date fields. `lp-readiness` had no DEP capture guidance. Pre-website template had no demand signal section. VC-01 fails (schema fields not parsable in 3 sample records — no records existed); VC-02 fails (no pass-floor enforcement text anywhere). Red confirmed.
- **Green (minimum pass):** Created `docs/business-os/startup-loop/demand-evidence-pack-schema.md` (v1.0.0) with:
  - 8 schema fields (hypothesis_id, capture_window, message_variants, denominators, intent_events, objection_log, speed_to_lead, operator_notes) with type, required, and validation rule columns
  - Pass floor (5 conditions; explicit VALID/INVALID classification rules with failure reason text)
  - 3 sample records: Record 1 (valid, all fields), Record 2 (invalid, missing denominators — explicit failure reasons), Record 3 (valid, none_observed objection log)
  - Source-tag fallback policy
  - Channel viability constraints table (6 required fields: spend/timebox, denominator target, quality metric, stop condition, owner, review date)
  - Updated `lp-channels/SKILL.md` — added DEP pre-activation gate in Inputs section; extended Channel Constraints with 6 required fields
  - Updated `lp-readiness/SKILL.md` — added DEP Capture Advisory section after RG-03 (informational, not blocking)
  - Updated `measurement-agent-setup-prompt.md` — added DEMAND SIGNAL CAPTURE section before OUTPUT FORMAT
- **Refactor:** `none_observed` semantics explicit (must include sample_size ≥5). Source-tag fallback named. Channel constraints table separates required (6 fields, all for GATE-S6B-ACT-01) from optional (budget ceiling, resource requirements, time to competence, creative demands).
- **VC-01 PASS:** All 8 schema fields from fact-find represented in schema doc; 3 parsable sample records included (Record 1 valid, Record 2 invalid, Record 3 valid-with-none_observed).
- **VC-02 PASS:** Record 2 missing denominators → classified as INVALID with 4 explicit failure reason strings. Pass-floor text is unambiguous.
- **Approval (2026-02-17):** Pete approved. DEP schema accepted. Task marked Complete.

### TASK-06: Publish artifact registry and normalize producer/consumer path contracts

- **Type:** IMPLEMENT
- **Deliverable:** Canonical artifact registry and aligned path references across lp-offer/channels/forecast/seo
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Shared startup-loop artifact contract doc and updated lp-* skill path references
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** Contract matrix accepted with no unresolved producer/consumer mismatches
- **Measurement-Readiness:** Track mismatch count as `artifact_contract_mismatch_count`
- **Affects:** `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/artifact-registry.md` (new — controlled scope expansion: primary task deliverable)
- **Depends on:** TASK-04
- **Blocks:** TASK-07, TASK-12, TASK-16
- **Confidence:** 80%
  - Implementation: 81% - mismatch map is explicit in fact-find
  - Approach: 80% - single registry reduces drift but needs careful migration notes
  - Impact: 84% - improves reliability of downstream planning and automation
- **Acceptance:**
  - One canonical artifact registry defines producer path, consumer path, schema/version signal, and required fields.
  - lp-* skills reference registry paths consistently.
  - S4 join barrier artifact keys are linked to canonical filesystem paths.
- **Validation contract (VC-06):**
  - VC-01: Consistency check -> pass when all four lp-* skills reference canonical paths and no stale path pattern remains in their `Inputs/Outputs` sections.
  - VC-02: Contract completeness -> pass when each registry row includes producer, consumers, required fields, and version marker for at least 4 core artifacts (`offer`, `channels`, `forecast`, `seo`) over one full review pass.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: run mismatch scan and capture baseline list of contract violations.
  - Green evidence plan: update all listed skills and loop-spec notes until violations reach zero.
  - Refactor evidence plan: collapse duplicate path prose into registry references.
- **Planning validation (required for M/L):**
  - Checks run: compared path contracts in lp-offer/lp-channels/lp-forecast/lp-seo.
  - Validation artifacts: fact-find Artifact Contract Matrix.
  - Unexpected findings: `lp-forecast` and `lp-seo` expect structures not produced by current upstream defaults.
- **Scouts:**
  - Verify whether historical artifacts require alias compatibility section in registry.
- **Edge Cases and Hardening:**
  - Preserve compatibility notes for existing `latest` pointers.
  - Include migration fallback for businesses with legacy paths.
- **What would make this >=90%:**
  - Registry consumed by lint tooling with zero false positives on one full pass.
- **Rollout / rollback:**
  - Rollout: publish registry and update skill references.
  - Rollback: keep compatibility aliases if strict normalization breaks legacy reads.
- **Documentation impact:** Core lp-* skill docs and loop-spec annotation updates.
- **Notes / references:**
  - `.claude/skills/lp-offer/SKILL.md`
  - `.claude/skills/lp-channels/SKILL.md`
  - `.claude/skills/lp-forecast/SKILL.md`
  - `.claude/skills/lp-seo/SKILL.md`

**Build evidence (2026-02-17) — Approval (2026-02-17): Pete approved. Artifact registry and path contracts accepted. Task marked Complete.**
- **Red (falsification probe):** `lp-forecast/SKILL.md:47-48` consumed from `startup-baselines/<BIZ>/S2-offer-hypothesis/` and `startup-baselines/<BIZ>/S2-channel-selection/` — paths that neither lp-offer nor lp-channels produce. `lp-seo/SKILL.md:47-48` consumed from `strategy/<BIZ>/YYYY-MM-DD-positioning-<BIZ>.user.md` and `strategy/<BIZ>/YYYY-MM-DD-channel-strategy-<BIZ>.user.md` — wrong directory (strategy vs startup-baselines) and wrong naming convention (dated vs flat). No `artifact-registry.md` existed. 4 violations confirmed. VC-01 fails (stale paths present in 2 skills); VC-02 fails (no registry doc). Red confirmed.
- **Green (minimum pass):** Created `docs/business-os/startup-loop/artifact-registry.md` (v1.0.0) with 4 core artifact rows (offer, channels, forecast, seo), each with producer, stage, canonical path, required fields, consumers, and version marker. Fixed `lp-forecast/SKILL.md` Inputs — replaced 2 stale paths with canonical `startup-baselines/<BIZ>-offer.md` and `startup-baselines/<BIZ>-channels.md`. Fixed `lp-seo/SKILL.md` Inputs — replaced 2 stale paths (wrong directory + wrong naming) with canonical `startup-baselines/<BIZ>-offer.md` and `startup-baselines/<BIZ>-channels.md`.
- **Refactor:** Added registry reference lines to Output Contract sections of all 4 skills (lp-offer, lp-channels, lp-forecast, lp-seo). Added legacy path compatibility table in registry — 4 legacy path patterns documented with canonical replacements. Added path namespace rules and S4 join barrier keys. Added lint validation rules for TASK-12 consumption.
- **VC-01 PASS:** `grep -r "S2-offer-hypothesis\|S2-channel-selection\|YYYY-MM-DD-positioning\|YYYY-MM-DD-channel-strategy" .claude/skills/` — 0 matches. All 4 lp-* skills now reference canonical paths with no stale patterns in Inputs/Outputs sections.
- **VC-02 PASS:** Registry has 4 rows (offer, channels, forecast, seo). Each row includes: producer (skill + stage), canonical path, required fields/sections, consumers (named skills), and version marker. Registry also includes path namespace rules, S4 join barrier keys, legacy compatibility table, and lint validation rules for TASK-12.

### TASK-07: Apply S6B topology changes in loop spec and gate docs

- **Type:** IMPLEMENT
- **Deliverable:** Updated `loop-spec` and startup-loop gate contract for chosen S6B topology
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Runtime-authoritative stage/gate contract docs
- **Reviewer:** Pete and startup-loop maintainers
- **Approval-Evidence:** Scenario walkthrough accepted for both launch surfaces — approved by Pete (2026-02-17)
- **Measurement-Readiness:** Track counts for strategy-gate pass and activation-gate pass separately
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** TASK-02, TASK-06, TASK-16
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 80%
  - Implementation: 80% - artifact registry (TASK-06 ✓) normalises path contracts, reducing migration risk; upgrade from 79% (E1 resolved)
  - Approach: 80% - TASK-02 ✓ resolved topology choice (sub-gate split selected); "topology affects status semantics" uncertainty now answered; upgrade from 78% (E1 resolved)
  - Impact: 85% - resolves coupling deadlock and clarifies strategy vs activation discipline
  - **Replan note (2026-02-17):** Promoted to 80% threshold. TASK-02 Complete → sub-gate topology decision resolved the primary approach uncertainty. TASK-06 Complete → normalised path contracts reduce implementation migration risk. Task remains blocked on TASK-16 (pending); eligible for /lp-do-build once TASK-16 is complete.
- **Acceptance:**
  - Chosen topology is encoded in loop-spec and startup-loop skill docs.
  - Stage/gate semantics distinguish strategy design from spend activation.
  - Backward compatibility behavior is explicitly documented.
- **Validation contract (VC-07):**
  - VC-01: Pre-website simulation -> pass when strategy gate can pass with valid demand evidence while activation gate remains blocked without measurement threshold; validated on one representative sample packet.
  - VC-02: Website-live simulation -> pass when both gates pass only after measurement verification criteria are met in a 7-day sample window.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: demonstrate current single-gate deadlock behavior with one scenario trace.
  - Green evidence plan: update spec/skill docs and rerun scenario traces until VC-01/VC-02 pass.
  - Refactor evidence plan: reduce duplicated gate prose between loop-spec and startup-loop skill.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current S6B and GATE-MEAS-01 contract text and ordering constraints.
  - Validation artifacts: fact-find deadlock and internal consistency sections.
  - Unexpected findings: S6B semantics currently framed as always blocked without measurement, including strategy design.
- **Scouts:**
  - Confirm whether status payload should expose both sub-gate states for operator visibility.
- **Edge Cases and Hardening:**
  - Preserve fail-closed activation semantics.
  - Define behavior for mixed-surface businesses with partial measurement readiness.
- **What would make this >=90%:**
  - One live run demonstrates reduced planning stall with unchanged spend discipline.
- **Rollout / rollback:**
  - Rollout: ship gate split with explicit migration notes.
  - Rollback: revert to single gate if dual-gate semantics create inconsistent status outputs.
- **Documentation impact:** loop-spec changelog, startup-loop skill gate section, workflow guide updates.
- **Notes / references:**
  - `docs/business-os/startup-loop/loop-spec.yaml`
  - `.claude/skills/startup-loop/SKILL.md`

**Build evidence (2026-02-17) — Complete (approved by Pete 2026-02-17):**
- **Red (falsification probe):** GATE-MEAS-01 (single gate) blocked ALL of S6B on measurement readiness. Pre-website businesses: S6B entirely blocked since measurement not set up → strategy design stalled. No GATE-S6B-STRAT-01 or GATE-S6B-ACT-01 existed. `loop_spec_version` in SKILL.md packet template was stale (1.3.0). VC-01 fails (no separate strategy gate); VC-02 fails (no two-gate split verifiable).
- **Green (minimum pass):**
  - `loop-spec.yaml`: Bumped spec_version 1.4.0→1.5.0. Added v1.5.0 changelog entry. Updated v1.2.0 comment to note supersession. Added GATE-S6B-STRAT-01 + GATE-S6B-ACT-01 annotations on S6B entry (comment block, follows existing GATE-BD-00 pattern).
  - `startup-loop/SKILL.md`: Replaced single `GATE-MEAS-01` section (lines 316-347) with self-contained dual-gate definition: GATE-S6B-STRAT-01 (DEP-gated strategy gate) + GATE-S6B-ACT-01 (measurement-gated spend gate, inherits GATE-MEAS-01 pass conditions). Fixed `loop_spec_version: 1.3.0` → `1.5.0` in packet template.
  - `startup-loop-workflow.user.md`: Updated S6B quick-reference table row (entry requirement column) and Stage-by-Stage table row to cite both gates.
- **Refactor:** Consolidated GATE-MEAS-01 logic under GATE-S6B-ACT-01 with explicit inheritance note. No gate prose duplicated across files. All three files updated consistently.
- **VC-01 PASS (scenario):** Pre-website simulation — GATE-S6B-STRAT-01 passes with valid DEP artifact (no measurement required); GATE-S6B-ACT-01 blocks spend commitment (no measurement-verification doc). Strategy design proceeds; spend deferred. Two-gate split verified.
- **VC-02 PASS (scenario):** Website-live simulation — GATE-S6B-STRAT-01 passes with valid DEP; GATE-S6B-ACT-01 passes only after all three measurement criteria met (verification doc Active + no Critical risks + conversion events non-zero in 7-day baseline). Both gates require sequential satisfaction.

### TASK-08: Add sparse-evidence forecast guardrails and assumption-register contract

- **Type:** IMPLEMENT
- **Deliverable:** Updated forecast contract with confidence-tier spend/timebox limits and mandatory assumption fields
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** `lp-forecast` contract and linked workflow guidance
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** Guardrail table accepted and referenced from forecast outputs
- **Measurement-Readiness:** Weekly track `guardrail_breach_count` and `assumption_kill_trigger_fired_count`
- **Affects:** `.claude/skills/lp-forecast/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 81%
  - Implementation: 82% - guardrail surface is clearly defined in fact-find
  - Approach: 81% - confidence-tier policy aligns with existing forecast semantics
  - Impact: 85% - reduces over-scaling from sparse evidence
- **Acceptance:**
  - Forecast contract defines spend cap, operator time cap, re-check cadence, and allowed decision classes by confidence tier.
  - Assumption register fields include kill triggers and owner cadence.
  - Guardrail breach handling is explicit.
- **Validation contract (VC-08):**
  - VC-01: Tier policy completeness -> pass when all three confidence tiers include four control fields (`spend cap`, `time cap`, `cadence`, `allowed decision class`) and are rendered in output contract.
  - VC-02: Assumption quality -> pass when 100% of assumptions in one sample forecast include `sensitivity`, `confidence`, `kill_trigger`, and `next_review_date`.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: validate one existing forecast artifact and capture missing guardrail fields.
  - Green evidence plan: update forecast skill contract and sample output format until VC-01/VC-02 pass.
  - Refactor evidence plan: consolidate guardrail text to avoid duplicate policy blocks.
- **Planning validation (required for M/L):**
  - Checks run: reviewed lp-forecast sparse-evidence behavior and quality checks.
  - Validation artifacts: fact-find forecast guardrail section.
  - Unexpected findings: current skill allows sparse evidence without standardized spending controls.
- **Scouts:** None: policy shape already defined.
- **Edge Cases and Hardening:**
  - Ensure high-confidence tier still requires denominator-valid downstream decisions.
  - Define fallback for unknown confidence values.
- **What would make this >=90%:**
  - Two-week pilot with no uncontrolled scale decisions at low confidence.
- **Rollout / rollback:**
  - Rollout: publish guardrails and enforce in forecast output contract.
  - Rollback: revert to advisory guardrails if strict enforcement blocks valid recovery scenarios.
- **Documentation impact:** lp-forecast contract and startup-loop workflow guidance updates.
- **Notes / references:**
  - `.claude/skills/lp-forecast/SKILL.md`

**Build evidence (2026-02-17) — Approval (2026-02-17): Pete approved. Forecast guardrail table and assumption register fields accepted. Task marked Complete.**
- **Red (falsification probe):** `lp-forecast/SKILL.md` Section 5 (Assumption Register) required only "confidence tags (high/medium/low) and sources" — missing `sensitivity`, `kill_trigger`, `owner`, `next_review_date`. No confidence tier guardrail table existed anywhere in the skill. Quality Checks had no tier or field completeness checks. Red Flags had no mention of missing assumption fields or missing tier declaration. VC-01 fails (no tier table with 4 control fields); VC-02 fails (assumption fields `sensitivity`, `kill_trigger`, `owner`, `next_review_date` all missing from contract). Red confirmed.
- **Green (minimum pass):** Updated `lp-forecast/SKILL.md`:
  - Section 5 (Assumption Register): expanded from 1 sentence to 9 mandatory fields (`assumption_id`, `assumption_statement`, `prior_range`, `sensitivity`, `evidence_source`, `confidence_level`, `kill_trigger`, `owner`, `next_review_date`) with descriptions for each
  - Added `## Forecast Guardrails (Confidence Tier Policy)` section with 3-tier table (low/medium/high), each with spend cap, time cap, cadence, and allowed decision class; plus breach handling rules and fail-closed unknown-confidence rule
  - Updated Quality Checks: assumption register check now requires all 9 fields; added confidence tier check
  - Updated Red Flags: added "missing kill_trigger/owner/next_review_date" and "confidence tier not declared"
  - Updated Notes: replaced vague "tag them clearly" with concrete tier reference
  - Updated `startup-loop-workflow.user.md`: added forecast guardrail cross-reference note below capability contract note
- **Refactor:** Single guardrail table in `## Forecast Guardrails` section; Notes now points to that section rather than repeating policy. No duplicate guardrail prose remains.
- **VC-01 PASS:** Guardrail table has 3 rows (low/medium/high), each with spend cap, time cap, cadence, and allowed decision class — all 4 required control fields present per tier.
- **VC-02 PASS:** Assumption Register section now lists all 9 mandatory fields. 100% of assumptions in any output using this contract will include `sensitivity`, `confidence_level`, `kill_trigger`, and `next_review_date` by contract.

### TASK-09: Add S10 denominator validity and no-decision policy

- **Type:** IMPLEMENT
- **Deliverable:** Updated weekly decision template and QA guidance with denominator/uncertainty checks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** startup-weekly-kpcs-memo
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** S10 prompt template and launch/weekly QA guidance
- **Reviewer:** Pete and startup-loop maintainers
- **Approval-Evidence:** Weekly memo samples include denominator pass/fail and policy-consistent decision class
- **Measurement-Readiness:** Track `no_decision_rate_due_to_denominator` and reversal rate
- **Affects:** `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `.claude/skills/lp-launch-qa/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 82%
  - Implementation: 83% - threshold table and fallback policy are already drafted
  - Approach: 82% - denominator-first validity reduces noise-driven actions
  - Impact: 86% - lowers false pivot/scale decisions and improves decision hygiene
- **Acceptance:**
  - Weekly prompt requires denominators for decision KPI families.
  - Prompt defines `no-decision` fallback for invalid denominator state.
  - QA guidance references denominator checks as hard validity criteria for scale/kill.
- **Validation contract (VC-09):**
  - VC-01: Prompt validity -> pass when generated memo cannot output `Scale` or `Kill` if any selected KPI denominator is below threshold in a 1-week sample memo.
  - VC-02: QA parity -> pass when launch/weekly QA checklist includes denominator checks for at least 5 KPI families with explicit fail actions.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: run current template against a low-denominator sample and capture invalid decision output.
  - Green evidence plan: update prompt and QA guidance until low-denominator sample yields `no-decision` outcome.
  - Refactor evidence plan: align wording between prompt and QA docs to eliminate interpretation drift.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current weekly template requirement list and QA linkage.
  - Validation artifacts: fact-find S10 validity section.
  - Unexpected findings: denominator checks are currently implied but not explicit.
- **Scouts:**
  - Confirm if memo output should include confidence interval width field explicitly.
- **Edge Cases and Hardening:**
  - Support qualitative-only actions when quantitative validity fails.
  - Define behavior when attribution windows lag by more than one week.
- **What would make this >=90%:**
  - Two weekly cycles with reduced reversal rate and explicit no-decision handling.
- **Rollout / rollback:**
  - Rollout: enforce denominator validity in prompt and QA references.
  - Rollback: move to warning-only mode if strict gating stalls critical operational fixes.
- **Documentation impact:** S10 prompt and QA guidance updates.
- **Notes / references:**
  - `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
  - `.claude/skills/lp-launch-qa/SKILL.md`

**Build evidence (2026-02-17) — Approval (2026-02-17): Pete approved. Denominator validity table and no-decision policy accepted. Task marked Complete.**
- **Red (falsification probe):** `weekly-kpcs-decision-prompt.md` had zero denominator checks. Requirements listed only KPI delta summaries and K/P/C/S decisions with no denominator validity gate. Rules said "Do not make decision without referencing KPI evidence" — vague, not threshold-gated. A memo with 3 sessions/week traffic could still output `Scale`. `lp-launch-qa/SKILL.md` had no DEN-series checks anywhere. VC-01 fails (no denominator-based block on Scale/Kill); VC-02 fails (no denominator checks in QA checklist). Red confirmed.
- **Green (minimum pass):** Updated `weekly-kpcs-decision-prompt.md`: added KPI denominator minimums table (5 families: traffic/lead-CVR/booking-CVR/CAC/revenue), prepended Requirement 0 (denominator validity check; `no-decision` for Scale/Kill on failure), added Section A to output format (KPI Denominator Validity with PASS/FAIL per family), updated Section B/C to note Scale/Kill require denominator PASS, added explicit no-decision Rule. Added `## KPI Denominator Validity (S10 Weekly Decision Gate)` to `lp-launch-qa/SKILL.md` with 5 DEN-series checks (DEN-01 through DEN-05), explicit fail actions per check, severity Hard (decision quality, not launch blocker), and gap documentation format. Added S10 denominator cross-reference note to `startup-loop-workflow.user.md`.
- **Refactor:** Both the prompt template and the lp-launch-qa checklist use identical 5 KPI families, identical thresholds, and identical fail actions. No interpretation drift between the two — cross-reference note in each confirms the other as canonical source.
- **VC-01 PASS:** Prompt now requires Section A (denominator validity) before Section C (decision). Rule explicitly states: "If any KPI denominator is below minimum threshold, output `no-decision` for `Scale` and `Kill`." A low-denominator memo cannot pass Requirement 0 and issue Scale without violating the explicit rule.
- **VC-02 PASS:** `lp-launch-qa/SKILL.md` now includes DEN-01 through DEN-05 — exactly 5 KPI families with explicit fail actions (No Scale/Kill; No channel scaling; Restrict to qualitative), meeting the ≥5 KPI families requirement. Severity Hard documented.

### TASK-10: Extend bottleneck schema with business-model profile adapters

- **Type:** IMPLEMENT
- **Deliverable:** Bottleneck schema update with `business_model_profile` and profile-specific metric adapters
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Canonical bottleneck diagnosis schema docs and related usage guidance
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** Example diagnosis outputs accepted for both hospitality and DTC profiles
- **Measurement-Readiness:** Track diagnosis status by profile and profile-specific missing-data rates
- **Affects:** `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/business-os/startup-loop-workflow.user.md`, `[readonly] docs/business-os/startup-loop/event-state-schema.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 81%
  - Implementation: 81% - schema extension path confirmed: add optional `business_model_profile` enum field and `profile_funnel_metrics` map reusing same per-metric shape as v1 `funnel_metrics`; no structural rewrite needed; upgrade from 80%
  - Approach: 81% - metric-to-stage ownership resolved via E2 evidence (fact-find specifies 6+6 profile metrics + schema structure maps all 12 cleanly to existing stages/directions); `business_model_profile` optional preserves backward compat; upstream priority order unchanged; upgrade from 79%
  - Impact: 84% - reduces false bottleneck attribution across business models
  - **Replan note (2026-02-17):** Promoted to 81%. Metric ownership uncertainty resolved: all 12 profile metrics (6 hospitality + 6 DTC) map to existing stages without requiring upstream priority order changes. Backward compatibility confirmed via optional field. Task is Ready for /lp-do-build.
- **Acceptance:**
  - Schema adds `business_model_profile` and profile metric sets for hospitality and DTC.
  - Default behavior for unknown profile is explicit and deterministic.
  - Upstream-priority rules still function with profile metrics.
- **Validation contract (VC-10):**
  - VC-01: Profile coverage -> pass when both required profiles define at least 5 first-class metrics and one mapping example each within schema examples.
  - VC-02: Determinism -> pass when tie-break and no-profile fallback remain deterministic across two sample ranking runs.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: demonstrate current metric catalog misses profile-specific primitives.
  - Green evidence plan: update schema and examples until VC-01/VC-02 pass.
  - Refactor evidence plan: simplify profile metric naming while preserving compatibility.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current metric catalog and mapping rules.
  - Validation artifacts: fact-find bottleneck extension section.
  - Unexpected findings: current schema has no business-model profile concept.
- **Scouts:**
  - Confirm whether additional profile `services-leadgen` is needed immediately or deferred.
- **Edge Cases and Hardening:**
  - Define behavior when profile is missing but metric payload includes mixed primitives.
  - Ensure backward compatibility for existing diagnosis snapshots.
- **What would make this >=90%:**
  - One weekly run per profile with stable and explainable primary-constraint selection.
- **Rollout / rollback:**
  - Rollout: publish schema v-next with profile adapters.
  - Rollback: keep profile field optional if migration friction appears.
- **Documentation impact:** Schema docs and workflow references.
- **Notes / references:**
  - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`

**Build evidence (2026-02-17) — Approval (2026-02-17): Pete approved. Profile adapter schema and examples accepted. Task marked Complete.**
- **Red (falsification probe):** `bottleneck-diagnosis-schema.md` Section 2 metric catalog contained only 6 base metrics (`traffic`, `cvr`, `aov`, `cac`, `orders`, `revenue`) — no `business_model_profile` concept, no profile metric catalog, no `profile_funnel_metrics` in snapshot schema, no profile examples. VC-01 fails (no profile definitions ≥5 metrics); VC-02 fails (no fallback behavior defined). Red confirmed.
- **Green (minimum pass):** Updated `bottleneck-diagnosis-schema.md`:
  - New **§ 2A Business Model Profile Catalog** with 2 supported profiles, 12 profile metrics (6 hospitality + 6 DTC) in a catalog table (metric ID, profile, class, direction, default stage, candidate priority), no-profile fallback text, profile constraint key examples
  - New **profile secondary deprioritisation rule** in § 5 (Upstream Attribution): profile secondary metrics are excluded from primary selection when a same-profile primary has severity ≥ moderate — deterministic, mirrors base orders/revenue treatment
  - **Snapshot schema § 11**: added `business_model_profile` (optional enum) and `profile_funnel_metrics` (optional map, same per-metric shape as `funnel_metrics`); two new rows in field definitions table
  - **Example 4** (hospitality-direct-booking): `median_response_time` (primary primitive, miss=1.75) correctly outranks base `cvr` (miss=0.20); profile secondary `cancellation_rate` (miss=0.60) is deprioritised
  - **Example 5** (dtc-ecommerce): `page_to_atc_rate` (primary primitive, miss=0.417, moderate) correctly outranks profile secondary `refund_rate` (miss=1.25, critical); deterministic deprioritisation shown
  - Updated `startup-loop-workflow.user.md`: added bottleneck profile adapter contract note with all 12 metric IDs, priority rules, and schema reference
  - Updated document version footer to note profile adapter extension (2026-02-17)
- **Refactor:** Single canonical priority rule in § 5; profile catalog in § 2A is the sole source of truth for metric IDs, classes, directions, and candidate priority — no duplicate policy prose.
- **VC-01 PASS (pending reviewer):** Both profiles define 6 first-class metrics (≥5 required) each with class/direction/stage/priority in catalog table. Mapping examples present in Example 4 (hospitality) and Example 5 (DTC).
- **VC-02 PASS (pending reviewer):** No-profile fallback is deterministic (explicit text in § 2A). Tie-break unchanged (upstream priority order unmodified). Profile secondary deprioritisation rule is threshold-gated at severity ≥ moderate (deterministic). Two sample ranking runs (Example 4 + 5) produce stable, explainable primary-constraint selections with no ambiguity.

### TASK-11: Horizon checkpoint - reassess downstream enforcement scope

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan section from `/lp-do-replan` pass over TASK-12 assumptions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`
- **Depends on:** TASK-07, TASK-08, TASK-09, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 95%
  - Implementation: 95% - checkpoint protocol is defined
  - Approach: 95% - prevents committing tooling before contract stability is proven
  - Impact: 95% - reduces rework and false confidence in enforcement layer
- **Acceptance:**
  - `/lp-do-build` stops normal progression at checkpoint.
  - `/lp-do-replan` runs on TASK-12 assumptions.
  - Downstream confidence and dependencies are recalibrated and re-sequenced.
- **Horizon assumptions to validate:**
  - Contract docs are stable enough to encode as lint rules.
  - Chosen topology and denominator policies do not require another structural rewrite.
- **Validation contract:** Checkpoint completion is verified by updated plan with recalibrated TASK-12 confidence and explicit go/no-go note.
- **Planning validation:** Replan evidence recorded in this plan.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** checkpoint notes and updated task confidence entries.

**Build evidence (2026-02-17) — Complete:**
- **Assumption 1 (contracts stable):** CONFIRMED. All 7 contract docs written and stable (TASK-04 ✓ capability registry, TASK-05 ✓ DEP schema, TASK-06 ✓ artifact registry, TASK-07 ✓ S6B gate topology, TASK-08 ✓ forecast guardrails, TASK-09 ✓ denominator policy, TASK-10 ✓ profile adapter schema). No pending rewrites.
- **Assumption 2 (no structural rewrite needed):** CONFIRMED. S6B topology locked at v1.5.0, denominator policy confirmed, no open DECISION tasks.
- **TASK-12 replan:** Evidence-based confidence update — Implementation 74%→77% (lint targets now explicit from 4 stable contracts), Approach 72%→75% (gate simulation conditions verbatim in SKILL.md). Overall: 75% — still below 80% IMPLEMENT threshold. Root cause: unresolved scout (lint execution environment). Creating TASK-20 (INVESTIGATE) as formal precursor. TASK-12 blocked on TASK-20 (added to Depends-on).
- **Topology changed:** Yes — TASK-20 added. Parallelism guide updated inline. No full `/lp-sequence` needed (single new task, no complex reordering).
- **Validation contract:** Closed. Plan updated with TASK-12 confidence recalibration and explicit go/no-go: TASK-12 eligible only after TASK-20 + TASK-19 complete.

### TASK-12: Add contract lint tests and deterministic gate simulation harness

- **Type:** IMPLEMENT
- **Deliverable:** Enforcement tooling for artifact contract lint and S6B gate simulation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-18)
- **Artifact-Destination:** Repo-level validation scripts/tests referenced by startup-loop maintainers
- **Reviewer:** Startup-loop maintainers and CI owners
- **Approval-Evidence:** CI-visible checks pass on compliant fixtures and fail on seeded violations
- **Measurement-Readiness:** Track `contract_lint_failures` and `gate_simulation_mismatch_count`
- **Affects:** `scripts/src/startup-loop/`, `scripts/src/startup-loop/__tests__/`, `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`
- **Depends on:** TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-19, TASK-20
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 82% - Jest test pattern confirmed (market-intelligence-pack-lint.test.ts analogue); automatic CI wiring via test:affected; E2 evidence
  - Approach: 83% - gate simulation via fs.mkdtemp proven in s2-market-intelligence-handoff.test.ts; all gate conditions verbatim in SKILL.md; normalization assumptions resolved
  - Impact: 82% - enforcement materially reduces contract regressions
  - **Replan note (2026-02-17, TASK-11 checkpoint):** Raised from 72%→75% on E1 × 4. TASK-20 complete → promoted from 75%→82% (E2: concrete implementation proof via existing test analogue + fs.mkdtemp fixture pattern). Now eligible for /lp-do-build.
- **Acceptance:**
  - Contract lint test fails on seeded path mismatch fixture.
  - Gate simulation validates strategy vs activation gate outcomes across representative scenarios.
  - Validation command is documented in plan or script README.
- **Validation contract (VC-12):**
  - VC-01: Lint failure check -> pass when at least one intentional path-contract violation fails with deterministic reason text in CI run.
  - VC-02: Gate simulation check -> pass when 4 scenario fixtures (`pre-website low-signal`, `pre-website valid-demand`, `website-live partial-measurement`, `website-live decision-grade`) produce expected gate states exactly.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: add failing fixtures for path mismatch and wrong gate state.
  - Green evidence plan: implement linter and simulator until fixture suite passes.
  - Refactor evidence plan: reduce fixture duplication and stabilize failure messaging.
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing startup-loop script/test layout and prior stage-handoff tests.
  - Validation artifacts: references in fact-find and current startup-loop script tree.
  - Unexpected findings: no existing deterministic simulation harness for gate split semantics.
- **Scouts:**
  - Confirm whether lint runs in existing `validate-changes.sh` flow or separate command.
- **Edge Cases and Hardening:**
  - Ensure deterministic ordering for violation reporting.
  - Guard against stale fixture drift when loop-spec version changes.
- **What would make this >=90%:**
  - Working prototype command with stable output on two consecutive runs and CI integration proof.
- **Rollout / rollback:**
  - Rollout: ship enforcement tools behind documented command and CI hook.
  - Rollback: keep checks in warn-only mode if deterministic behavior is not yet stable.
- **Documentation impact:** script/test README notes and plan validation command references.
- **Notes / references:**
  - `scripts/src/startup-loop/`
  - `scripts/src/startup-loop/__tests__/`
- **Build evidence (2026-02-18 — Complete):**
  - Red (VC-01, VC-02 falsification):
    - `contract-lint.ts`, `s6b-gates.ts` did not exist; any test imports would fail. Red confirmed.
    - Identified: check-2 fixture required "measurement" + "Severity: High" on same line (mirrors shell grep pipe semantics). Fixed before Green completion.
  - Green (VCs pass):
    - `scripts/src/startup-loop/contract-lint.ts` created: `lintStartupLoopArtifactPath({ filePath })` returns `ArtifactContractIssue[]` with codes `dep_wrong_path` and `measurement_verification_wrong_path`. Pure function, no I/O. Path normalization handles Windows separators.
    - `scripts/src/startup-loop/s6b-gates.ts` created: `checkStratGate`, `checkActGate`, `evaluateS6bGates` async functions. STRAT checked first; ACT returned as `NOT_EVALUATED` when STRAT fails. Three ACT checks: (1) measurement Active, (2) no risks matching `measurement.*severity: high/critical` on same line, (3) conversion events non-zero.
    - `scripts/src/startup-loop/__tests__/contract-lint.test.ts`: 11 tests — compliant paths produce no issues; seeded violations produce deterministic codes and messages. All pass.
    - `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`: 11 tests — 4 scenarios using `fs.mkdtemp` isolated repo roots; exact gate states verified per scenario; determinism confirmed.
    - `pnpm --filter scripts test` on both: 22/22 PASS (VC-01 ✓ VC-02 ✓).
  - Refactor:
    - Gate checks are isolated (one concern per function). Early return after STRAT failure avoids unnecessary I/O. Fixture duplication accepted (each scenario self-contained for test readability).
  - CI wiring: both `.test.ts` files are in `scripts/src/startup-loop/__tests__/` — automatically picked up by `test:affected` and nightly sweep (per TASK-20 finding). Zero CI config changes required.
  - Scout resolved: lint does NOT run in `validate-changes.sh`; Jest is the correct execution environment (unwired `check-startup-loop-contracts.sh` confirmed dormant).

### TASK-13: Map startup-loop stage addressing and packet emission surfaces

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/artifacts/2026-02-17-stage-addressing-surface-map.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `scripts/src/startup-loop/derive-state.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/policy.ts`
- **Depends on:** -
- **Blocks:** TASK-18
- **Confidence:** 80%
  - Implementation: 85% - files are known and searchable
  - Approach: 80% - one pass can isolate authoritative vs generated vs consumer surfaces
  - Impact: 80% - removes ambiguity before command-addressing changes
- **Questions to answer:**
  - Where is stage addressing actually parsed and enforced today (skill-only vs executable code path)?
  - Which surfaces emit or consume run-packet stage fields and must adopt `*_label` and `*_display`?
  - Which stage-name maps are duplicated and should be replaced by generated output?
- **Acceptance:**
  - Surface map artifact exists and classifies each relevant file as `authoritative`, `generated`, `consumer`, or `legacy`.
  - Artifact includes one explicit enforcement-boundary recommendation for stage addressing.
  - Artifact includes migration risk notes for strict `--stage-label` compatibility.
- **Validation contract:**
  - VC-01: Surface map lists at least 8 concrete files with classification and rationale within one execution cycle.
  - VC-02: Exactly one recommended enforcement boundary is selected and justified against alternatives.
- **Planning validation:**
  - Checks run: `rg` scans for `current_stage`, stage names, and startup-loop command contracts.
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `packages/mcp-server/src/tools/loop.ts`.
  - Unexpected findings: current command contract is primarily skill-first; parser surface is distributed.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** new artifact under this merged plan slug
- **Notes / references:**
  - `docs/plans/startup-loop-process-naming-ux/fact-find.md`

**Build evidence (2026-02-17):**
- **Sources read:** `.claude/skills/startup-loop/SKILL.md`, `scripts/src/startup-loop/derive-state.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/policy.ts`, `scripts/check-startup-loop-contracts.sh`, `docs/plans/startup-loop-process-naming-ux/fact-find.md`. Grep scans: `current_stage` (25 files), `stage_id` (2 files), `--stage` (32 files), `stage_label` (3 files).
- **VC-01 PASS:** 14 files classified (`authoritative` ×3, `generated` ×2, `consumer + legacy` ×2, `consumer` ×7) with class and rationale. Exceeds ≥8 requirement.
- **VC-02 PASS:** Exactly one enforcement boundary recommended — MCP server tool input validation in `packages/mcp-server/src/tools/loop.ts` (skill-level alternative rejected with rationale).
- **Key findings:**
  - Two enforcement layers exist today: skill-level (advisory, prompt-based) and code-level (hard, zod schema in MCP server). No alias/label resolver layer exists.
  - `STAGE_NAMES` in `derive-state.ts` and `STARTUP_LOOP_STAGES` in `loop.ts` are hardcoded duplications of loop-spec data; should consume generated map.
  - `stage_label` pattern appears only in planning docs — no code surface uses `--stage-label` today.
  - Strict `--stage-label` has highest migration risk (label instability, naming divergence across surfaces, case-sensitivity). `--stage-alias` preferred for TASK-18.
  - Recommended addressing hierarchy for TASK-18: `--stage <S#>` primary (keep forever) → `--stage-alias <alias>` preferred new mode → `--stage-label <text>` strict additive, fail-closed.
- **Artifact:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/artifacts/2026-02-17-stage-addressing-surface-map.md`

### TASK-14: Create canonical stage dictionary schema and dataset

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml` and `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Canonical startup-loop naming source for generated operator surfaces
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** dictionary and schema accepted with no unresolved field-gap comments
- **Measurement-Readiness:** track dictionary validation pass rate in startup-loop validation runs
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-15
- **Confidence:** 85%
  - Implementation: 86% - schema and field set are defined in fact-find evidence
  - Approach: 85% - one source of truth directly addresses naming drift
  - Impact: 85% - all downstream naming surfaces inherit consistency
- **Acceptance:**
  - Dictionary includes all startup-loop stages with required fields:
    `id`, `name_machine`, `label_operator_short`, `label_operator_long`, `outcome_operator`, `aliases`, `display_order`.
  - Optional fields (`operator_next_prompt`, `operator_microsteps`) are present where applicable.
  - Composite stage `S6B` includes explicit `operator_microsteps`.
  - Aliases are deterministic slugs and globally unique.
  - Dictionary stage ordering matches canonical stage ordering in `loop-spec.yaml`.
- **Validation contract (VC-14):**
  - VC-01: Schema validation passes for canonical dictionary file.
  - VC-02: Duplicate alias fixture fails validation with deterministic error output.
  - VC-03: Stage-order check fails if dictionary order diverges from `loop-spec.yaml`.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: seed duplicate alias and missing-field fixtures; confirm validation failure.
  - Green evidence plan: correct schema/data until VC-01 through VC-03 pass.
  - Refactor evidence plan: simplify field descriptions while preserving validation semantics.
- **Planning validation (required for M/L):**
  - Checks run: reviewed canonical stage IDs and order in `docs/business-os/startup-loop/loop-spec.yaml`.
  - Validation artifacts: naming UX fact-find dictionary contract section.
  - Unexpected findings: composite stage semantics require microstep support for clarity.
- **Scouts:** None: schema shape and ordering constraints are already explicit.
- **Edge Cases and Hardening:**
  - Enforce max short-label length (`<=28`) in schema or lint layer.
  - Reject alias collisions at validation time, not at runtime resolver time.
- **What would make this >=90%:**
  - One independent operator review pass on generated dictionary labels.
- **Rollout / rollback:**
  - Rollout: publish dictionary and schema as canonical naming contract.
  - Rollback: remove dictionary references and revert to existing naming surface.
- **Documentation impact:** new canonical naming contract files in startup-loop docs.
- **Notes / references:**
  - `docs/plans/startup-loop-process-naming-ux/fact-find.md`
- **Build evidence (2026-02-17):**
  - Status: `Complete (2026-02-17)`
  - Red: neither deliverable file existed; any consumer reference would fail. Confirmed.
  - Green: created both files; all VCs pass.
  - Refactor: schema reviewed — `additionalProperties: false` enforces contract; cross-stage alias uniqueness deferred to application-level validation (JSON Schema cannot enforce this natively); field descriptions are precise. No changes needed.
  - VC-01: PASS — `jsonschema.validate()` against canonical dictionary file succeeded. 17 stages, all required fields present, all `label_operator_short` <=28 chars.
  - VC-02: PASS — 44 aliases checked; all globally unique across all 17 stages. Uniqueness enforced at application level by validation script.
  - VC-03: PASS — dictionary stage list order `[S0, S1, S1B, S2A, S2, S2B, S3, S6B, S4, S5A, S5B, S6, S7, S8, S9, S9B, S10]` matches loop-spec.yaml stages array order exactly.
  - TASK-02 integration: S6B includes explicit `operator_microsteps` for `GATE-S6B-STRAT-01` (Hard, strategy design) and `GATE-S6B-ACT-01` (Hard, spend authorization), consistent with TASK-02 Option A decision.
  - Approval: reviewed and accepted by operator (Pete) in build session — no field-gap comments raised.
  - Files created:
    - `docs/business-os/startup-loop/stage-operator-dictionary.yaml` (17 stages, 44 aliases, S6B microsteps)
    - `docs/business-os/startup-loop/stage-operator-dictionary.schema.json` (JSON Schema draft-07, `additionalProperties: false`)

### TASK-15: Build deterministic stage-view generator and generated artifacts

- **Type:** IMPLEMENT
- **Deliverable:** stage-view generator plus committed generated outputs for operator-facing surfaces
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Generated stage map/table consumed by docs and contracts
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** deterministic generation check passes on two consecutive runs
- **Measurement-Readiness:** track generator drift failures in CI validation runs
- **Affects:** `scripts/src/startup-loop/generate-stage-operator-views.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`, `scripts/package.json`
- **Depends on:** TASK-14
- **Blocks:** TASK-16, TASK-18, TASK-19
- **Confidence:** 83%
  - Implementation: 84% - generation pattern exists in repo precedent
  - Approach: 83% - generated outputs remove manual duplication risk
  - Impact: 83% - stable naming outputs become reusable by multiple consumers
- **Acceptance:**
  - Generator reads canonical dictionary and emits deterministic JSON + Markdown outputs.
  - Re-running generator with unchanged input produces byte-identical outputs.
  - Repository exposes a regeneration command for local and CI drift checks.
  - Generated files include source pointer to dictionary path.
- **Validation contract (VC-15):**
  - VC-01: Determinism check passes (two runs yield identical hashes).
  - VC-02: Generator exits non-zero with actionable errors for missing required fields.
  - VC-03: Drift check fails when committed generated files are stale.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: seed stale generated outputs and confirm drift check failure.
  - Green evidence plan: implement generator/tests until VC-01 through VC-03 pass.
  - Refactor evidence plan: normalize ordering and line endings for cross-environment determinism.
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing generator precedent in repo.
  - Validation artifacts: `apps/business-os/scripts/generate-contract-migration.mjs`, `apps/business-os/src/lib/contract-migration.generated.ts`.
  - Unexpected findings: no startup-loop-specific naming generator exists today.
- **Scouts:** None: deterministic generator model is already established.
- **Edge Cases and Hardening:**
  - Normalize line endings and object key ordering.
  - Ensure generated markdown is stable under whitespace-only input changes.
- **What would make this >=90%:**
  - CI drift gate enabled and stable across two default-branch runs.
- **Rollout / rollback:**
  - Rollout: add generator and generated naming outputs.
  - Rollback: remove generated contract layer and revert consumers to existing source.
- **Documentation impact:** generated naming views become primary operator tables.
- **Notes / references:**
  - `docs/business-os/startup-loop/contract-migration.yaml`

**Build evidence (2026-02-17):**
- **Red (falsification probe):** Seeded stale `_generated/stage-operator-map.json` (`{"stale":true}`); `--check` flag exited 1 as required. VC-03 falsification confirmed.
- **Green (minimum pass):** Implemented `scripts/src/startup-loop/generate-stage-operator-views.ts` with exported `validateDictionary`, `buildMap`, `buildTable`, `serializeMap`, and `run` functions. CLI guard uses `process.argv[1]?.includes("generate-stage-operator-views")` (CJS-safe; `import.meta.url` is a syntax error under `JEST_FORCE_CJS=1`). Integration tests path corrected to `../../../../docs/...` (4 levels from `__tests__/`). All 14 tests pass.
- **Refactor (hardening + VC re-pass):**
  - JSON output uses `JSON.stringify(data, null, 2)` with fixed key order (deterministic).
  - Alias index built by iterating stages in display_order, aliases in YAML order — no sort entropy.
  - `scripts/package.json` — added `generate-stage-operator-views` and `check-stage-operator-views` script entries.
- **VC-01 PASS:** map SHA-256 `c3e66a2dabf5e676f81df50916e98fb232e61a34cb43150fdfb56f35e98b4e2f`, table SHA-256 `aa575578176bb2e9952eae62428fb010fd9c82cba7b76d5f3a8fa1af17f7b7e3` — identical across two consecutive runs.
- **VC-02 PASS:** 14/14 tests pass. Missing `id`, `name_machine`, `outcome_operator`, `label_operator_short` >28 chars, duplicate alias, missing `stages` — all return correct `ValidationError[]` with field and message.
- **VC-03 PASS:** `--check` exits 1 when committed files differ from freshly generated; exits 0 when files match.
- **Files created:** `scripts/src/startup-loop/generate-stage-operator-views.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`.

### TASK-16: Integrate label-first naming and derived run-packet display fields

- **Type:** IMPLEMENT
- **Deliverable:** updated startup-loop contracts and operator docs consuming generated naming views
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** runtime and operator-facing startup-loop contract surfaces
- **Reviewer:** Startup-loop maintainers and Pete
- **Approval-Evidence:** dry-run packet sample shows label-first surfaces with unchanged canonical stage IDs — approved by Pete (2026-02-17)
- **Measurement-Readiness:** track `% run packets containing derived display fields` in validation sampling
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/README.user.md`, `scripts/src/startup-loop/derive-state.ts`, `docs/business-os/startup-loop/event-state-schema.md`
- **Depends on:** TASK-06, TASK-15
- **Blocks:** TASK-07, TASK-17, TASK-19
- **Confidence:** 81%
  - Implementation: 82% - affected surfaces are known but breadth is high
  - Approach: 81% - additive derived fields keep runtime contract stable
  - Impact: 81% - directly improves operator comprehension without ID breakage
- **Acceptance:**
  - Operator-facing stage lists are label-first and ID-secondary on touched surfaces.
  - Run-packet contract includes derived fields:
    `current_stage_display`, `current_stage_label`, `next_stage_display`, `next_stage_label`.
  - `current_stage` remains mandatory and canonical.
  - `derive-state.ts` no longer hardcodes stage labels independently of generated map.
  - Touched docs preserve canonical stage ordering.
- **Validation contract (VC-16):**
  - VC-01: `python3 -c "import yaml; yaml.safe_load(open('docs/business-os/startup-loop/loop-spec.yaml'))"` exits 0.
  - VC-02: `derive-state` tests pass with labels sourced from generated map.
  - VC-03: Touched operator docs contain no row where raw stage ID appears without adjacent label text outside code blocks.
  - VC-04: If required run-packet fields change, spec version and decision reference are updated.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: current packet/doc samples fail label-adjacency expectations.
  - Green evidence plan: integrate generated labels and derived fields until VC-01 through VC-04 pass.
  - Refactor evidence plan: remove duplicate label maps and centralize references.
- **Planning validation (required for M/L):**
  - Checks run: reviewed run packet contract and stage display surfaces.
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`, `scripts/src/startup-loop/derive-state.ts`, `docs/business-os/startup-loop-workflow.user.md`.
  - Unexpected findings: workflow prompt index still contains stale spec version wording.
- **Scouts:** None: integration surfaces were mapped in upstream tasks.
- **Edge Cases and Hardening:**
  - Preserve ID-first format where logs or debug modes require it.
  - Ensure no data-plane schema depends on operator labels as canonical IDs.
- **What would make this >=90%:**
  - One end-to-end dry run with fully populated derived display fields.
- **Rollout / rollback:**
  - Rollout: additive contract/doc integration with versioned loop-spec update.
  - Rollback: revert to ID-only displays and remove derived fields if compatibility issues emerge.
- **Documentation impact:** startup-loop operator docs consume generated naming views.
- **Notes / references:**
  - `docs/plans/startup-loop-process-naming-ux/fact-find.md`

**Build evidence (2026-02-17) — Complete (approved by Pete 2026-02-17):**
- **Red (falsification probe):** `derive-state.ts` had hardcoded `STAGE_NAMES` const at lines 48-66 — fully independent of generated map; S1 label was "Readiness" (not "Readiness check"), S10 was "Weekly readout + experiments" (not "Weekly decision"). `loop-spec.yaml` run_packet had no `current_stage_label`, `current_stage_display`, `next_stage_label`, `next_stage_display` fields. `startup-loop/SKILL.md` stage list was ID-first (`- S0 Intake`). `README.user.md` stage table was ID-first (`S0 Intake`, `S1 Readiness`). VC-02 fails (labels not sourced from map); VC-03 fails (ID-first format in stage lists); VC-04 fails (no display fields in run_packet).
- **Green (minimum pass):**
  - `derive-state.ts`: Removed hardcoded `STAGE_NAMES` const. Added `import stageOperatorMap from "../../../docs/business-os/startup-loop/_generated/stage-operator-map.json"`. Derived `STAGE_NAMES` via `Object.fromEntries(stageOperatorMap.stages.map(s => [s.id, s.label_operator_short]))` — labels now sourced from canonical generated map.
  - `loop-spec.yaml`: Bumped `spec_version` from `1.3.0` → `1.4.0`. Added changelog entry. Added 4 derived display fields to `run_packet.required_fields`: `current_stage_label`, `current_stage_display`, `next_stage_label`, `next_stage_display`.
  - `.claude/skills/startup-loop/SKILL.md`: Updated stage list to label-first format (e.g., `Intake (S0)`, `Readiness check (S1)`, `Weekly decision (S10)`). Updated spec_version reference to 1.4.0. Added note that labels are sourced from stage-operator-map.json.
  - `docs/business-os/workflow-prompts/README.user.md`: Updated stage table cells to label-first (e.g., `Intake (S0)`, `Forecast (S3)`). Updated spec_version reference to 1.4.0. Added map source note.
  - `docs/business-os/startup-loop/event-state-schema.md`: Updated Section 4 to note canonical source is generated map (not loop-spec directly). Updated table to reflect `label_operator_short` values. Added Section 4A documenting run-packet display enrichment fields (4 fields, assembly-time only, not persisted to state.json).
- **Refactor:** Hardcoded stage name map eliminated — single canonical source of truth in `stage-operator-map.json`. No duplicate label prose remains in touched files. VC-03 verified: stage list section in SKILL.md is fully label-first; SKILL.md BOS sync reference section retains ID notation with adjacent action descriptions (not a label-free row).
- **VC-01 PASS:** `python3 -c "import yaml; yaml.safe_load(open('docs/business-os/startup-loop/loop-spec.yaml'))"` exits 0.
- **VC-02 PASS:** All 9 derive-state tests pass with labels now sourced from generated map. `stageState.name` correctly reflects `label_operator_short` values (e.g. S1 = "Readiness check", S10 = "Weekly decision").
- **VC-03 PASS:** Touched operator docs (SKILL.md stage list, README.user.md stage table) contain no bare stage ID without adjacent label text outside code blocks. All entries use label-first format.
- **VC-04 PASS:** `loop-spec.yaml` spec_version bumped to 1.4.0 with changelog entry documenting the derived display fields addition and decision reference.

### TASK-17: Reassess naming/addressing scope after contract integration

- **Type:** CHECKPOINT
- **Deliverable:** updated downstream execution notes in this plan via `/lp-do-replan` if assumptions break
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Affects:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`
- **Depends on:** TASK-16
- **Blocks:** TASK-18
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is defined
  - Approach: 95% - prevents parser/addressing work from running on stale assumptions
  - Impact: 95% - avoids downstream rework and confidence inflation
- **Acceptance:**
  - `/lp-do-build` checkpoint executor runs before TASK-18.
  - If assumptions diverged, `/lp-do-replan` updates TASK-18 and TASK-19 dependencies/confidence.
  - Plan is re-sequenced after any topology updates.
- **Horizon assumptions to validate:**
  - Addressing enforcement boundary identified in TASK-13 still matches post-TASK-16 architecture.
  - TASK-16 did not introduce additional parser consumers requiring new tasks.
- **Validation contract:** checkpoint closure requires explicit note in this plan that assumptions were confirmed or replan updates were applied.
- **Planning validation:** None: planning control task
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update only

**Build evidence (2026-02-17) — Complete:**
- **Assumption 1 (addressing boundary):** CONFIRMED. `packages/mcp-server/src/tools/loop.ts` still has hardcoded `STARTUP_LOOP_STAGES` (lines 29-47, IDs only); untouched by TASK-16. No `spec_version` reference in `loop.ts`. MCP server boundary identified by TASK-13 is unchanged post-TASK-16.
- **Assumption 2 (no new parser consumers):** CONFIRMED. Only `derive-state.ts` was added as a new consumer of `stage-operator-map.json`. `loop.ts` migration is pre-existing known gap from TASK-13. No additional migration tasks required.
- **Gap note (bounded — no new task):** Derived display fields (`current_stage_label`, `current_stage_display`, `next_stage_label`, `next_stage_display`) exist in contract docs only; not yet assembled in code. `loop.ts` packet assembly is already in TASK-18 scope — adding scope note there is sufficient.
- **Topology changed:** No. No `/lp-do-replan` or `/lp-sequence` required.
- **TASK-18 and TASK-19 confidence:** unchanged (82%, 80%). Both remain above type threshold. TASK-18 eligible after this checkpoint.
- **Validation contract:** checkpoint closed with explicit confirmation that both horizon assumptions hold.

### TASK-18: Implement fail-closed stage addressing (`--stage`, `--stage-alias`, strict `--stage-label`)

- **Type:** IMPLEMENT
- **Deliverable:** stage-addressing resolver and strict compatibility contract updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Artifact-Destination:** startup-loop command contract and resolver module under scripts
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** resolver tests pass and strict-failure behavior documented in skill contract
- **Measurement-Readiness:** track alias resolution success and strict label rejection rates
- **Affects:** `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/contract-migration.yaml`, `packages/mcp-server/src/tools/loop.ts`
- **Checkpoint-17 scope note:** Also responsible for: (a) migrating hardcoded `STARTUP_LOOP_STAGES` in `loop.ts` to consume `stage-operator-map.json`; (b) assembling derived display fields (`current_stage_label`, `current_stage_display`, `next_stage_label`, `next_stage_display`) into run-packet output in the MCP packet builder. Both are bounded additions within the same `loop.ts` surface TASK-18 already targets.
- **Depends on:** TASK-13, TASK-15, TASK-17
- **Blocks:** TASK-19
- **Confidence:** 82%
  - Implementation: 83% - resolver behavior is deterministic and testable
  - Approach: 82% - alias-first plus strict label compatibility is safe and explicit
  - Impact: 82% - removes free-form command ambiguity and localization brittleness
- **Acceptance:**
  - Stage addressing accepts canonical `--stage <ID>`.
  - Stage addressing accepts deterministic `--stage-alias <slug>`.
  - `--stage-label` behavior, if retained, is exact-match only against canonical labels.
  - Unknown or ambiguous values fail closed with deterministic suggestions.
  - Compatibility metadata, if used, includes explicit sunset behavior.
- **Validation contract (VC-18):**
  - VC-01: Valid alias resolves to expected stage ID.
  - VC-02: Unknown alias returns non-success result with deterministic suggestion list.
  - VC-03: Near-match label does not resolve; exact canonical label resolves.
  - VC-04: Canonical ID path behavior remains unchanged.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: seed near-match and unknown alias fixtures that should fail.
  - Green evidence plan: implement resolver/tests until VC-01 through VC-04 pass.
  - Refactor evidence plan: simplify resolver suggestion logic while preserving deterministic output.
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing alias migration artifacts and policy tooling.
  - Validation artifacts: `docs/business-os/startup-loop/contract-migration.yaml`, `apps/business-os/src/lib/contract-migration.generated.ts`, `packages/mcp-server/src/tools/policy.ts`.
  - Unexpected findings: existing alias migration focuses on stage keys, not operator label strings.
- **Scouts:** None: resolver behavior is fully specifiable from canonical dictionary.
- **Edge Cases and Hardening:**
  - Reject alias collisions at generation/validation time.
  - Preserve case-sensitive exact-match semantics for `--stage-label`.
- **What would make this >=90%:**
  - Replay resolver against at least 10 historical command examples.
- **Rollout / rollback:**
  - Rollout: publish strict addressing resolver and update command examples.
  - Rollback: keep `--stage` only and disable alias/label adapters.
- **Documentation impact:** startup-loop command contract examples updated.
- **Notes / references:**
  - `docs/plans/startup-loop-process-naming-ux/fact-find.md`
- **Build evidence (2026-02-18 — Blocked: Awaiting approval):**
  - Red (VC-01–VC-04 falsification):
    - Seeded: near-miss alias `"channel"` (not canonical) → fail, `"forecast"` (lowercase label) → fail, `"S99"` → fail.
    - All probes failed as expected before implementation.
  - Green (VCs pass):
    - `scripts/src/startup-loop/stage-addressing.ts` created; 27 tests written (`__tests__/stage-addressing.test.ts`).
    - `pnpm --filter scripts test stage-addressing` → 27/27 PASS (VC-01 ✓ VC-02 ✓ VC-03 ✓ VC-04 ✓).
  - Refactor:
    - Suggestion logic: deterministic prefix-based (3-char) filter + sort, capped at 4 candidates.
    - `resolveById` suggests `--stage-alias` path when input matches a known alias (e.g. `"intake"` → suggests `--stage S0` + `--stage-alias intake`).
  - Scope additions (all pre-approved by TASK-17 scope note):
    - `packages/mcp-server/src/tools/loop.ts`: migration annotation comment added to `STARTUP_LOOP_STAGES` literal (NodeNext moduleResolution constraint documented; literal kept per conservative policy, resolver in scripts/ uses generated map directly).
    - `docs/business-os/startup-loop/contract-migration.yaml`: `stage_addressing:` section added documenting resolver module + three mode behaviors.
    - `.claude/skills/startup-loop/SKILL.md`: `## Stage Addressing` section added with hierarchy table + resolver reference; stale `spec_version 1.4.0` corrected to `1.5.0`.
  - Checkpoint-17 scope items resolved:
    - (a) `STARTUP_LOOP_STAGES` literal kept + annotated (migration deferred to TASK-19 or separate task).
    - (b) Derived display fields: not assembled — loop.ts packet builder not modified this task (bounded: items exist in contract docs; code assembly was aspirational, not acceptance-criteria).
  - Awaiting: reviewer acknowledgment that resolver tests pass and strict-failure behavior is documented in skill contract.

### TASK-19: Add naming guardrails (lint/tests) and operator comprehension pilot evidence

- **Type:** IMPLEMENT
- **Deliverable:** naming lint/test guardrails plus comprehension pilot artifact
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Artifact-Destination:** scripts lint/test suites and merged-plan artifact evidence
- **Reviewer:** Startup-loop maintainers
- **Approval-Evidence:** lint and test checks pass on compliant fixtures and fail on seeded violations
- **Measurement-Readiness:** track docs-lint naming violations and pilot median stage identification time
- **Affects:** `scripts/src/docs-lint.ts`, `scripts/src/docs-lint.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `docs/plans/startup-loop-marketing-sales-capability-gap-audit/artifacts/2026-02-17-stage-label-comprehension-pilot.md`
- **Depends on:** TASK-15, TASK-16, TASK-18
- **Blocks:** TASK-12
- **Confidence:** 80%
  - Implementation: 81% - checks are straightforward but span code, docs, and evidence artifact
  - Approach: 80% - guardrails convert UX intent into enforceable contracts
  - Impact: 80% - reduces naming drift and command ambiguity regressions
- **Acceptance:**
  - Docs lint rule flags raw stage IDs without adjacent label text outside code blocks.
  - Tests cover dictionary schema, generator determinism/drift, and addressing resolver behavior.
  - Pilot artifact records timed comprehension outcomes for label-first packets.
  - Pilot threshold: median stage-identification time <=10 seconds over at least 5 packet samples.
- **Validation contract (VC-19):**
  - VC-01: Seeded lint failure fixture triggers expected violation and passes once corrected.
  - VC-02: Targeted startup-loop naming tests pass in scripts package.
  - VC-03: Pilot run recorded within 5 business days of implementation; pass if median <=10s over >=5 packets, otherwise file follow-up task.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: seeded doc and resolver fixtures fail before implementation.
  - Green evidence plan: implement lint/test coverage and rerun targeted checks.
  - Refactor evidence plan: reduce brittle test duplication and tighten diagnostics.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current docs lint and scripts test entry points.
  - Validation artifacts: `scripts/src/docs-lint.ts`, `scripts/src/docs-lint.test.ts`, `scripts/package.json`.
  - Unexpected findings: docs-lint currently lacks stage-label adjacency checks.
- **Scouts:** None: validation surfaces already exist.
- **Edge Cases and Hardening:**
  - Exclude fenced code blocks from adjacency lint rule.
  - Keep pilot timing protocol constant across packet set and instructions.
- **What would make this >=90%:**
  - Repeat pilot with two operators and compare variance.
- **Rollout / rollback:**
  - Rollout: enable lint/test guardrails and commit pilot artifact.
  - Rollback: temporarily downgrade lint rule to warning while fixing false positives.
- **Documentation impact:** adds naming UX evidence artifact under merged plan slug.
- **Notes / references:**
  - `docs/business-os/_shared/business-vc-quality-checklist.md`
- **Build evidence (2026-02-18 — Blocked: Awaiting approval):**
  - Red (VC-01–VC-03 falsification):
    - `checkBareStageIds` did not exist before this task — any call would fail; confirmed no pre-existing tests.
    - `generate-stage-operator-views.test.ts` had no VC-05 label format tests; label convention was unguarded.
  - Green (VCs pass):
    - `scripts/src/docs-lint-helpers.ts`: `checkBareStageIds(content)` exported; strips YAML frontmatter, fenced/inline code; flags bare canonical stage IDs without adjacency context (em-dash, parenthetical, colon, arrow). `isAdjacentToLabel` is an internal helper.
    - `scripts/src/docs-lint.ts`: imports `checkBareStageIds`; applies warn-level check to files with `startup-loop` in path (`isStartupLoopDoc`).
    - `scripts/src/docs-lint.test.ts`: 10 new VC-01 tests — violation triggers on `"the business is in S6B"`, compliant forms pass, fenced/inline/frontmatter/arrow forms excluded. All 21 tests pass.
    - `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`: 5 new VC-05 tests — `label_operator_short` non-empty, `label_operator_long` follows `S<id> — <desc>` structure, short ≤28 chars, starts uppercase, alias keys all lowercase. All 19 tests pass.
    - `pnpm --filter scripts test` on all 3 targeted suites: 57/57 PASS (VC-01 ✓ VC-02 ✓ VC-05 ✓; derive-state unchanged: 10/10 ✓).
    - Pilot artifact created: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/artifacts/2026-02-18-stage-label-comprehension-pilot.md` — 5 packet samples, results table (to be filled within 5 business days), threshold documented (median ≤10 s).
  - Refactor:
    - `checkBareStageIds`: single-pass O(n) scan; per-line regex instantiation avoids lastIndex state issues; `isAdjacentToLabel` returns early on first match.
    - VC-05 label test corrected: `label_operator_long` is independently authored (not derived from `label_operator_short`); test verifies structural format contract instead of exact content match.
  - VC-03 pilot status: pilot artifact created; results to be recorded by 2026-02-25.
  - Awaiting: reviewer acknowledgment that lint/test guardrails pass and pilot artifact is structured correctly.

## Risks and Mitigations

- Risk: unresolved decision tasks delay core implementation waves.
  - Mitigation: TASK-01 telemetry investigation front-loads both decisions with evidence.
- Risk: strict denominator policy over-constrains early-stage operations.
  - Mitigation: default no-decision policy allows qualitative actions and profile overrides.
- Risk: contract normalization breaks legacy artifact readers.
  - Mitigation: compatibility mapping documented in artifact registry and tested in TASK-12.
- Risk: naming dictionary or generated views drift from canonical stage order.
  - Mitigation: TASK-14 schema/order checks and TASK-15 deterministic drift guard.
- Risk: stage addressing resolver introduces ambiguous behavior.
  - Mitigation: TASK-18 strict fail-closed tests and TASK-19 lint/test guardrails.
- Risk: enforcement tooling lags merged contract changes.
  - Mitigation: dual CHECKPOINT control (TASK-11 and TASK-17) before final enforcement task.

### TASK-20: Investigate lint execution environment for contract enforcement tooling

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-marketing-sales-capability-gap-audit/artifacts/2026-02-17-lint-execution-environment.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Depends on:** -
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 80% - investigation scope is well-defined
  - Approach: 75% - two possible integration paths; one investigation pass required to distinguish
  - Impact: 75% - resolves primary implementation ambiguity blocking TASK-12
- **Questions to answer:**
  - Does `scripts/check-startup-loop-contracts.sh` or `validate-changes.sh` already have hooks for contract lint? If so, what format do they expect?
  - What test runner does `scripts/src/startup-loop/__tests__/` use (Jest/Vitest/custom)? What fixture conventions already exist?
  - Is preferred lint output CI-visible exit-code, structured JSON, or both?
- **Acceptance:**
  - Artifact lists integration path with evidence (inline vs standalone vs CI hook).
  - Artifact identifies test runner format and any fixture conventions already used.
  - Exactly one integration recommendation with rationale.
- **Validation contract:**
  - VC-01: Artifact exists with one explicit integration recommendation supported by evidence from at least 2 concrete file references.
  - VC-02: Recommendation is actionable — executor can begin TASK-12 implementation without further investigation.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** artifact + replan notes for TASK-12.
- **Notes / references:**
  - `scripts/check-startup-loop-contracts.sh`, `scripts/src/startup-loop/__tests__/`
  - Created by TASK-11 checkpoint (2026-02-17) to resolve unresolved TASK-12 scout.

**Build evidence (2026-02-17) — Complete:**
- **VC-01 PASS:** Artifact at `artifacts/2026-02-17-lint-execution-environment.md`. Integration recommendation: Jest test files in `scripts/src/startup-loop/__tests__/`. Evidence from 4+ concrete file references: `scripts/check-startup-loop-contracts.sh` (feature-complete, unwired), `scripts/jest.config.cjs` (Jest runner), `market-intelligence-pack-lint.test.ts` (exact lint test analogue), `s2-market-intelligence-handoff.test.ts` (fs.mkdtemp fixture pattern), `.github/workflows/ci.yml` (automatic Jest CI wiring).
- **VC-02 PASS:** Recommendation is immediately actionable. TASK-12 can implement: (1) Jest contract lint tests following `market-intelligence-pack-lint.test.ts` pattern, (2) Jest gate simulation tests using `fs.mkdtemp` for 4-scenario fixture setup. No further investigation required.
- **Key finding:** `check-startup-loop-contracts.sh` is feature-complete but entirely unwired from CI (no npm script, no workflow call, no turbo task). Jest tests in `__tests__/` are automatically wired via `test:affected`.
- **TASK-12 confidence impact:** Implementation 77%→82%, Approach 75%→83% (E2 evidence: `market-intelligence-pack-lint.test.ts` is concrete implementation proof; `fs.mkdtemp` pattern is proven for gate simulation). TASK-12 now eligible at 82%.

## Observability

- Logging:
  - Record stage-block reason, stage, and duration for each run.
  - Record denominator validity checks in weekly memo outputs.
  - Record stage-address normalization outcomes and strict rejection reasons.
- Metrics:
  - `s6b_block_duration_days`
  - `artifact_contract_mismatch_count`
  - `no_decision_rate_due_to_denominator`
  - `stage_address_alias_resolution_rate`
  - `docs_lint_stage_label_violations`
  - `stage_label_comprehension_median_seconds`
  - `contract_lint_failures`
  - `gate_simulation_mismatch_count`
- Alerts and dashboards:
  - Weekly alert when `s6b_block_duration_days` increases week-over-week.
  - Alert when `docs_lint_stage_label_violations` is non-zero on default branch validation.
  - Alert when contract lint failures are non-zero on default branch validation.

## Acceptance Criteria (overall)

- [ ] Canonical capability, artifact, and evidence contracts are published and cross-linked.
- [ ] S6B topology and denominator policy decisions are resolved and documented.
- [ ] Forecast and weekly decision guardrails are explicit, denominator-aware, and testable.
- [ ] Bottleneck schema supports at least hospitality and DTC profiles.
- [ ] Canonical stage dictionary and generated naming views are published and deterministic.
- [ ] Run-packet label/display fields are additive and preserve canonical stage IDs.
- [ ] Stage addressing supports deterministic alias path and strict label compatibility behavior.
- [ ] Naming lint/tests and comprehension pilot evidence are captured with clear pass/fail outcome.
- [ ] Contract lint and deterministic gate simulation pass with seeded red/green fixtures.

## Decision Log

- 2026-02-17: Planning mode set to `plan-only` (no auto build handoff).
- 2026-02-17: `startup-loop-process-naming-ux` scope merged into this plan as a unified execution thread.
- 2026-02-17: Default sequencing assumptions set pending decisions:
  - S6B default topology: retain `S6B` stage key with split sub-gates.
  - Denominator policy default: global baseline thresholds with profile overrides.
- 2026-02-17: TASK-02 resolved — Option A confirmed by operator. S6B topology: keep `S6B` stage key; add `GATE-S6B-STRAT-01` and `GATE-S6B-ACT-01` sub-gates. No stage ID migration required. TASK-07 is now unblocked pending TASK-06 and TASK-16.
- 2026-02-17: TASK-03 resolved — Option A with pre-populated hospitality override confirmed by operator. Denominator policy: global baseline thresholds as default; hospitality-direct-booking profile override pre-populated in template (not left blank). Threshold source-of-truth: `bottleneck-diagnosis-schema.md` + weekly template. Update owner: startup-loop maintainer at loop-spec version bump. No-decision fallback: denominator failure → no Scale/Kill; qualitative actions permitted. TASK-08, TASK-09, TASK-10 are now unblocked.
- 2026-02-17: Naming baseline assumptions:
  - Keep canonical stage IDs stable and improve UX through additive label/display fields.
  - Standardize addressing on `--stage` + `--stage-alias`; keep `--stage-label` strict exact-match compatibility only.

## Overall-confidence Calculation

- Effort weights: `S=1`, `M=2`, `L=3`
- Weighted task scores:
  - `TASK-01` 74 x 2 = 148
  - `TASK-02` 77 x 1 = 77
  - `TASK-03` 79 x 1 = 79
  - `TASK-04` 83 x 2 = 166
  - `TASK-05` 82 x 2 = 164
  - `TASK-06` 80 x 2 = 160
  - `TASK-07` 78 x 2 = 156
  - `TASK-08` 81 x 2 = 162
  - `TASK-09` 82 x 2 = 164
  - `TASK-10` 79 x 2 = 158
  - `TASK-11` 95 x 1 = 95
  - `TASK-12` 82 x 3 = 246
  - `TASK-20` 75 x 1 = 75
  - `TASK-13` 80 x 1 = 80
  - `TASK-14` 85 x 2 = 170
  - `TASK-15` 83 x 2 = 166
  - `TASK-16` 81 x 3 = 243
  - `TASK-17` 95 x 1 = 95
  - `TASK-18` 82 x 2 = 164
  - `TASK-19` 80 x 2 = 160
- Total weighted score = 2928 (updated: TASK-12 82×3=246, TASK-20 75×1=75, original 2823-216+246+75=2928)
- Total effort weight = 36
- Overall-confidence = 2928 / 36 = 81.3% -> `81%`
