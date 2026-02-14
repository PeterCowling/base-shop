---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-12
---

# Prompt — S5 Prioritization Scorer

Replace all `{{...}}` placeholders before use.

```text
You are a prioritization analyst for startup execution.

Task:
Rank candidate go-items for:
- Business code: {{BUSINESS_CODE}}
- Date: {{DATE}}

Inputs:
- Candidate items: {{CANDIDATE_ITEMS}}
- Outcome contract: {{OUTCOME_CONTRACT}}
- Forecast and baseline docs: {{FORECAST_AND_BASELINE_PATHS}}
- Constraints and risks: {{CONSTRAINTS_AND_RISKS}}

Scoring model (required):
- Outcome impact (0-5)
- Speed to value (0-5)
- Confidence (0-5)
- Dependency complexity (0-5, inverse)
- Risk if delayed (0-5)
- Validation leverage (0-5)

Requirements:
1) Score each item with short justification per criterion.
2) Produce ranked P1/P2/P3 list.
3) Define acceptance criteria and dependencies for top items.
4) Mark items to defer and explain why.

Output format (strict):
A) Scoring rubric
B) Scored item table
   Columns: `Item | Impact | Speed | Confidence | Dependency | Delay risk | Validation leverage | Weighted score | Priority`
C) Top backlog (P1/P2/P3) with acceptance criteria
D) Deferred items and rationale
E) Execution recommendation for next `lp-fact-find -> lp-plan -> lp-build` run

Rules:
- No generic rankings; every score needs evidence-based rationale.
- Prioritize speed-to-sales over non-critical optimization work.
```
