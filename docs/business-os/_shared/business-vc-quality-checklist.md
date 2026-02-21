---
Type: Checklist
Status: Active
Domain: Business-OS
Last-reviewed: 2026-02-17
---

# Business VC Quality Checklist

Every business validation check (`VC-XX`) must satisfy all criteria below.

## Principles

1. Isolated
- One VC should test one variable at a time.

2. Pre-committed
- Pass/fail rule is defined before data is observed.

3. Time-boxed
- VC includes a measurement deadline.

4. Minimum viable sample
- VC specifies minimum sample size/volume needed for interpretation.

5. Diagnostic
- Failures identify why the check failed, not just that it failed.

6. Repeatable
- Another operator with same inputs should get same outcome.

7. Observable
- Metric is directly measurable, not subjective proxy language.

## Reject Patterns

- "Validate demand is sufficient"
- "Check market response"
- "Confirm unit economics work"

These are too broad unless rewritten with thresholds, timing, and decision rules.

## Acceptable Pattern Shape

`VC-XX: <specific variable> -> pass when <threshold> within <timebox> over <sample>; else <explicit decision action>`
