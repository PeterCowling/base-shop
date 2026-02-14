---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Marketing
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: skylar-marketing-promotion
Deliverable-Type: marketing-asset
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /draft-marketing
Supporting-Skills: /lp-build, /lp-channels, /lp-seo
Related-Plan: docs/plans/skylar-marketing-promotion/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Skylar Marketing + Promotion Content Fact-Find

## Scope
### Summary
Skylar's public site (static Next.js app at `apps/skylar`) currently positions the company primarily as **product design + China sourcing + custom distribution**, with a secondary "flywheel" narrative and an Amalfi Coast hospitality portfolio as proof/testbed.

This fact-find defines a bolder, venture-studio-forward messaging set that:
- explicitly names our **Startup Loop** as the operating system for building and launching businesses,
- pulls proof points from the repo's portfolio (operating businesses + active build streams), and
- provides a concrete **remove/replace** content delta for the Skylar website and a promotion pack (bios, pitches, outbound templates).

Important constraint: we can be aggressive and confident, but we should not fabricate client logos, revenue numbers, headcount, "as seen in", or fake testimonials. The recommended voice is "bold + specific + verifiable".

### Goals
- Reposition Skylar as a **venture studio / business builder** (not just sourcing/design).
- Turn the Startup Loop into an external-facing capability narrative: "we build businesses like software".
- Produce a ready-to-implement content pack:
 - Website copy replacements (EN first; IT/ZH either translated or queued).
 - Promotion copy: short bio, long bio, 30s pitch, 2-min pitch, outreach email, and "capability bullets".
- Identify what existing Skylar content should be removed or demoted to avoid diluted positioning.

### Non-goals
- Writing or shipping code changes to `apps/skylar` in this fact-find.
- Producing a full channel strategy, ad plan, or SEO keyword research (can be a follow-up via `/lp-channels` and `/lp-seo`).

### Constraints & Assumptions
- Constraints:
 - Skylar is deployed as a fully static reference site (Cloudflare Pages) with content in `apps/skylar/i18n/*.json`. Evidence: `apps/skylar/AGENTS.md`.
 - The public narrative must remain consistent with the actual portfolio and systems we operate/build.
- Assumptions:
 - The primary surface for this work is `https://skylarsrl.com` (home, products/platforms, real estate, people).
 - We want one "aggressive, company-builder" voice across EN/IT/ZH, adapted per locale style guides.

## Evidence Audit (Current State)
### Surfaces + content entry points
- Site app and content:
 - `apps/skylar/src/app/[lang]/page.tsx` (home route selection per locale)
 - `apps/skylar/i18n/en.json`, `apps/skylar/i18n/it.json`, `apps/skylar/i18n/zh.json` (primary marketing copy)
 - `apps/skylar/AGENTS.md` + locale style guides: `apps/skylar/AGENTS.en.md`, `apps/skylar/AGENTS.it.md`, `apps/skylar/AGENTS.zh.md`
- Portfolio + operating model evidence:
 - Startup Loop workflow and capabilities: `docs/business-os/startup-loop-workflow.user.md`
 - Startup Loop external reviewer briefing (capabilities list and reliability gaps): `docs/business-os/startup-loop-current-vs-proposed.user.md`
 - Business catalog and what exists today: `docs/business-os/strategy/businesses.json`
 - Business plans (operating vs in-progress signals):
 - `docs/business-os/strategy/BRIK/plan.user.md`
 - `docs/business-os/strategy/PIPE/plan.user.md`
 - `docs/business-os/strategy/HBAG/plan.user.md`
 - `docs/business-os/strategy/HEAD/plan.user.md`
 - `docs/business-os/strategy/XA/plan.user.md`

### Current Skylar positioning (what it says today)
Skylar already contains several "bold" claims that are usable as a foundation:
- "3-hour website launch with the Skylar platform." Evidence: `apps/skylar/i18n/en.json` (`services.list.platform`, `products.en.threeHour.*`) and `apps/skylar/i18n/it.json`, `apps/skylar/i18n/zh.json` equivalents.
- "We design and source our own catalog... sell through Amazon, Etsy, and our own storefronts... while operating Hostel Brikette..." Evidence: `apps/skylar/i18n/en.json` (`home.en.hero.rightBody`).
- Real estate portfolio as a systems + experiments testbed. Evidence: `apps/skylar/i18n/en.json` (`realEstate.en.stack.cards.experiments.body`).

Where it is currently weak for "company builder":
- Startup Loop is not named or explained on the public site, despite being a repo-level operating system. Evidence: no Startup Loop mention in `apps/skylar/i18n/en.json`.
- The site reads like a company profile (products + real estate) rather than a "we can launch your business / we can build businesses end-to-end" statement.
- Portfolio breadth (BRIK, PIPE, HEAD, HBAG, XA) is not presented as a coherent venture studio portfolio.

