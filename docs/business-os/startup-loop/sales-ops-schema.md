---
Type: Capability-Schema
Capability-ID: CAP-05
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-18
Last-updated: 2026-02-18
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Related-capability-contract: docs/business-os/startup-loop/marketing-sales-capability-contract.md
Related-process: GTM-3 (process-registry-v2.md)
---

# CAP-05 — Sales Ops Schema Contract

## Purpose

This document defines the canonical schema for CAP-05 (Sales ops): the artifact structure, required fields, validation rules, stage gate anchor, downstream consumers, and N/A policy. It closes the gap identified in the capability contract where CAP-05 was previously `Missing` with no canonical template or gate.

**CAP-05 is the capability contract for sales pipeline operations.** It governs structured deal tracking, speed-to-lead responsiveness, follow-up cadence, and objection handling — the operational layer between initial channel distribution (CAP-04) and retention/repeat (CAP-06).

**Process vehicle:** GTM-3 (Sales/account pipeline and booking deals) in `process-registry-v2.md` is the primary recurring process for executing CAP-05.

---

## Canonical Artifact Path

```
docs/business-os/strategy/<BIZ>/sales-ops.user.md
```

- One file per business; overwritten/updated on each use.
- Producer: Operator (with prompt guidance from this schema)
- Template structure: see §3 Required Fields below.

---

## Stage Gate Anchor

| Gate | Type | Condition |
|---|---|---|
| **CAP-05 Activation Gate** (Soft) | Between S6B and S10 | Activates when at least one channel is producing qualified leads/enquiries. Absent until lead flow exists — not a hard blocker for S10, but a no-decision flag for pipeline-based Scale decisions. |
| **CAP-05 Decision Gate** | S10 (weekly) | Scale or Kill decisions referencing pipeline performance require CAP-05 denominator validity (see §5). |

**Pre-activation N/A policy:** If a business has no current lead pipeline (pre-launch or channel not yet active), mark CAP-05 status `Not-yet-active` with a one-sentence rationale. `Not-yet-active` is distinct from `N/A` (see §6).

---

## Required Fields

The `sales-ops.user.md` artifact must include the following sections. All fields are required unless explicitly marked `(optional)` or the N/A policy applies.

### 1. Pipeline Stages

Define the deal/booking pipeline with ordered stages. Minimum 3 stages; maximum 7.

```markdown
## Pipeline Stages

| Stage # | Stage name | Entry criteria | Exit criteria | Owner |
|---|---|---|---|---|
| 1 | [e.g. New Lead] | ... | ... | [role] |
| 2 | [e.g. Contacted] | ... | ... | [role] |
| N | [e.g. Closed Won / Closed Lost] | ... | ... | [role] |
```

**Validation rule:** Every pipeline stage has explicit entry and exit criteria. Closed-Won and Closed-Lost are distinct final stages.

### 2. Speed-to-Lead SLA

```markdown
## Speed-to-Lead SLA

- Target first-contact time: [e.g. within 2 hours of lead arrival]
- Owner: [role/person]
- SLA breach definition: [e.g. >4 hours without contact attempt = SLA breach]
- SLA breach escalation: [person/channel notified]
- Measurement: [how tracked — e.g. CRM timestamp]
```

**Validation rule:** Named owner, numeric time target, and breach definition all present. "As soon as possible" is not a valid SLA definition.

### 3. Follow-Up Loop

```markdown
## Follow-Up Loop

- Attempts: [e.g. 3 contact attempts]
- Spacing: [e.g. Day 0 (immediate), Day 2, Day 5]
- Timeout / give-up rule: [e.g. after 3 attempts with no response, mark Closed-Lost with reason code "unresponsive"]
- Channel(s): [e.g. email → WhatsApp → phone]
- Owner: [role]
```

**Validation rule:** Defined retry count (≥2, ≤7), spacing between attempts, and explicit give-up rule all present. No open-ended follow-up loops.

### 4. Objection Handling Scripts

```markdown
## Objection Handling Scripts

| Primary objection | Handling script | Evidence source | Last updated |
|---|---|---|---|
| [objection 1] | [script text or reference] | [e.g. CDI-2 interview log] | [date] |
| [objection N] | ... | ... | ... |
```

**Validation rule:** At least one script per primary objection identified in `offer.user.md` objection map. Evidence source linked to CDI-2 notes or offer artifact.

### 5. Stage Conversion Denominators

```markdown
## Stage Conversion Denominators

| Stage transition | Minimum sample for decision-grade analysis | Current sample (from KPI snapshot) |
|---|---|---|
| Lead → Contacted | ≥20 leads | [N] |
| Contacted → Qualified | ≥15 contacted leads | [N] |
| Qualified → Closed Won/Lost | ≥10 qualified leads | [N] |
```

**Validation rule:** Each stage transition has a numeric minimum sample floor. "No data yet" is valid when activating for the first time, but must be stated explicitly. Sample counts must be updated each week.

### 6. Weekly Denominator Check (CAP-05 KPI Hook)

