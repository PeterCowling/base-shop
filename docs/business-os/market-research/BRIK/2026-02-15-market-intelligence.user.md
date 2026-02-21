---
Type: Market-Intelligence-Pack
Status: Active
Business: BRIK
Region: Europe (primary: Italy)
Created: 2026-02-15
Updated: 2026-02-15
Last-reviewed: 2026-02-15
Owner: Pete
Source: Deep Research draft + internal baselines (as-of 2026-02-15) + operator cleanup
---

# BRIK Market Intelligence Pack - EU Hostel Direct Booking + OTA Distribution

## A) Executive summary (max 12 bullets; must answer Delta Q1-Q3 explicitly)

- Delta Q1 (Why is net booking value down YoY?): Net booking value is down EUR 92,297.23 (-15.2%) YoY, driven primarily by lower booking volume rather than price/ADR erosion. Volume effect explains ~89% of the YoY decline; net/booking explains ~11%. `[observed | High confidence]` (internal baseline, as-of 2026-02-15)
- The largest YoY decline is concentrated in peak/shoulder months: June (EUR -23,490.40), April (EUR -22,421.00), July (EUR -20,608.47). These three months explain ~72% of the annual net-value drop. `[observed | High confidence]` (internal baseline, as-of 2026-02-15)
- Direct share increased from 14.1% -> 20.5% (+6.4pp) YoY, meaning the business became less dependent on OTAs in mix, yet still lost total bookings. This is consistent with an OTA volume/ranking/availability problem (or demand displacement) that direct gains could not offset. `[observed -> inferred | Medium confidence]` (internal baseline, as-of 2026-02-15)
- Current web measurement is not decision-usable (GA4: 73 sessions, 0 begin_checkout, 0 conversions, 0 web vitals). Given the live site shows booking-widget placeholder strings (suggesting client-rendered booking), website conversion may be under-tracked or broken, blocking paid scaling. `[observed -> inferred | High confidence]` (internal baseline; BRIK site as-of 2026-02-15: https://hostel-positano.com/en/)
- External demand context does not support an Italy-wide collapse: EU tourism nights reached ~3.08B in 2025 (+2%), and Italy's 2024 inbound/non-resident nights exceeded 250M (+6.8%), >half of total nights. This strengthens the view that YoY decline is property/channel-specific, not macro-only. `[inferred | Medium confidence]` (Eurostat + ISTAT; see Sources)
- Fastest 90-day levers (ranked): (1) repair measurement + funnel tracking to establish reliable CVR/CAC gates; (2) OTA distribution recovery (availability parity, content, promos, ranking levers); (3) direct-rate value fencing (clear best-rate logic, perks, low-friction checkout) to raise direct conversion and reduce cancellation exposure. `[inferred | Medium confidence]`
- Delta Q2 (Fastest levers to move net value): The fastest net-value movement comes from recovering peak-month booking volume (April-July) via OTA visibility + inventory control, while simultaneously increasing direct conversion once tracking is fixed. This matches internal decomposition showing volume is the main driver. `[observed -> inferred | High confidence]` (internal baseline, as-of 2026-02-15)
- Delta Q3 (14-day stop/continue/start):
- STOP: scaling paid acquisition and any "growth" experiments that cannot be attributed end-to-end (until begin_checkout/purchase are measured). `[inferred | High confidence]`
- CONTINUE: direct-booking perks (breakfast + drink + discount) but restructure to be auto-applied and transparent at room/checkout level. `[observed -> inferred | Medium confidence]` (BRIK rooms page as-of 2026-02-15: https://hostel-positano.com/en/rooms/)
- START: a 14-day measurement repair + parity + OTA recovery sprint with explicit thresholds and reforecast triggers (see sections M + Q). `[inferred | High confidence]`

## B) Business context and explicit assumptions (include business model classification)

Business model classification (TODAY): A) Single-property direct booking site + OTAs.

Evidence:
- 11 rooms total inventory and inventory labels consistent with one property's rate plans. `[observed | High confidence]` (internal baseline, as-of 2026-02-15)
- Experiences commerce appears optional (site menu includes "Experiences"), but this is ancillary to accommodation and does not resemble a multi-property marketplace. `[observed -> inferred | Medium confidence]` (BRIK site as-of 2026-02-15: https://hostel-positano.com/en/)

Key internal baselines to anchor all decisions (observed, internal baseline as-of 2026-02-15):
- YoY (12 complete months) net value EUR 514,800.23 vs EUR 607,097.46 (Delta EUR -92,297.23).
- YoY bookings 1,906 vs 2,205 (Delta -299).
- YoY net/booking EUR 270.09 vs EUR 275.33 (Delta EUR -5.23).
- YoY direct share 20.5% vs 14.1% (Delta +6.4pp).
- GA4 snapshot: 73 sessions; 0 begin_checkout; 0 conversions (directional; incomplete).

Confidence labels used in this pack:
- High: supported by internal baselines and/or primary sources; low ambiguity.
- Medium: plausible and supported by some evidence; requires targeted validation.
- Low: weak/conflicting evidence; treat as hypothesis only.

External constraints explicitly adopted (observed):
- Paid acquisition is gated until conversion + measurement baselines are reliable.

Required next artifact (explicit; unblock channel-mix / unit economics split):
- Export bookings by channel + take rate/commission for last 12 complete months. Save as:
  - `docs/business-os/market-research/BRIK/data/2026-02-15-bookings-by-channel.csv`
  - `docs/business-os/market-research/BRIK/data/2026-02-15-commission-by-channel.csv`
  - Required fields (minimum): `month`, `channel` (direct / Booking.com / Hostelworld / other OTA), `bookings`, `gross_value`, `net_value`, `commission_amount`, `effective_take_rate`, `cancellations`, `refunds_or_adjustments`.

## C) Market size and demand signals table (with confidence labels)

| Signal | Geography | What it suggests for BRIK | Evidence type | Confidence | Evidence (URL) |
|---|---|---|---|---|---|
| Non-resident nights in Italy exceeded 250M in 2024 (+6.8% YoY); non-residents were 54.6% of total nights | Italy (national) | Inbound demand remains structurally strong; a YoY decline is less likely to be macro-only and more likely channel/offer-specific | Primary (ISTAT) | High | https://www.istat.it/wp-content/uploads/2025/03/Statistics-Today-Turist-flows-Q4-2024.pdf |
| EU tourism nights reached ~3.08B in 2025 (+2% YoY) | EU | Broad leisure demand remains high; competitive intensity rises (more travelers + more supply) | Primary (Eurostat) | High | https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260116-1 |
| 854.1M EU STR guest nights booked via major platforms in 2024 (+18.8%) | EU | Growing substitute pressure from STR platforms; total-price transparency becomes a decision driver | Primary (Eurostat platform data) | High | https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250402-1 |
| 123.7M EU platform nights in Q1 2024 (+28.3%) | EU | Off-season/platform growth can siphon price-sensitive travelers away from hostels unless direct value is clear | Primary (Eurostat) | High | https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20240729-1 |
| Monthly examples: inbound/outbound expenditure and seasonal shape | Italy | Peak season spend remains large; capturing share depends on distribution + perceived value | Primary (Bank of Italy) | High | https://www.bancaditalia.it/statistiche/tematiche/rapporti-estero/turismo-internazionale/evidenze-mensili/ |

Demand implications for Positano / Amalfi Coast (inferred):
- Peak demand is strong and price-inelastic at the destination level, but BRIK's YoY decline in April-July suggests lost share, not a lack of travelers. `[inferred | Medium confidence]`
- Substitute pressure (STR + hotels) means travelers increasingly compare total price + cancellation + fees rather than "nightly headline." `[inferred | High confidence]`

## D) Competitor map table (direct/adjacent/substitute + OTA/meta + experiences)

Selection logic (inferred):
- Catchment competitors = places travelers use as an Amalfi Coast base (Sorrento peninsula / Naples access) and/or budget alternatives near Positano.
- Wallet competitors = Italian city hostels attracting the same budget traveler wallet that would otherwise be allocated to expensive coastal nights.

Direct-property competitors (12 minimum; evidence-based):

| Competitor | Location bucket | Positioning & promise | Offer mechanics / trust patterns (examples) | Evidence (URL) |
|---|---|---|---|---|
| Seven Hostel | Catchment | Boutique hostel on Sorrento peninsula; quality/price ratio | Direct site messaging and booking UX patterns | https://sevenhostel.eu/ |
| Ulisse Deluxe Hostel | Catchment | Hostel/hotel hybrid near Sorrento center | Card guarantee / pay-later style framing on direct booking | https://www.ulissedeluxe.com/ |
| Hostel of the Sun Napoli | Catchment | "Perfect base" for Naples + Amalfi | Direct positioning around transport and traveler base | https://hostelnapoli.com/ |
| Ostello Bello Napoli | Catchment | Hostel + bar/events positioning | Strong social proof + direct CTAs | https://ostellobello.com/it/hostel/napoli/ |
| Albergo California (Positano) | Catchment | Hotel substitute for private-room travelers | "Official site" / direct booking engine mechanics | https://www.hotelcaliforniapositano.it/ |
| Sorrento B&D Rooms | Catchment | Budget rooms/guesthouse substitute | Direct booking engine presence (rooms/guesthouse substitute) | https://www.sorrentobedrooms.com/ |
| YellowSquare Rome | Wallet | Party/social hostel with pro entertainment | Direct offer stack and events-led value proposition | https://yellowsquare.com/rome/ |
| The Beehive | Wallet | Small independent hostel built around community | Community narrative + hosted activities | https://www.the-beehive.com/ |
| Plus Florence | Wallet | Large hostel/hotel hybrid with amenities | Amenities-led differentiator (pool/sauna etc) | https://plushostels.com/en/florence |
| Anda Venice Hostel | Wallet | "Design hostel" with experience-first narrative | Book-direct fence patterns (discounts, cancellation, perks) | https://www.andavenice.com/ |
| Generator Rome | Wallet | "Affordable luxury" hostel/boutique hybrid | Book-direct messaging; strong brand consistency | https://staygenerator.com/hostels/rome?lang=en-GB |
| Combo Milano | Wallet | Hybrid: hostel + bar/kitchen + events/culture hub | Targets locals + travelers via venue programming | https://thisiscombo.com/en/destinations/milan |

OTAs / meta (5 minimum):

| Channel | Role in funnel | Notable mechanics relevant to BRIK | Evidence (URL) |
|---|---|---|---|
| Booking.com | High-intent conversion at scale | Commission-based model; partner commission varies | https://partner.booking.com/en-gb/help/commission-invoices-tax/commission/understanding-our-commission |
| Hostelworld | Hostel demand aggregation | Hostel-focused demand + reviews; deposit/commission mechanics (varies by contract) | https://www.hostelworld.com/ |
| Airbnb | Substitute + sometimes hostel/hotel inventory | Service-fee model, strong total-price and policy norms | https://www.airbnb.com/help/article/1857 |
| Expedia Group | Additional OTA supply + packages | Distribution levers and packaging effects (high level) | https://www.expediagroup.com/ |
| Google Hotels / metasearch | Comparison-first journeys | Policy + price comparison norms; requires strong measurement | https://support.google.com/hotelprices/ |

Experience marketplaces (4 minimum):

| Platform | Why it matters for BRIK experiences cross-sell | Evidence (URL) |
|---|---|---|
| GetYourGuide | Traveler "things to do" discovery; can power affiliate/curated upsell | https://www.getyourguide.com/c/about/ |
| Viator | Free cancellation + reserve-now-pay-later patterns create conversion expectations | https://www.viator.com/ |
| Civitatis | Strong Italy coverage; useful for Amalfi/Naples day-trip upsells | https://www.civitatis.com/en/italy/ |
| Tiqets | Tickets-first; useful for museum bundles and skip-the-line norms | https://www.tiqets.com/en/about-tiqets/ |

Substitutes (category-level, inferred):
- Hotels & B&Bs / room-only guesthouses compete for private-room travelers.
- Short-term rentals are growing strongly in the EU, increasing supply and comparison-shopping friction.
- "Hostel-hybrid" lifestyle brands raise guest expectations (social spaces, bars, curated programming).
- Packages/bundles create "all-in" price anchors; BRIK must compete on transparency and direct perks.

## E) Pricing and offer benchmark table (using S1-S3 scenarios)

Fixed-date scenarios (for this run; as-of 2026-02-15):
- S1 Peak: 2026-07-17 -> 2026-07-19
- S2 Shoulder: 2026-05-12 -> 2026-05-14
- S3 Off-season: 2026-02-24 -> 2026-02-26

Important execution note (status): PARTIALLY BLOCKED (requires operator browser run).
- Many direct booking engines and OTA price surfaces are client-rendered and cannot be reliably executed end-to-end in the Deep Research environment for exact check-in/check-out contracts.
- Decision requirement: this pack must still cite competitor positioning/mechanics pages (section D), and must produce an operator-ready capture table + protocol to collect missing scenario totals.

### Parity & Scenario Capture Table (operator-fill; single table feeds Stop/Continue/Start)

Fill this table via a browser run and screenshots. Save the filled data as:
- `docs/business-os/market-research/BRIK/data/2026-02-15-parity-scenarios.csv`

| Scenario | Surface | Total price (all-in) | Taxes/fees clarity | Cancellation cutoff | Deposit/payment | Notes / parity issue | Evidence (URL) |
|---|---|---:|---|---|---|---|---|
| S1 | BRIK direct | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | https://hostel-positano.com/en/book |
| S1 | Booking.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |
| S1 | Hostelworld | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |
| S2 | BRIK direct | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | https://hostel-positano.com/en/book |
| S2 | Booking.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |
| S2 | Hostelworld | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |
| S3 | BRIK direct | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | https://hostel-positano.com/en/book |
| S3 | Booking.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |
| S3 | Hostelworld | BLOCKED | BLOCKED | BLOCKED | BLOCKED |  | (property listing URL) |

Decision mapping (how this table drives Stop/Continue/Start):
- If OTA total price is lower AND perks are not visible/applied on direct: START "parity + perks reframe" task; STOP any paid tests until fixed.
- If direct is lower or equal but fee/tax clarity differs: START "total price transparency" task (checkout module + confirmation email).
- If cancellation/payment terms differ materially: START "policy alignment" task to reduce abandonment and disputes.

### Offer mechanics benchmark (visible now; decision-relevant)

| Item | BRIK direct (visible now) | Competitive pattern (examples) | Implication |
|---|---|---|---|
| Direct-book fence | Direct booking perks (discount, breakfast, welcome drink) appear on rooms page | Many hostels push "book direct" discounts/perks | Needs earlier, clearer total-value framing at CTA level |
| Cancellation framing | Refundable: free cancel up to 72h before 15:00; non-refundable: 100% at booking; cancellation admin fee EUR 5 | Platforms train users to expect clear cancellation rules | Make cancellation rules scannable and consistent across direct + OTAs |
| Payments | Visa/Mastercard; cash EUR; refundable may be pay at check-in; security deposit up to one night per guest | Many competitors emphasize "pay later / card guarantee" | Deposit rules can suppress conversion if not explained (why/when released/amount) |
| Trust signals | Reviews shown: Hostelworld 2,757 reviews score 9.3; Booking.com 579 reviews score 9.0 (as of Nov 2025) | Reviews + social proof drive conversion | Move review proof closer to booking CTA and embed recent snippets |
| Local taxes | Tourist tax exists and varies; must be communicated clearly | Platforms increasingly push all-in price display | Direct checkout must show tourist tax handling clearly |

14-day manual protocol to complete scenario totals (fastest path to unblock):
- For each surface (direct + OTA), enter dates for S1/S2/S3; 1 traveler; choose cheapest refundable if offered else cheapest.
- Screenshot: room selection + total price breakdown + taxes/fees + cancellation cutoff + deposit/payment method.
- Record into the single parity table above; compute deltas and note "value fences" (breakfast/drinks, discounts, pay-later).
- Exit criteria: >=8 direct competitors + >=2 OTAs fully captured across all three scenarios (in addition to BRIK parity).

## F) Segment and JTBD section (primary + secondary sequence)

Primary segment (JTBD): "Access Positano on a budget without losing the social/trust layer."
- Functional job: secure a bed/room with predictable total cost and clear rules (check-in, cancellation, taxes). `[inferred | High confidence]`
- Emotional job: feel safe/welcomed in a high-status destination while paying hostel-level pricing; avoid scams/fake listings. `[inferred | Medium confidence]`
- Social job: meet other travelers; shared spaces and events matter. `[observed -> inferred | High confidence]` (competitor positioning patterns; see section D)

Secondary segment (JTBD): "Couples/pairs seeking a 'value luxury' Amalfi base."
- Private rooms + "best rate direct" framing can convert couples priced out of hotels. `[observed -> inferred | Medium confidence]` (BRIK rooms page: https://hostel-positano.com/en/rooms/)

Near-term implication (supported, inferred):
- Traveler comparison behavior emphasizes total price + cancellation + fees early and consistently (platform norm); direct sites must remove "price surprise" friction. `[inferred | Medium confidence]`

## G) Unit economics priors table (AOV/net per booking/CAC/CVR/cancellation/refund exposure/margin ranges)

Model scope: single-property accommodation (hostel) with direct + OTAs; experiences as optional add-on.

| Metric | Direct (website/email) | OTA (Booking/Hostelworld/others) | Evidence / assumptions | Confidence |
|---|---|---|---|---|
| Net per booking (AOV proxy) | EUR 270.09 (observed blended) | EUR 270.09 (observed blended) | Observed as blended net/booking (internal baseline). Channel split unknown. | High (blended), Low (split) |
| Payment processing fees | Assumption: ~1.4-3.4% + fixed fee (varies by PSP/market) | Often included (OTA collects) or still paid if property collects | Stripe/PayPal fee tables (vary by country/product) | Medium |
| OTA commission (property-side) | N/A | Assumption range: 10-25% (varies by contract) | Booking.com notes commission varies; verify with invoices | Medium |
| Cancellation exposure | Refundable has 72h cutoff; admin fee EUR 5 | Platform rules affect refunds/cancellations | BRIK terms page: https://hostel-positano.com/en/terms | High |
| Support cost per booking | Assumption: EUR 1-6 | Assumption: EUR 2-10 | No internal support logs provided; validate via time tracking | Low |
| Contribution margin per booking (before fixed costs) | Assumption: 65-85% of net | Assumption: 45-75% of net | Depends on commission, variable cost, refund rate | Low-Medium |
| CAC | Low for organic; paid gated | "CAC" embedded in commissions | Treat commission as variable acquisition cost | Medium |

What would make these ranges wrong (and how to validate fast):
- If OTA commission is materially above/below assumptions: pull actual commission invoices and compute effective take rate per channel for 30 days.
- If refunds/cancellations materially differ by channel: export cancellations by source and compute net retained value vs booked value.

## H) Channel strategy implications (first 90 days; constrain paid until measurement + CVR baselines)

North star for first 90 days (inferred): recover peak-month volume without buying demand prematurely. Given volume explains ~89% of YoY net-value loss, distribution recovery and conversion clarity dominate ROI. `[observed -> inferred | High confidence]` (internal baseline)

Channel priorities (ranked):
- OTAs as volume stabilizers (0-45 days):
  - Rationale: direct share rose, but total bookings fell; pattern is consistent with an OTA visibility or configuration problem. `[inferred | Medium confidence]`
  - Action focus: content refresh, promo controls for April-July, cancellation parity, inventory open windows, eliminate rate-plan confusion. `[inferred | Medium confidence]`
- Direct as margin + data asset (0-90 days, but only after measurement repair):
  - Ensure direct perks are automatically applied and visible in total price.
  - Add metasearch once tracking is sound (Google Hotel Ads / similar).
- Experiences as attach-rate experiment (45-90 days):
  - Use marketplaces for supply reference and pricing norms; sell curated day trips as post-booking add-ons.

Paid acquisition gate (hard rule, inferred):
- Do not scale paid until: (a) begin_checkout + purchase are tracked; (b) baseline CVR is stable for 2 consecutive weeks; (c) channel attribution reconciles to net booking value exports.

## I) Website design implications (implementation-ready checklist with P0/P1/P2 + impact/effort/metric)

Live-funnel audit highlights (observed -> inferred):
- The "Book/Check availability" page does not expose room selection and checkout steps in the server-rendered view; homepage shows untranslated booking-widget keys (e.g. "booking.checkInLabel..."), a common symptom of client-side rendering/translation injection. This is consistent with GA4 showing 0 begin_checkout and 0 conversions. `[observed -> inferred | High confidence]` (BRIK site: https://hostel-positano.com/en/)

P0 (<=14 days) checklist (>=12 items):

| Priority | Item | Expected impact | Effort | Metric moved |
|---|---|---|---|---|
| P0 | Implement cross-domain/cross-subdomain tracking for booking engine (or server-side tracking) so begin_checkout + purchase fire | High | M | begin_checkout rate; purchase count |
| P0 | Add GA4 events: view_item (room), selection, begin_checkout, purchase; plus phone/email/WhatsApp clicks | High | M | funnel visibility |
| P0 | Create a "Book now" sticky CTA on mobile with date persistence | Medium | S | CTA CTR; booking starts |
| P0 | Replace placeholder booking labels and ensure booking widget renders reliably on first load | High | M | bounce rate; booking starts |
| P0 | Show total price clarity: what's included, tourist tax handling, admin fee visibility, deposit rules | High | S | checkout abandonment; support tickets |
| P0 | Summarize cancellation terms in 2 lines per rate (Refundable vs Non-refundable) with exact cutoff | Medium | S | CVR; disputes |
| P0 | Move review proof (scores + counts) next to CTA and include 2-3 recent snippets | Medium | S | CVR |
| P0 | Add "Direct perks" value box per room card and ensure it's auto-applied | Medium | S | room->checkout rate |
| P0 | Implement email capture for "price drop / availability alert" for peak dates | Medium | M | leads; returning sessions |
| P0 | Add support promise (response SLA) and channels (email/WhatsApp) with click tracking | Low-Med | S | assisted conversions |
| P0 | Start weekly reconciliation: bookings export <-> GA4 purchase <-> net value | High | M | attribution accuracy |
| P0 | Create the channel export artifacts (bookings + commission/take rate) for 12 complete months | High | M | ability to quantify channel-mix effect |

P1 (30-60 days):
- Launch metasearch (Google Hotel Ads) once conversion tracking is validated.
- Build room-type merchandising pages (solo bed vs private room vs couples).
- Automate post-booking upsell flow (experiences + late checkout + drinks).

P2 (nice-to-have):
- On-site personalization (repeat visitor, language-aware perks).
- A/B testing program (pricing display order, trust modules).

Measurement repair plan (must enable weekly decisions):
- Events: view_item (room page), select_date, begin_checkout, purchase/booking_confirm, generate_lead (email), click_phone, click_whatsapp, click_directions.
- UTM discipline: enforce utm_source/utm_medium/utm_campaign on all marketing links; keep a single source-of-truth channel mapping.
- Reconciliation: weekly join between net booking value exports (internal truth) and GA4 purchase events; flag deltas >5% for investigation.

## J) Product + operations implications (booking product + experiences cross-sell; failure modes; support)

Booking product implications (inferred):
- With only 11 rooms, the opportunity is less about "more traffic" and more about reducing leakage (availability errors, parity confusion, abandoned checkouts) and increasing yield per available bed in peak months. `[inferred | High confidence]`
- The booking terms include a security deposit up to one night per guest and a EUR 5 cancellation admin fee; these must be explained to reduce disputes and chargebacks. `[observed -> inferred | Medium confidence]` (BRIK terms: https://hostel-positano.com/en/terms)

Experiences cross-sell approach (inferred):
- Treat experiences as post-booking attach first, not pre-booking friction. Use marketplaces for supply and pricing norms.
- Failure mode: bundling accommodation + experiences into a single "package price" can trigger package travel obligations (see K). `[inferred | Medium confidence]`

Operational "must not break" list (inferred):
- Inventory sync between PMS/channel manager and OTAs must be audited weekly in April-July.
- Check-in window and ID/payment requirements should be repeated in pre-arrival messages to reduce no-shows.

## K) Regulatory/claims constraints and red lines

Price transparency (EU):
- EU consumer law requires showing the total price inclusive of taxes, or how it is calculated, and any additional costs where applicable. `[observed | High confidence]` (Directive 2011/83/EU; see Sources)
- Red line: do not hide mandatory fees (service/admin) until after checkout steps.

Local taxes (Positano):
- Municipal tourist tax applies and must be communicated clearly (whether collected online or at check-in). `[observed | High confidence]` (Comune di Positano; see Sources)

Payments (PSD2 / SCA):
- Card payments in the EU are subject to Strong Customer Authentication requirements; payment flows/providers must support SCA. `[observed | High confidence]` (PSD2 + RTS; see Sources)

Data/privacy (GDPR + cookies):
- Personal data processing must follow GDPR obligations. `[observed | High confidence]` (GDPR; see Sources)

Package Travel Directive (accommodation + experiences):
- If BRIK sells a combination of travel services as a "package" or linked travel arrangement, Package Travel Directive duties can apply. `[observed | High confidence]` (Directive 2015/2302; see Sources)
- Practical guardrail (inferred): keep experiences as optional add-ons charged separately and clearly disclosed, unless compliant package infrastructure exists.

## L) Proposed 90-day outcome contract (outcome, baseline, target, by-date, owner, leading indicators, decision links)

| Outcome | Baseline (observed) | 90-day target (inferred) | By date | Owner | Leading indicators (weekly) | Decision link |
|---|---|---|---|---|---|---|
| Measurement usable for decisions | GA4: 73 sessions; 0 begin_checkout; 0 conversions | Purchase tracking + begin_checkout live; >=95% reconciliation between bookings export and GA4 purchase | 2026-03-15 | Growth/Ops | begin_checkout/session; purchase/session; reconciliation delta | Unlock metasearch / limited paid tests |
| Peak-month volume recovery plan set | Apr-Jul were top YoY decline months | Inventory + promo calendar for Apr-Jul locked (>=8-week lead) | 2026-03-31 | Revenue/Ops | OTA impressions/rank signals where available; pickup curve | Reforecast YoY recovery |
| Channel-level unit economics visibility | Channel split unknown | Channel export artifacts created and reviewed | 2026-03-15 | Revenue/Ops | effective take rate; cancels/refunds by channel | Quantify channel-mix effect |
| Direct conversion lift (once tracked) | Unknown (not measurable) | Establish baseline CVR, then +20-40% relative lift from UX fixes | 2026-05-15 | Growth | room view->begin_checkout; begin_checkout->purchase | Decide on scaling direct channels |
| Direct share protection | Direct share 20.5% (YoY up) | Maintain >=20% while recovering OTA volume | 2026-05-15 | Revenue | direct share (weekly), net value | Budget allocation |

## M) First-14-day validation plan (tests + thresholds + re-forecast triggers)

| Test | What it validates | Pass threshold | If fail | Data source |
|---|---|---|---|---|
| Implement begin_checkout + purchase tracking | Measurement viability | >=95% reconciliation between bookings export and GA4 purchase (or >=20 purchases tracked if volume allows) | Pause growth; debug cross-domain/server-side tracking | GA4 + bookings export |
| Booking widget render + mobile flow | Funnel friction | >=90% of test sessions can reach checkout without reload/label errors | Replace/patch booking widget integration | QA logs + GA4 |
| OTA inventory & rate-plan audit | Distribution leakage | 0 critical mismatches (sold-out when not; wrong min-stay; wrong occupancy) | Daily audit until stable | PMS/OTA extranet |
| Manual S1-S3 parity capture | Price competitiveness | Direct is <= OTA total OR direct wins via perks with clear value | Adjust rate fences/perks/taxes display | Screenshots + parity table |
| Channel export artifacts | Channel-mix + margin visibility | Both CSVs present and reviewed; effective take rate computed | Block deeper channel-mix analysis until present | CSV exports + invoices |

## N) Assumptions register (assumption, evidence, confidence, impact, validation test)

| Assumption | Evidence | Confidence | Impact if wrong | Fast validation |
|---|---|---|---|---|
| OTA volume loss is a primary driver of booking decline | Direct share rose while total bookings fell, but channel-level data missing | Medium | Misallocates effort (OTAs vs pricing/product) | Export bookings by channel for last 12 months |
| Website bookings are undercounted due to tracking/integration | GA4 shows 0 begin_checkout; booking UI appears client-rendered | High | Underestimates direct performance | Implement purchase tracking + reconcile |
| Typical OTA take rate 10-25% | Booking.com notes varies; industry anchors | Medium | Margin model errors | Pull invoices / effective commission |
| Experiences can increase net value via attach rate | Existence of experience menu + marketplaces | Medium | Wasted effort if low take | Test post-booking add-on email (A/B) |

## O) Risk register (risk, why it matters, mitigation)

| Risk | Why it matters | Mitigation |
|---|---|---|
| Tracking remains broken -> "flying blind" | Blocks paid scaling; misreads conversion | P0 measurement sprint + reconciliation |
| Peak inventory misconfigured on OTAs | Direct cannot replace lost OTA volume fast | Weekly OTA audit; simplify rate plans |
| Price/fee opacity triggers drop-offs or disputes | Price-sensitive travelers react to surprises | Total price clarity; tourist tax messaging |
| Experiences bundling triggers package travel duties | Compliance exposure | Keep add-ons separate unless compliant |

## P) Source list with URL + access date

Access date for all sources: 2026-02-15

BRIK (official):
- https://hostel-positano.com/en
- https://hostel-positano.com/en/rooms/
- https://hostel-positano.com/en/book
- https://hostel-positano.com/en/terms
- https://hostel-positano.com/en/assistance/bookings-reservations

Demand / market (primary and reputable):
- ISTAT - Statistics Today, Tourist flows Q4 2024 (PDF): https://www.istat.it/wp-content/uploads/2025/03/Statistics-Today-Turist-flows-Q4-2024.pdf
- ISTAT - Tourism Satellite Account 2023 (EN) (PDF): https://www.istat.it/wp-content/uploads/2025/12/Statistica_Report_CST_2023_EN.pdf
- Eurostat - EU tourism nights at record 3.08B in 2025: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260116-1
- Eurostat - Tourism statistics explained: https://ec.europa.eu/eurostat/statistics-explained/index.php/Tourism_statistics_-_nights_spent_at_tourist_accommodation_establishments
- Eurostat - New records set by online booking platforms in 2024: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250402-1
- Eurostat - Bookings via online platforms rise by 28.3% in Q1 2024: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20240729-1
- Bank of Italy - Survey on International Tourism 2024 (PDF, EN): https://www.bancaditalia.it/pubblicazioni/indagine-turismo-internazionale/2025-indagine-turismo-internazionale/en_statistiche_ITI_30062025.pdf?language_id=1
- Bank of Italy - International tourism (monthly evidences index): https://www.bancaditalia.it/statistiche/tematiche/rapporti-estero/turismo-internazionale/evidenze-mensili/
- OECD - Strengthening tourism statistics in Italy (PDF): https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/07/strengthening-the-tourism-statistics-and-data-system-in-italy_30c05dc9/fe0b1b14-en.pdf
- OECD - Digitalisation of the tourism ecosystem in Italy (PDF): https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/07/promoting-the-digitalisation-of-the-tourism-ecosystem-in-italy_33726375/63616a85-en.pdf

Regulatory:
- Consumer Rights Directive (2011/83/EU): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02011L0083-20220528
- PSD2 (Directive 2015/2366): https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32015L2366
- SCA RTS (Reg. 2018/389): https://eur-lex.europa.eu/eli/reg_del/2018/389/oj/eng
- GDPR (Reg. 2016/679): https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- Package Travel Directive (2015/2302): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A32015L2302
- Comune di Positano tourist tax: https://comune.positano.sa.it/servizi/imposta-di-soggiorno-ids

Payments / fees:
- Stripe pricing: https://stripe.com/pricing
- PayPal merchant fees (PDF example): https://www.paypalobjects.com/marketing/ua/pdf/FR/en/fr-en-merchant-fees-17-jul-2025.pdf

Competitor sites (direct):
- Seven Hostel: https://sevenhostel.eu/
- Ulisse Deluxe Hostel: https://www.ulissedeluxe.com/
- Hostel of the Sun Napoli: https://hostelnapoli.com/
- Ostello Bello Napoli: https://ostellobello.com/it/hostel/napoli/
- Albergo California (Positano): https://www.hotelcaliforniapositano.it/
- Sorrento B&D Rooms: https://www.sorrentobedrooms.com/
- YellowSquare Rome: https://yellowsquare.com/rome/
- The Beehive: https://www.the-beehive.com/
- Plus Florence: https://plushostels.com/en/florence
- Anda Venice Hostel: https://www.andavenice.com/
- Generator Rome: https://staygenerator.com/hostels/rome?lang=en-GB
- Combo Milano: https://thisiscombo.com/en/destinations/milan

Platforms:
- Booking.com partner commission: https://partner.booking.com/en-gb/help/commission-invoices-tax/commission/understanding-our-commission
- Hostelworld: https://www.hostelworld.com/
- Airbnb fees: https://www.airbnb.com/help/article/1857
- Expedia Group: https://www.expediagroup.com/
- Google Hotels help: https://support.google.com/hotelprices/

Experiences:
- GetYourGuide (about): https://www.getyourguide.com/c/about/
- Viator: https://www.viator.com/
- Civitatis Italy: https://www.civitatis.com/en/italy/
- Tiqets (about): https://www.tiqets.com/en/about-tiqets/

## Q) Delta and feedback for human operators (required)

What is working vs not working given internal baseline trends?

Working (observed -> inferred):
- Direct share improved YoY (14.1% -> 20.5%), which implies direct tactics/perks and/or manual-direct processes have traction. `[observed | Medium confidence]` (internal baseline)
- Strong review proof is visible on the site (high counts and scores), a major trust asset. `[observed | Medium confidence]` (BRIK rooms page: https://hostel-positano.com/en/rooms/)

Not working (observed -> inferred):
- Peak-month booking volume fell materially (April-July drive most of the YoY net-value loss), indicating lost share or capacity utilization issues when demand is highest. `[observed | High confidence]` (internal baseline)
- Measurement and website funnel instrumentation are not reliable, preventing fast iteration and paid gating. `[observed | High confidence]` (internal baseline; GA4 snapshot)

Stop / Continue / Start (14-day focus)

STOP (14 days)
- Action: stop scaling paid acquisition and any channel spend beyond brand defense until purchase-level tracking is accurate.
- Rationale: with 0 begin_checkout/purchase in GA4, you cannot compute CVR or CAC reliably. `[observed -> inferred | High confidence]` (internal baseline)
- Expected metric movement: N/A (risk reduction); prevents mis-spend.
- 14-day verification: tracking reconciliation >=95% between bookings export and GA4 purchase.

CONTINUE (14 days)
- Action: continue direct-booking perks, but keep messaging consistent and placed at room + checkout levels (auto-applied; visible in total price).
- Rationale: direct perks are a proven industry pattern and already present; they can justify parity differences versus OTAs. `[observed -> inferred | Medium confidence]` (BRIK rooms page: https://hostel-positano.com/en/rooms/)
- Expected metric movement: +10-25% relative improvement in room-view -> begin_checkout (once tracked).
- 14-day verification: A/B test "perks module near CTA" vs control; compare funnel rates.

START (14 days)
- Action: start a single-threaded "Measurement + OTA recovery" sprint tied to the three worst months (April/June/July).
- Rationale: volume is the main driver of YoY decline; OTAs remain the fastest volume lever for a single-property hostel. `[observed -> inferred | High confidence]` (internal baseline)
- Expected metric movement: +10-20% booking pickup vs same booking window (internal), especially for peak dates.
- 14-day verification: track pickup curve for April-July 2026 dates vs last 2 weeks; confirm OTA impressions/rank signals where available.

START (14 days)
- Action: start the S1-S3 parity capture protocol (manual) and fix any discrepancies in taxes/fees visibility and cancellation cutoff.
- Rationale: travelers increasingly compare total price; fee opacity increases abandonment and disputes. `[inferred | Medium confidence]`
- Expected metric movement: lower checkout abandonment; fewer "price surprise" support tickets.
- 14-day verification: parity table filled for BRIK direct + 2 OTAs + >=8 competitors; parity issues logged and resolved/mitigated.

START (14 days)
- Action: start a "tourist tax clarity" module in checkout and confirmation emails (collected when/how much).
- Rationale: local tax is real and must be transparent; reduces guest friction. `[observed -> inferred | High confidence]` (Comune di Positano tax page; see Sources)
- Expected metric movement: reduced booking disputes; higher post-stay satisfaction.
- 14-day verification: tag support contacts mentioning "tax/fees"; target -30% mentions after rollout.

