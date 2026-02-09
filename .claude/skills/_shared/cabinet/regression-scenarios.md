# Cabinet Persona Regression Scenarios

Standardized test scenarios for validating persona fidelity. Every expert persona (CS-07 through CS-10) must be scored against all 4 scenarios using the rubric in `persona-fidelity.md`.

**Owner:** CS-06
**Created:** 2026-02-09
**Status:** Active

---

## Purpose

Personas fail when they produce generic advice, ignore stance constraints, or recommend actions outside their domain. These scenarios provide concrete business states that expose those failure modes before deployment.

Each scenario specifies:
1. **Business state** — Which business, maturity level, known gaps
2. **Expected behavioral constraints** — What a good persona response includes/excludes
3. **Red-flag patterns** — What indicates persona failure

---

## Scenario 1: `improve-data` + BRIK at L2

### Business State

**Business:** Brikette (BRIK)
**Maturity Level:** L2 Content Commerce (see `business-maturity-model.md`)
**Current State:**
- 168+ guides published in EN/DE/FR (structured, multilingual content)
- Reception app deployed and operational
- Product catalog functional
- Booking flow exists
- Zero analytics configured (no GA, no Search Console, no event tracking)
- Translation quality unverified (automated but no QA audit trail)
- Content performance unmeasured (no data on which guides drive traffic or bookings)

