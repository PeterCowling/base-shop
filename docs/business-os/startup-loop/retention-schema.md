---
Type: Capability-Schema
Capability-ID: CAP-06
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-18
Last-updated: 2026-02-18
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Related-capability-contract: docs/business-os/startup-loop/marketing-sales-capability-contract.md
Related-processes: CX-3 (retention/loyalty), GTM-4 (lifecycle automation) — see process-registry-v2.md
---

# CAP-06 — Lifecycle and Retention Schema Contract

## Purpose

This document defines the canonical schema for CAP-06 (Lifecycle and retention): the artifact structure, required fields, validation rules, stage gate anchor, downstream consumers, phase-aware N/A policy, and S10 denominator hooks.

**CAP-06 closes the capability gap for repeat purchase / re-booking, referral, churn signals, and LTV estimation.** It activates only after the first non-zero retention metric exists — it is never a pre-launch requirement.

**Process vehicles:**
- CX-3 (Retention and loyalty loops) — relational and loyalty arm
- GTM-4 (Conversion and lifecycle automation) — automation and funnel arm

Both are defined in `process-registry-v2.md`.

---

## Canonical Artifact Path

```
docs/business-os/strategy/<BIZ>/retention.user.md
```

- One file per business; updated on each weekly cycle once activated.
- Producer: Operator (with guidance from this schema and S10 weekly cycle)
- Template structure: see §3 Required Fields below.

---

## Stage Gate Anchor

| Gate | Type | Condition |
|---|---|---|
| **CAP-06 Activation Gate** (Soft) | S10 | Activates at first non-zero repeat/re-booking signal OR after 4 consecutive weekly cycles post-launch, whichever comes first. Before activation: retention fields in S10 memo are advisory only. |
| **CAP-06 Decision Gate** | S10 (weekly) | Scale decisions that reference retention or LTV require CAP-06 denominator validity (see §5). |

**Pre-activation rule:** Before the activation gate passes, retention-related Scale/Kill decisions default to `no-decision`. The operator must explicitly note `cap-06-not-yet-active` in Section A of the S10 memo rather than omitting the check.

**Phase-awareness rule:** Pre-PMF businesses must not treat missing repeat data as a failure. Mark individual denominator checks `Below floor — pre-PMF` when the business stage is `pre-PMF`. This does not constitute a validation failure; it is a phase-appropriate deferral.

---

## Required Fields

The `retention.user.md` artifact must include the following sections. Fields marked `(pre-PMF optional)` may be left as `not-yet-measured` before the activation gate; they must be completed at PMF stage entry.

### 1. Retention Segments

```markdown
## Retention Segments

| Segment | Definition | Current size | Last updated |
|---|---|---|---|
| First-time | [e.g. Customers / guests with exactly 1 purchase/stay] | [N] | [date] |
| Repeat | [e.g. ≥2 purchases/stays in trailing 12 months] | [N] | [date] |
| High-LTV | [e.g. Top 20% by lifetime spend] | [N] | [date] |
| At-risk | [e.g. No activity in last 60 days after prior purchase/stay] | [N] | [date] |
```

**Validation rule:** All four segment labels present. Definitions are numeric and time-bounded (no vague labels like "loyal" or "inactive" without criteria). Current size may be `0` when not-yet-measured.

### 2. Repeat and Referral Drivers

```markdown
## Repeat and Referral Drivers

| Driver | Type | Measurable metric | Denominator | Source |
|---|---|---|---|---|
| [e.g. Price competitiveness] | Repeat | [e.g. rebooking rate among guests citing price in exit survey] | [N interviewed] | [CDI-2 log, date] |
| [e.g. Referral incentive] | Referral | [e.g. % new customers from referral code] | [N referrals] | [tracking source] |
```

**Validation rule:** ≥1 measurable driver for repeat and ≥1 for referral, each with a named metric, denominator, and evidence source. Pre-PMF minimum: ≥1 hypothesised driver with stated evidence plan (metric + how it will be measured).

### 3. Churn and Cancellation Reasons

```markdown
## Churn and Cancellation Reasons

| Reason code | Frequency (trailing 4 weeks) | Source | Root cause hypothesis |
|---|---|---|---|
| [e.g. Price too high] | [N / %] | [OPS-3 refund log / exit survey] | [hypothesis] |
| [e.g. Delivery quality issue] | [N / %] | [CX-1 complaint log] | [hypothesis] |
```

