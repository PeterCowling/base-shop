---
Type: Market-Research
Stage: MARKET-04
Business-Unit: HBAG
Business-Name: Caryina
Status: Draft
Created: 2026-02-23
Updated: 2026-02-23
Owner: Pete
Prompt-Source: docs/business-os/market-research/HBAG/market-04-channel-landscape-prompt.md
---

# Channel landscape for Caryina's 90-day Etsy demand test

Caryina's 90‑day test is designed to validate whether an artisan‑premium positioning can convert at €99 (H1 bag charm) and €89 (H2 AirPods holder) on Etsy with international shipping from Italy. This report focuses on acquisition and distribution channels that can be executed quickly by a one‑person operator and that generate decision‑grade signals (impressions → favourites → carts → checkout → reviews/messages) without committing to full-scale DTC infrastructure.

A critical Q1 2026 operational constraint is the US inbound customs environment: the US has continued the suspension of duty‑free "de minimis" treatment under 19 U.S.C. 1321(a)(2)(C) via an executive order dated 20 February 2026, including for shipments sent through the international postal network, with U.S. Customs and Border Protection collecting duties accordingly. This materially increases the risk of buyer friction for US‑bound orders (delays, duty payment steps, surprise charges) and should be treated as a live variable during the test.

---

## Section 1 — Candidate channels and why they fit

The channels below are evaluated against the known buyer path from MARKET‑02 (social exposure → search on Etsy → purchase), plus operator constraints (bootstrapped, low time), and the need to produce evidence fast.

| Channel | Type | Fit rationale | Stage fit for 90‑day test | Operator requirement |
|---|---|---|---|---|
| Etsy | Marketplace conversion | Search-led discovery and gifting behaviours; best environment to test price/positioning with tight iteration loop | Day 1 | Verified shop, shipping profiles, policies, and premium listing assets |
| TikTok organic | Owned social (discovery) | Bag charm culture is TikTok-native (trend framing, stacking, "Birkin-ification" formats); can generate Etsy searches and favourites | Day 1 | 2–4 videos/week; consistent hooks; rapid iteration |
| Instagram organic | Owned social (discovery) | Visual credibility and save/share mechanics suit a considered €89–€99 purchase; supports social proof | Day 1 | A coherent visual style; repeatable Reels; provenance story assets |
| Pinterest | Passive discovery / SEO-adjacent | Long-tail "handbag styling" and gifting intent; can send sustained traffic to Etsy with low ongoing effort | Day 30 | 10–30 product pins; keyword discipline; consistent pinning |
| TikTok Shop (Italy/EU) | Social commerce | Potentially compresses "watch → buy" inside TikTok; Italy supported since 31 Mar 2025 | Day 60+ (optional) | Business verification, returns workflow, higher operational overhead |
| In-destination boutique consignment (Positano) | Seasonal retail | Converts as "premium artisan souvenir" June–Sept; authenticity is legible in-person | Seasonal (June–Sept) | Consignment SOP, inventory control, merchandising materials |
| Brikette Hostel display sales | Seasonal micro-retail | Captive footfall; convenience buying; strong souvenir/gift use case | Seasonal (June–Sept) | Tight stock control and payout process |
| Etsy Ads | Paid marketplace placement | Can accelerate impressions, but efficiency depends on listing quality and conversion | Micro-test only | Budget discipline; treat as diagnostic, not growth engine |
| Depop / Not On The High Street / Wolf & Badger | Alternative marketplaces | Can be attractive post-validation, but onboarding and economics skew against a 90‑day, Etsy-first test | Phase 2 | Application/compliance + economics review |

Key implication: for the 90‑day test, the "channel shortlist" is Etsy + TikTok/Instagram (discovery) + Pinterest (evergreen support), with tourist retail as a seasonal parallel rather than a replacement.

---

## Section 2 — Operational constraints and compliance by channel

### Etsy onboarding, compliance, and costs for an Italy-based seller