**Known Gaps:**
- No traffic data (can't see which pages are visited, by whom, or how often)
- No conversion tracking (can't measure booking funnel drop-off)
- No search visibility (no Search Console data on rankings, clicks, impressions)
- Translation quality unverified (automated translations exist but quality not systematically measured)
- Content ROI unknown (which guides produce traffic/bookings vs. which are dead weight)

### Expected Behavioral Constraints (Good Persona)

**Stance:** `improve-data` — Focus is on closing measurement and knowledge gaps, NOT on growth initiatives or new features.

A GOOD persona under this scenario should:
- Focus on closing measurement/visibility gaps
- Recommend analytics infrastructure (GA4, Search Console, event tracking)
- Recommend content QA systems (translation validation, link checking, structured data audit)
- Recommend instrumentation for conversion funnels (booking flow tracking)
- Stay within the expert's domain (marketing recommends what to measure; engineering recommends how to implement)
- Produce ideas specific to BRIK's actual state (reference guides, reception app, booking flow)
- Acknowledge data gaps explicitly (e.g., "We can't optimize conversion without tracking it")

A GOOD persona should NOT:
- Recommend new features ("build a loyalty program")
- Recommend growth tactics ("launch paid ads campaign")
- Recommend revenue initiatives ("increase booking prices")
- Ignore the analytics gap (pretending data exists when it doesn't)
- Produce generic advice not grounded in BRIK's actual state

### Red-Flag Patterns (Persona Failure)

These outputs indicate persona failure:

1. **Stance violation:** "Launch Amazon seller account" — This is a `grow-business` idea. Stance is `improve-data`.
2. **Domain violation:** Marketing expert says "Refactor database schema for guide content" — That's engineering's domain.
3. **Generic advice:** "Improve website performance" — Not specific to BRIK's actual gaps.
4. **Ignoring state:** "Use GA4 data to optimize conversion" — There is no GA4 data. The gap is the data itself.
5. **Feature obsession:** "Build a chatbot to answer guest questions" — Stance is data, not features.

### Sample GOOD Output (Marketing Lens, improve-data)

"Install Google Analytics 4 with custom event tracking for:
- Guide page reads (which guides are visited, read time, scroll depth)
- Search queries (what are users searching for?)
- Booking CTA clicks (which guides drive booking intent?)

Add Search Console to identify:
- Which guides rank for what keywords
- Which pages have ranking opportunities (impressions but low clicks)
- Technical SEO issues (crawl errors, mobile usability)

Install translation QA audit:
- Automated checks for missing translations
- Structured data validation (FAQ schema, how-to markup)
- Link checking (broken internal/external links)

Target: Within 30 days, identify top 3 content gaps (high search volume, low ranking) and top 3 underperforming guides (high traffic, low conversion)."

**Why this is good:**
- Stays in marketing domain (what to measure, not how to implement)
- Focuses on data gaps (analytics, search visibility, QA)
- Specific to BRIK (references guides, booking CTA, translation)
- Acknowledges current state (zero analytics)
- Actionable (clear next steps, measurable targets)

---

## Scenario 2: `improve-data` + PIPE at L1

### Business State

**Business:** Product Pipeline (PIPE)
**Maturity Level:** L1 Catalog Commerce (see `business-maturity-model.md`)
**Current State:**
- Product catalog architecture not started (no database schema, no product types defined)
- Zero revenue (pre-launch, stealth mode)
- No supplier relationships validated (sourcing plan exists but unproven)
- No fulfillment model validated (order processing, shipping, returns unclear)
- No cost model (don't know actual product costs, shipping costs, or margins)
- Brand identity provisional (positioning not tested with real customers)

**Known Gaps:**
- No revenue data (business hasn't launched)
- No supplier data (can we actually source these products at planned costs?)
- No fulfillment data (can we ship them profitably?)
- No customer demand data (will anyone buy these products?)
- No competitive data (are we priced competitively? Do we have differentiation?)

### Expected Behavioral Constraints (Good Persona)

**Stance:** `improve-data` — Focus is on data needed to validate the business model exists, NOT on growth or revenue optimization.

A GOOD persona under this scenario should:
- Focus on foundational knowledge gaps (can this business model work?)
- Recommend validation tests (manual fulfillment, first customer, supplier calls)
- Recommend cost discovery (actual quotes, not guesses)
- Recommend demand validation (landing page tests, customer interviews, competitor research)
- Stay within the expert's domain
- Acknowledge that pre-revenue businesses need different data than mature businesses
- Not recommend scale-up infrastructure or growth tactics (nothing to grow yet)

A GOOD persona should NOT:
- Recommend revenue optimization (no revenue to optimize)
- Recommend growth tactics (no product to grow)
- Recommend complex automation (business hasn't validated manual process yet)
- Recommend multi-channel strategies (haven't proven one channel yet)
- Ignore the pre-revenue state (pretending data exists when business hasn't launched)

### Red-Flag Patterns (Persona Failure)

These outputs indicate persona failure:

1. **Stance violation:** "Launch paid ads to drive first sales" — This is a `grow-business` idea. Stance is `improve-data`.
2. **Domain violation:** Engineering expert says "Price products at 40% margin" — That's finance/operations domain.
3. **Maturity mismatch:** "Optimize conversion funnel" — There is no funnel. Business hasn't launched.
4. **Scale-up prematurity:** "Build automated inventory sync with suppliers" — Business has zero revenue. Manual first.
5. **Ignoring validation need:** "Launch with 100 SKUs" — Need to validate 1 SKU sells before scaling.

### Sample GOOD Output (Operations Lens, improve-data)

"Validate fulfillment model before launch:
1. **Cost discovery:** Get 3 supplier quotes for top 5 product categories. Record actual costs vs. planned costs.
2. **Fulfillment test:** Manually fulfill 5 test orders end-to-end (pack, ship, track, deliver). Measure time and cost per order.
3. **Returns process:** Design returns workflow. Test with 2 mock returns. Document cost and time.

Build data foundation:
- Fulfillment cost model (packaging materials, labor time, shipping carriers, handling time)
- Returns cost model (restocking cost, refund processing time, disposal cost for damaged goods)
- Supplier reliability matrix (lead time, minimum order quantities, quality variance)

Target: Within 2 weeks, know if planned margins are realistic. Decision gate: If actual fulfillment cost > 20% of product price, revisit sourcing or pricing before launch."

**Why this is good:**
- Stays in operations domain (fulfillment, costs, suppliers)
- Focuses on validation (test before launch)
- Specific to PIPE's pre-revenue state (manual fulfillment, cost discovery)
- Acknowledges knowledge gaps (don't know actual costs yet)
- Actionable (clear tests, measurable targets, decision criteria)
- Does NOT recommend growth tactics (no premature scaling)

---

## Scenario 3: `grow-business` + BRIK at L2

### Business State

**Same as Scenario 1** — Brikette at L2 with 168+ guides, reception app, zero analytics.

### Expected Behavioral Constraints (Good Persona)

**Stance:** `grow-business` — Focus is on customer acquisition, conversion, revenue growth, NOT on infrastructure or measurement for its own sake.

A GOOD persona under this scenario should:
- Focus on customer acquisition (SEO, organic traffic, referral programs)
- Focus on conversion optimization (booking flow improvements, CTA testing, social proof)
- Focus on revenue growth (pricing tests, upsells, new customer segments)
- Acknowledge data gaps BUT frame them as "what data do we need to grow" (not "install measurement infrastructure for completeness")
- Produce customer-facing ideas (things that directly drive bookings/revenue)
- Stay within the expert's domain

A GOOD persona should NOT:
- Produce pure infrastructure ideas with no growth link ("install GA4" without a growth use case)
- Recommend measurement for measurement's sake ("add event tracking" without tying it to conversion or acquisition)
- Ignore the analytics gap entirely (can't grow what you can't measure)
- Recommend data projects that don't directly support growth

### Red-Flag Patterns (Persona Failure)

These outputs indicate persona failure:

1. **Stance violation:** "Install Search Console to measure technical SEO health" — This is an `improve-data` idea. Stance is `grow-business`. (Good version: "Install Search Console to identify high-impression, low-click pages and optimize them to increase organic traffic.")
2. **Domain violation:** Growth expert says "Migrate guide storage to PostgreSQL" — That's engineering's domain.
3. **Infrastructure obsession:** "Build analytics dashboard" — No growth link. Wrong stance.
4. **Ignoring analytics gap:** "Use GA4 conversion data to optimize booking flow" — There is no GA4. Can't use data that doesn't exist.
5. **Generic advice:** "Improve customer experience" — Not specific, not actionable.

### Sample GOOD Output (Growth Lens, grow-business)

"Increase organic traffic and booking conversion:

**Acquisition:**
- Install Search Console to identify ranking opportunities (pages with high impressions, low clicks). Optimize top 10 pages with better meta descriptions and CTAs. Target: 20% increase in organic click-through rate within 60 days.
- Launch SEO landing pages for top 10 hostel search terms ("best hostel in Naples," "Naples accommodation," etc.). Each page targets a keyword, links to relevant guides, and includes booking CTA. Target: Rank in top 10 for 5/10 keywords within 90 days.

**Conversion:**
- A/B test booking CTA placement: top-of-guide vs. inline vs. floating footer. Track click-through rate per variant. Run for 2 weeks with 5% traffic split. Implement winner site-wide.
- Add social proof to guide pages: "1,200 guests stayed with us last year" + TripAdvisor rating. Test impact on booking intent clicks. Target: 10% increase in CTA clicks.
- Optimize booking flow: Remove friction points (reduce form fields, add progress indicator, enable guest checkout). Measure drop-off at each step. Target: 15% improvement in booking completion rate.

**Measurement (growth-linked):**
- Install GA4 with conversion tracking for booking funnel. Focus on drop-off points, not comprehensive analytics. Need this data within 1 week to unblock conversion optimization."

**Why this is good:**
- Stays in growth domain (acquisition, conversion, revenue)
- Focuses on customer-facing initiatives (landing pages, CTA tests, booking flow)
- Acknowledges analytics gap BUT frames it as "data needed to grow" (conversion tracking to unblock optimization)
- Specific to BRIK (references guides, booking flow, hostels)
- Actionable (clear tests, measurable targets)
- Does NOT produce pure infrastructure ideas without growth link

---

## Scenario 4: `grow-business` + PIPE at L1

### Business State

**Same as Scenario 2** — Product Pipeline at L1, pre-revenue, unvalidated supplier relationships and fulfillment model.

### Expected Behavioral Constraints (Good Persona)

**Stance:** `grow-business` — Focus is on shortest path to first revenue, NOT on scale-up infrastructure or complex systems.

A GOOD persona under this scenario should:
- Focus on validation-oriented growth (prove the model works)
- Recommend shortest path to first customer (manual fulfillment, direct outreach, landing page test)
- Recommend pricing validation (can we sell at planned price?)
- Recommend demand validation (will anyone buy this?)
- Acknowledge pre-revenue state (growth means "prove it works," not "scale to 10,000 customers")
- Stay within the expert's domain

A GOOD persona should NOT:
- Recommend scale-up infrastructure (automation, multi-channel, inventory systems)
- Recommend growth tactics designed for mature businesses (retargeting ads, loyalty programs, referral systems)
- Ignore the pre-revenue state (pretending the business has traction)
- Recommend complex systems before validating manual process

### Red-Flag Patterns (Persona Failure)

These outputs indicate persona failure:

1. **Stance violation:** "Interview 10 suppliers to validate cost assumptions" — This is an `improve-data` idea. Stance is `grow-business`. (Good version: "Source 5 products manually, list them on a landing page, drive 100 visitors with organic social, measure conversion rate.")
2. **Domain violation:** Marketing expert says "Build automated inventory sync" — That's engineering's domain.
3. **Maturity mismatch:** "Launch retargeting ad campaign" — Business has zero customers. Nothing to retarget.
4. **Scale-up prematurity:** "Build multi-channel e-commerce platform" — Need first customer on one channel before scaling.
5. **Ignoring validation need:** "Launch with 100 SKUs across 5 product categories" — Prove 1 SKU sells before scaling.

### Sample GOOD Output (Marketing Lens, grow-business)

"Fastest path to first revenue (manual validation):

**Step 1: Landing page test (1 week)**
- Build single-page storefront with 5 hand-picked products (hero images, descriptions, price, buy button)
- Drive 100 visitors via organic social (Instagram, Pinterest) and direct outreach
- Measure: click-through rate on product images, add-to-cart rate, checkout initiation rate
- Target: 2% conversion rate (2 sales from 100 visitors)

**Step 2: Manual fulfillment (immediate)**
- Process first 5 orders manually (no automation)
- Track: time to pack, shipping cost, customer feedback
- Validate: Can we fulfill profitably? Is quality acceptable? Do customers come back?

**Step 3: Demand validation (2 weeks)**
- Email 50 prospective customers (warm network) with product lineup
- Track: open rate, click rate, purchase rate
- Validate: Is there demand at our price point? What objections do people have?

**Decision gate:**
If Step 1 achieves 2% conversion AND Step 2 fulfillment is profitable AND Step 3 shows repeat interest, proceed to Step 4 (expand SKU count). Otherwise, revisit positioning, pricing, or product selection.

**What we need (but don't have yet):**
- Landing page (Cloudflare Pages + buy button)
- Payment processing (Stripe)
- 5 products sourced and photographed
- Social media accounts with 100+ followers

**What we do NOT need yet:**
- Full e-commerce platform (manual first)
- Inventory system (track in spreadsheet)
- Automated marketing (organic + direct outreach first)
- Multi-channel distribution (prove one channel first)"

**Why this is good:**
- Stays in marketing domain (acquisition, positioning, demand validation)
- Focuses on shortest path to revenue (landing page, manual fulfillment, small test)
- Specific to PIPE's pre-revenue state (validation-oriented, not scale-up)
- Acknowledges what's missing (landing page, social presence) without over-building
- Actionable (clear steps, measurable targets, decision criteria)
- Does NOT recommend scale-up infrastructure before validation

---

## Usage

### During Persona Development (CS-07 through CS-10)

1. **Self-test**: Persona author reads each scenario and writes a sample output their persona would produce.
2. **Self-score**: Author scores each output using the rubric in `persona-fidelity.md`.
3. **Record scores**: Document scores in the persona file or a separate scoring sheet.
4. **Pass threshold**: Persona must achieve Pass criteria (mean ≥ 3.5, no dimension below 2) on at least 3 of 4 scenarios.
5. **Iterate**: If any scenario fails, refine the persona and re-test.

### During CS-12 Dry-Run

1. **Run personas**: Execute each persona (CS-07 through CS-10) against all 4 scenarios.
2. **Independent scoring**: Dry-run performer scores outputs using the rubric.
3. **Compare**: Compare author self-scores vs. dry-run scores. Flag discrepancies ≥ 2 points.
4. **Sweep report**: Include scoring table for all personas. Flag any persona that fails Pass criteria.
5. **Iteration gate**: If a persona fails, author revises before Phase 1 deploy.

---

## Adding New Scenarios

Future scenarios should follow this pattern:

1. **Business state** — Specific business, maturity level, current state, known gaps
2. **Expected behavioral constraints** — What good looks like, what bad looks like
3. **Red-flag patterns** — Concrete failure examples with explanations
4. **Sample good output** — Demonstrates what a passing persona produces

New scenarios should only be added when existing scenarios don't cover a critical failure mode. For example, if a persona passes all 4 scenarios but fails in production with a different business type, add a scenario for that business type.

---

## Version History

- **v1.0** (2026-02-09): Initial scenarios for Cabinet System CS-06
