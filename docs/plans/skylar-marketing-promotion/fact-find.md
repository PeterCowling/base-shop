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
Supporting-Skills: /lp-do-build, /lp-channels, /lp-seo
Related-Plan: docs/plans/skylar-marketing-promotion/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Skylar Marketing + Promotion Content Fact-Find

## Scope
### Summary
Skylar's public site (static Next.js app at `apps/skylar`) currently reads as a company profile: products + platforms + real estate + people. It does not clearly encode the highest-level identity decision that drives marketing: Skylar builds and operates its own ventures (not for hire).

This fact-find defines an aggressive but defensible messaging set that:
- names the Startup Loop as the operating discipline behind speed and decision-quality,
- uses the repo portfolio as proof (operating assets vs in-build streams), and
- produces an implementable remove/replace delta for the Skylar website plus a promotion copy pack.

Constraint: we can be bold, but we do not fabricate client logos, revenue numbers, headcount, "as seen in", fake testimonials, or fake case studies.

### Goals
- Remove "for-hire" positioning and enforce "operator-led portfolio builder" hierarchy.
- Translate the Startup Loop from an internal workflow into buyer outcomes for the three real audiences.
- Produce a plan-ready content pack:
  - Website copy replacements (verbatim text for existing keys; plus optional new section copy).
  - Promotion copy split by audience: customers, suppliers, financial providers.
  - Claim -> proof -> placement ledger so bold claims stay defensible.

### Non-goals
- Shipping code changes in this fact-find.
- Full SEO keyword research or paid channel strategy (follow-up: `/lp-channels`, `/lp-seo`).

### Default Decisions (to keep this Ready-for-planning)
These defaults unblock planning. If wrong, the plan changes in specific ways.

1. Primary external narrative: operator-led portfolio builder (not for hire)
- We build and operate our own ventures. We do not sell "venture studio services".
- If wrong (you do want for-hire): reintroduce partner intake CTAs and founder-facing outbound.

2. Audience doors: finance / customer / supplier
- Home + nav should support three clear paths:
  - Customers: products + hospitality
  - Suppliers: how we partner + supplier intro CTA
  - Financial providers: portfolio + financing pack CTA
- All doors share the same contact endpoint for now (different subject lines / landing pages can segment intent).

3. Portfolio naming default: operating assets named; in-build streams generic
- Public site names operating assets; "in build" is described without internal codes unless there is a strong reason.
- If wrong (you want codes public): add a portfolio grid that labels "in build" explicitly and makes no revenue claims.

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

### Baseline extract (what is actually on the EN surface)
The EN home route uses `SkylarTypoHome` (`apps/skylar/src/components/typo-home/EnglishHome.tsx`), so keys like `hero.subhead` are NOT rendered in the EN first fold. They still matter for metadata and other locales.

EN home keys that dominate the visible surface:
- `home.en.intro.column1.heading` / `.body` ("The Flywheel")
- `home.en.story2.heading` / `.body` ("We sell the things we make.")

EN products page keys:
- `products.en.hero.body` and the poster sections:
  - `products.en.design.body`
  - `products.en.sourcing.body`
  - `products.en.distribution.body` (includes "In a few hours we can spin up a dedicated brand site...")

EN people page keys:
- `people.en.hero.body` currently includes "services" and "service delivery".

EN real estate page key to fix:
- `realEstate.en.stack.cards.experiments.body` currently ends with "tools partners can reuse".

### Current weaknesses (strategy/positioning)
- The site is not explicit that Skylar is not for hire.
- Some copy reads like client services ("How we work with you", "service delivery", "tools partners can reuse").
- Startup Loop exists as a real operating system, but is not translated into audience-specific outcomes (customer, supplier, finance).

### Measurement/analytics finding
- Searched Skylar source for common analytics hooks (gtag/GTM/GA4 + plausible/fathom/segment/posthog/mixpanel/heap/amplitude) and found none under `apps/skylar/src`.

## Positioning (external)

### Positioning statement (forced hierarchy)
For customers who want well-designed, practical products and exceptional stays, and for suppliers and financial partners who want a disciplined operator, Skylar is an operator-led venture studio that builds and operates its own portfolio across hospitality and consumer commerce.