**Onboarding gates that commonly delay launch.** An Italy-based seller should assume three gating steps that are not optional: identity/security, payouts, and tax reporting.

- Identity and fraud prevention: shop creation includes identity verification and uses Persona for verification workflows; two-factor authentication is a required security step during setup.
- Bank payout verification: payout setup may require a small verification deposit or bank-statement upload; Etsy notes shops can be suspended if bank verification is not completed in time.
- EU tax/data reporting: Etsy must collect and may report EU seller identity and tax attributes (including TIN and VAT number if applicable), and transaction totals, to EU tax authorities.
- VAT ID thresholds: Etsy can require adding a VAT ID/taxpayer details when placing sellers near local thresholds, and can suspend selling privileges for non-compliance.

**Fees that matter at €89–€99.** For a shop using Etsy Payments with an Italy bank account, the major fee stack (excluding shipping and product cost) is:

- Listing fee: $0.20 per listing publish/renew.
- Transaction fee: 6.5% of item price + shipping + gift wrap.
- Payment processing for Italy: 4% + €0.30 per order.
- Regulatory operating fee (Italy): 0.32% on the order total (as defined by Etsy).
- Currency conversion fee: 2.5% if listing currency ≠ payment account currency; Etsy explicitly recommends aligning currencies to avoid this.
- Offsite Ads (conditional): 15% for shops < $10k sales in the last 365 days; 12% for ≥ $10k; capped per order.

Illustrative fee-only take (excluding Offsite Ads, shipping, VAT-on-fees, and FX): on a €99 order, 6.5% + 4% + 0.32% ≈ 10.82%, plus €0.30 processing and the listing fee (converted from $0.20). This simplification is valid because Etsy publishes the percent fees directly; real totals vary due to fee VAT, FX, refunds, and whether shipping is included in the listed price.

**Etsy SEO/discovery mechanics relevant to a new shop with zero reviews.**

Etsy's seller documentation is unusually explicit about what you can control on day 1:

- Search ranking considers relevance (titles, tags, descriptions, categories, attributes), shop quality, listing quality, and recency.
- Recency boost: new listings receive a small, temporary boost that can last "from a few hours to a few days," and renewed listings get a smaller boost; Etsy cautions against gaming renewals.
- New listings can appear in search even without reviews; however Etsy warns that missing elements (e.g., photos or a return policy) can immediately reduce search visibility.
- Etsy states that missing return policies may result in listings appearing lower in search, and provides a simple return policy template.
- Etsy's "Search Visibility" tooling highlights shop, listing, and customer service quality; after changes, insights can disappear within ~24 hours—useful for tight iteration loops in a test.

**How long to get organic visibility (practical expectation).** Etsy's own recency guidance implies that a brand-new listing should receive some initial testing exposure within hours to days if it is relevant to queries in the niche.

A realistic test expectation is therefore two-phase:

- Indexing and initial exposure: within the recency window (hours–days). (Observed in Etsy documentation.)
- Stable, meaningful placement: depends on interaction and conversion signals (clicks, favourites, purchases), and customer service/shop completeness. This is an inference from how Etsy describes ranking signals and shop quality, rather than a published timeline.

### Shipping and fulfilment from Italy under Q1 2026 constraints

**Etsy fulfilment tooling in Italy.** Etsy has explicitly recommended Packlink and Sendcloud as third‑party shipping apps for sellers shipping from Italy (with new integration limits enforcement from 1 February 2026 for new integrations). This matters because it affects operational setup and reduces friction in label creation/tracking imports.

**Carrier and cost bands (evidence-based examples).** For small leather items, the cost of shipping can dominate unit economics if "free shipping" is priced in.

From Poste Italiane product pages:

- Poste Delivery International Standard (parcels) is positioned as "the cheapest way to send parcels abroad," starts from €25.80, and quotes delivery 10–15 days EU and 10–25 days non‑EU (excluding weekends/holidays).
- Poste Deliverybox International Express quotes €39 (USA small up to 1 kg) and "3 working days (main areas), excluding customs," and €35 (EU small) with "2 working days."

