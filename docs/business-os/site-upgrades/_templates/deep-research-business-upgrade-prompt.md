---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-23
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

Automatic mode policy (must enforce):
- If `launch-surface=website-live` and this is the first WEBSITE-02 brief for the business, treat it as **L1 Build 2**.
- For L1 Build 2, if the catalog is visual-first physical product (for example bags, fashion, accessories, footwear, jewelry, beauty) OR launch assortment is expected to be high-variant (about 40+ SKUs/variants), automatically apply **Image-First Merchandising Mode**.
- In Image-First Merchandising Mode, recommendations must prioritize photo-led storytelling, dense-but-premium product browsing, and PDP media depth before secondary copy enhancements.

Research requirements:
1) Decompose each reference site into reusable patterns across IA, PDP, conversion, trust, checkout, support, and retention mechanics.
2) For each pattern, assess user value and business value for this business (not generic ecommerce advice).
3) Evaluate platform fit against provided platform baseline and technical constraints.
4) Classify each pattern as Adopt, Adapt, Defer, or Reject with explicit rationale.
5) Produce concrete website design implications and technical implementation implications.
6) Produce prioritized backlog candidates (P1/P2/P3) with acceptance criteria and dependencies.
7) Include risks and open questions that must be resolved before lp-do-fact-find/plan.
8) When Image-First Merchandising Mode is active, build a world-class exemplar set and capture a reusable image shot-board:
   - Analyze at least 8 exemplar sites.
   - Include at least 24 concrete shot references across homepage, PLP, and PDP media patterns.
   - Keep evidence traceable to exact page URLs.

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
K) Exemplar image shot-board (required when Image-First Merchandising Mode is active)
   Columns: `Reference site | Page URL | Shot type (hero/PLP/PDP/detail/on-body/cross-sell/etc.) | Why it matters | Evidence (observed/inferred)`
L) Image-heavy launch contract
   Columns: `Surface | Required media behavior | Acceptance criteria | Dependency | Evidence refs`
   - Include explicit criteria for: homepage visual hierarchy, PLP image density, PDP media-set depth, and mobile gallery behavior.

Rules:
- Do not invent data.
- Every specific claim must be marked `observed` or `inferred`.
- Do not copy brand assets or copyrighted creative from reference sites.
- Focus on reusable patterns and user outcomes, not aesthetic cloning.
- Keep recommendations realistic for current launch surface and constraints.
- If evidence is weak or conflicting, say so and provide a fast validation step.
- For image-first mode, never return generic “use bigger images” guidance; return measurable merchandising contracts.
```

## Quality Bar (must pass)

Use output only if all conditions are true:

1. At least 6 reference sites are analyzed with concrete pattern evidence.
2. Best-of matrix contains at least 10 pattern rows.
3. At least 4 P1 backlog items include explicit acceptance criteria.
4. Source list includes URL + access date for every cited reference.
5. No section is left as generic advice without business-specific rationale.
6. If Image-First Merchandising Mode is active: at least 8 exemplar sites and at least 24 shot-board rows are present.