### Startup Loop capabilities (what we can credibly claim)
From `docs/business-os/startup-loop-workflow.user.md` and the external briefing `docs/business-os/startup-loop-current-vs-proposed.user.md`, we can credibly describe Skylar as having a structured loop that covers:
- readiness gates,
- research and forecasting,
- offer design + channel strategy,
- a fact-find -> plan -> build delivery chain,
- QA gates and a weekly decision loop.

Important nuance for marketing: the system has "strong capability coverage" but also explicitly documents current fragility as contract drift (not missing capability). Evidence: `docs/business-os/startup-loop-current-vs-proposed.user.md`.

### Portfolio inventory (what exists, what is in progress)
The repo's business catalog gives us a clean external "portfolio map" to reference:
- Operating business: Brikette (BRIK) (travel/hospitality + multilingual e-commerce). Evidence: `docs/business-os/strategy/businesses.json` and `docs/business-os/strategy/BRIK/plan.user.md`.
- Operating/business streams in active build:
 - Product Pipeline (PIPE) (sourcing-to-EU multi-channel pipeline) but explicitly "ZERO revenue" currently. Evidence: `docs/business-os/strategy/PIPE/plan.user.md`.
 - Headband (HEAD) and Handbag Accessory (HBAG) as dedicated outcome-tracked streams. Evidence: `docs/business-os/strategy/HEAD/plan.user.md`, `docs/business-os/strategy/HBAG/plan.user.md`.
 - XA as a separate execution stream (channel/brand-specific). Evidence: `docs/business-os/strategy/XA/plan.user.md`.

Marketing implication: we should distinguish "operating businesses" vs "in build" to avoid overclaiming.

## Delivery & Channel Landscape
### Intended audiences (recommended segmentation)
- **Founders/partners** who want to build and launch a business quickly with an operator-led team.
- **Factories/suppliers/logistics partners** who need clarity on the chain (design -> sourcing -> cross-border -> distribution).
- **Talent/contractors** who want to understand the internal machine (process discipline, speed, quality bar).

### Primary surfaces
- Skylar website copy (EN/IT/ZH): `apps/skylar/i18n/*.json`.
- Lightweight outbound assets:
 - Email outreach template
 - LinkedIn bio + "pinned post" copy
 - One-page "capabilities" blurb (can live as a section on `/products`)

### Measurement hooks (current gap)
Skylar is a static reference site with no obvious analytics hooks found in the app source. Evidence: no GA4/gtag usage found under `apps/skylar/src`. This makes "promotion" hard to measure.

Recommendation: add minimal measurement (e.g. privacy-respecting pageview + contact-click tracking) in a later build step, or at minimum standardized UTM links for all outbound.

## Hypothesis & Validation Landscape
### Key hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Visitors will understand Skylar as a venture studio (not a sourcing agency) within 10 seconds. | Home hero + intro copy updates | Low (copy deploy) | 1-3 days (qualitative review) |
| H2 | "Startup Loop" framing increases inbound quality (partner/founder conversations). | Clear CTA + loop explanation + portfolio proof | Medium (time cost + outreach) | 2-4 weeks |
| H3 | Aggressive capability framing will not create trust loss. | Truthful claims + proof mapping | Medium (reputational) | 2-8 weeks |

### Existing signal coverage
- None found in repo for Skylar inbound metrics (no analytics baseline).

### Recommended validation approach
- Quick probe: ship EN copy changes + update CTA links with UTMs; do 10-20 outbound messages; manually log response quality.
- Structured test: add a simple contact/intake form and track conversion funnels (future work).

## Remove/Replace Delta (Website)
This section is intentionally concrete: it lists what we should remove/demote and what we should replace it with.

### Option A (copy-only, minimal code risk)
Change translations only (no layout changes) to shift positioning.

Remove/demote themes:
- "Product design & China sourcing" as the primary identity line.
- Product category emphasis as the main story on the home page.

Replace with:
- "Venture studio" and "business builder" identity.
- Startup Loop explanation as the operating system behind the speed/quality claims.

Suggested key-level replacements (EN)
- `apps/skylar/i18n/en.json`:
 - `hero.subhead`: change to "Venture Studio: Build and Launch Businesses".
 - `hero.support`: change to a sharper capability line: "Offer + Supply Chain + Distribution + Platforms | Multilingual by default | Launch in hours".
 - `hero.copy`: rewrite to explicitly say we build and launch businesses using the Startup Loop.
 - `home.en.intro.column1.heading`: "The Flywheel" -> "The Startup Loop".
 - `home.en.intro.column1.body`: replace with a plain-language 5-7 sentence summary of the loop (readiness -> research -> offer -> channels -> build -> QA -> weekly decisioning).
 - `home.en.story2.heading/body`: shift from "We sell the things we make" to "We operate what we build" and connect to portfolio.