These examples imply a pragmatic trade-off: slow/cheaper parcel services vs. fast/expensive tracked services. That trade-off is magnified by the new US customs environment.

**US duties and delivery disruption risk.** Following the de minimis suspension, major global reporting in late 2025 described widespread postal disruptions and a steep decline in postal traffic to the US while operators adjusted systems. As of 20 February 2026, the US executive order confirms continued duty collection.

Operational implication for the 90‑day test: if the US is in-scope as a primary buyer market, Caryina should treat carrier choice, duty/disclosure messaging, and tracking reliability as core conversion variables—i.e., "channel mechanics," not just fulfilment detail.

### Instagram organic constraints

**Commerce features vs. Etsy-first test reality.** Meta commerce eligibility requirements for Facebook/Instagram commerce surfaces include representing your business and your domain, being located in a supported country, and demonstrating trustworthiness. In practice, product tagging typically requires a product catalogue and domain verification; for an Etsy-first test phase (no own site), it is usually more reliable to run Instagram as discovery + proof (Reels, Stories, Highlights) that drives to Etsy.

**Minimum viable content formats for artisan bag accessories.** Because Caryina's products are premium but small, content needs to repeatedly answer: what is it, how does it attach, does it read premium, and is it truly made in Italy? High-leverage formats align with what Etsy itself says converts (multiple high-quality photos, accurate representation, finished item shown).

### TikTok organic constraints and high-probability formats

**Why TikTok is a fit for bag charms.** Vogue Business' year-in-TikTok coverage explicitly lists bag charms as a "top-trending product," tying the trend to "chaotic customisation" and "Jane Birkin-ification," and provides objective evidence (e.g., hashtag post counts) that supports repeatable format hypotheses (stacking multiple charms, coin purses/mini pouches, beads/jewellery).

**Operational constraint for the test.** TikTok should be treated as a demand generator (create Etsy searches/favourites) rather than a checkout layer in the first 30 days. This is because the controllable variable is content cadence + iteration, while checkout optimisation and returns processes are heavier. (This is an inference based on platform dynamics and operator constraints rather than a published TikTok rule.)

### TikTok Shop (Italy/EU) viability as an add-on

**Availability and positioning.** TikTok announced TikTok Shop availability in Italy from 31 March 2025 and framed it as "discovery e-commerce" (entertainment → discovery → purchase in-app).

**Seller onboarding and documentation.** Italian merchant guidance widely describes business-document requirements (e.g., Partita IVA, chamber certificate/registration, legal rep ID, bank details). This is corroborated by Italian institutional/industry guidance describing merchant documents and stressing shipping timeliness as an experience/ratings factor.

**Returns and consumer rights.** TikTok Shop EU policy states EU buyers have a statutory 14-day cancellation right and, for most products, sellers provide an extended returns benefit (commonly 30 days), with category exceptions.

**Fees/commission.** Multiple 2025–26 reports state TikTok Shop's EU commission moved to 9% from 8 January 2026, with a new-seller incentive reducing commission to 4% for up to 60 days under certain conditions. These are not sourced from TikTok's Italy newsroom post, so they should be treated as reported until verified inside Seller Center for the specific account.

**Stage fit conclusion.** TikTok Shop can be a viable Phase‑2 funnel closer only if (1) organic TikTok is already reliably generating discovery, and (2) Caryina can operationally meet the stricter after-sales expectations (returns, customer service). This is partly supported by the formal EU returns policy and partly an execution inference given operator constraints and the higher operational complexity.

### Pinterest mechanics for an Etsy-first test

Pinterest's business help on rich Pins explicitly states that you do not need to add markup if your site is hosted by Etsy, and that new Pins from Etsy-hosted pages will have product information within ~24 hours. This makes Pinterest unusually low-effort as an "evergreen discovery" layer for Etsy listings during a 90‑day test.

