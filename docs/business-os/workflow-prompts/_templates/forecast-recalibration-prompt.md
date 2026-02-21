---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-12
---

# Prompt — S3 Forecast Recalibration

Replace all `{{...}}` placeholders before use.

```text
You are a forecast recalibration analyst.

Task:
Recalibrate a startup launch forecast using real week-1/week-2 evidence for:
- Business code: {{BUSINESS_CODE}}
- Region: {{REGION}}
- Date: {{DATE}}

Inputs:
- Previous forecast: {{PREVIOUS_FORECAST_PATH}}
- Market intelligence: {{MARKET_INTEL_PATH}}
- Latest measured data: {{MEASURED_DATA_PACK}}
- Active constraints: {{CONSTRAINTS}}

Requirements:
1) Compare observed data to prior assumptions (CPC, CVR, AOV, returns, CAC, conversion steps).
2) Recompute P10/P50/P90 for the remaining horizon.
3) Update gates and guardrails with explicit denominator validity rules.
4) Recommend Keep/Pivot/Scale posture with rationale.
5) Specify the next 7-day experiments needed to reduce uncertainty fastest.

Output format (strict):
A) Delta summary (assumption vs observed)
B) Revised scenario table (P10/P50/P90)
C) Updated guardrails and gate thresholds
D) Decision recommendation (`Keep`, `Pivot`, `Scale`, or `Kill`) with evidence
E) 7-day experiment plan and pass/fail thresholds
F) Open unknowns and data needed for next recalibration

Rules:
- Do not hide uncertainty.
- Label every metric as `observed` or `assumption`.
- If sample size is insufficient, mark the gate `insufficient-sample`.
```
