---
Type: Capability-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Owner: startup-loop maintainers
Source: docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md
Related-plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
---

# Marketing and Sales Capability Contract Registry

## Purpose

This document defines the canonical set of marketing and sales capabilities required by the startup loop and the contracts governing their production, validation, and consumption. It is the authoritative source of completeness for each capability — not the fact-find brief or individual skill docs.

The registry answers: "Is this capability fully executable for a given business?" If all seven capabilities pass their validation rules, the business has decision-grade marketing and sales infrastructure.

## Canonical Capability IDs

| Capability ID | Name |
|---|---|
| CAP-01 | Positioning and ICP |
| CAP-02 | Message testing |
| CAP-03 | Offer mechanics |
| CAP-04 | Channel strategy |
| CAP-05 | Sales ops |
| CAP-06 | Lifecycle and retention |
| CAP-07 | Measurement and inference |

## Capability Contract Registry

| Capability ID | Required artifact / data | Owner (producer) | Stage / gate anchor | Validation rule | Downstream consumers | Status |
|---|---|---|---|---|---|---|
| CAP-01 — Positioning and ICP | Offer artifact: ICP profile, positioning statement, switching trigger evidence | `lp-offer` + operator | S2B | Offer artifact has ICP, positioning, and ≥1 switching trigger with evidence source; all three sections present and sourced | `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md` | Partial — contract exists via `lp-offer` but artifact output path is not normalized across consumers |
| CAP-02 — Message testing | Message variant log: variant text, source-tagged outcomes, denominator ≥ pass-floor, ISO timestamp per variant | Operator + S1/S1B prompt template | S1 or S1B (pre-website) or S2A (website-live); hard gate: pre-S6B channel activation | Variant log has ≥1 variant per channel tested; each variant has outcome count, denominator, and timestamp; source tag present | `.claude/skills/lp-channels/SKILL.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Missing — no canonical schema or template field enforces this as a first-class contract |
| CAP-03 — Offer mechanics | Offer artifact: pricing hypothesis with confidence score, packaging options, guarantees/risk-reversal tied to objection map | `lp-offer` | S2B | Pricing hypothesis includes confidence score and stated validation plan; objection map has ≥1 entry per primary objection | `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Partial — `lp-offer` produces a pricing section but guarantee/objection sub-sections are advisory only |
| CAP-04 — Channel strategy | Channel plan: 2–3 ranked channels with viability constraints, stop conditions, 30-day GTM timeline, SEO strategy | `lp-channels` | S6B (GATE-S6B-STRAT-01 for strategy design; GATE-S6B-ACT-01 for spend authorization) | Channel plan has 2–3 selected channels, each with a viability constraint, a stop condition, and at least one 30-day execution line; SEO strategy section present | `.claude/skills/lp-forecast/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml` (S4 baseline merge), `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Partial — `lp-channels` produces a channel plan but stop-condition and constraint fields are advisory |
| CAP-05 — Sales ops | Sales ops artifact: pipeline stages, speed-to-lead SLA, follow-up loop definition, objection handling scripts | Operator + sales-ops prompt template (does not yet exist) | Between S6B and S10 (no canonical gate defined) | Stage conversion denominators ≥ pass-floor; speed-to-lead SLA defined with named owner; follow-up loop has defined retry count and timeout | `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Missing — no canonical template, artifact path, or gate exists |
| CAP-06 — Lifecycle and retention | Retention artifact: repeat/referral drivers, churn/cancel reasons, LTV estimate | Operator + weekly loop data | S10 (activated at first non-zero retention metric, no earlier) | Retention lever map has ≥1 measurable driver with denominator and source; repeat/referral baseline expressed with denominator; cancel/refund reason log exists with ≥1 entry | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, forecast recalibration docs at day 14/30 | Missing — no first-class retention artifact, schema, or S10 template enforcement |
| CAP-07 — Measurement and inference | Measurement setup doc (S1B or S2A path) + denominator validity check in weekly decision memo | Operator + `GATE-MEAS-01` (startup-loop skill) | `GATE-MEAS-01` (Hard; pre-S6B); S10 (weekly denominator validity gate) | Measurement setup doc at Active status with ≥1 confirmed conversion event; weekly memo denominator section: each selected KPI has denominator ≥ applicable threshold (global or profile override); uncertainty bound is explicit | `.claude/skills/lp-channels/SKILL.md` (GATE-S6B-ACT-01 spend gate), `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, scale/kill decision | Partial — GATE-MEAS-01 enforces measurement before spend but weekly denominator gate and uncertainty bound are not yet explicit pass/fail checks |

## Artifact Output Paths

Canonical output path per capability per business:

| Capability ID | Artifact path pattern | Producer | Notes |
|---|---|---|---|
| CAP-01 | `docs/business-os/strategy/<BIZ>/offer.user.md` | `/lp-offer` | Shared file with CAP-03 |
| CAP-02 | `docs/business-os/strategy/<BIZ>/message-variants.user.md` | Operator prompt | **Proposed canonical path — schema not yet defined. Deferred to TASK-05.** |
| CAP-03 | `docs/business-os/strategy/<BIZ>/offer.user.md` | `/lp-offer` | Same artifact as CAP-01; sections: pricing hypothesis, guarantees, objection map |
| CAP-04 | `docs/business-os/strategy/<BIZ>/channels.user.md` | `/lp-channels` | |
| CAP-05 | `docs/business-os/strategy/<BIZ>/sales-ops.user.md` | Operator prompt | **Proposed canonical path — template does not yet exist.** |
| CAP-06 | `docs/business-os/strategy/<BIZ>/retention.user.md` | Operator prompt | **Proposed canonical path — template does not yet exist.** |
| CAP-07 | `docs/business-os/strategy/<BIZ>/measurement-setup.user.md` + weekly decision docs | S1B/S2A prompt handoff; weekly loop | Measurement setup: S1B or S2A path. Weekly denominator check: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` |

