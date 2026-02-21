---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-marketing-sales-capability-gap-audit
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan
Related-Plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Marketing/Sales Capability Gap Audit - Fact-Find Brief

## Scope

### Summary

Audit the startup-loop implementation for marketing and sales capability completeness, not only gate/contract coherence. This brief defines a canonical capability taxonomy, maps capability contracts end-to-end, and identifies where current stages/templates cannot yet produce decision-grade marketing or sales execution.

### Goals

- Define the minimum canonical marketing/sales capability set required by the startup loop.
- Map each capability to required artifacts/data, owner, stage/gate, validation rule, and downstream consumers.
- Quantify current S6B deadlock/slowdown evidence from available stage-status artifacts.
- Produce a planning-grade artifact contract matrix (producer/consumer path + schema/version + validation).
- Specify an explicit pre-website Demand Evidence Pack schema.
- Specify forecast sparse-evidence guardrails and weekly decision-validity rules.

### Non-goals

- Implementing stage/skill/template changes in this fact-find.
- Rewriting current business strategy artifacts (HEAD/PET/BRIK docs).
- Building new external connectors or analytics integrations.
- Internal validation/lint/test tooling is in-scope for planning.

## Canonical Capability Definition

### Minimum capability taxonomy

| Capability bucket | Operational definition | Minimum output expectation |
|---|---|---|
| Positioning and ICP | Who we sell to, why now, and what they switch from | ICP + positioning + switching trigger evidence |
| Message testing | Tested message variants by channel/audience with outcomes | Variant log + denominator + win/lose notes |
| Offer mechanics | Pricing/packaging/guarantees/risk reversal tied to objections | Offer mechanics map with objection handling |
| Channel strategy | Ranked channels with constraints and test budget/timebox | Channel plan with viability constraints |
| Sales ops | Pipeline stages, speed-to-lead, follow-up loops, objection handling | Stage conversion + response-time loop |
| Lifecycle and retention | Repeat/referral/LTV drivers and churn/cancel reasons | Retention lever map + repeat/referral baseline |
| Measurement and inference | Denominator-aware signal, uncertainty bounds, guardrails | Decision validity check + confidence-limited actions |

### Capability contract map (current-state coverage)

| Capability | Required artifacts/data | Owner | Stage/gate anchor | Validation rule | Downstream consumers | Current coverage |
|---|---|---|---|---|---|---|
| Positioning and ICP | Offer artifact (ICP, positioning, objections) | `lp-offer` + operator | `S2B` | Offer sections complete and sourced | `lp-channels`, `lp-forecast`, `lp-seo` | Partial |
| Message testing | Message variant log + source-tagged outcomes | Operator + `S1/S1B` prompt templates | `S1`, `S1B`, pre-`S6B` | Variant count + denominators + timestamps present | `S2B`, `S6B`, `S10` | Missing as first-class contract |
| Offer mechanics | Price/packaging/guarantee hypotheses + objection map | `lp-offer` | `S2B` | Pricing hypothesis includes confidence + validation plan | `S3`, `S6B`, `S10` | Partial |
| Channel strategy | Channel fit scoring + constraints + 30-day plan | `lp-channels` | `S6B` | Channel viability constraints and stop conditions documented | `S3`, `S4`, `S10` | Partial |
| Sales ops | Speed-to-lead, stage conversion, follow-up loop | Operator + templates | Between `S6B` and `S10` | Stage conversion and response-time denominators present | Weekly decisions + bottleneck diagnosis | Missing |
| Lifecycle and retention | Repeat/referral/cancel/refund drivers | Operator + weekly loop | `S10` | Lifecycle metrics included with denominators | Forecast recalibration + prioritization | Missing |
| Measurement and inference | Measurement verification + denominator checks + uncertainty | `lp-measure`, `S10` template | `GATE-MEAS-01`, `S10` | Explicit denominator and uncertainty pass/fail checks | Scale/kill decisions | Partial |

## Evidence Audit (Current State)