### Alternative marketplaces (brief, for completeness)

**Depop.** Depop's help centre states that sellers outside the UK and US generally pay a 10% selling fee, in addition to payment processing; UK/US sellers have different structures (e.g., eliminated seller fees for new listings in those markets). An Italy-based seller should assume the "outside UK/US" fee baseline. A February 2026 report frames Depop's buyer base as heavily under-34, which can be a mismatch for Caryina's 27–42 core, and Depop is also resale-native versus artisan-new.

**Not On The High Street and Wolf & Badger.** Both are curated and involve higher gatekeeping and usually higher take rates versus Etsy (joining fees/commission in the former; "relevant amount" and other fees in seller terms for the latter). These characteristics push them into Phase‑2 post-validation rather than a quick 90‑day Etsy test.

---

## Section 3 — Conversion path expectations and how price shapes behaviour

### Etsy conversion path

Etsy is intent-led: discovery is typically search → click → compare → policy/shipping check → buy. Etsy's recency boost can create early exposure, but stable placement depends on listing/shop signals and customer service quality. At €89–€99, purchases tend to be "considered impulse": users may favourite, message, or return later. Caryina's "proof" assets (materials, origin, craft, packaging, return policy) are therefore not brand fluff; they are conversion-critical listing components.

### Social-led discovery path (TikTok/Instagram → Etsy)

A realistic flow is scroll exposure → save/comment/DM → Etsy search (brand name + keywords) → favourite/cart → purchase. MARKET‑02 already established Etsy as the destination search layer; MARKET‑04 operationalises this by treating social as demand creation with repeated format execution. (Inference built on the known loop and platform mechanics.)

### TikTok Shop conversion path

TikTok Shop can compress discovery to purchase, but it adds an after-sales overhead (returns rights and extended returns benefit) that will change the operator workload and potentially the buyer's expectations for fulfilment speed and frictionless returns.

### Pinterest conversion path

Pinterest is delayed-intent: pin → save → revisit → click → buy. During a 90‑day test, its main value is low-effort compounding traffic to Etsy (especially if product rich pin data populates automatically for Etsy URLs).

### Tourist retail conversion path

In-person, the path becomes tactile and immediate: touch → attach/visualise → buy. What replaces reviews is product feel, packaging, and provenance cues; what replaces Etsy policies is the retailer's trust and the physical context. (Inference.)

---

## Section 4 — Early stop conditions and risk signals

Stop conditions must separate "no visibility" from "visibility but no intent" and "intent but trust friction." They are framed as operator heuristics because platforms do not publish universal hard thresholds.

### Etsy

