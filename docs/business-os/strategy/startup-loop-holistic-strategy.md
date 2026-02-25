---
Type: Strategy
Status: Draft
Domain: Venture-Studio / Startup-Loop
Created: 2026-02-24
Updated: 2026-02-24
Last-reviewed: 2026-02-24
Owner: Pete
Audience: Operator
---

# Startup Loop Holistic Strategy (2026-2033)

## 1) Purpose

Define how Startup Loop evolves from a decision-support workflow into an internal autonomous operating system that can launch, grow, and run businesses end to end, with human governance at policy and capital boundaries.

## 2) Strategic Position (Current)

Startup Loop already provides a strong foundation:

1. Canonical stage graph with explicit gates and join barriers.
2. Two-layer architecture separating standing intelligence from implementation loops.
3. Repeatable weekly decision cadence (`Continue`, `Pivot`, `Scale`, `Kill`).
4. Growing contract discipline around artifacts and stage transitions.

Current ceiling:

1. Most value is still concentrated in orchestration and decision support.
2. Many execution domains remain semi-manual across deployment and operations.
3. Day-to-day business control is not yet exception-driven.

## 3) Scope and Non-Goal

### In scope

1. Internal venture studio capability.
2. End-to-end business deployment automation.
3. Continuous growth and operations automation.
4. Day-to-day operations oversight by machine with human exception handling.

### Explicit non-goal

1. Productizing Startup Loop as an external platform for other operators/studios.

## 4) Strategic Thesis

Startup Loop can become a venture operating layer if it is built around four truths:

1. **Policy-bounded autonomy beats full manual control.** The system should act by default inside clear risk and spend limits.
2. **Closed-loop learning compounds only with high-fidelity evidence.** Every action must write back to shared memory and measured outcomes.
3. **Operations quality determines scale quality.** Growth automation without operations automation creates fragile businesses.
4. **Deterministic by default; agentic where uncertainty is intrinsic and reversible.** High-impact, irreversible paths stay deterministic and policy-gated.

## 4A) Priority Order (2026-2027)

Immediate build priority is operations-first:

1. **Operational deployment automation** (go-live reliability, launch readiness, post-launch stability).
2. **Continuous improvement of deployed offering** (always-on offer, UX, pricing, and content/service iteration after launch).
3. **Customer operations automation** (support triage, draft/reply workflows, knowledge-grounded service responses, SLA routing).
4. **Decision-science deepening** as an enabling layer for 1-3, not the primary workstream.

## 4B) Immediate Program (Next 90 Days)

### Track A: Deployment Reliability

1. Standardize launch packets and launch QA evidence for every new deployment.
2. Enforce post-launch verification windows (for example day-1, day-7, day-14 checks).
3. Reduce failed or unstable launches by converting known regressions into automated checks.

### Track B: Continuous Improvement of Live Offerings

1. Run weekly live-offering improvement cycles for copy, offer packaging, conversion flow, and channel landing surfaces.
2. Require each cycle to ship at least one production change on an already-live offering.
3. Build a repeatable improvement backlog from weekly signals and support feedback.

### Track C: Support Operations Automation

1. Expand inbox automation from triage/drafting into end-to-end resolution for routine requests.
2. Increase knowledge-grounded response coverage so fewer tickets require manual drafting.
3. Add explicit escalation classes (`legal`, `refund`, `high-value complaint`, `uncertain policy`) for human handling.

## 5) Horizon Model

| Horizon | Timeframe | Strategic Form | What Startup Loop Can Do | Human Role |
|---|---|---|---|---|
| H1 | 0-18 months | Autonomous deployment engine | Stand up ventures from intake to launch-ready state with policy-gated execution | Approve legal commitments, payment rails, budget envelopes, and brand-critical changes |
| H2 | 18-36 months | Semi-autonomous growth operator | Run always-on growth, pricing, and channel optimization loops with bounded reallocation | Set strategy, adjust policy, handle material exceptions |
| H3 | 3-7 years | Autonomous operating layer | Operate businesses day to day across growth, service, ops, and cash controls with exception routing | Board-level governance: capital allocation, risk acceptance, crisis intervention |

