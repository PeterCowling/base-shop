---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-12
---

# Deep Research Prompt — Business Site Upgrade Brief

Replace all `{{...}}` placeholders, then submit to Deep Research.

```text
You are a website-upgrade synthesis analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Site Upgrade Brief for:
- Business code: {{BUSINESS_CODE}}
- Business name: {{BUSINESS_NAME}}
- Region: {{REGION}} (primary country: {{COUNTRY}})
- Launch-surface mode: {{LAUNCH_SURFACE}} (`pre-website` or `website-live`)

Input packet:
- Current business outcome contract: {{OUTCOME_CONTRACT}}
- Startup constraints and non-negotiables: {{CONSTRAINTS}}
- Existing site/product surface baseline: {{EXISTING_SITE_BASELINE}}
- Reference websites to mine: {{REFERENCE_SITES}}
- Platform capability baseline summary: {{PLATFORM_BASELINE_SUMMARY}}
- Current market intelligence summary: {{MARKET_INTELLIGENCE_SUMMARY}}
- Known technical constraints (repo/platform/tooling): {{TECH_CONSTRAINTS}}

Research requirements:
1) Decompose each reference site into reusable patterns across IA, PDP, conversion, trust, checkout, support, and retention mechanics.
2) For each pattern, assess user value and business value for this business (not generic ecommerce advice).
3) Evaluate platform fit against provided platform baseline and technical constraints.
4) Classify each pattern as Adopt, Adapt, Defer, or Reject with explicit rationale.
5) Produce concrete website design implications and technical implementation implications.
6) Produce prioritized backlog candidates (P1/P2/P3) with acceptance criteria and dependencies.
7) Include risks and open questions that must be resolved before lp-fact-find/plan.

Output format (strict):
A) Executive summary (max 12 bullets)
B) Business outcome frame and constraints
C) Existing site baseline assessment
D) Reference-site pattern decomposition table
   Columns: `Reference site | Pattern | Why it matters | Evidence (observed/inferred)`
E) Best-of synthesis matrix (Adopt/Adapt/Defer/Reject)
   Columns: `Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification | Rationale`
F) Design implications checklist
G) Technical implications checklist
H) Prioritized backlog candidates (P1/P2/P3)
   Columns: `Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs`
I) Open questions and risk notes
J) Source list with URLs and access dates

Rules:
- Do not invent data.
- Every specific claim must be marked `observed` or `inferred`.
- Do not copy brand assets or copyrighted creative from reference sites.
- Focus on reusable patterns and user outcomes, not aesthetic cloning.
- Keep recommendations realistic for current launch surface and constraints.
- If evidence is weak or conflicting, say so and provide a fast validation step.
```

## Quality Bar (must pass)

Use output only if all conditions are true:

1. At least 6 reference sites are analyzed with concrete pattern evidence.
2. Best-of matrix contains at least 10 pattern rows.
3. At least 4 P1 backlog items include explicit acceptance criteria.
4. Source list includes URL + access date for every cited reference.
5. No section is left as generic advice without business-specific rationale.