### Entry points

- `docs/business-os/startup-loop/loop-spec.yaml` - canonical stage graph and stage ordering.
- `.claude/skills/startup-loop/SKILL.md` - runtime gate behavior including `GATE-MEAS-01`.
- `docs/business-os/startup-loop-workflow.user.md` - per-business stage-status and current blockers.

### Key modules/files

- `.claude/skills/lp-readiness/SKILL.md` - lightweight readiness posture.
- `.claude/skills/lp-offer/SKILL.md` - offer contract and path.
- `.claude/skills/lp-channels/SKILL.md` - channel contract and path.
- `.claude/skills/lp-forecast/SKILL.md` - sparse-evidence forecast behavior and paths.
- `.claude/skills/lp-seo/SKILL.md` - SEO consumer paths for upstream artifacts.
- `.claude/skills/lp-measure/SKILL.md` - measurement bootstrap scope (infra-centric).
- `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md` - S1B template requirements.
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` - weekly decision memo contract.
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` - bottleneck metric catalog.

### Patterns and conventions observed

- `GATE-MEAS-01` is hard and currently prevents S6B start until decision-grade measurement proof exists.
  - Evidence: `.claude/skills/startup-loop/SKILL.md:291`, `.claude/skills/startup-loop/SKILL.md:301`
- Current guidance frames this as always-required for S6B, but does not split strategy design from spend authorization.
  - Evidence: `.claude/skills/startup-loop/SKILL.md:294`, `.claude/skills/startup-loop/SKILL.md:299`
- Upstream/downstream artifact paths are inconsistent across skills.
  - Evidence: `.claude/skills/lp-offer/SKILL.md:26`, `.claude/skills/lp-channels/SKILL.md:29`, `.claude/skills/lp-forecast/SKILL.md:47`, `.claude/skills/lp-seo/SKILL.md:47`
- Forecast explicitly allows low-confidence assumptions when evidence is sparse.
  - Evidence: `.claude/skills/lp-forecast/SKILL.md:39`, `.claude/skills/lp-forecast/SKILL.md:168`
- Weekly decision template requires KPI deltas but no denominator sufficiency or uncertainty gate.
  - Evidence: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md:27`
- Bottleneck schema metric catalog is limited to six core metrics and lacks sales-ops/lifecycle first-class metrics.
  - Evidence: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md:22`

## Deadlock Quantification Snapshot (as-of 2026-02-17)

> **TASK-01 evidence added 2026-02-17.** Formal deadlock table with data-source classification and attribution split. See plan TASK-01 build notes for full context.

### Observable status from current artifacts

| Business | S2 complete date | S2B status | S6B status | Measurement signal state | Min elapsed days with S6B not started |
|---|---|---|---|---|---|
| HEAD | Feb 12 | Not yet started | Not yet started | Demand/conversion baselines not measured | >=5 days |
| PET | Feb 12 | Not yet started | Not yet started | Demand/margin baselines not measured | >=5 days |
| BRIK | Feb 15 | Not yet started | Not yet started | Conversion/vitals verification still incomplete | >=2 days |

Evidence: `docs/business-os/startup-loop-workflow.user.md:128`, `docs/business-os/startup-loop-workflow.user.md:129`, `docs/business-os/startup-loop-workflow.user.md:132`, `docs/business-os/startup-loop-workflow.user.md:400`, `docs/business-os/startup-loop-workflow.user.md:420`

### Formal deadlock evidence table (business × stage × blocked_reason × days)

Date window: 2026-02-12 to 2026-02-17.

