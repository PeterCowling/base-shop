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
Skylar's public site (static Next.js app at `apps/skylar`) currently positions the company primarily as product design + China sourcing + custom distribution, with a secondary "flywheel" narrative and an Amalfi Coast hospitality portfolio as proof/testbed.

This fact-find defines a bolder, venture-studio-forward messaging set that:
- names our Startup Loop as the operating system behind speed and discipline,
- uses the repo portfolio as proof (operating vs in-build streams), and
- produces an implementable remove/replace delta for the Skylar website plus a promotion copy pack.

Constraint: we can be aggressive and confident, but we do not fabricate client logos, revenue numbers, headcount, "as seen in", fake testimonials, or fake case studies.

### Goals
- Reposition Skylar as an operator-led venture studio / business builder (not "a sourcing agency").
- Translate the Startup Loop from an internal workflow into buyer outcomes and engagement model.
- Produce a plan-ready content pack:
  - Website copy replacements (verbatim text for existing keys; plus optional new section copy).
  - Promotion copy: short bio, long bio, 30s pitch, 2-min pitch, pinned post, outbound email variants.
  - Claim -> proof -> placement ledger so bold claims stay defensible.

### Non-goals
- Shipping code changes in this fact-find.
- Full SEO keyword research or paid channel strategy (follow-up: `/lp-channels`, `/lp-seo`).

### Default Decisions (to keep this Ready-for-planning)
These defaults unblock planning. If wrong, the plan changes in specific ways (noted inline).

1. Primary external narrative: partner-facing venture studio ("build with us")
- If wrong (holding-company/portfolio narrative): home hero/CTA becomes "explore portfolio" and we reduce service language.

2. Portfolio naming: name the in-build streams publicly, but label them explicitly as "in build" (no revenue claims)
- If wrong (do not name): we keep the portfolio section generic ("operating" vs "in build") without business codes.

## Evidence Audit (Current State)
### Primary content sources (Skylar)
- Routes:
  - `apps/skylar/src/app/[lang]/page.tsx` (home route selection per locale)
  - `apps/skylar/src/app/[lang]/products/page.tsx`
  - `apps/skylar/src/app/[lang]/real-estate/page.tsx`
  - `apps/skylar/src/app/[lang]/people/page.tsx`
- Copy:
  - `apps/skylar/i18n/en.json`
  - `apps/skylar/i18n/it.json`
  - `apps/skylar/i18n/zh.json`
- Locale tone/visual guardrails:
  - `apps/skylar/AGENTS.en.md`, `apps/skylar/AGENTS.it.md`, `apps/skylar/AGENTS.zh.md`

### Portfolio + operating model sources
- Startup Loop workflow and stage list: `docs/business-os/startup-loop-workflow.user.md`
- Startup Loop external briefing (capability coverage + drift risk): `docs/business-os/startup-loop-current-vs-proposed.user.md`
- Business catalog: `docs/business-os/strategy/businesses.json`
- Selected business plans (operating vs in-build discipline):
  - BRIK: `docs/business-os/strategy/BRIK/plan.user.md`
  - PIPE: `docs/business-os/strategy/PIPE/plan.user.md`
  - HEAD: `docs/business-os/strategy/HEAD/plan.user.md`
  - HBAG: `docs/business-os/strategy/HBAG/plan.user.md`
  - XA: `docs/business-os/strategy/XA/plan.user.md`

### Baseline extract (EN - current copy)
These are the minimum "current state" lines reviewers should not have to dig out of JSON.

- Current identity line:
  - `hero.subhead`: "Product Design & China Sourcing"
  - `hero.support`: "Custom Distribution & Sales Platforms ... 3-Hour Website Launch ... Multilingual Markets"
  - `hero.copy`: "...design, source, and launch commerce experiences..."
- Current home intro framing:
  - `home.en.intro.column1.heading`: "The Flywheel"
  - `home.en.intro.column1.body`: hospitality cashflows -> invest in product -> platform -> real estate loop
- Current platform claim:
  - `services.list.platform`: "3-hour website launch with the Skylar platform."

### Current weaknesses (marketing)
- Startup Loop is not named or explained on the public site.
  - Evidence: no Startup Loop mention in `apps/skylar/i18n/en.json`.
- The site reads like a company profile (products + real estate) rather than a "we can build/launch" proposition.
- Portfolio breadth exists in the repo but is not presented as a coherent studio portfolio.

### Measurement/analytics finding
- Searched Skylar source for common analytics hooks (gtag/GTM/GA4 + plausible/fathom/segment/posthog/mixpanel/heap/amplitude) and found none under `apps/skylar/src`.