- **Indexing/visibility failure (pause and fix setup):** near-zero impressions after the expected recency testing window (hours–days) suggests listing completeness or relevance issues; Etsy explicitly notes missing photos or return policy can impact visibility.
- **Traffic but no intent (reframe / SEO):** visits occur but favourites/add-to-carts remain very low → likely mismatch in keywords, imagery, or "why premium" framing. (Inference anchored to Etsy's emphasis on listing quality and conversion.)
- **Intent but trust friction (add proof):** favourites/carts exist, but repeated buyer messages focus on origin, materials, or shipping uncertainties → indicates missing proof assets. (Inference.)
- **External risk trigger (US shipping):** rising complaints about surprise duties or long delays in the US → revisit carriers and duty disclosures; this risk is structurally higher under the continued de minimis suspension.

### TikTok/Instagram organic

- **Dead signal:** inability to sustain weekly content output; if cadence collapses, pause rather than "post occasionally." (Operator constraint.)
- **Negative signal:** strong view counts but comments show confusion ("what is it?", "how do you attach it?") → content needs clearer functional demonstration and hook. (Inference.)

### TikTok Shop

- **Hard stop:** repeated onboarding rejection or verification limbo consumes operator time; community reports suggest these failures can happen even with valid documentation.
- **Operational risk:** early elevated returns/disputes (given the EU returns framework) indicate expectation mismatch and can damage account health.

### Tourist channel

- **Hard stop:** ambiguous cash handling, unclear inventory ownership, or shrinkage risk; solve process before scaling. (Inference.)
- **Commercial warning:** retailer pushes aggressive discounting early; often indicates the product does not "read premium" in that context. (Inference.)

---

## Section 5 — Channel shortlist and 90-day sequencing

| Channel | Priority | Start timing | Confidence | Key prerequisite |
|---|---|---|---|---|
| Etsy | Primary | Day 1 | High | Verified shop + premium listing assets + clear returns + shipping profiles |
| TikTok organic | Secondary | Day 1 | Medium–High | 2–4 videos/week; repeatable "bag styling + craft proof" formats |
| Instagram organic | Secondary | Day 1 | Medium | Coherent visual style + Reels cadence + provenance story highlights |
| Pinterest | Support | Day 30 | Medium | 10–30 product pins linked to Etsy; keyword discipline |
| Tourist (Positano boutique + hostel) | Seasonal | Prep Day 60–90 for June | Medium–Low | Consignment SOP + inventory controls + merchandising materials |
| TikTok Shop (Italy/EU) | Optional | Day 60+ | Low–Medium | Verified Seller Center + returns/customer service capacity |

**Sequencing summary:** activate Etsy on Day 1 with fully compliant setup, fee-aware pricing, and shipping clarity; run TikTok and Instagram as daily/weekly discovery engines to generate Etsy searches and favourites; add Pinterest at Day 30 for evergreen traffic compounding; only layer in TikTok Shop after early traction is proven and operations can support returns and compliance; begin tourist retail outreach only if online validation supports production and June–September season execution.

---

## Section 6 — Confidence scoring and evidence log

| Claim | Source | Evidence type | Confidence |
|---|---|---|---|
| Etsy new listings receive a temporary recency boost (hours to days) | Etsy seller documentation | Observed | High |
| Missing return policy can reduce Etsy search visibility | Etsy seller documentation | Observed | High |
| Etsy fees: $0.20 listing fee; 6.5% transaction; Offsite Ads 12–15% | Etsy fees documentation | Observed | High |
| Etsy Payments processing fee for Italy: 4% + €0.30 | Etsy fees documentation | Observed | High |
| Italy Regulatory Operating fee: 0.32% | Etsy fees documentation | Observed | High |
| Etsy recommends Packlink and Sendcloud for Italy; new integration limits from 1 Feb 2026 for new integrations | Etsy seller documentation | Observed | High |
| Poste Italiane International Standard starts at €25.80; delivery estimates 10–15 days EU and 10–25 non‑EU | Poste Italiane product pages | Observed | High |
| Poste Deliverybox International Express: €39 USA small; 3 working days excluding customs | Poste Italiane product pages | Observed | High |
| US de minimis duty-free treatment remains suspended as of 20 Feb 2026; duties collected by CBP including postal network shipments | US Executive Order, 20 Feb 2026 | Observed | High |
| Pinterest: Etsy-hosted pages do not need markup; product info appears within 24 hours | Pinterest business help | Observed | High |
| TikTok Shop launched in Italy from 31 Mar 2025 | TikTok newsroom | Observed | High |
| TikTok Shop EU: 14-day statutory cancellation plus extended returns benefit (typically 30 days) | TikTok Shop EU policy | Observed | High |
| Depop: 10% selling fee for sellers outside UK/US | Depop help centre | Observed | High |
| Depop audience skews young (reported 90% under 34) | February 2026 industry report | Observed | Medium |
| TikTok Shop EU commission increase to ~9% from 8 Jan 2026 + new seller reduction reported | Multiple 2025–26 reports | Reported | Medium |
| Typical consignment splits cluster around ~40–60% store share (non‑Italy‑specific) | Observed but context-limited | Observed | Low–Medium |