| Business | Stage | Blocked reason | Days blocked (proxy) | Data source quality |
|---|---|---|---|---|
| HEAD | S2B | Offer design not started — operational confirmations (stock, units, pricing, compatibility, payment, returns SLA) missing; no offer artifact exists | >=5 | Proxy — workflow snapshot; no `stage_blocked` event emitted |
| HEAD | S6B | S2B incomplete (no offer artifact; primary binding gate) + GATE-MEAS-01 pending (S1B measurement setup not Active) | >=5 | Proxy — workflow snapshot; no `stage_blocked` event emitted |
| PET | S2B | Offer design not started — inventory units, arrival date, and landed cost not decision-grade; no offer artifact exists | >=5 | Proxy — workflow snapshot; no `stage_blocked` event emitted |
| PET | S6B | S2B incomplete (no offer artifact; primary binding gate) + GATE-MEAS-01 pending (S1B measurement setup not Active) | >=5 | Proxy — workflow snapshot; no `stage_blocked` event emitted |
| BRIK | S2B | Offer design not started — all markets lack offer artifact despite S2 and S2A being active | >=2 | Proxy — workflow snapshot; no `stage_blocked` event emitted |
| BRIK | S6B | S2B incomplete (no offer artifact; primary binding gate) + GATE-MEAS-01 partial (begin_checkout and web_vitals verification still pending) | >=2 | Proxy — workflow snapshot; no `stage_blocked` event emitted |

### Attribution split (S6B non-start, as-of 2026-02-17)

| Cause bucket | Estimated share | Basis |
|---|---|---|
| Upstream S2B incompletion (offer artifact missing) | Primary — 100% of S6B non-starts have this as immediate binding constraint | S6B requires offer artifact; S2B not started for any business |
| GATE-MEAS-01 (measurement verification incomplete) | Secondary — present in all 3 cases but masked by S2B binding constraint | HEAD/PET: S1B not Active; BRIK: begin_checkout + web_vitals pending |
| Other causes | 0% observable | No other gap types visible in workflow snapshot |

Attribution note: shares cannot be independently decomposed without event ledger reason codes. If S2B were resolved for all businesses, GATE-MEAS-01 would become the next binding gate for HEAD and PET (S1B not Active). For BRIK, GATE-MEAS-01 would be near-pass pending GA4 verification.

### Quantification limits (explicit)

- Observed explicit `stage_blocked` events with reason code `GATE-MEAS-01`: `0` in repo snapshots (no `events.jsonl` persisted for startup-loop; only `.cache/test-governor/events.jsonl` exists for unrelated test governor tooling).
- Directly measured S6B gate-block duration by reason: unavailable.
- Leading indicator only: `3/3` businesses currently show `S6B` as not started and `3/3` show unresolved measurement/signal gaps.
- S2B non-start duration is also a leading indicator; true S6B deadlock attributable to GATE-MEAS-01 alone cannot be isolated without event ledger.

### Data source gaps and next actions

| Gap | Next action to close |
|---|---|
| No persisted `events.jsonl` for startup-loop; `stage_blocked` reason codes unavailable | Add `stage_blocked` event emission with `blocking_reason` field to startup-loop control plane (`derive-state.ts` or equivalent); canonical schema is already defined in `event-state-schema.md` |
| S2B non-start not captured as a `stage_blocked` event | Instrument S2B gate check to emit `stage_blocked` with `blocking_reason: "upstream_S2B_incomplete"` on S6B start attempts |
| Day-granularity block duration not available from proxy | Once event ledger is active, compute `days = (stage_started_timestamp - stage_blocked_timestamp)` per run |

## Artifact Contract Matrix (planning-grade)