## Positioning (external)

### Positioning statement (forced hierarchy)
For founders/operators who want to launch something real (fast, multilingual, cross-border), Skylar is an operator-led venture studio that builds and launches businesses end-to-end.

Unlike agencies that hand off docs or factories that only ship boxes, we join up offer design, supply chain, distribution, and the platform layer, then run a weekly decision loop so work does not drift.

Because we operate our own portfolio and build the systems in-repo, we can move quickly while staying evidence-led.

### Vocabulary guardrails
Use consistently:
- venture studio, operator-led, build and launch, end-to-end, offer, supply chain, distribution, platforms, multilingual

Avoid or only use with proof:
- proprietary (prefer "internal" unless we are selling it as a product)
- battle-tested (prefer "used in our operating portfolio")
- launch in hours (must specify what launches in hours)
- forecasting (prefer "demand modeling" or "forecasting when needed" unless we are showing an artifact)

## Startup Loop translation (internal -> buyer outcomes)
The loop must be described in buyer language.

- Readiness gates -> "We will tell you 'not yet' fast, and exactly what to fix."
- Research/market intelligence -> "We do competitor/pricing/channel homework before we build."
- Offer design -> "We turn 'idea' into a sellable offer with pricing, objections, and packaging."
- Channels -> "We pick 2-3 launch channels and build the assets to test demand."
- Fact-find -> plan -> build -> "We reduce risk before coding and ship in controlled increments."
- QA + weekly decisioning -> "We ship, measure, and decide weekly: keep, pivot, scale, or kill."

External nuance: internal docs note contract drift risk (not capability gaps). We do not market "fragility"; we market the corollary: documented loop + explicit gates prevents drift.

## Portfolio framing (public-safe)
Recommended public vocabulary:
- Operating: Brikette (BRIK) + Amalfi Coast hospitality assets (proof of operations complexity)
- In build: PIPE / HEAD / HBAG / XA (explicitly "in build"; no revenue claims)

## Claim -> Proof -> Placement Ledger
This is the enforcement mechanism for bold copy.

| Claim (exact phrase) | Where used | Proof hook (repo evidence) | Publicly linkable | Risk | Safer fallback |
|---|---|---|---|---|---|
| "Operator-led venture studio" | Home hero, pinned post, outreach | `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/strategy/businesses.json` | Partial (site only) | Med | "Operator-led studio" |
| "Build and launch businesses end-to-end" | Home hero, products hero, outreach | `docs/business-os/startup-loop-workflow.user.md` | Partial | Med | "We can take a business from idea to launch" |
| "3-hour website launch" | Home support, products page | Existing Skylar claim: `apps/skylar/i18n/en.json`; 3-hour target docs: `docs/plans/archive/launch-shop-pipeline-plan.md` (operator-controlled clock) | No | High | "Launch a clean multilingual site fast (hours, not weeks)" |
| "Multilingual by default" | Home support, platform section | Skylar has 3 locales: `apps/skylar/i18n/*.json` | Yes (site) | Low | n/a |
| "We operate Brikette" | Home/real-estate | BRIK plan: `docs/business-os/strategy/BRIK/plan.user.md` | Yes (Brikette site) | Low | n/a |
| "Used in our operating portfolio" | Platform section | Portfolio apps exist under `apps/*` | Partial | Low | n/a |
| "Forecasting / demand modeling" | Capability bullets (not hero) | Forecast stage exists: `docs/business-os/startup-loop-workflow.user.md` | No | Med | "Demand modeling when needed" |

Notes:
- Any claim marked High risk must have a proof hook on-page (portfolio tile, artifact excerpt, or scoped wording).

## Remove/Replace Delta (website)

### Release sequence (recommended)
- Release 1: Copy-only reposition + proof hooks + UTMs (fast deploy, low engineering risk).
- Release 2: Add Loop poster + Portfolio map section (structure change to hit the "10 seconds" comprehension goal).

### Page-by-page checklist (Release 1)
Home (`/[lang]`)
- Hero: category, promise, support line, CTA labels
- Intro columns: replace flywheel-first narrative with loop-first narrative
- Services section: shift from "what we do" to "capability stack" and add proof hooks
- Story sections: reframe from "we sell the things we make" to "we operate what we build"

Products (`/[lang]/products`)
- Reframe from catalog/services into a venture studio capability stack with clear engagement model
- Ensure "3-hour" claim is scoped (marketing site vs full commerce)

