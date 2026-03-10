---
Type: Capability-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-03-09
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
| CAP-01 — Positioning and ICP | Offer artifact: ICP profile, positioning statement, switching trigger evidence | `lp-offer` + operator | MARKET-06 | Offer artifact has ICP, positioning, and ≥1 switching trigger with evidence source; all three sections present and sourced | `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md` | Partial — contract exists via `lp-offer` but artifact output path is not normalized across consumers |
| CAP-02 — Message testing | Message variant log: hypothesis-linked variants, source-tagged outcomes, denominator-bearing observations where available, ISO timestamps per variant | Operator + `lp-channels` + weekly operating loop | MEASURE-01 capture start + SELL-01 sprint setup; hard gate: pre-SELL-08 paid channel activation | Artifact exists at canonical path; rows follow `message-variants-schema.md`; each denominator-bearing row has source tag, denominator, outcome count, and timestamps; hard gate passes only when each active hypothesis has ≥2 denominator-bearing variants with explicit decisions | `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/draft-marketing/SKILL.md`, `.claude/skills/draft-outreach/SKILL.md`, `.claude/skills/lp-weekly/modules/orchestrate.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Schema-defined — canonical schema: `docs/business-os/startup-loop/schemas/message-variants-schema.md`; artifact path and pass-floor now explicit |
| CAP-03 — Offer mechanics | Offer artifact: pricing hypothesis with confidence score, packaging options, guarantees/risk-reversal tied to objection map | `lp-offer` | MARKET-06 | Pricing hypothesis includes confidence score and stated validation plan; objection map has ≥1 entry per primary objection | `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Partial — `lp-offer` produces a pricing section but guarantee/objection sub-sections are advisory only |
| CAP-04 — Channel strategy | Channel plan: 2–3 ranked channels with viability constraints, stop conditions, 30-day GTM timeline, SEO strategy | `lp-channels` | SELL-01 (GATE-SELL-STRAT-01 for strategy design; GATE-SELL-ACT-01 for spend authorization) | Channel plan has 2–3 selected channels, each with a viability constraint, a stop condition, and at least one 30-day execution line; SEO strategy section present | `.claude/skills/lp-forecast/SKILL.md`, `docs/business-os/startup-loop/specifications/loop-spec.yaml` (S4 baseline merge), `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Partial — `lp-channels` produces a channel plan but stop-condition and constraint fields are advisory |
| CAP-05 — Sales ops | Sales ops artifact: pipeline stages, speed-to-lead SLA, follow-up loop definition, objection handling scripts, stage conversion denominators | Operator (guided by `sales-ops-schema.md`) | CAP-05 Activation Gate (Soft, between SELL-01 and S10, on first qualified lead); CAP-05 Decision Gate (S10, weekly denominator check) | Pipeline Stages defined with entry/exit criteria; speed-to-lead SLA has named owner and numeric target; follow-up loop has retry count, spacing, and give-up rule; ≥1 objection script per primary objection; stage conversion denominators ≥ pass-floor; no-decision rule explicit | `docs/business-os/startup-loop/schemas/bottleneck-diagnosis-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `docs/business-os/startup-loop/process-registry-v2.md` (GTM-3) | **Schema-defined** — canonical schema: `docs/business-os/startup-loop/schemas/sales-ops-schema.md`; artifact path: `docs/business-os/strategy/<BIZ>/sales-ops.user.md`; gates defined; N/A policy documented |
| CAP-06 — Lifecycle and retention | Retention artifact: retention segments, repeat/referral drivers, churn/cancel reasons, LTV estimate, retention metrics denominators | Operator (guided by `retention-schema.md`) | CAP-06 Activation Gate (Soft, S10, at first non-zero repeat signal OR 4 weeks post-launch); CAP-06 Decision Gate (S10, weekly denominator check) | Retention segments defined with numeric criteria; ≥1 measurable repeat driver and ≥1 referral driver with denominator; cancel/refund reason log exists with ≥1 entry; LTV estimate with confidence level; denominator floors met for retention-based Scale decisions | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, forecast recalibration at day 14/30, `docs/business-os/startup-loop/process-registry-v2.md` (CX-3, GTM-4) | **Schema-defined** — canonical schema: `docs/business-os/startup-loop/schemas/retention-schema.md`; artifact path: `docs/business-os/strategy/<BIZ>/retention.user.md`; phase-aware N/A and pre-PMF deferral policy documented |
| CAP-07 — Measurement and inference | Measure stage docs (MEASURE-01 + MEASURE-02) + denominator validity check in weekly decision memo | Operator + `GATE-SELL-ACT-01` measurement requirements | `GATE-SELL-ACT-01` (Hard; pre-SELL-08 paid spend activation); S10 (weekly denominator validity gate) | Measure stage doc at Active status with ≥1 confirmed conversion event; weekly memo denominator section: each selected KPI has denominator ≥ applicable threshold (global or profile override); uncertainty bound is explicit | `.claude/skills/lp-channels/SKILL.md` (GATE-SELL-ACT-01 spend gate), `docs/business-os/startup-loop/schemas/bottleneck-diagnosis-schema.md`, scale/kill decision | Partial — spend activation enforces measurement before paid channels, but weekly denominator gate and uncertainty bound are not yet explicit pass/fail checks |

