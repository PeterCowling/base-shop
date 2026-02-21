---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: startup-loop-briefing-feedback-loop
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-replan
Related-Plan: docs/plans/startup-loop-briefing-feedback-loop/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Briefing Feedback Loop Hardening Fact-Find Brief

## Scope
### Summary
Investigate the operator's high-level HEAD review of the consolidated startup-loop briefing and convert validated feedback into planning-ready loop hardening requirements.

This fact-find is focused on preventing future briefing quality regressions (metadata contamination, contract drift, unresolved contradictions, and weak feedback capture), not on rebuilding content already delivered in `docs/business-os/startup-loop-output-registry.user.html`.

### Goals
- Verify each operator feedback claim with repository evidence.
- Identify root causes at compilation/template/contract level.
- Produce P0/P1/P2 hardening requirements with explicit validation checks.
- Produce planning-ready task seeds for the next implementation cycle.

### Non-goals
- Re-authoring HEAD/PET/BRIK business strategy content.
- Running `/lp-do-plan` or `/lp-do-build` in this session.
- Full deep audit of PET and BRIK content quality.

### Constraints & Assumptions
- Constraints:
  - Current briefing is a single static HTML artifact consumed by an operator.
  - Existing source artifacts use heterogeneous metadata and status vocabulary.
  - Changes must preserve startup-loop process authority in `loop-spec.yaml` and process registry contracts.
- Assumptions:
  - The next implementation cycle can introduce compile-time validation/lint checks.
  - A canonical source-of-truth contract can be introduced without breaking existing business docs.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop-output-registry.user.html` - compiled operator artifact under review.
- `docs/business-os/strategy/HEAD/plan.user.md` - current HEAD strategy and contract wording.
- `docs/business-os/startup-baselines/HEAD-intake-packet.user.md` - intake-level channel and contract statements.

### Key Modules / Files
- `docs/business-os/startup-loop-output-registry.user.html` - HEAD header labels, rendered statuses, and top-of-fold structure.
- `docs/business-os/strategy/HEAD/plan.user.md` - locked/frozen contract language and learning placeholder.
- `docs/business-os/startup-baselines/HEAD-intake-packet.user.md` - own-site-first channel intent and draft outcome contract.
- `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md` - assumptions register (including confidence values).
- `docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md` - marketplace-first recommendation.
- `docs/business-os/site-upgrades/HEAD/2026-02-12-upgrade-brief.user.md` - open-question set that overlaps with intake unknowns.
- `docs/business-os/strategy/HEAD/brand-dossier.user.md` - low-confidence proof ledger for claims also marked high elsewhere.
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` - authoritative S10 prompt structure and required sections.
- `docs/business-os/startup-loop/process-registry-v2.md` - weekly feedback responsibilities and S10 authority boundaries.
- `docs/business-os/startup-loop/artifact-registry.md` - canonical-path + lint-rule precedent for artifact validation.