## 6) Three-Plane Architecture (Control, Data, Execution)

Startup Loop should be developed as three explicit planes:

1. **Control plane:** policy, permissions, approvals, risk/spend envelopes, escalation ownership.
2. **Data plane:** instrumentation, metric SLOs, denominator validity checks, standing intelligence, replayable evidence.
3. **Execution plane:** deterministic automations and agentic modules that perform actions through governed tool contracts.

Build order rule:

1. Control and data contracts must exist before expanding execution authority.
2. Any new execution capability must declare which control and data contracts it depends on.

## 7) Policy System Specification

Policy is a machine-enforced control system, not prose.

### 7.1) Minimum policy object schema

Each policy object must include:

1. `scope`: venture, function, tool, and action class.
2. `limits`: spend caps, risk thresholds, data-scope limits, rate limits.
3. `preconditions`: metric SLO pass requirements and confidence thresholds.
4. `escalation`: severity routing target, response SLA, fallback action.
5. `expiry`: TTL and mandatory review date.
6. `version`: immutable version identifier for audit linkage.

### 7.2) Policy authority model

1. **Propose:** domain owner or operator delegate.
2. **Approve:** policy authority (operator or delegated governance role).
3. **Deploy:** automated pipeline with policy linting, staging checks, and canary rollout.
4. **Emergency override:** time-boxed override with auto-expiry and mandatory post-incident review.

### 7.3) Policy change workflow

1. Policy changes are treated as governed configuration.
2. Changes follow the same promotion path as code: validate -> stage -> canary -> promote.
3. Runtime actions must always reference `policy_version` in the event ledger.

## 8) Event Ledger Contract (First-Class Product)

The event ledger is the source of truth for what happened, why, and under which policy.

### 8.1) Required event types

1. `decision`
2. `action_attempt`
3. `action_commit`
4. `rollback`
5. `exception`
6. `policy_violation`
7. `metric_snapshot`

### 8.2) Required fields per event

1. `venture_id`
2. `event_type`
3. `actor_type` (`human` or `agent`)
4. `actor_id`
5. `tool`
6. `payload_hash`
7. `preconditions`
8. `outcome`
9. `timestamp_utc`
10. `correlation_id`
11. `policy_version`
12. `model_id` and `model_version` when model-backed

### 8.3) Ledger properties

1. Append-only immutability.
2. Retention policy by event class and regulatory boundary.
3. Replayability for decision reconstruction and regression debugging.
4. Coverage target: every material action must have linked `action_attempt` and `action_commit` or `rollback`.

## 9) Measurement SLO and Denominator Validity Standard

### 9.1) Denominator validity definition

A metric is decision-eligible only if denominator assumptions are valid.

Examples:

1. Conversion rate valid only when attribution coverage is above threshold.
2. CAC valid only when spend ingestion completeness is above threshold.
3. Churn valid only when cohort definitions are stable and billing events are reconciled.

### 9.2) Measurement SLO contract

Each key metric must declare SLOs for:

1. Freshness.
2. Completeness.
3. Accuracy tolerance.
4. Attribution coverage.
5. Schema stability.

### 9.3) Decision dependency rule

1. Decisions requiring a metric can execute only if that metric's SLO status is `pass`.
2. If SLO is `fail`, route to data-repair loop or exception queue.
3. Every metric has an explicit owner accountable for SLO compliance.

## 10) Execution Safety Model

### 10.1) Action classes

1. **Reversible actions:** can be safely undone within defined window.
2. **Irreversible actions:** money movement, legal commitments, destructive mutations, sensitive customer commitments.

### 10.2) Safety requirements

