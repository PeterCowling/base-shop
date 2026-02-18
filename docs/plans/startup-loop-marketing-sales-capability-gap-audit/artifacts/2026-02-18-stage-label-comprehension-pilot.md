---
Type: Reference
Status: Draft
Created: 2026-02-18
Last-updated: 2026-02-18
---

# Stage-Label Comprehension Pilot — Startup Loop Naming UX

**Task:** TASK-19 (startup-loop-marketing-sales-capability-gap-audit)
**Objective:** Validate that label-first stage naming reduces stage-identification time to ≤10 seconds median over ≥5 packet samples.
**Threshold:** Median ≤10 s over ≥5 samples → Pass. Exceeds threshold → file follow-up task.

---

## Protocol

Each operator sees one run-packet sample and answers: *"What stage is the business currently in?"*

Rules:
- Timer starts when operator reads the packet header line.
- Timer stops when operator states the correct stage name or ID.
- Sessions are conducted independently (no collaboration between pilots).
- Packets use canonical `label_operator_short` in the `current_stage` display field (label-first format introduced in TASK-16).

---

## Packet Samples (test stimuli)

All packets below use the label-first format:

```text
current_stage: Forecast (S3)
loop_spec_version: 1.5.0
status: ready
next_action: Run /lp-forecast for this business.
```

```text
current_stage: Channel strategy + GTM (S6B)
loop_spec_version: 1.5.0
status: blocked
blocking_reason: GATE-S6B-STRAT-01: No valid DEP artifact.
```

```text
current_stage: Offer design (S2B)
loop_spec_version: 1.5.0
status: awaiting-input
next_action: Run /lp-offer with the market intelligence output.
```

```text
current_stage: Readiness check (S1)
loop_spec_version: 1.5.0
status: ready
next_action: Run /lp-readiness --business BRIK.
```

```text
current_stage: Weekly decision (S10)
loop_spec_version: 1.5.0
status: ready
next_action: Run /startup-loop advance --business BRIK.
```

---

## Results

| Sample # | Packet Stage | Operator | Time (s) | Correct? | Notes |
|---|---|---|---|---|---|
| 1 | Forecast (S3) | — | — | — | |
| 2 | Channel strategy + GTM (S6B) | — | — | — | |
| 3 | Offer design (S2B) | — | — | — | |
| 4 | Readiness check (S1) | — | — | — | |
| 5 | Weekly decision (S10) | — | — | — | |

**Median response time:** — s
**Pass/Fail:** — (threshold: ≤10 s)

---

## Status

This pilot artifact was created as part of TASK-19 delivery (2026-02-18). Results are to be recorded within 5 business days of implementation (by 2026-02-25). If median exceeds 10 s, a follow-up IMPLEMENT task will be filed to investigate label copy improvements.

**Completion target:** 2026-02-25
**Owner:** Startup-loop maintainers
