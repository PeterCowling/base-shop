---
Type: Deep-Research-Prompt
Status: Active
Business: HBAG
Date: 2026-02-23
Owner: Pete
Mode: WEBSITE-02-L1-Build-2
Image-First-Merchandising-Mode: Active
Target-Output: docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md
---

# HBAG Deep Research Prompt (Site Upgrade)

Use the prompt below directly in Deep Research.

Mode declaration:
- WEBSITE-02 phase: `L1 Build 2`
- Image-First Merchandising Auto-Mode: `ACTIVE`

```text
You are a website-upgrade synthesis analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Site Upgrade Brief for:
- Business code: HBAG
- Business name: Caryina
- Region: Europe (primary country: Italy)
- Launch-surface mode: website-live (`pre-website` or `website-live`)

Input packet:
- Current business outcome contract:
  Move Caryina from proven WhatsApp demand to a scalable owned channel (website + Etsy), validating that premium €80–€150 positioning converts at volume without manual order handling.
- Startup constraints and non-negotiables:
  - Keep product imagery primary; copy and chrome must remain recessive behind product visuals.
  - Preserve brand language and token contract from `docs/business-os/strategy/HBAG/brand-dossier.user.md`.
  - No pattern recommendations that require heavy runtime dependencies or WebGL libraries.
  - Mobile-first behavior is mandatory; discovery traffic is social-first.
  - Keep accessibility intact (`prefers-reduced-motion`, semantic DOM, keyboard/focus parity).
- Existing site/product surface baseline:
  - Caryina app exists and is live as a route skeleton in `apps/caryina/src/app/[lang]/`.
  - Current PLP/PDP are text-forward placeholders with minimal image storytelling (`apps/caryina/src/app/[lang]/shop/page.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`).
  - Brand identity and typography are active, but visual merchandising depth is not yet implemented.
- Reference websites to mine:
  - https://www.loewe.com/usa/en/women/bags/
  - https://www.bottegaveneta.com/en-us/search?cgid=women-bags-cabat
  - https://www.coach.com/shop/women/handbags
  - https://us.strathberry.com/collections/all-bags
  - https://eng.polene-paris.com/collections/numero-un
  - https://www.longchamp.com/us/en/women/bags/
  - https://www.mulberry.com/us/shop/women/bags/alexa
  - https://www.demellierlondon.com/collections/all-bags
  - https://www.mansurgavriel.com/collections/bags
- Platform capability baseline summary:
  - Active baseline pointer: `docs/business-os/platform-capability/latest.user.md`
  - Baseline source: `docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.md`
  - Platform supports fast startup-loop delivery with reusable frontend primitives and markdown/html artifact workflows.
- Current market intelligence summary:
  - HBAG market research indicates strong visual demand and price-pressure from low-cost lookalikes.
  - Premium conversion depends on photography quality, hardware-detail proof, and trust clarity.
  - Sources: `docs/business-os/market-research/HBAG/latest.user.md` and MARKET-01..05 artifacts.
- Known technical constraints (repo/platform/tooling):
  - Existing implementation target is Next.js app router (`apps/caryina`).
  - Keep bundle and runtime complexity controlled; prefer existing platform patterns.
  - Recommendations must be testable with current repo validation practices.

Automatic mode policy (must enforce):
- This run is WEBSITE-02 first cycle for HBAG and must be treated as L1 Build 2.
- Catalog is visual-first physical product (bags/accessories) with planned high-variant launch (~60 variants), so Image-First Merchandising Mode is active.
- Recommendations must prioritize photo-led storytelling, dense-but-premium browsing, and PDP media depth before secondary copy enhancements.

Research requirements:
1) Decompose each reference site into reusable patterns across IA, PDP, conversion, trust, checkout, support, and retention mechanics.
2) For each pattern, assess user value and business value for HBAG (not generic ecommerce advice).
3) Evaluate platform fit against provided platform baseline and technical constraints.
4) Classify each pattern as Adopt, Adapt, Defer, or Reject with explicit rationale.
5) Produce concrete website design implications and technical implementation implications.
6) Produce prioritized backlog candidates (P1/P2/P3) with acceptance criteria and dependencies.
7) Include risks and open questions that must be resolved before lp-do-fact-find/plan.
8) Build a world-class exemplar set and capture a reusable image shot-board:
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
K) Exemplar image shot-board
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
- Never return generic “use bigger images” guidance; return measurable merchandising contracts.
```

After Deep Research returns:
1. Save result to `docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md` (or newer dated equivalent).
2. Set status to `Active` when decision-grade.
3. Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md`