```markdown
## Weekly Denominator Check

Evaluated in S10 weekly memo before pipeline-based Scale/Kill decisions.

| Metric | Minimum denominator | Current denominator | PASS / FAIL |
|---|---|---|---|
| Lead response rate | ≥20 leads in trailing 4 weeks | [N] | [PASS/FAIL] |
| Stage conversion rate (primary) | ≥10 converted-to-next per stage | [N] | [PASS/FAIL] |
| Opportunity win rate | ≥8 Closed-Won + Closed-Lost | [N] | [PASS/FAIL] |

No-decision rule: If any metric is FAIL, pipeline-based Scale and Kill decisions are restricted to Continue/Investigate only. Document as `pipeline-no-decision` in the S10 memo.
```

---

## Validation Rules (VC-03)

### VC-03-A — Schema Completeness

**Pass when:** `sales-ops.user.md` contains all required sections (Pipeline Stages, Speed-to-Lead SLA, Follow-Up Loop, Objection Handling Scripts, Stage Conversion Denominators, Weekly Denominator Check) with explicit values in all non-optional fields.

**Fail when:** Any required section is absent or has placeholder text without values.

**Reviewer check:** One reviewer can verify completeness in ≤10 minutes using the Required Fields checklist above.

### VC-03-B — Denominator Readiness

**Pass when:** Stage conversion denominators define minimum sample thresholds for each stage transition, and the no-decision behavior for `pipeline-no-decision` is explicitly stated.

**Fail when:** Any stage transition lacks a numeric floor, or the no-decision condition is undefined.

**Blocking rule:** CAP-05 denominator check failure blocks pipeline-based Scale/Kill decisions in S10; it does not block the weekly S10 session itself.

### VC-03-C — Repeatability

**Pass when:** Two independent reviewers produce identical pass/fail classification for a given `sales-ops.user.md` in ≤20 minutes using only this schema document.

**Fail when:** Classification diverges due to ambiguous pass/fail wording. Resolution: clarify the ambiguous field definition in this schema.

---

## Downstream Consumers

| Consumer | How it uses CAP-05 |
|---|---|
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | CAP-05 denominator check section gates pipeline-based Scale/Kill decisions |
| `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` | Speed-to-lead SLA breach feeds `S6B/median_response_time` metric (hospitality) or custom constraint signal |
| `docs/business-os/startup-loop/process-registry-v2.md` (GTM-3) | GTM-3 is the primary recurring execution vehicle for this capability |
| `docs/business-os/startup-loop/exception-runbooks-v1.md` | Pipeline stall (no movement for 2+ weeks) is a Demand Shock exception trigger |

---

## N/A Policy

CAP-05 may be classified `Not-applicable` for a specific business profile when the operational model has no sales pipeline:

| Business type | Default posture |
|---|---|
| Pure DTC e-commerce (no account sales, no group bookings) | `Not-applicable` — no pipeline stages; substitute order funnel metrics (page-to-ATC, checkout completion) |
| Pre-launch (no active channel producing leads) | `Not-yet-active` — activate at first qualified lead; track as deferred capability |
| Hospitality (direct booking with no corporate/group sales) | `Not-applicable` for GTM-3 pipeline; substitute booking inquiry funnel (inquiry-to-quote-rate, quote-to-booking-rate) |

**Rules governing N/A:**
1. Explicit business-model rationale required (one sentence).
2. Owner named even for N/A: responsible for monitoring whether N/A remains valid.
3. N/A capabilities excluded from CAP coverage score for that business.
4. N/A reviewed at each loop-spec version bump or when business model changes.
5. Absence of current sales activity is **not** sufficient for N/A — use `Not-yet-active` instead.

---

## Current Coverage by Business

| Business | CAP-05 Status | Notes |
|---|---|---|
| HEAD | Not-yet-active | S2B never run; no channel active; activate at first qualified lead |
| PET | Not-yet-active | S2B never run; no channel active; activate at first qualified lead |
| BRIK | Not-yet-active | S2B never run; begin_checkout verification incomplete; activate at first enquiry/lead |

> **As of 2026-02-18.** Update after each week where pipeline activity begins.

---

## Measurement Readiness

Weekly metrics to track once CAP-05 is active:

| Metric | Definition | Owner | Target |
|---|---|---|---|
| Lead response rate | % leads contacted within speed-to-lead SLA | Sales Lead | ≥80% within SLA |
| Stage conversion rate | % leads advancing from each stage | Sales Lead | Set at pipeline launch; review quarterly |
| Opportunity win rate | Closed-Won ÷ (Closed-Won + Closed-Lost) | Sales Lead | Set at pipeline launch |
| Follow-up completion rate | % leads receiving all defined follow-up attempts before give-up | Sales Lead | ≥95% |

---

## References

- Capability contract: `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
- Process registry: `docs/business-os/startup-loop/process-registry-v2.md` (GTM-3)
- Boundary decision: `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md`
- Research baseline: `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` (GTM-3 specification)