## N/A Policy

A capability may be marked `not-applicable` for a specific business profile when the operational model makes the capability structurally irrelevant.

Rules governing N/A classification:

1. **Explicit justification required.** The capability must be marked N/A with a one-sentence business-model rationale. Absence of current activity is not sufficient ("we haven't run sales yet" ≠ N/A).
2. **Owner required even for N/A.** The owner column must name the person or role responsible for monitoring whether the N/A status remains valid.
3. **Coverage scoring exclusion.** N/A capabilities are excluded from the coverage score for that business but remain in the registry for cross-business comparability.
4. **Review cadence.** N/A status must be re-evaluated at each loop-spec version bump or when a new business profile is onboarded. No capability is permanently N/A without a recorded review.

## Current Coverage by Business

| Business | CAP-01 | CAP-02 | CAP-03 | CAP-04 | CAP-05 | CAP-06 | CAP-07 |
|---|---|---|---|---|---|---|---|
| HEAD | Not started (S2B never run) | Not started | Not started (S2B never run) | Not started (S6B never run) | Not started | Not started | Partial (S1B infra started, not Active) |
| PET | Not started (S2B never run) | Not started | Not started (S2B never run) | Not started (S6B never run) | Not started | Not started | Partial (S1B infra started, not Active) |
| BRIK | Not started (S2B never run) | Not started | Not started (S2B never run) | Not started (S6B never run) | Not started | Not started | Partial (begin_checkout verification incomplete) |

> **As of 2026-02-17.** Update this table after each S2B, S6B, or S10 advancement. Source: `docs/business-os/startup-loop-workflow.user.md`.

## References

- Fact-find: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Stage operator dictionary: `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- Bottleneck diagnosis schema: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
- Weekly decision template: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Pre-website measurement template: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
- Downstream task for Sales ops + Lifecycle schemas: TASK-05 in plan (Demand Evidence Pack)
- Downstream task for denominator gate enforcement: TASK-09 (S10 denominator validity and no-decision policy)