### Findings (Operator Feedback Verification)
| ID | Finding | Verification | Evidence |
|---|---|---|---|
| F-01 | Metadata contamination in HEAD panel title | Confirmed | `docs/business-os/startup-loop-output-registry.user.html:380` shows `HEAD — Mini Pet Headband`, conflicting with HEAD naming in `docs/business-os/strategy/HEAD/plan.user.md:11` and `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:30`. |
| F-02 | Outcome contract is duplicated across artifacts | Confirmed | Contract definitions appear in `docs/business-os/strategy/HEAD/plan.user.md:17`, `docs/business-os/strategy/HEAD/plan.user.md:38`, `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:56`, and `docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:149`. |
| F-03 | Channel posture contradiction (own-site-first vs marketplace-first) | Confirmed | Own-site-first in intake (`docs/business-os/startup-baselines/HEAD-intake-packet.user.md:21`, `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:43`) versus marketplace-first in market intel (`docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:22`, `docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:105`). |
| F-04 | Status taxonomy drift in compiled output | Confirmed | Source files are `Status: Active` (`docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:3`, `docs/business-os/site-upgrades/HEAD/2026-02-12-upgrade-brief.user.md:3`), but compiled labels render as `Resolved` (`docs/business-os/startup-loop-output-registry.user.html:521`, `docs/business-os/startup-loop-output-registry.user.html:681`). |
| F-05 | Confidence conflict for the same claim (`~17k CI users`) | Confirmed | Forecast assumption marks high confidence (`docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md:127`) while brand proof ledger marks low confidence (`docs/business-os/strategy/HEAD/brand-dossier.user.md:134`). |
| F-06 | Operator top-of-fold is not a strict decision card | Confirmed | HEAD top-of-fold starts with long narrative artifacts (`docs/business-os/startup-loop-output-registry.user.html:387` onward); probe found no `Decision Register`, `Blockers & Unknowns`, or pass/warn/fail gate block in current output (rg probe, 2026-02-19). |
| F-07 | Unknowns are scattered across artifacts | Confirmed | `Missing-Data Checklist` and `Open Questions` appear in multiple sections (`docs/business-os/startup-loop-output-registry.user.html:615`, `docs/business-os/startup-loop-output-registry.user.html:705`, `docs/business-os/site-upgrades/HEAD/2026-02-12-upgrade-brief.user.md:121`). |
| F-08 | Learning loop intent exists but is not enforced | Confirmed | Placeholder text appears in compiled output (`docs/business-os/startup-loop-output-registry.user.html:414`), while S10 prompt required output sections stop at A-G with no mandatory learning append (`docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md:44`). |

### Patterns & Conventions Observed
- Status terms are mixed across layers: source frontmatter (`Draft`/`Active`), content labels (`Locked`/`Frozen`), compiled section titles (`Resolved`).
- Decision IDs (for example `DEC-HEAD-01`) exist but are embedded in narrative, not operated as a dedicated decision register object.
- Assumptions and confidence values are distributed per artifact without a canonical claim registry.
- Unknowns are tracked in artifact-local tables, not a consolidated, owner-driven burn-down object.

### Data & Contracts
- Artifact contract precedent exists for canonical paths and lint rules (`docs/business-os/startup-loop/artifact-registry.md:18`, `docs/business-os/startup-loop/artifact-registry.md:70`).
- S10 governance already defines weekly decision facilitation and authority (`docs/business-os/startup-loop/process-registry-v2.md:79`, `docs/business-os/startup-loop/process-registry-v2.md:688`).
- Weekly decision prompt defines required output sections A-G but does not require an explicit learning payload (`docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md:44`).

### Dependency & Impact Map
- Upstream dependencies:
  - HEAD source artifacts in strategy, baseline, market-research, and site-upgrades folders.
  - Prompt/registry contracts that define startup-loop operating structure.
- Downstream dependents:
  - Operator execution quality in weekly startup-loop decisions.
  - Future `/lp-do-plan` and `/lp-do-build` runs that compile/update the briefing.
- Likely blast radius:
  - Briefing compiler/renderer rules.
  - Source artifact schema conventions.
  - Weekly decision prompt contract (S10) and related validation tooling.

### Delivery & Channel Landscape
- Audience/recipient:
  - Operator (Peter), using the briefing as a decision cockpit.
- Channel constraints:
  - Local static HTML, no dynamic back-end validation at render time.
- Existing templates/assets:
  - Startup-loop artifact registry and process registry establish governance patterns but do not yet enforce this briefing's internal consistency checks.
- Approvals/owners:
  - Operator sign-off for briefing readability and decision usability.
  - Startup-loop maintainers for schema/prompt contract changes.
- Compliance constraints:
  - No new external compliance research needed for this hardening pass; focus is internal consistency and decision quality.