Unlike agencies, we do not sell execution as a service. We run the whole loop internally (offer design, supply chain, distribution, and the platform layer) and make weekly decisions based on signal so capital and effort do not drift.

### Vocabulary guardrails
Use consistently:
- operator-led, portfolio, build and operate, end-to-end, offer, supply chain, distribution, platforms, multilingual

Avoid or only use with proof:
- proprietary (prefer "internal" unless we are selling it as a product)
- battle-tested (prefer "used in our operating portfolio")
- launch in hours (must specify what launches in hours)
- forecasting (prefer "demand modeling" or "forecasting when needed" unless we are showing an artifact)

## Startup Loop translation (internal -> buyer outcomes)
Startup Loop cannot be marketed as a stage list. It must be marketed as discipline.

- Readiness gates -> "We will tell you 'not yet' fast, and exactly what to fix before we commit capital."
- Research/market intelligence -> "We do competitor/pricing/channel homework before we scale."
- Offer design -> "We turn 'idea' into a sellable offer with pricing, objections, and packaging."
- Supply + distribution -> "We control factory, logistics, and channels so launches do not depend on handoffs."
- Fact-find -> plan -> build -> "We reduce risk before coding and ship in controlled increments."
- QA + weekly decisioning -> "We ship, measure, and decide weekly: keep, pivot, scale, or kill."

External nuance: internal docs note contract drift risk (not capability gaps). We do not market "fragility"; we market the corollary: documented loop + explicit gates prevents drift.

## Portfolio framing (public-safe)
Recommended public vocabulary:
- Operating: Brikette + Amalfi Coast hospitality assets (proof of operations complexity)
- In build: described generically unless we decide to name codes publicly

## Claim -> Proof -> Placement Ledger
This is the enforcement mechanism for bold copy.

| Claim (exact phrase) | Where used | Proof hook (repo evidence) | Publicly linkable | Risk | Safer fallback |
|---|---|---|---|---|---|
| "Operator-led portfolio" | Home, pinned post | `docs/business-os/strategy/businesses.json`, `docs/business-os/strategy/BRIK/plan.user.md` | Partial (site only) | Med | "Operator-led" |
| "Not for hire" | Home, products, people | Strategy decision (this doc) | Yes (site) | Low | "We build and operate our own ventures" |
| "We run a documented operating loop (Startup Loop)" | Finance page/section, pinned post | `docs/business-os/startup-loop-workflow.user.md` | Partial | Med | "We run a documented loop with explicit gates" |
| "Spin up a dedicated brand site in a few hours" | Products/platform section (not hero) | Existing claim in `products.en.distribution.body` | No | High | "Launch new product sites fast (hours, not weeks)" |
| "Tools we roll out across the portfolio" | Real estate proof section | Replace partner language: `realEstate.en.stack.cards.experiments.body` | Yes (site) | Med | "Operational playbooks we reuse internally" |

Notes:
- Any claim marked High risk must have a scope definition on-page (what exactly launches, what is excluded) and must not imply client delivery.

## Remove/Replace Delta (website)

### Release sequence (recommended)
- Release 1: Copy-only reposition + remove for-hire language + proof hooks + UTMs.
- Release 2: Add audience doors + Loop poster + Portfolio map (structure change).

### Page-by-page checklist (Release 1)
Home (`/[lang]`)
- Add explicit "not for hire" line (copy-only: encode into existing intro column 1).
- Replace Flywheel-first narrative with Loop-as-discipline (internal loop, not a client method).

Products (`/[lang]/products`)
- Remove client-service framing and ensure all platform claims are internal (how we operate).

People (`/[lang]/people`)
- Remove "services" and "service delivery" language.

Real estate (`/[lang]/real-estate`)
- Replace "tools partners can reuse" -> "tools we roll out across the portfolio".

Global
- CTAs: avoid partner intake; instead route to finance/supplier/customer doors.

### Implementable copy pack (EN - Release 1)
This section provides verbatim replacements for existing keys.

EN home (make Loop + not-for-hire explicit)
- `home.en.intro.column1.heading`:
  - NEW: "The Operating Loop"
- `home.en.intro.column1.body`:
  - NEW: "We build and operate our own ventures. We are not for hire. We run a documented operating loop: readiness gates, research, demand modeling, supply chain execution, distribution, and weekly decisions based on signal so capital and effort do not drift."