1. Idempotency key required for all write actions.
2. Transaction boundary declared for every multi-step mutation.
3. Compensation action defined for each reversible class.
4. Irreversible classes require explicit human approval or dual-control policy.

### 10.3) Permissions and sandboxing

1. Least privilege credentials per venture and per tool.
2. Tool actions scoped to policy-approved action classes.
3. Secrets are isolated per venture, rotated on schedule, and never shared across venture contexts.

## 11) Multi-Venture Operating Boundaries

### 11.1) Venture boundary definition

Each venture boundary includes:

1. Identity and auth space.
2. Secrets and credential vault partition.
3. Billing and spend accounts.
4. Ad/platform accounts.
5. Domains and launch surfaces.
6. Customer and operational data.

### 11.2) Global vs venture-scoped artifacts

1. **Global:** execution framework, policy engine, shared model infrastructure, generalized playbooks.
2. **Venture-scoped:** customer data, spend controls, business policies, sensitive logs, exception history.

### 11.3) Cross-venture learning rule

1. Share abstracted priors and pattern-level insights.
2. Never leak raw sensitive venture data across boundaries.
3. Apply per-venture policy overrides even when using pooled learning.

## 12) Escalation and Reliability Operating Model

### 12.1) Severity classes and response targets

1. `S0` existential or legal-critical: immediate page, continuous response until contained.
2. `S1` material business impact: rapid page, same-day containment.
3. `S2` degraded performance: queued response within operating day.
4. `S3` low-impact issue: backlog triage.

### 12.2) Routing model

1. Operator: capital, legal, ethics, and brand-critical decisions.
2. Domain owner: function-specific incidents and policy exceptions.
3. Compliance/legal route: regulated or contractual risk path.

### 12.3) Human-unavailable default behavior

1. Freeze spend expansion.
2. Pause irreversible autonomous actions.
3. Continue reversible low-risk actions within existing envelopes.
4. Degrade gracefully to safe state with full event logging.

## 13) Phase Roadmap (Operations-First)

Each phase has required Definition of Done (DoD) and explicit failure/rollback triggers.

### Phase 1: Deployment Operating System (H1)

Primary initiatives:

1. Define one runtime contract covering artifact schema, action schema, policy schema, and ledger schema.
2. Automate venture deployment from approved offer to production-ready launch stack.
3. Auto-generate launch packs with mandatory human review for brand-critical and legal-critical assets.

DoD:

1. Deployment automation is repeatable across at least three ventures with stable checklist pass rates.
2. Post-launch verification windows are executed automatically (`day-1`, `day-7`, `day-14`).
3. Launch failures from known regressions are blocked pre-release.

Failure triggers and rollback:

1. Repeated launch regressions above threshold trigger rollback to prior stable release path.
2. Missing launch evidence blocks promotion.

### Phase 2: Continuous Deployed-Offer Improvement (H1->H2)

Primary initiatives:

1. Run weekly post-launch improvement cycles for conversion, pricing, messaging, and service content.
2. Convert weekly decision outputs into deterministic backlog execution on live surfaces.
3. Standardize improvement experiment templates with denominator-valid metric gates.

DoD:

1. Every live venture ships at least one scoped improvement per cycle.
2. Improvement outcomes are logged with decision rationale and measured deltas.
3. Backlog generation is signal-driven, not ad hoc.

Failure triggers and rollback:

1. If reversal rate exceeds threshold, reduce autonomy and return to assisted mode.
2. If metric SLO failures persist, suspend optimization actions and enter data-repair mode.

### Phase 3: Customer Operations Automation (H1->H2)

Primary initiatives:

1. Automate support triage, classification, and response generation with policy-safe quality gates.
2. Expand knowledge-grounded coverage for routine support intents.
3. Route complex/high-risk cases with full context packs.
4. Enforce refund/credit guardrail: no autonomous refund or credit above policy threshold without approval.

DoD:

1. Routine support intents meet automation coverage and SLA targets.
2. Escalations are severity-tagged and routed correctly.
3. Quality review shows stable customer-safe response quality.