| Skill/stage | Produces (path + schema signal) | Consumes (path + schema signal) | Required marketing/sales fields | Validation surface | Gap |
|---|---|---|---|---|---|
| `lp-offer` (`S2B`) | `docs/business-os/startup-baselines/<BIZ>-offer.md` (single-file markdown) | Readiness + strategy context | ICP, positioning, pricing hypothesis, objections | Skill self-audit only | Producer path conflicts with downstream consumers expecting dated or foldered artifacts |
| `lp-channels` (`S6B`) | `docs/business-os/startup-baselines/<BIZ>-channels.md` | `.../<BIZ>-offer.md` | Channel fit score, constraints, 30-day GTM | Skill self-audit only | Path/schema not aligned with `lp-forecast` and `lp-seo` consumers |
| `lp-forecast` (`S3`) | `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md` | `.../<BIZ>/S2-offer-hypothesis/`, `.../<BIZ>/S2-channel-selection/` | P10/P50/P90, guardrails, assumption register | Skill self-audit only | Consumer paths differ from `lp-offer` and `lp-channels` outputs |
| `lp-seo` (`S6B` companion) | `docs/business-os/strategy/<BIZ>/seo/YYYY-MM-DD-*.user.md` | `docs/business-os/strategy/<BIZ>/YYYY-MM-DD-positioning-<BIZ>.user.md`, `...-channel-strategy-<BIZ>.user.md` | Organic channel rationale, keyword journey mapping | Phase checks only | Expects dated strategy artifacts not produced by current upstream defaults |
| `S4` join barrier (`loop-spec`) | Candidate baseline + manifest | `S2B offer`, `S3 forecast`, `S6B channels` artifact keys | Offer + forecast + channel availability | Join barrier contract in `loop-spec` | Artifact keys exist, but filesystem contract is not canonicalized end-to-end |

## Findings

1. `Critical` Capability completeness is not currently encoded as a canonical contract. The system validates gates and files, but not whether core marketing/sales capabilities are actually present.
2. `Critical` S6B uses a single hard gate for both strategy design and spend readiness. This creates predictable planning drag and makes capability development path-dependent on measurement maturity.
3. `Critical` Producer/consumer artifact path contracts are inconsistent across `lp-offer`, `lp-channels`, `lp-forecast`, and `lp-seo`, reducing reliability of downstream reasoning.
4. `High` Pre-website measurement defaults are infrastructure-first and do not require a demand-signal evidence schema (message variants, intent capture, objection frequency, speed-to-lead).
5. `High` Forecasting under sparse evidence is allowed, but spend/timebox guardrails and assumption kill-triggers are not standardized.
6. `High` S10 weekly decisions have no explicit denominator/uncertainty validity rule, enabling noise-driven pivots/scales.
7. `High` Bottleneck diagnosis is not business-model aware. Hospitality and DTC need different sales-quality primitives to avoid false diagnosis.
8. `Medium` Readiness remains intentionally hypothesis-tolerant and does not enforce a minimum evidence floor for message/channel validation before downstream design work.
9. `Medium` Current monthly/quarterly refresh cadence is slow for first 4-8 weeks of launch volatility.

## Practical Capture Contracts

### Demand Evidence Pack (minimum schema)

Required prior to treating message/channel confidence as above `low`.

| Field | Type | Required | Validation rule |
|---|---|---|---|
| `hypothesis_id` | string | yes | Stable ID linked to offer/channel hypothesis |
| `capture_window` | date range | yes | Start/end timestamps present |
| `message_variants` | list | yes | >=2 variants, each with `channel`, `audience_slice`, `asset_ref`, `timestamp` |
| `denominators` | object | yes | Variant-level denominators present (`impressions` or `conversations` or `visits`) |
| `intent_events` | list | yes | Each event includes `event_type`, `source_tag`, `count`, `timestamp` |
| `objection_log` | list | yes | Verbatim objection text + frequency count; explicit `none_observed` flag if none |
| `speed_to_lead` | object | yes | `median_minutes_to_first_response` + sample size |
| `operator_notes` | text | optional | Must distinguish measured signal vs assumption |

### Demand Evidence Pack pass floor (default)

- At least 2 message variants tested per active hypothesis.
- Every variant has a denominator and source tag.
- Objection log contains either >=5 tagged objections or explicit `none_observed` with sample-size note.
- Speed-to-lead metric includes denominator and timestamped window.

### Channel viability constraints (pre-scale)

For each selected channel, require:
- Minimum viable spend or timebox.
- Minimum denominator target.
- One quality metric (not only volume).
- Explicit stop condition.
- Explicit owner and review date.