EN home (reinforce operator posture)
- `home.en.story2.heading`:
  - NEW: "We operate what we build."

EN products (remove service-y implications, keep platform claim scoped)
- `products.en.hero.body`:
  - NEW: "We build and operate across hospitality and consumer commerce. We stay close to manufacturing, run distribution across multiple channels, and build the platform layer that keeps launches fast and multilingual."
- `products.en.distribution.body`:
  - NEW: "Once a product is ready, we plug it into our own commerce platform and take it to customers where they already spend their time. When we launch something new, we can spin up a dedicated brand site in a few hours, with feeds to search engines, links into social networks, and inventory that keeps orders in sync across channels. The same system connects to marketplaces like Amazon and Etsy, so sales across every channel are tracked from a single place and can scale without re-wiring the setup each time."

EN people (remove services language)
- `people.en.hero.body`:
  - NEW: "Two principals driving one loop. Cristiana leads product research, operations, and quality across the portfolio. Peter leads platforms, commercial strategy, and marketing so each property and product line stays connected and ships."

EN real estate (remove partner reuse language)
- `realEstate.en.stack.cards.experiments.body`:
  - NEW: "Real estate is our live testbed. We trial room layouts, check-in flows, and service playbooks across Positano and Piano di Sorrento before we roll them out across the portfolio."

### Release 2 (audience doors + Loop + Portfolio)
Add explicit doors on the home page:
- Customers: products + hospitality
- Suppliers: supplier intro CTA
- Financial providers: financing pack CTA

Implementation note: will require code changes in `apps/skylar/src/components/typo-home/EnglishHome.tsx` and likely new routes/pages.

## Promotion pack (EN - split by audience)

### One-liner (general)
Skylar builds and operates a portfolio across hospitality and consumer commerce, run on a documented operating loop ("Startup Loop") that keeps execution disciplined.

### 30-second pitch (financial providers)
We are an operator-led portfolio spanning hospitality assets on the Amalfi Coast and consumer commerce. We control sourcing, distribution, and the platform layer, and we run a documented weekly decision loop so capital is deployed with discipline. We are looking for financing partners for inventory, capex, and growth across the portfolio.

### 30-second pitch (suppliers)
We are a direct operator: we design products, place orders ourselves, and sell through our channels. We move quickly on sampling, QC, packaging specs, and lead times, and we value consistent quality and documentation. If you can deliver repeatable production, we can build a long-term relationship.

### 30-second pitch (customers)
We build functional products and operate hospitality spaces we would want to use ourselves. We stay close to manufacturing details, keep design understated, and obsess over the end-to-end experience from first use to support.

### Outbound email (financial provider)
Subject: Operator-led portfolio (hospitality + commerce)

Hi <Name>,

Skylar is an operator-led portfolio spanning hospitality assets on the Amalfi Coast and consumer commerce. We control sourcing, distribution, and the platform layer, and we run a documented weekly decision loop so capital and effort stay disciplined.

We are exploring financing partnerships for inventory/capex and controlled growth across the portfolio. If this is in your lane, open to a short call next week?

Best,
<Signature>

### Outbound email (supplier)
Subject: Direct operator seeking long-term factory partner

Hi <Name>,

Skylar is a direct operator: we design products, place orders ourselves, and sell through our channels. We care about repeatable quality, clear documentation, and reliable lead times.

If your factory is strong in <category>, can you share your MOQ ranges, typical lead times, and how you handle sampling/QC? If it looks like a fit, we can move quickly.

Best,
<Signature>

## Minimum viable measurement spec (plan seed)
Even without analytics tooling, we can measure promotion effectiveness.

1. UTM taxonomy (required immediately)
- `utm_source`: linkedin | email | whatsapp | supplier | finance | referral
- `utm_medium`: social | outbound | message | bio
- `utm_campaign`: skylar-operator-portfolio-2026-02
- `utm_content`: customer-door | supplier-door | finance-door | pitch-finance | pitch-supplier

2. CTA inventory (must be UTM-tagged)
- Finance: financing pack CTA
- Supplier: supplier intro CTA
- Customer: product/hospitality CTAs
- Same contact endpoint for finance + supplier for now (different subject lines; segment via UTMs on the door pages).