## Artifact Output Paths

Canonical output path per capability per business:

| Capability ID | Artifact path pattern | Producer | Notes |
|---|---|---|---|
| CAP-01 | `docs/business-os/startup-baselines/<BIZ>/offer.md` | `/lp-offer` | Shared file with CAP-03 |
| CAP-02 | `docs/business-os/strategy/<BIZ>/message-variants.user.md` | Operator-guided; initialized by `/lp-channels` when message tests are in scope | Canonical schema: `docs/business-os/startup-loop/schemas/message-variants-schema.md` |
| CAP-03 | `docs/business-os/startup-baselines/<BIZ>/offer.md` | `/lp-offer` | Same artifact as CAP-01; sections: pricing hypothesis, guarantees, objection map |
| CAP-04 | `docs/business-os/startup-baselines/<BIZ>/channels.md` | `/lp-channels` | |
| CAP-05 | `docs/business-os/strategy/<BIZ>/sales-ops.user.md` | Operator (guided by `sales-ops-schema.md`) | Schema and gates defined in `docs/business-os/startup-loop/schemas/sales-ops-schema.md` |
| CAP-06 | `docs/business-os/strategy/<BIZ>/retention.user.md` | Operator (guided by `retention-schema.md`) | Schema, gates, and phase-aware N/A policy defined in `docs/business-os/startup-loop/schemas/retention-schema.md` |
| CAP-07 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-agent-setup.user.md` + `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance.user.md` + weekly decision docs | MEASURE-01/MEASURE-02 prompt handoff; weekly loop | Measure stages: MEASURE-01 + MEASURE-02. Weekly denominator check: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` |

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
| HBAG | Partial (offer artifact active; consumer normalization still mixed) | Draft (canonical ledger created; first qualitative boutique signal logged; denominator-bearing tests pending) | Partial (pricing and objection sections present; not yet fully standardized across consumers) | Partial (channels artifact active; channel companions still being filled in) | Not started | Not started | Partial (measurement preconditions exist; weekly denominator discipline still maturing) |
| HEAD | Partial (offer artifact active) | Draft (scaffold created; no live message rows yet) | Partial (offer artifact active) | Partial (channels artifact active) | Not started | Not started | Partial (MEASURE-01 started, not Active) |
| PET | Partial (offer artifact active) | Draft (scaffold created; no live message rows yet) | Partial (offer artifact active) | Not started (SELL-01 never run) | Not started | Not started | Partial (MEASURE-01 started, not Active) |
| BRIK | Not started (MARKET-06 never run) | Not started | Not started (MARKET-06 never run) | Not started (SELL-01 never run) | Not started | Not started | Partial (begin_checkout verification incomplete) |

> **As of 2026-03-09.** Update this table after each MARKET-06, SELL-01, or S10 advancement. Source: `docs/business-os/startup-loop-workflow.user.md`.

## References

- Fact-find: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md`
- Loop spec: `docs/business-os/startup-loop/specifications/loop-spec.yaml`
- Stage operator dictionary: `docs/business-os/startup-loop/specifications/stage-operator-dictionary.yaml`
- Bottleneck diagnosis schema: `docs/business-os/startup-loop/schemas/bottleneck-diagnosis-schema.md`
- Weekly decision template: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Pre-website measurement template: `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`
- CAP-02 schema: `docs/business-os/startup-loop/schemas/message-variants-schema.md`
- Direct build record: `docs/plans/startup-loop-cap02-message-variants/micro-build.md`
- Downstream task for Sales ops + Lifecycle schemas: TASK-05 in plan (Demand Evidence Pack)
- Downstream task for denominator gate enforcement: TASK-09 (S10 denominator validity and no-decision policy)