- Measurement hooks:
  - S10 weekly decision artifact and process contracts are the primary feedback loop anchors.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A required metadata schema + compile lint will prevent cross-business label contamination. | Compiler reads canonical metadata rather than hardcoded labels. | Low | Same session once lint exists |
| H2 | A single canonical outcome contract artifact will reduce cross-document target drift. | References replace duplicate contract blocks. | Medium | 1-2 build cycles |
| H3 | Explicit contradiction checks on channel/ICP/confidence fields will surface decision conflicts before publishing. | Structured field extraction from source artifacts. | Medium | Same cycle after parser/checks are added |
| H4 | A strict T1 operator card will reduce decision latency and increase actionable clarity. | T1 schema enforced at compile time. | Medium | 1 cycle with operator review |
| H5 | Mandatory weekly learning payload in S10 output will improve reforecast quality and stop silent non-learning weeks. | Weekly prompt + validation gate changes. | Medium | 2-3 weekly loops |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Direct contamination example present | `docs/business-os/startup-loop-output-registry.user.html:380` | High |
| H2 | Contract duplication across plan/intake/market docs | `docs/business-os/strategy/HEAD/plan.user.md:17`, `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:56` | High |
| H3 | Contradictory channel recommendations are explicit | `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:43`, `docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:105` | High |
| H4 | Current T1 contains long narrative blocks without strict operator card schema | `docs/business-os/startup-loop-output-registry.user.html:387` | Medium-High |
| H5 | Learning placeholder exists; S10 prompt lacks explicit learning section | `docs/business-os/startup-loop-output-registry.user.html:414`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md:44` | High |

#### Falsifiability Assessment
- Easy to test:
  - Metadata contamination checks.
  - Contradiction checks on channel/ICP/confidence fields.
  - Status taxonomy normalization checks.
- Hard to test:
  - Real-world operator efficiency gains from T1 redesign (needs at least one weekly cycle).
  - Learning quality improvements from prompt changes (needs multi-week comparison).
- Validation seams needed:
  - Structured parser for required frontmatter fields and selected in-body canonical blocks.
  - Deterministic compile-report artifact showing pass/fail checks per business.

#### Recommended Validation Approach
- Quick probes:
  - Build-time schema lint over source artifacts.
  - Contradiction detector with fail-fast output in generated briefing T1.
- Structured tests:
  - Snapshot test: compile output must contain canonical business label from source registry.
  - Contract uniqueness test: only one canonical outcome contract source per business.
  - Prompt contract test: weekly memo must include explicit learning payload fields.
- Deferred validation:
  - Human factors evaluation of T1 readability after one full weekly run.

## Loop Hardening Requirements (Planning Input)

### P0 - Must Fix Next
1. **Required artifact frontmatter schema + compile lint**
   - Require: `business`, `artifact`, `status`, `owner`, `last_updated`, `source_of_truth`, `depends_on`, `decisions`.
   - Fail compile on missing required keys, business-code mismatch, or incompatible status values.
2. **Single canonical outcome contract per business**
   - Introduce canonical path: `docs/business-os/contracts/<BIZ>/outcome-contract.user.md`.
   - All other artifacts reference this contract; duplication is flagged as an error.
3. **Decision Register object in T1**
   - Required columns: decision id, decision statement, trigger condition, state, next evidence required.
4. **Contradiction check for high-impact fields**
   - Validate and block on contradictions for: primary channel, primary ICP, pricing corridor, top numeric claim confidence.
5. **Status taxonomy normalization**
   - Enforce status vocabulary: `Draft`, `Active`, `Frozen`, `Superseded`.
   - Disallow `Resolved` unless formally defined in contract and mapped to a lifecycle state.

### P1 - Improve Operator Decision Quality
1. **Strict T1 operator card schema**
   - Required top-of-fold blocks: outcome window, gate state (pass/warn/fail with denominators), top blockers, next 72h plan, metrics snapshot.
2. **Canonical Blockers and Unknowns table**
   - Aggregate from all source artifacts into one owner-driven table with stable IDs and due dates.
3. **Priors summary + delta view**
   - Keep raw priors JSON in appendix; surface top priors and confidence deltas in T2.
4. **Claim registry + inline citation IDs**
   - Introduce `CLAIM-<BIZ>-NNN` references for load-bearing numeric claims.
5. **Learning payload enforcement in weekly memo**
   - Require explicit `tested`, `learned`, `changed`, `stop-next-week` fields (or explicit no-test reason).

### P2 - Higher Leverage Automation
1. **Analytics instrumentation spec artifact**
   - Add canonical analytics event and parameter schema for the business.
2. **Backlog-to-risk/gate linkage**
   - Add `mitigates_risk` and `improves_gate` fields to backlog rows and generate coverage maps.
3. **Brand dossier compaction rule for operator briefing**
   - If brand dossier status is not Active, render summary + advancement checklist only in T1/T2; full dossier remains appendix.

## Questions
### Resolved
- Q: Is the metadata contamination concern real or cosmetic?
  - A: Real. Header label conflict is confirmed in compiled output and conflicts with source artifacts.
  - Evidence: `docs/business-os/startup-loop-output-registry.user.html:380`, `docs/business-os/strategy/HEAD/plan.user.md:11`.
- Q: Is channel contradiction present in source artifacts?
  - A: Yes. Own-site-first and marketplace-first recommendations are both active and unresolved.
  - Evidence: `docs/business-os/startup-baselines/HEAD-intake-packet.user.md:43`, `docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md:105`.
- Q: Is learning loop enforcement currently explicit in S10 output contract?
  - A: No explicit learning payload section is required today.
  - Evidence: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md:44`.