**Validation rule:** At least one reason code with frequency and source. Pre-PMF minimum: log exists with ≥1 entry (even if frequency is 0 — confirms the log is running). "No cancellations yet" is valid as a frequency value; the log must still exist.

**Mandatory field:** Cancel/refund reason log must exist with ≥1 entry. This is the minimum enforcement condition from the original CAP-06 spec.

### 4. LTV Estimate

```markdown
## LTV Estimate

| Segment | LTV estimate | Method | Confidence | Last updated |
|---|---|---|---|---|
| All customers/guests | [e.g. £N over 12 months] | [e.g. Average AOV × repeat rate × time window] | [Low/Medium/High] | [date] |
| Repeat segment | [e.g. £N] | [...] | [...] | [date] |
```

**Validation rule:** At least one LTV estimate (all-customers or repeat segment) with method and confidence level. Confidence `Low` is valid pre-PMF; it must be stated explicitly rather than omitted. Denominator required: state how many customers the estimate is derived from.

### 5. Retention Metrics Denominators (CAP-06 KPI Hook)

```markdown
## Retention Metrics Denominators

Evaluated in S10 weekly memo before retention-based Scale decisions.

| Metric | Minimum denominator | Current denominator | Stage gate | PASS / FAIL / Pre-PMF |
|---|---|---|---|---|
| Repeat rate (product) OR Re-booking rate (hospitality) | ≥20 customers/guests with ≥1 completed purchase/stay | [N] | PMF entry | [PASS/FAIL/Below floor — pre-PMF] |
| Referral rate | ≥30 customers/guests invited to refer | [N] | PMF entry | [PASS/FAIL/Below floor — pre-PMF] |
| Retention lift from lifecycle automation | ≥15 customers in automated flow for ≥2 weeks | [N] | PMF+ | [PASS/FAIL/Below floor — pre-PMF] |
| Churn/cancel reason log | ≥1 entry (any volume) | [exists: yes/no] | Activation gate | [PASS/FAIL] |

No-decision rule: If repeat rate or re-booking rate is below floor and business is PMF+, retention-based Scale decisions are restricted to Continue/Investigate only. Document as `retention-no-decision` in the S10 memo. Pre-PMF businesses document as `cap-06-pre-pmf-deferral` — this is not a failure.
```

---

## Profile-Specific Metric Mappings

### Profile: hospitality-direct-booking

| CAP-06 metric | Hospitality equivalent | Denominator |
|---|---|---|
| Repeat rate | Re-booking rate (% guests who book again within 12 months) | ≥20 past guests |
| Referral rate | Direct referral or voucher usage rate | ≥30 guests offered referral |
| Churn signal | Cancellation rate + "no-return" cohort (guests with 1 stay, not re-booked in 12 months) | ≥10 guests in cohort |
| LTV | RevPAR × average stay frequency × stay horizon | All past guests |

### Profile: dtc-ecommerce

| CAP-06 metric | DTC equivalent | Denominator |
|---|---|---|
| Repeat rate | Repeat purchase rate (% customers with ≥2 orders in 12 months) | ≥20 customers |
| Referral rate | Referral code usage rate | ≥30 customers invited |
| Churn signal | 90-day non-repurchase cohort | ≥10 customers in cohort |
| LTV | AOV × average order frequency × time window | All customers with ≥1 order |

---

## Validation Rules (VC-04)

### VC-04-A — Schema Completeness

**Pass when:** `retention.user.md` contains all required sections (Retention Segments, Repeat and Referral Drivers, Churn and Cancellation Reasons, LTV Estimate, Retention Metrics Denominators) with explicit values in all non-optional fields, and N/A policy applied correctly where relevant.

**Fail when:** Any required section is absent; or cancel/refund reason log does not exist with ≥1 entry; or segment definitions use vague non-numeric criteria.

**Pre-PMF pass condition:** Pre-PMF businesses pass VC-04-A when the artifact exists with: all four segment labels present, ≥1 hypothesised repeat/referral driver, cancel log exists with ≥1 entry, LTV estimate present at `Low` confidence, and all denominator checks explicitly marked `Below floor — pre-PMF` where applicable.

