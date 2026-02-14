---
Type: Deep-Research-Prompt
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
Target-Output: docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md
---

# BRIK Deep Research Prompt (Site Upgrade)

Use the prompt below directly in Deep Research.

```text
You are a website-upgrade synthesis analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Site Upgrade Brief for:
- Business code: BRIK
- Business name: Brikette
- Region: Europe (primary country: Italy)
- Launch-surface mode: website-live (`pre-website` or `website-live`)

Input packet:
- Current business outcome contract:
  Establish reliable, measurable booking funnel performance and operational reliability, then improve conversion with weekly evidence-led decisions.
- Startup constraints and non-negotiables:
  - Do not optimize blindly without measurement baseline.
  - Prioritize conversion and reliability outcomes over cosmetic-only work.
  - Preserve multi-locale usability and trust.
- Existing site/product surface baseline:
  - Website is live with substantial multilingual content footprint.
  - Measurement baseline is currently incomplete in canonical planning docs.
  - Reception/booking support reliability is an active concern.
- Historical performance baseline (mandatory):
  - docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md
- Reference websites to mine:
  - https://www.hostelworld.com/
  - https://www.booking.com/
  - https://www.airbnb.com/
  - https://www.generatorhostels.com/
  - https://www.meininger-hotels.com/
  - https://www.selina.com/
  - https://www.st-christophers.co.uk/
  - https://www.aohostels.com/
- Platform capability baseline summary:
  - Shared platform components and patterns exist.
  - Startup-loop preference is fast delivery on concrete sales/conversion outcomes.
  - Browser-rendered markdown companions are available for operations visibility.
- Current market intelligence summary:
  - BRIK external market intelligence is currently seed-level and requires this Deep Research pass.
- Known technical constraints (repo/platform/tooling):
  - Work must align with existing monorepo/platform patterns.
  - No heavy CMS-first dependency for startup-speed lanes.
  - Validation and observability are required for launch-impact changes.
  - GA4 data is missing/partial; recommendations must use historical booking/cancellation and Cloudflare evidence where available.

Research requirements:
1) Decompose each reference site into reusable patterns across IA, PDP, conversion, trust, checkout, support, and retention mechanics.
2) For each pattern, assess user value and business value for BRIK (not generic ecommerce advice).
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
   Columns: Reference site | Pattern | Why it matters | Evidence (observed/inferred)
E) Best-of synthesis matrix (Adopt/Adapt/Defer/Reject)
   Columns: Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification | Rationale
F) Design implications checklist
G) Technical implications checklist
H) Prioritized backlog candidates (P1/P2/P3)
   Columns: Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs
I) Open questions and risk notes
J) Source list with URLs and access dates

Rules:
- Do not invent data.
- Every specific claim must be marked observed or inferred.
- Do not copy brand assets or copyrighted creative from reference sites.
- Focus on reusable patterns and user outcomes, not aesthetic cloning.
- Keep recommendations realistic for current launch surface and constraints.
- If evidence is weak or conflicting, say so and provide a fast validation step.
- Existing-business rule: prioritize patterns that can measurably improve booked-conversion and cancellation outcomes using available historical baseline evidence.
- If mandatory baseline input is absent or empty, return `Status: BLOCKED` with exact missing data fields before giving recommendations.
```

After Deep Research returns:
1. Save result to `docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md` (or newer dated equivalent).
2. Set status to `Active` when decision-grade.
3. Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`