### Open (User Input Needed)
- Q: Should the canonical outcome contract path be introduced under `docs/business-os/contracts/` (new namespace) or under existing `docs/business-os/strategy/<BIZ>/` namespace?
  - Why it matters: determines migration scope and compatibility with existing automation.
  - Decision impacted: contract canonicalization implementation plan.
  - Decision owner: startup-loop maintainers.
  - Default assumption (if any) + risk: default to `docs/business-os/contracts/<BIZ>/`; risk is extra migration/update effort for existing references.
- Q: Should unresolved contradictions fail compile hard, or render a prominent `CONFLICT` block while still publishing?
  - Why it matters: impacts operational continuity during transition.
  - Decision impacted: contradiction-check gate severity.
  - Decision owner: operator + startup-loop maintainers.
  - Default assumption (if any) + risk: default hard-fail for P0 fields; risk is temporary publishing friction during cleanup.

## Confidence Inputs
- Implementation: 86%
  - Basis: issues are concrete and traceable; existing registry docs provide a lint/contract precedent.
  - To >=80: already met.
  - To >=90: confirm canonical contract namespace decision and compile-gate severity choice.
- Approach: 84%
  - Basis: proposed fixes map directly to observed failure classes (metadata, duplication, contradiction, weak top-of-fold).
  - To >=80: already met.
  - To >=90: prototype one compile pass with full P0 checks and verify no false positives.
- Impact: 92%
  - Basis: fixes target operator trust, decision clarity, and feedback-loop reliability.
  - To >=80: already met.
  - To >=90: run one weekly cycle and confirm reduced contradiction/manual reconciliation overhead.
- Delivery-Readiness: 82%
  - Basis: owners and source artifacts are known; changes are mostly contract/compile/prompt level.
  - To >=80: already met.
  - To >=90: lock migration order for existing artifacts and confirm review owner for prompt-contract changes.
- Testability: 78%
  - Basis: many checks are deterministic, but human-usability impact requires at least one live weekly cycle to validate.
  - To >=80: add deterministic fixture tests for contamination/contradiction/status normalization.
  - To >=90: add one-cycle before/after operator QA checklist with decision-speed and conflict-count metrics.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Canonical contract migration breaks existing references | Medium | High | Stage migration with compatibility aliases and lints before hard-fail gates. |