Real estate (`/[lang]/real-estate`)
- Demote to proof/lab (unless you intend to sell hospitality services)
- Make the "operating lab" framing explicit

People (`/[lang]/people`)
- Shift identity from "designers/sourcers" to "operators"
- Add an explicit "how we work" line (what an engagement looks like)

Global
- Metadata: titles/descriptions should align with venture studio positioning
- CTAs: every primary CTA should be measurable (UTM links; contact intent)

### Implementable copy pack (EN - Release 1)
This section provides verbatim replacements for existing keys. (IT/ZH: translate after EN locks.)

Home hero and identity
- `hero.subhead`:
  - NEW: "Venture Studio: Build and Launch Businesses"
- `hero.support`:
  - NEW: "Offer | Supply Chain | Distribution | Platforms | Multilingual by default"
- `hero.copy`:
  - NEW: "Skylar is an operator-led venture studio. We build and launch businesses across China, Italy, and multilingual markets by joining up offer design, supply chain, distribution, and the platform layer. Behind the scenes we run a documented Startup Loop with explicit gates so work stays fast, evidence-led, and does not drift."

Home intro (replace Flywheel -> Loop)
- `home.en.intro.column1.heading`:
  - NEW: "The Startup Loop"
- `home.en.intro.column1.body`:
  - NEW: "We do not build on vibes. We start with readiness gates, then do research and demand modeling, turn the idea into a sellable offer, pick channels, and ship. After launch we measure and decide weekly: keep, pivot, scale, or kill. The loop is documented so execution stays disciplined even when the work is ambitious."

Home hero headline/body (first fold)
- `home.en.hero.heading`:
  - NEW: "Build. Launch. Operate."
- `home.en.hero.body`:
  - NEW: "Cross-border supply chain + distribution + platforms, wired together under one loop."

Services section
- `services.heading`:
  - NEW: "Capabilities (the stack)"
- `services.intro`:
  - NEW: "Offer design, China sourcing, distribution, and fast multilingual launches. Built and used in our own operating portfolio."
- `services.list.platform`:
  - NEW: "Launch a clean multilingual site fast (hours, not weeks) on our internal platform."

Products page hero (tighten scope)
- `products.en.hero.body`:
  - NEW: "We build and launch commerce and hospitality businesses by joining up product work, supply chain, distribution, and the platform layer. When we say end-to-end, we mean from brief to factory to front door, then weekly iteration based on measured signal."

People page hero
- `people.en.hero.body`:
  - NEW: "Two operators driving one loop. Cristiana leads product research, operations, and quality across the portfolio. Peter leads platforms, commercial strategy, and delivery so every product line and property stays connected - and the work ships."

Real estate hero (as proof/lab)
- `realEstate.en.hero.body`:
  - NEW: "We operate a diversified hospitality portfolio along the Amalfi Coast. It is not just real estate - it is an operating lab where we test service playbooks, logistics, and platform systems under real customer load, then feed those learnings back into our product and platform work."

### Release 2 (Option B): Loop + Portfolio sections
Add 1-2 new home sections:
- "THE LOOP": 6-8 bullets + one paragraph + proof tiles
- "PORTFOLIO": Operating vs In build grid

Implementation note (where it lives): `apps/skylar/src/components/typo-home/EnglishHome.tsx` (and IT/ZH variants depending on locale home).

## Promotion pack (EN - draft, plan-ready)

### One-liner
Skylar is an operator-led venture studio: we build and launch businesses end-to-end under a documented Startup Loop.

### Short bio (50-80 words)
Skylar is an operator-led venture studio based between Italy and China. We build and launch businesses end-to-end: offer design, supply chain, distribution, and the platform layer. We operate our own portfolio in hospitality and commerce, and we run a documented Startup Loop with explicit gates so execution stays fast and evidence-led.

### Long bio (150-250 words)
Skylar is an operator-led venture studio operating between Italy and China. We build and launch businesses end-to-end by joining up the pieces that usually break when teams scale: offer clarity, supply chain, distribution, and the platform layer.

Our work is grounded in operations, not decks. We operate a real portfolio across hospitality and commerce, and we build the systems that run it. That operator reality is why we are disciplined about execution: we run a documented Startup Loop with explicit gates (readiness, research, demand modeling, offer, channels, build, QA, weekly decisions) so work does not drift and we can move quickly without making promises we cannot keep.

If you are building something cross-border, multilingual, or multi-channel, we can accelerate your path from idea to launch - and tell you fast when something is not ready.

