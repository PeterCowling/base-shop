---
Type: Briefing
Status: Active
Domain: Startup-Loop / Prioritization
Date: 2026-02-26
Owner: Peter + AI agents
Audience: External expert reviewer
Revision: v2 (post expert decision)
Audit-Ref: working-tree
Audit-Head: dd981d25ccfea2552c4fc70357fd18395b096550
---

# Post-Build Reflection Prioritization (External Expert Brief, v2)

## 1) Purpose

This document defines a deterministic, auditable prioritization policy for post-build reflection ideas.

It incorporates operator-provided external expert review feedback (2026-02-26) and is structured so reviewers and operators can evaluate policy quality without repository access.

## 2) Decision Status

External decision (operator-provided, 2026-02-26): **Revise (close to approve)**.

Policy can be treated as canonical after five fixes are enforced:
- Single-source encoding of P1 proximity (no dual encoding).
- Prerequisite ordering inheritance (`effective_priority_rank`).
- Deterministic U0 expedite lane.
- Revised tier order with `P1M` above `P1-N`/`P1-I`.
- Evidence-gated tier/urgency assignment with auto-demotion.

This v2 applies those fixes.

## 3) System Context

Reflection ideas are captured after build completion and currently aggregate into process-improvement feeds (idea/risk/pending-review lists). This policy defines the deterministic ranked queue contract to be implemented.

Core requirement: report generation must not invent priorities opportunistically.

Required behavior:
1. Read ideas from reflection artifacts.
2. Classify via published rules only.
3. Order deterministically.
4. Keep source backlink for audit trail.

## 4) Canonical Idea Schema

## 4.1 Required identity/source fields

- `idea_id` (stable string)
- `title`
- `source_path`
- `source_excerpt`
- `created_at`

## 4.2 Required classification fields

- `priority_tier`: `P0 | P0R | P1 | P1M | P2 | P3 | P4 | P5`
- `proximity`: `Direct | Near | Indirect | null`
  - Required when `priority_tier == P1`
  - Must be `null` for non-`P1` tiers
- `urgency`: `U0 | U1 | U2 | U3`
- `effort`: `XS | S | M | L | XL`
- `reason_code` (rule that fired)

## 4.3 Required prerequisite fields

- `parent_idea_id` (nullable)
- `is_prerequisite` (boolean)
- `effective_priority_rank` (computed integer)

Computation rule:
- If `is_prerequisite == true` and `parent_idea_id` exists, then `effective_priority_rank = parent.effective_priority_rank`.
- Else `effective_priority_rank = own_priority_rank`.

This keeps measurement/enablement semantics intact while ordering blockers correctly.

## 4.4 Required evidence/governance fields

- `classified_by`
- `classified_at`
- `status`: `open | queued | in_progress | actioned | deferred | rejected`

Evidence fields (used for admission and anti-gaming):
- `incident_id` (nullable)
- `deadline_date` (nullable, ISO date)
- `repro_ref` (nullable, logs/test steps/trace)
- `leakage_estimate_value` (nullable number)
- `leakage_estimate_unit` (nullable string, e.g. `USD/day`, `failures/day`)
- `first_observed_at` (nullable datetime)
- `risk_vector` (nullable: `legal | safety | security | privacy | compliance`)
- `risk_ref` (nullable)
- `failure_metric` (nullable)
- `baseline_value` (nullable)
- `funnel_step` (nullable: `pricing_view | checkout_start | payment | confirmation`)
- `metric_name` (nullable)

## 5) Classification Decision Tree (Single Allowed Path)

Apply rules in this order; first match wins:

1. If legal/safety/security/privacy/compliance exposure -> `P0`
2. Else if revenue-path or fulfillment reliability is broken, or data loss exists -> `P0R`
3. Else if short causal chain to sales is explicit -> `P1` (+ required `proximity`)
4. Else if per-transaction margin leakage/loss reduction -> `P1M`
5. Else if operator intervention/exception volume reduction -> `P2`
6. Else if measurement correctness/attribution/experiment hygiene -> `P3`
7. Else if startup-loop process/throughput/determinism quality -> `P4`
8. Else -> `P5`