| Over-strict compile checks block urgent publishing | Medium | Medium | Introduce staged enforcement: warn -> soft-fail -> hard-fail. |
| Status taxonomy migration creates churn across existing docs | High | Medium | Provide codemod/script and explicit mapping table from old terms. |
| T1 schema becomes too rigid for edge businesses | Medium | Medium | Keep strict required core fields plus optional extension block. |
| Claim registry overhead slows authoring | Medium | Medium | Limit mandatory citation IDs to top load-bearing numeric claims first. |
| Weekly learning enforcement becomes box-ticking | Medium | Medium | Add quality rubric and require direct linkage to changed plan/forecast fields. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve authority boundaries: stage order remains in `loop-spec.yaml`; S10 authority remains with weekly KPCS prompt contract.
  - Reuse artifact-registry linting model for new compile checks.
- Rollout/rollback expectations:
  - Rollout via phased gate strictness and migration checklist.
  - Rollback by toggling contradiction/status checks to warn-only mode.
- Observability expectations:
  - Compile report must emit per-business check results and blocking reasons.
  - Weekly report should track contradiction count, unresolved blocker count, and learning-entry completeness.

## Suggested Task Seeds (Non-binding)
1. Define and publish canonical briefing artifact schema + lint checks (P0.1).
2. Introduce canonical outcome contract artifact path and migrate HEAD references (P0.2).
3. Add T1 Decision Register section contract and renderer (P0.3).
4. Implement contradiction checker for channel/ICP/pricing/confidence fields (P0.4).
5. Normalize lifecycle status taxonomy and map legacy labels (`Resolved`, mixed lock/freeze usage) (P0.5).
6. Implement strict T1 operator card layout with gate state, blockers, and 72h plan (P1.1).
7. Add canonical Blockers and Unknowns aggregation table with IDs/owners/due dates (P1.2).
8. Add priors summary + diff renderer and move raw priors JSON to appendix (P1.3).
9. Introduce claim registry with citation IDs for top load-bearing numeric claims (P1.4).
10. Extend S10 weekly prompt contract with mandatory learning payload and validation (P1.5).
11. Add analytics instrumentation spec artifact and enforce linkage from backlog/gates (P2.1/P2.2).
12. Add brand dossier rendering rule for non-Active status (summary-only in operator layers) (P2.3).

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-sequence` for dependency-safe task ordering
  - `lp-do-replan` if confidence drops below gating thresholds during implementation
- Deliverable acceptance package:
  - Schema lint blocks metadata contamination and missing required fields.
  - Canonical outcome contract is singular and referenced from derivative artifacts.
  - Contradictions on P0 fields are surfaced deterministically (configured severity).
  - T1 operator card includes gate status, blockers, next 72h actions, and decision register.
  - Learning payload exists in weekly decision output or explicit no-test rationale is present.
- Post-delivery measurement plan:
  - Track per-run contradiction count and unresolved blocker count.
  - Track weekly learning payload completeness.
  - Track operator-reported time-to-decision for T1 review (before/after baseline).

## Evidence Gap Review
### Gaps Addressed
- Verified all major operator feedback points with concrete repository evidence.
- Traced contradictions and drift to specific source artifacts and compiled output labels.
- Mapped feedback into explicit P0/P1/P2 hardening requirements suitable for planning.

### Confidence Adjustments
- Increased confidence on metadata contamination and contradiction findings after direct file-level verification.
- Reduced testability confidence to 78% because usability gains require at least one live weekly cycle to validate.

### Remaining Assumptions
- Compiler/lint ownership and code location are not yet locked in this run.
- Severity mode for contradiction checks (hard-fail vs conflict-banner) is not yet decided.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning kickoff (open questions can be resolved during planning as explicit decisions).
- Recommended next step:
  - `/lp-do-plan` on `startup-loop-briefing-feedback-loop` to sequence P0 first, then P1, then P2.