Failure triggers and rollback:

1. Spike in customer harm indicators or legal-risk flags triggers immediate autonomy reduction.
2. Hallucination or policy-violating response events above threshold force fallback to draft-only mode.

### Phase 4: Growth and Revenue Automation (H2)

Primary initiatives:

1. Add bounded autonomous budget, channel, and offer adjustments.
2. Restrict reallocations to spend envelopes, SLO-pass windows, and reversible time windows.
3. Integrate experimentation and constrained allocation engines into live operations.

DoD:

1. Reallocation actions stay within policy envelopes with audited justification.
2. Shadow-mode uplift is demonstrated before full activation.
3. False-positive action rate is below defined threshold.

Failure triggers and rollback:

1. Budget or brand-risk policy breaches trigger automatic rollback and escalation.
2. Sustained underperformance versus holdout triggers envelope reduction.

### Phase 5: Cash and Risk Automation (H2->H3)

Primary initiatives:

1. Automate controls for unit economics, leakage, refund/cancellation patterns, and anomaly response.
2. Enforce compliance checks before sensitive actions.
3. Run continuous risk scoring per venture and initiative.

DoD:

1. High-severity leakage and anomaly events are detected and contained within target windows.
2. Risk controls are linked to policy actions and visible in weekly governance packets.
3. Cash loop metrics meet sustained stability thresholds.

Failure triggers and rollback:

1. Undetected high-impact leakage post-mortem triggers tighter policy thresholds and rollout pause.
2. Repeated false alarms above threshold trigger model recalibration and temporary manual review.

### Phase 6: Autonomous Day-to-Day Operations by Exception (H3)

Primary initiatives:

1. Run core business functions continuously with policy-bounded authority.
2. Route only material exceptions and strategic forks to operators.
3. Maintain full replayable auditability for every autonomous decision and mutation.

DoD:

1. Core loops remain stable without daily manual orchestration.
2. Exception queue remains low and severity-weighted burden is within threshold.
3. On-call and incident response function without operator wakefulness as a dependency.

Failure triggers and rollback:

1. Rising high-severity incidents trigger controlled step-down to prior autonomy tier.
2. Policy drift or audit gaps trigger change freeze until corrected.

## 14) Functional Autonomy Targets

| Function | H1 Target | H2 Target | H3 Target |
|---|---|---|---|
| Venture design | Structured intake -> offer -> forecast -> channel plan automation | Rapid scenario generation and strategy adaptation from live signals | Continuous strategy refresh from market and internal performance shifts |
| Launch deployment | Automated launch checklists, assets, and measurement setup | Auto-remediation for common launch regressions | Self-healing launch and relaunch flows |
| Growth execution | Guided experiments with bounded auto-actions | Autonomous experiment portfolio and channel rebalancing | Fully continuous growth engine with policy-level supervision |
| Customer operations | Drafting and triage automation | Multi-channel service orchestration by intent/severity | End-to-end service operation with human escalation only on high-impact cases |
| Delivery/fulfillment operations | Structured SOP execution support | Automated planning and exception flags | Closed-loop autonomous operations with throughput/cost optimization |
| Financial operations | Baseline KPI and anomaly visibility | Automated cash and margin guardrails with interventions | Continuous capital efficiency optimization under governance policy |
| Risk and compliance | Rules documented and enforced at key gates | Policy checks embedded in execution paths | Continuous compliance monitoring with proactive containment |

## 15) Operating Model End State

Startup Loop should run five continuous loops per business:

1. **Demand loop:** acquisition, conversion, retention.
2. **Delivery loop:** production/fulfillment/service reliability.
3. **Customer loop:** support quality, response speed, satisfaction outcomes.
4. **Cash loop:** margin, cash velocity, leakage control.
5. **Risk loop:** compliance, data quality, operational anomaly containment.

Each loop writes to shared standing intelligence, updates confidence, and feeds the next cycle's action set automatically.