Notes:
- `P0` always supersedes all other tiers.
- Reliability leaks (`P0R`) supersede growth optimization.

## 6) Tier and Rank Policy

## 6.1 Tier display order (report grouping)

`P0, P0R, P1, P1M, P2, P3, P4, P5`

Within `P1` display groups, show `Direct`, `Near`, `Indirect`.

## 6.2 Own priority rank mapping (ordering base)

1. `P0`
2. `P0R`
3. `P1` + `Direct`
4. `P1M`
5. `P1` + `Near`
6. `P1` + `Indirect`
7. `P2`
8. `P3`
9. `P4`
10. `P5`

## 6.3 Rank mappings

- Urgency: `U0` > `U1` > `U2` > `U3`
- Effort: `XS` > `S` > `M` > `L` > `XL`
- Tie-breakers: `created_at` (earlier first), then `idea_id` lexical

## 7) Queue Ordering (Execution)

Queue order is deterministic and separate from report grouping.

Sort key:
`(is_expedite, effective_priority_rank, urgency_rank, effort_rank, created_at, idea_id)`

Where:
- `is_expedite = 0` when `urgency == U0`, else `1`

This makes active incidents/deadlines surface first without discarding tier economics.

## 8) Urgency Admission Rules (Automation-Grade)

## 8.1 `U0` allowed only if at least one is true

- `incident_id` exists and incident status is `open` or `mitigated`
- `deadline_date` is within 72 hours (or next business day)
- `leakage_estimate_value` exceeds published threshold

## 8.2 `U1` allowed only if at least one is true

- Recurrence observed in last 7 days with references
- `deadline_date` within 14 days
- Explicit linked launch blocker

## 8.3 Default urgency

- If `U0`/`U1` evidence is missing, assign `U2` (or `U3` for speculative items).

## 9) Evidence-Gated Tier Assignment

## 9.1 Required evidence by high-impact class

- `P0`: requires `risk_vector` + `risk_ref`
- `P0R`: requires `incident_id` or `failure_metric` + baseline
- `P1` (`Direct`): requires `funnel_step` + `metric_name` + baseline

## 9.2 Auto-demotion rule

If required evidence is missing:
- Tier demotes to `P4` or `P5` (by content tag)
- Urgency demotes to `U2`
- `reason_code = RULE_INSUFFICIENT_EVIDENCE`

No silent overrides.

## 10) Measurement Floor Inheritance

Rule:
- Measurement work remains semantically `P3`.
- If it is a prerequisite for a higher-priority initiative, `effective_priority_rank` inherits parent rank.

Result:
- Reporting remains semantically accurate.
- Queue ordering remains executable.

## 11) Anti-Gaming Controls

1. Evidence-required classification (rules in Sections 8-9).
2. Auto-demotion on missing evidence.
3. `reason_code` must map to deterministic classifier rule.
4. `classified_by` + `classified_at` always recorded.
5. Weekly audit sample of new classifications (5-10%).
6. Distribution anomaly alerts (review trigger only):
   - if weekly share of `P1+Direct` exceeds threshold
   - if weekly share of `U0` exceeds threshold
7. U0 execution WIP cap:
   - maximum 2 concurrent `in_progress` U0 items
   - additional U0 items remain queued as U0

## 12) Rollout Plan

1. Advisory phase (2 weeks):
- Generate classification/rank outputs without gating.

2. Calibration phase (2-4 cycles):
- Adjust only rule text and thresholds, not per-item manual reranks.

3. Backlog normalization pass:
- Reclassify current backlog under this schema before enforcement.

4. Enforcement phase:
- Fail generation/gates when required fields are missing.
- Enforce deterministic ordering.

5. Audit phase (monthly):
- Tier distribution
- Demotion rate due to insufficient evidence
- Outcome yield by tier

## 13) Canonicality Gate

This policy is canonical only when all are true:
- Single-source proximity encoding (`P1` + proximity field only)
- Prerequisite inheritance implemented
- U0 expedite lane active
- Evidence gates + auto-demotion active
- Audit fields persisted and reviewed

## 14) Decision Request

Requested reviewer confirmation:
- Approve this v2 as canonical policy, or
- Return exact change requests against named sections/fields.