## Forecast and Weekly Decision Guardrails

### Sparse-evidence forecast control surface

| Forecast confidence tier | Max spend cap | Max operator time cap | Re-check cadence | Allowed decision class |
|---|---|---|---|---|
| `<60` (low) | 10% of planned monthly spend (or fixed micro-budget) | <=5 hours/week/channel | Every 7 days | `Continue` or `Investigate` only |
| `60-79` (medium) | 30% of planned monthly spend | <=10 hours/week/channel | Every 7 days | `Keep/Pivot/Continue`; no full `Scale` |
| `>=80` (high) | Up to planned budget | Planned operating cadence | Weekly | Full decision set including `Scale` |

### Assumption register (mandatory fields)

- `assumption_id`
- `assumption_statement`
- `prior_range`
- `sensitivity` (impact on CAC/CVR/revenue)
- `evidence_source`
- `confidence_level`
- `kill_trigger`
- `owner`
- `next_review_date`

### S10 decision validity rule (proposed defaults)

| KPI family | Minimum denominator | Additional validity check | If check fails |
|---|---|---|---|
| Traffic trend | >=200 sessions/week | 2-week directional consistency | No `Scale/Kill`; treat as directional only |
| Lead CVR | >=100 visits and >=10 leads | Relative CI width <=30% | No `Scale/Kill`; require more data |
| Booking/Purchase CVR | >=150 visits and >=8 bookings/orders | Relative CI width <=30% | No `Scale/Kill`; run next test cycle |
| CAC | >=10 attributed conversions | Attribution window stable and documented | No channel scaling decision |
| Revenue/AOV | >=10 bookings/orders | Outlier check documented | Restrict to qualitative actions |

Decision policy: if any selected KPI for the weekly call fails denominator validity, default to `no-decision` for scale/kill actions and permit only qualitative or measurement-improvement actions.

## Business-Model-Aware Bottleneck Extension

### Recommended structure

- Use one abstract bottleneck schema with profile adapters by business model.
- Add `business_model_profile` on run context (`hospitality-direct-booking`, `dtc-ecommerce`, extensible).

### Profile metrics (minimum)

| Profile | Additional first-class metrics |
|---|---|
| Hospitality direct booking | Inquiry-to-quote rate, quote-to-booking rate, median response time, direct-vs-OTA mix, cancellation reasons, review velocity |
| DTC ecommerce | Product page-to-ATC rate, checkout completion rate, CAC by cohort, refund rate, support load per 100 orders, repeat purchase rate |

## Internal Consistency Fixes Required in Planning

1. Non-goals wording should explicitly allow internal validation tooling while excluding external connector buildout.
2. S6B split must be concretely modeled. Recommended near-term approach:
   - Keep stage key `S6B`.
   - Add sub-gates:
     - `GATE-S6B-STRAT-01` (strategy design complete; allows plan artifact generation).
     - `GATE-S6B-ACT-01` (spend authorization; requires decision-grade measurement thresholds).
3. Confidence scoring must include calibration metadata, not only subjective percentages.

## Questions

### Resolved

- Q: Is this only a plumbing issue?
  - A: No. It is both contract coherence and missing capability completeness definition.

### Open (User Input Needed)

- Q: Should S6B remain one stage with split sub-gates (`S6B-STRAT`/`S6B-ACT`) or be split into explicit stage IDs (`S6A`/`S6B`)?
  - Why it matters: determines loop-spec churn and migration complexity.
  - Decision impacted: stage graph update vs gate-only update.
  - Decision owner: Pete.

- Q: Are the proposed denominator defaults acceptable as cross-business minimums, or should thresholds be profile-specific from day one?
  - Why it matters: directly controls weekly decision validity and scale gating.
  - Decision impacted: S10 template and QA checks.
  - Decision owner: Pete.

## Confidence Inputs (calibrated)

Calibration anchor: no prior closed-loop marketing/sales capability audit in this repo has tracked prediction accuracy versus realized outcomes. Confidence scores are therefore intentionally conservative.