## 16) Human Authority Boundaries (Persistent)

These remain human-governed even at H3:

1. Net-new legal obligations and contracts.
2. Material budget envelope changes and capital allocation decisions.
3. Brand, ethics, and sensitive customer-policy decisions.
4. Crisis actions with significant downside risk.

## 17) Progress Gates Between Horizons

### H1 -> H2 gate

1. Deployment automation is repeatable across multiple ventures with stable quality.
2. Rollback paths exist and are exercised for top action classes.
3. Ledger completeness target is met for material actions.
4. Post-launch improvement cadence is continuous and measurable on live offerings.
5. Support automation handles routine customer operations within SLA and quality targets.
6. Shadow mode runs for growth/ops recommendations show positive signal with controlled false positives.
7. Exception queue is manageable and does not hide systematic failures.

### H2 -> H3 gate

1. Growth and operations loops sustain performance without daily manual orchestration.
2. Financial and risk guardrails intervene early enough to prevent material failures.
3. Policy and runtime changes pass canary and evaluation gates before broad rollout.
4. Security baseline is proven: per-venture isolation, least privilege, secrets rotation, incident drills.
5. On-call incident response works end to end without operator wakefulness dependency.
6. Audit trail supports root-cause analysis and governance review at decision granularity.

## 18) North-Star Metrics (Operational Definitions)

1. **Deployment lead time:** median elapsed time from approved offer to stable production launch.
2. **Post-launch improvement velocity:** shipped improvement cycles per live offering per month.
3. **Support automation coverage:** routine inbound support resolutions completed without manual drafting.
4. **Support SLA reliability:** percentage of inquiries resolved within SLA window.
5. **Autonomy coverage ratio:** impact-weighted autonomous actions divided by impact-weighted eligible actions.
6. **Exception burden:** severity-weighted exception count per 1,000 autonomous actions.
7. **Action correctness rate:** `1 - reversal_rate`, where reversal captures rollbacks due to incorrect or harmful actions.
8. **Policy violation attempt rate:** blocked or detected policy-violating attempts per 1,000 autonomous actions.
9. **Signal integrity rate:** share of decision-critical metrics in SLO `pass` state when decisions were executed.
10. **Operating resilience:** share of operating hours without uncontained `S0/S1` incidents and without critical policy breaches.

## 19) Quantitative Decision Contracts (Hard Science Layer)

All major decisions should move from qualitative labels to explicit statistical gates.
This layer is an enabler for deployment/support/growth operations, not the primary near-term delivery stream.

### Required decision gates

1. **Scale gate**
   - Require denominator validity pass plus `blocking_confidence >= 0.8`.
   - Require uncertainty-aware upside: `P(lift > 0) >= 0.8`.
   - Require downside control: lower bound of 90-day interval above defined loss floor.
2. **Hold gate**
   - Trigger when evidence is directional but not decisive (`0.4 <= P(lift > 0) < 0.8`) or denominator validity is partial.
3. **Kill/Pivot gate**
   - Trigger when `P(target attainment) <= 0.2` and downside risk remains above cap for two consecutive cycles.
4. **Replan gate**
   - Trigger on persistent constraints plus statistical anomaly persistence, not single-point misses.

### Core formulas to standardize

```text
miss_higher = max(0, (target - actual) / target)
miss_lower  = max(0, (actual - target) / target)
```

```text
EV_action = P(success) * upside - (1 - P(success)) * downside - spend - effort_cost
```

```text
risk_adjusted_score = EV_action / (1 + tail_risk_penalty + compliance_penalty)
```

## 20) Existing Math Assets to Activate

Use existing repo math before introducing new dependencies.

1. **Experiment inference**
   - `@acme/lib/math/experimentation`: Bayesian A/B, always-valid inference, group-sequential boundaries, classical tests, sample-size planning.