Notes:
- This option is the fastest path to a bold reposition while staying within existing design constraints.
- IT/ZH should be updated with equivalent meaning, but can lag by one deploy if needed.

### Option B (add a dedicated "Loop + Portfolio" section)
Add 1-2 new home sections:
- "THE LOOP" poster section: 6-8 bullets + one paragraph.
- "PORTFOLIO" section that lists operating vs in-build streams.

This requires code changes to `apps/skylar/src/components/typo-home/EnglishHome.tsx` (and possibly IT/ZH home variants) plus new translation keys.

## Promotion Pack (Draft Copy, EN)
These are "ship-ready" text blocks designed to be aggressive but defensible.

### One-liner
Skylar is a venture studio: we design the offer, build the platform, wire the distribution, and run the weekly decision loop.

### 30-second pitch
We build and launch businesses end-to-end. Skylar combines product strategy and China sourcing with distribution systems and a proprietary platform that can spin up a multilingual website in hours. Behind the scenes we run a disciplined Startup Loop: readiness gates, research, forecasting, channel plans, build and QA, then weekly keep/pivot/scale decisions. We operate our own hospitality and commerce portfolio, so the systems are battle-tested, not theoretical.

### Capability bullets (for bios / proposals)
- Venture studio operating system (Startup Loop): research, forecasting, offer, channels, build, QA, weekly decisioning.
- Supply chain: design + China sourcing + sampling + quality + cross-border execution.
- Distribution: multi-channel mapping (DTC + marketplaces + partners).
- Platforms: "3-hour website launch" with multilingual-ready content architecture.
- Operator-led: you work with the principals who run the work.

### Outbound email (partner/founder)
Subject: We build businesses end-to-end (fast, multilingual, operator-led)

Hi <Name>,

I run Skylar. We're a venture studio that builds and launches businesses end-to-end: offer design, supply chain, distribution, and the platform layer.

We've built an internal Startup Loop that keeps execution fast and evidence-led: readiness gates, research, forecasting, channel plan, build + QA, then weekly keep/pivot/scale decisions.

If you're working on <their category>, I'd like to compare notes and see if we can accelerate your path to launch. If it's not a fit, I'll tell you quickly.

Best,
<Signature>

## Risks & Mitigations
- Risk: Overclaiming "operating" status for streams that are explicitly pre-revenue.
 - Mitigation: Use "operating portfolio" only for BRIK; use "in build" language for PIPE/HEAD/HBAG/XA.
- Risk: "Fake it until you make it" voice creates trust debt.
 - Mitigation: Pair every bold claim with a proof hook (portfolio, system, or artifact) and avoid numbers unless measured.
- Risk: No measurement baseline for Skylar promotion effectiveness.
 - Mitigation: add UTMs immediately; consider minimal analytics in a follow-up build.

## Confidence Inputs (for /lp-plan)
- Implementation: 85
 - Reason: Copy changes are mechanically simple (i18n keys). Adding new sections is moderate, but still contained to `apps/skylar`.
- Approach: 80
 - Reason: Venture-studio positioning is consistent with the Startup Loop and portfolio, but needs an explicit decision on the target customer (partners/founders vs customers vs suppliers).
- Impact: 75
 - Reason: Messaging changes affect brand trust; no analytics makes outcome measurement weaker.
- Delivery-Readiness: 85
 - Reason: Clear surface (Skylar website + outbound templates). Missing: measurement plan + translation workflow decision.

What would make this >=90:
- Confirm target audience priority order (1-3), and whether we want to sell "venture studio services" vs "portfolio narrative only".
- Decide whether IT/ZH ship in the same deploy or can lag.
- Add a minimal measurement plan (UTMs at minimum; optionally lightweight analytics).

## Task Seeds (for /lp-plan)
- Update EN copy keys (home + products + people) to reposition as venture studio + Startup Loop.
- Produce IT/ZH equivalents (either human translation pass or use internal translation pipeline).
- Add a "Loop + Portfolio" section (Option B) if we want the strongest reposition.
- Add UTMs to all primary CTAs; optionally add minimal analytics.

## Open Questions (User Input Needed)
1. Primary audience: do you want Skylar to read as a partner-facing venture studio (build with us) or a portfolio-facing holding company (here's what we operate)?
2. Do we want to explicitly name portfolio streams (PIPE/HEAD/HBAG/XA) on the public site, or keep them implicit until they are revenue-positive?

## Planning Readiness
Ready-for-planning.