### VC-04-B — S10 Coupling Clarity

**Pass when:** Retention checks in the S10 memo are:
- Non-blocking under denominator floor (documented as `cap-06-pre-pmf-deferral` or `retention-no-decision`) — weekly S10 session proceeds normally.
- Blocking for Scale decisions above threshold at PMF+: `retention-no-decision` prevents Scale/Kill on retention-referencing actions.

**Fail when:** The threshold boundary between non-blocking (pre-PMF/below floor) and blocking (PMF+ Scale decisions) is ambiguous in the prompt extension or schema. Reviewer must be able to classify any scenario in ≤5 minutes.

### VC-04-C — Profile Fitness

**Pass when:** Both `hospitality-direct-booking` and `dtc-ecommerce` profile metric mappings exist with explicit denominators, and an operator can complete the relevant mapping section in ≤20 minutes using only this schema.

**Fail when:** Profile metric table is absent; or a profile-required metric lacks a denominator specification; or the two profiles share identical metric definitions with no profile-specific adjustment.

---

## Downstream Consumers

| Consumer | How it uses CAP-06 |
|---|---|
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | CAP-06 denominator check gates retention-based Scale/Kill decisions; pre-PMF deferral documented in Section A |
| `docs/business-os/startup-loop/process-registry-v2.md` (CX-3, GTM-4) | CX-3 and GTM-4 are the primary recurring execution vehicles; retention.user.md is their shared artifact |
| `docs/business-os/startup-loop/exception-runbooks-v1.md` | Churn spike triggers Demand Shock exception; repeat-rate collapse triggers Demand Shock exception |
| Forecast recalibration | LTV estimate from retention.user.md feeds forecast recalibration at Day 14/30 in `lp-forecast` |

---

## N/A Policy

CAP-06 may be classified `Not-applicable` in narrow structural cases:

| Business type | Default posture |
|---|---|
| Pre-launch (no transactions) | `Not-yet-active` — activate at first completed transaction or 4 weeks post-launch |
| One-time-purchase model (no repeat possible by design) | `Not-applicable` — requires explicit business-model rationale; referral metric still required |
| Event-based (single event, no repeat attendance) | `Not-applicable` with rationale; post-event referral/NPS still captured |

**Rules governing N/A:**
1. Explicit business-model rationale required (one sentence).
2. Owner named even for N/A.
3. N/A reviewed at each loop-spec version bump.
4. Absence of repeat data is **not** sufficient for N/A — use `Not-yet-active` or `Below floor — pre-PMF` instead.
5. Cancel/refund reason log is required **even for N/A businesses** — it is the minimum data integrity check that cannot be waived.

---

## Current Coverage by Business

| Business | CAP-06 Status | Notes |
|---|---|---|
| HEAD | Not-yet-active | Pre-launch; no transactions yet |
| PET | Not-yet-active | Pre-launch; no transactions yet |
| BRIK | Not-yet-active | No S2B/channel completed; activate at first booking |

> **As of 2026-02-18.** Update after first non-zero retention signal.

---

## Measurement Readiness

Once CAP-06 is active:

| Metric | Definition | Owner | PMF+ target |
|---|---|---|---|
| Repeat rate (product) / Re-booking rate (hospitality) | % customers/guests returning within 12 months | CX/Growth Lead | Set at PMF entry; benchmark 20–30% repeat (product category varies) |
| Referral rate | % new customers attributable to referral from existing customers | Growth Ops | Set at PMF entry |
| Churn rate | % customers/guests not returning after 90 days (product) / 12 months (hospitality) | CX Lead | Below category baseline; defined at PMF entry |
| Retention lift | % improvement in repeat rate from lifecycle automation vs control | Growth Ops | Positive directional; ≥15 in flow for measurement |

---

## References

- Capability contract: `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
- Process registry: `docs/business-os/startup-loop/process-registry-v2.md` (CX-3, GTM-4)
- Bottleneck diagnosis profiles: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` (`repeat_purchase_rate` and `cancellation_rate` profile metrics)
- Boundary decision: `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md`
- Research baseline: `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` (CX-3, GTM-4 specifications)