- Implementation: 81%
  - Evidence basis: concrete file-level contracts and gate logic are observable.
  - Raise to >=90: add stage-block reason telemetry and one dry-run on HEAD/PET/BRIK.
- Approach: 79%
  - Evidence basis: capability map and control surfaces are coherent but not yet operator-tested.
  - Raise to >=90: run one live weekly decision cycle with denominator rule applied.
- Impact: 80%
  - Evidence basis: identified gaps map directly to decision quality and pacing risk.
  - Raise to >=90: demonstrate reduced no-signal decisions over two weekly cycles.
- Delivery-Readiness: 84%
  - Evidence basis: planning tasks are clear and bounded.
  - Raise to >=90: lock S6B split choice and denominator policy.
- Testability: 78%
  - Evidence basis: requires new contract tests and event telemetry not yet present.
  - Raise to >=90: implement artifact contract lint + deterministic gate simulation harness.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Strategy gate split weakens spend discipline | Medium | High | Keep spend authorization hard-gated in `GATE-S6B-ACT-01` |
| Added evidence requirements create operator overhead | Medium | Medium | Keep Demand Evidence Pack minimal and template-driven |
| Contract/path standardization introduces migration drift | Medium | Medium | Add contract matrix + lint checks and fail-closed CI |
| One-size denominator thresholds misfit business models | Medium | Medium | Add profile adapters for hospitality vs DTC thresholds |

## Suggested Task Seeds (non-binding)

1. Define and publish canonical capability contract table (capability -> artifact/data -> owner -> gate -> validation -> consumers).
2. Add stage-block reason telemetry extraction and a deadlock-duration report (`business x stage x reason x days`).
3. Implement S6B split-gate design (`GATE-S6B-STRAT-01` and `GATE-S6B-ACT-01`) with explicit acceptance criteria.
4. Create Demand Evidence Pack template/schema and enforce it in S1/S1B and pre-S6B checks.
5. Standardize artifact paths via a single artifact registry and add producer/consumer contract lint tests.
6. Add sparse-evidence forecast guardrails (spend/time caps, re-check cadence, assumption kill-triggers).
7. Add denominator and uncertainty checks to S10 weekly decision template and QA guidance.
8. Extend bottleneck diagnosis with business-model profiles and adapter metrics.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-plan`
- Supporting skills:
  - `lp-do-build`, `lp-sequence`
- Deliverable acceptance package:
  - Updated loop-spec/gate docs, capability contract registry, prompt/template updates, and contract-test coverage.
- Post-delivery measurement plan:
  - Track `stage_blocked` counts/durations by reason, no-decision rate, and weekly decision reversals for two loop cycles.

## Pending Audit Work

### Areas examined

- `loop-spec.yaml`, startup-loop gate definitions, relevant lp-* skill contracts, weekly/measurement templates, bottleneck schema, and current stage-status workflow snapshot.

### Areas not yet examinable in-repo

- Stage-event ledgers with persisted `stage_blocked` reason/duration history for direct `GATE-MEAS-01` quantification.

### Questions remaining

- What share of historical S6B delays are truly `GATE-MEAS-01` versus upstream `S2B` incompletion?
- What denominator defaults are operationally realistic per business model for weekly decisions?

### Resume entry points

- Add or expose run-level event artifacts (`events.jsonl`/stage-result history), then compute reason-coded block duration table.
- Re-run this audit section against one complete cycle for HEAD, PET, and BRIK.

### Estimated remaining scope

- ~3 data extraction tasks plus one policy decision pass.

## Planning Readiness

- Status: Ready-for-planning (with quantified telemetry task required in the first execution slice).
- Blocking items:
  - Decision on S6B stage-key approach (split stage IDs vs split gates).
  - Decision on denominator policy baseline (global defaults vs profile-specific defaults).
- Recommended next step:
  - `/lp-do-plan` to convert these contracts and guardrails into sequenced implementation tasks.