2. **Adaptive allocation**
   - `@acme/lib/math/experimentation/thompson-sampling`: bounded exploration/exploitation for channel, creative, and offer allocation.
3. **Forecasting with uncertainty**
   - `@acme/lib/math/forecasting`: Holt-Winters, model selection (AIC/BIC), parameter optimization, prediction intervals.
4. **Risk and anomaly**
   - Startup-loop anomaly detector already uses EWMA + z-score; extend this to seasonal residual monitoring and persistence rules.
5. **Operational tail-risk**
   - `@acme/lib/math/probabilistic/t-digest`: p95/p99 latency and service-tail tracking with bounded memory.
6. **Current growth guardrails**
   - `packages/lib/src/growth/*`: denominator-aware thresholds, blocking modes, deterministic guardrail signals.

## 21) Priority Quant Upgrades

### Q1: Replace heuristic learning updates with effect-size updates

Current learning updates apply fixed confidence deltas by verdict/confidence bucket. Replace with posterior updates driven by observed effect sizes and interval width.

### Q2: Upgrade deterministic thresholds to uncertainty-aware thresholds

Current growth thresholds are static constants. Add profile/season-aware threshold sets and confidence-adjusted decision rules.

### Q3: Add sequential decisioning to weekly experimentation

Wire always-valid or group-sequential tests into weekly experiment reads so continuous monitoring does not inflate false positives.

### Q4: Add constrained bandit allocation

Use Thompson sampling with explicit risk caps and minimum exploration floors for paid channel and creative allocation.

### Q5: Add seasonal anomaly and change-point detection

Move from raw EWMA/z-score on aggregates to seasonal baseline residuals plus persistence checks to reduce false alarms and improve early warning.

### Q6: Add portfolio-level Bayesian pooling

Share strength across businesses for sparse-signal metrics (for example early-stage CVR/CAC) while preserving business-level posteriors for decisions.

## 22) Agent Evaluation and Release Process

1. Maintain offline evaluation sets by function (`deployment`, `support`, `growth`, `risk`).
2. Run regression evaluation on every prompt, model, or policy change affecting autonomous behavior.
3. Require shadow mode before active authority for new action classes.
4. Promote by staged rollout and canary success criteria.
5. Record evaluation artifacts in release packets with explicit rollback conditions.

## 23) Strategic Risks to Manage

1. **Over-automation risk:** automation outruns policy and control maturity.
2. **Signal-quality risk:** poor instrumentation drives confident but wrong actions.
3. **Tooling and integration fragility:** vendor APIs, permissions, and schemas drift.
4. **Model behavior drift:** model or prompt changes alter behavior and quality.
5. **Adversarial input risk:** prompt injection and manipulation in customer-facing channels.
6. **Automation debt accumulation:** patchwork exceptions create hidden couplings and fragility.
7. **Governance drift risk:** undocumented exceptions silently become normal behavior.
8. **Autonomy unit-economics risk:** inference/automation cost outgrows delivered value.

## 24) Math and Governance Requirements

1. Every model-backed decision must emit model identifier/version, input data window, probability outputs, and threshold crossed.
2. Every automated action must be reproducible from the audit trail.
3. Every promoted model contract must include backtest quality, false-positive cost, and rollback criteria.
4. Every policy or model change must declare expected impact and post-release validation checks.

## 25) Alignment to Existing Startup Loop Contracts

This strategy builds on existing authorities:

1. Stage graph and ordering: `docs/business-os/startup-loop/loop-spec.yaml`
2. Two-layer model: `docs/business-os/startup-loop/two-layer-model.md`
3. Operator workflow baseline: `docs/business-os/startup-loop-workflow.user.md`
4. System upgrade rationale: `docs/business-os/startup-loop-current-vs-proposed.user.md`

## 26) Strategy Statement

Startup Loop's long-term role is to become the internal system that can repeatedly create and operate businesses with machine-speed execution and human-level governance discipline, while keeping strategic control, capital authority, and risk ownership with the operator.