### 30-second pitch
We build and launch businesses end-to-end. Skylar joins up offer design, supply chain, distribution, and the platform layer so you can move fast across China, Italy, and multilingual markets. Behind the scenes we run a documented Startup Loop with explicit gates, then weekly keep/pivot/scale decisions - so execution stays disciplined and measurable.

### 2-minute pitch
Skylar is an operator-led venture studio. We build and launch businesses end-to-end by joining up four things that are usually fragmented: offer clarity, supply chain, distribution, and platforms.

We are not an agency that hands you a deck. We operate our own portfolio in hospitality and commerce, and we build the systems that run it. That is the point: we learn by operating, then bake those learnings back into a repeatable loop.

Internally we call it the Startup Loop. It is a documented process with explicit gates: readiness (what must be true to proceed), research and demand modeling, offer design, channel selection, fact-find, plan, build, QA, then weekly decisions based on signal. The goal is simple: ship fast without drifting into vague work.

If you are building something cross-border or multilingual, we can help you get to a real launch faster, with fewer blind spots. And if it is not ready, we will tell you early and exactly what to fix.

### Pinned post (LinkedIn)
We build businesses like software.

Skylar is an operator-led venture studio. We join up offer design, China sourcing, distribution, and platforms - then run a documented loop so execution stays fast and evidence-led.

Operating portfolio (proof): hospitality + commerce.
In build: new product streams with explicit outcomes.

If you are launching cross-border or multilingual, and you want an operator team that ships, message me.

### Outbound email (partner/founder)
Subject: Operator-led venture studio (fast, multilingual, evidence-led)

Hi <Name>,

I run Skylar. We are an operator-led venture studio: we build and launch businesses end-to-end (offer, supply chain, distribution, platform).

We run a documented Startup Loop with explicit gates so work stays measurable: readiness -> research/demand modeling -> offer -> channels -> build + QA -> weekly keep/pivot/scale decisions.

If you are working on <category> and need cross-border or multilingual execution, open to a 15-minute call next week? If it is not a fit, I will tell you quickly.

Best,
<Signature>

## Minimum viable measurement spec (plan seed)
Even without analytics tooling, we can measure promotion effectiveness.

1. UTM taxonomy (required immediately)
- `utm_source`: linkedin | email | whatsapp | partner | referral
- `utm_medium`: social | outbound | message | bio
- `utm_campaign`: skylar-venture-studio-2026-02
- `utm_content`: hero-variant-a | hero-variant-b | pitch-30s | pitch-2m

2. CTA inventory (must be UTM-tagged)
- Primary: contact CTA (email or form)
- Secondary: portfolio CTAs (Brikette, real estate)

3. Manual outbound log (minimum)
- Fields: date, target, segment, message variant, link (with UTM), reply quality (0-3), next step

## Risks & mitigations
- Risk: Overclaiming "operating" status for streams that are explicitly pre-revenue.
  - Mitigation: "Operating" only for BRIK + hospitality assets; label others "in build".
- Risk: Confusion about what Skylar sells (services vs platform vs portfolio).
  - Mitigation: enforce CTA architecture (Partner | Platform | Portfolio) and reduce identity soup.
- Risk: "3-hour" claim reads like hype.
  - Mitigation: scope it (what launches in hours) and/or phrase as "hours, not weeks" unless we are ready to defend the full claim.
- Risk: No analytics baseline.
  - Mitigation: UTMs + outbound log now; analytics later.

## Confidence inputs (for /lp-plan)
- Implementation: 85
  - Copy-only changes are straightforward in `apps/skylar/i18n/*.json`.
- Approach: 82
  - Venture studio positioning is consistent with Startup Loop + portfolio. Remaining risk is identity soup if we do not impose hierarchy.
- Impact: 78
  - Messaging changes affect trust and conversion; measurement is currently weak.
- Delivery readiness: 85
  - Clear surfaces (site + outbound). Needs a measurement spec (defined above) and a translation workflow decision.

What would make this >=90
- Confirm whether we are explicitly selling "studio services" vs keeping it portfolio-forward.
- Decide whether Release 2 (Loop + Portfolio sections) is in scope for the first deploy.
- Decide IT/ZH shipping rule: same deploy vs EN-first.

## Open questions (remaining)
These are not blockers (defaults are set), but they change plan tasks.

1. Do you want the primary CTA to be (a) email/DM (low friction) or (b) a structured partner intake form (higher intent, more measurable)?
2. Should the Skylar site explicitly list PIPE/HEAD/HBAG/XA by name on day 1, or only show "in build" generically?

## Planning readiness
Ready-for-planning.