3. Manual outreach log (minimum)
- Fields: date, target, segment, message variant, link (with UTM), reply quality (0-3), next step

## Risks & mitigations
- Risk: Generating inbound we intend to refuse ("for-hire" confusion).
  - Mitigation: explicit "not for hire" statement on the home page and remove service language site-wide.
- Risk: Claim drift (bold copy without proof).
  - Mitigation: claim -> proof ledger above; no new claims without a proof hook or scoped wording.
- Risk: "few hours" platform claim reads like client pitch.
  - Mitigation: ensure the phrasing is internal ("when we launch") and add scope (marketing site vs full commerce).
- Risk: No analytics baseline.
  - Mitigation: UTMs + outreach log now; analytics later.

## Confidence inputs (for /lp-do-plan)
- Implementation: 85
  - Copy-only changes are straightforward in `apps/skylar/i18n/*.json`.
- Approach: 88
  - Operator-led, not-for-hire positioning matches stated strategy and reduces conversion noise.
- Impact: 82
  - Messaging changes reduce inbound noise; measurement is still limited.
- Delivery readiness: 85
  - Clear surfaces (site + outreach). Needs routing/doors in Release 2.

What would make this >=90
- Confirm whether Release 2 (doors + Loop + Portfolio) is in scope for the first deploy.
- Decide whether to name in-build streams publicly or keep generic.

## Open questions (remaining)
These are not blockers (defaults are set), but they change plan tasks.

1. Do we want to publish a "financing pack" as a page, a PDF, or an email-only deliverable?



## Delivery & Channel Landscape
### Audience
- Customers: buy products / book stays.
- Suppliers: factory + logistics partners.
- Financial providers: inventory/capex/growth financing.

### Channels / surfaces
- Primary: Skylar website (`apps/skylar`) + outbound email/LinkedIn.
- Constraints:
  - Single shared contact endpoint for now (segment by subject lines + UTMs once door pages exist).
  - No fabricated proof (logos, revenue, testimonials).

### Ownership / approvals
- Owner/reviewer: Pete (final sign-off before shipping copy).
- Approval evidence: user acknowledgement in chat or in the eventual PR description.

### Measurement
- Short-term: manual outreach log + response quality scoring.
- Medium-term: UTM-tagged door pages (Release 2) + CTA click tracking.

## Hypothesis & Validation Landscape
### Key hypotheses
| # | Hypothesis | Pass condition | Time-box |
|---|-----------|----------------|---------|
| H1 | "Not for hire" + operator-led positioning reduces wrong-fit inbound. | <=1 wrong-fit inbound / week after ship (manual log). | 2-4 weeks |
| H2 | Finance pitch variant produces qualified replies. | >=3 qualified replies from 30 targeted emails. | 14 days |
| H3 | Supplier pitch variant produces partner conversations. | >=5 supplier replies from 30 targeted emails. | 14 days |

### Existing signal coverage
- No on-site analytics hooks found in `apps/skylar/src` (repo search).
- No baseline outreach log exists yet.

### Recommended validation approach
- Red: send 10 finance + 10 supplier outreach messages with current copy; expect low/unclear signal; record failure modes.
- Green: ship Release 1 copy + updated outreach variants; run 30/30 outreach; score replies.
- Refactor: tighten copy based on reply patterns; rerun the same outreach protocol.

## Confidence Inputs (for /lp-do-plan)
- Implementation: 85
  - Copy changes are contained to `apps/skylar/i18n/*.json`.
- Approach: 88
  - "Operator-led, not for hire" matches stated strategy and reduces conversion noise.
- Impact: 82
  - Blast radius is primarily copy/positioning; low technical risk, moderate trust risk.
- Delivery-Readiness: 85
  - Clear surfaces and owner; measurement is defined but not yet automated.
- Testability: 70
  - We can validate via builds + grep + manual outreach logs, but no analytics baseline.

What would make this >=90
- Add door pages (Release 2) and track CTA clickthrough by audience.
- Add a lightweight contact intent selector (still same email endpoint) to separate finance vs supplier vs customer inquiries.
## Planning readiness
Ready-for-planning.
