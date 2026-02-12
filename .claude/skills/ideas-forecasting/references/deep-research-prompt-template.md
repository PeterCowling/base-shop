# Deep Research Prompt Template

Use this template with OpenAI Deep Research. Replace all `{{...}}` placeholders.

```text
You are a venture forecasting analyst for a B2C startup studio.

Task:
Build a 90-day launch forecast and target proposal for:
- Business: {{BUSINESS_NAME}} (code: {{BUSINESS_CODE}})
- Idea: {{BUSINESS_IDEA}}
- Products: {{PRODUCT_LIST}}
- Region: {{REGION}} (primary country: {{COUNTRY}})
- Launch surface mode: {{LAUNCH_SURFACE}} (`website-live` or `pre-website`)
- Sales channels: {{CHANNELS}}
- Constraints: {{BUDGET_GUARDRAILS}}, {{TEAM_CAPACITY}}, {{STOCK_TIMELINE}}, {{NON_NEGOTIABLES}}

Research requirements:
1) Find direct and adjacent competitors in the same region and channels.
2) Extract benchmark ranges for price, conversion, CAC, AOV, gross margin, return rates, and launch velocity where available.
3) Identify demand signals and seasonality relevant to this category.
4) Build a transparent 90-day forecast with P10/P50/P90 scenarios using mode-appropriate metrics:
   - `website-live`: sessions, conversion rate, AOV, orders, gross revenue, gross margin, CAC.
   - `pre-website`: qualified leads, assisted order attempts, assisted conversion, pre-orders/deposits (if used), AOV proxy, gross revenue, gross margin, acquisition cost proxy.
5) Propose practical goals that maximize probability of early sales.
6) Identify critical unknowns and define week-1/week-2 measurements for rapid recalibration.

Output format (strict):
A) Executive summary (max 12 bullets)
B) Launch surface mode confirmation and metric set
C) Competitor benchmark table (with citations)
D) 90-day forecast table (P10/P50/P90)
E) Proposed goals (90-day plus weekly leading indicators)
F) Assumptions register (assumption, evidence, confidence, impact)
G) Risk register and mitigations
H) Validation checklist for first 14 days
I) Source list with URLs and access dates

Rules:
- Do not invent data.
- Distinguish observed data vs inferred estimate.
- Every numeric claim must have either a citation or a clearly labeled assumption.
- Prefer recent, region-relevant sources.
- Optimize for speed-to-first-sales over perfect infrastructure.
- If `pre-website`, do not force website-only funnel assumptions; map conversion to pre-site channels explicitly.
```

## Required Fields to Carry into Skill Output

When converting research into `forecast.user.md`, preserve:
- scenario tables (`P10/P50/P90`)
- explicit assumptions and confidence labels
- risks + mitigations
- citations for all external benchmarks
