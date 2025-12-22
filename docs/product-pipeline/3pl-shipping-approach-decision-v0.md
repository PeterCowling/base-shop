<!-- docs/product-pipeline/3pl-shipping-approach-decision-v0.md -->

Type: Guide
Status: Active
Domain: Commerce / Sourcing / Ops / Logistics
Audience: Non-coders (operators + decision maker)
Last-reviewed: 2025-12-21
Version: v0.2 (best-bet, operator-friendly)
Relates-to plan: [China Sourcing → EU Multi-Channel Capital Return Pipeline](./taobao-amazon-margin-pipeline-plan.md) (Section 6.1)
Notes: Assumptions-first; upgraded via quotes + pilots
Scope: EU inbound from China + Amazon EU fulfillment + “path to” multi-channel (Amazon + DTC) and higher volume / customized products.

Note: This guide exceeds 350 lines to keep the full decision pack self-contained. Follow-up: split into `docs/product-pipeline/{glossary,lanes,providers,stage-bc-mapping,sources}.md` once v0.2 stabilizes.

# 3PL + Shipping Approach Decision (EU Amazon-first → Multi‑channel scale)

## 0) What this doc delivers

This document is meant to be self-contained and to unblock Stage B (landed cost & lead time) + Stage C (fulfillment & selling costs) inputs on a “best bet” basis, while giving a clear path from:

Experiment purchases (small pilots sold on Amazon EU) →

Repeatable reorders (higher volume, lower shipping cost) →

Multi-channel + customization (EU hub, returns control, kitting, packaging) →

Scale (redundant lanes/providers, predictable KPIs, stronger compliance posture)

It covers:

- Operating models (where inventory sits, who fulfills)
- Shipping lanes (China → EU → Amazon/customer)
- Provider shortlist with must-have gates and a weighted scorecard
- Baseline costings with source + effective date, and a currency conversion rule
- A quote basket (including hazmat) for collecting comparable quotes
- Stage B/C entry mapping (what goes where, and when cash leaves)
- Governance cadence (monthly lane review + lane confidence/trust)

Important: This is a decision-support “lane model,” not legal/tax advice. Use it to avoid false economics and to make pilots auditable.

## 1) Quick glossary (non‑coder friendly)

### FBA / FBM

FBA = Fulfilled by Amazon (Amazon stores inventory + ships to customers + handles most returns).

FBM = Fulfilled by Merchant (we/3PL ships orders; may lose Prime badge depending on program).

### DDP / DAP (Incoterms)

DDP (Delivered Duty Paid): seller/shipper delivers with import duties/taxes handled before delivery (in practice: forwarder often arranges).

DAP (Delivered At Place): delivered to named place, but import clearance/duties/VAT are buyer’s responsibility.

### IOR (Importer of Record)

Entity legally responsible for the import: customs declarations, duties/VAT, compliance.

### EFN / MCI / Pan‑EU / CEP

Amazon programs affecting where inventory sits and cross‑border shipping:

EFN (European Fulfilment Network): inventory in one country; Amazon ships cross‑border for other EU marketplaces.

MCI (Multi‑Country Inventory): inventory stored in multiple countries you choose.

Pan‑EU: Amazon can distribute inventory across multiple EU countries (highest reach; more VAT complexity).

CEP (Central Europe Program): Amazon may store inventory in DE/PL/CZ region (operationally helpful; may increase tax/reg obligations).

### CBM

Cubic meters (m³). Used for freight pricing and storage volume.

### Hazmat / Dangerous Goods

Products requiring dangerous-goods classification/handling (e.g., lithium batteries, flammables, aerosols, some liquids).

## 2) The two decisions we’re making

### Decision A — Operating model (how fulfillment works)

We define four operating models (instead of “Approach 1/2/3”):

Model A: FBA‑first (single launch country)

Model B: EU 3PL hub → replenish FBA + fulfill DTC (multi‑channel ready)

Model C: EU 3PL fulfills everything (FBM + DTC)

Model D: Ship direct from China per order (baseline only; generally not recommended)

### Decision B — Provider set (who executes)

Almost always a set of providers:

China-side pickup/consolidation

International freight + customs clearance (+ IOR handling strategy)

EU-side prep/warehouse/returns (either Amazon FBA only, or a 3PL hub)

## 3) Best‑bet recommendation (path from experiments → scale)

### M0 (Bootstrap / experiments): Model A (FBA‑first, DE-only)

Goal: move fast with minimal ops burden and low failure risk.

Why: FBA absorbs the hardest parts (customer shipping + returns). For experiments, the “cost of complexity” is usually bigger than the “cost of higher freight”.

Best bet lane:

China supplier → forwarder → Amazon FBA Germany inbound (start with DE-only inventory to reduce multi-country complexity)

Optional: Germany prep center if supplier cannot label/pack to Amazon standard

When to upgrade: once you have repeatable reorder signals and want lower unit freight + multi-channel options.

### M1 (Repeatable / scaling reorders): Model B (EU hub + FBA replenishment + DTC)

Goal: reduce shipping cost, control returns/rework, support a website, and enable customization/kitting.

Best bet lane:

China → EU hub (often NL or DE) via sea/rail (lower €/unit)

Hub handles:

receiving + QC + labeling/kitting

replenishment shipments into Amazon

DTC fulfillment from the same stock

returns processing and rework (critical for scaling & for customization)

### M2 (Scaled): Model B + redundancy + broader Amazon programs

Goal: reliability + resilience.

Add:

Second forwarder lane (redundancy)

Start using CEP/MCI/Pan‑EU only when you can handle the compliance surface area and your SKU economics justify it.

## 4) Operating models (defined fully)

### Model A — FBA‑first (single launch country start)

Flow
Supplier → forwarder → (optional prep center) → Amazon FBA (DE) → Amazon customer delivery + returns

Pros

Lowest operational overhead day‑2

Highest conversion/Prime benefits (generally)

Amazon handles last‑mile and many returns steps

Cons

Less flexible for DTC

Prep/compliance constraints

Storage fee exposure and “aged inventory” risk

Best for

FLIP pilots

Low-touch items with clear compliance, low damage risk

Testing demand/velocity before building complexity

### Model B — EU 3PL hub → replenish FBA + fulfill DTC

Flow
Supplier → forwarder → EU 3PL hub → (a) replenish Amazon FBA, (b) fulfill DTC orders → consolidated returns + rework

Pros

Multi‑channel from day 1 (Amazon + website)

Kitting/bundling/labeling becomes easy

Single returns + rework node → crucial for CUSTOMIZE and later DEVELOP handoff

Cons

Adds cost per touch (receive, storage, pick, outbound)

Requires discipline (inventory accuracy, reorder points, replenishment planning)

Best for

Repeatable reorders

CUSTOMIZE (packaging, inserts, bundles)

Higher volume where sea/rail savings dominate

### Model C — EU 3PL fulfills Amazon as FBM + DTC (no FBA)

Flow
Supplier → forwarder → EU 3PL → fulfill all orders (Amazon FBM + DTC)

Pros

Maximum control (packaging, unboxing, inserts)

No Amazon inbound quirks; can route stock dynamically

Cons

Conversion/Prime risk (varies by program/category)

Operational burden and customer-experience risk increases

Returns/claims hit your workflow more directly

Best for

Brand-led DTC and stable SKUs, or specific niches where FBM performs strongly

Later-stage diversification, not early experiments

### Model D — Ship orders direct from China (cross‑border small parcel)

Included only as a baseline. Usually not suitable for Amazon EU expectations and creates high compliance/cancellation risk.

## 5) Currency + unit normalization (so comparisons don’t go wrong)

### 5.1 Base currency rule

All pipeline economics should be entered in EUR.

If any quote is in USD/CNY/GBP, convert to EUR using the ECB reference rate on the quote date (or the latest available business-day rate).

Record with every quote:

quote currency

FX rate used

FX effective date

quote TTL/expiry date

This prevents “quiet drift” when someone mixes $/kg and € fees.

### 5.2 Freight unit rule (kg vs CBM vs container)

Freight quotes come in different bases. Convert them consistently:

If priced €/kg → use chargeable weight (may be volumetric weight).

If priced €/CBM → use shipment CBM.

If priced €/container → divide by usable CBM or by total units in that shipment.

Chargeable weight reminder (air/courier): chargeable weight is often the greater of actual and volumetric.

## 6) Baseline “best bet” costings (v0.2) + where they come from

This section provides starter numbers so Stage B/C can run today.

Rule: anything not based on a source is explicitly labeled INTERNAL ASSUMPTION.

### 6.1 Amazon FBA fees (EU) — baseline anchors

From Amazon’s EU FBA rate card (effective as of 15 Oct 2025):

Example DE (non‑CEE) small parcel fulfillment fee (base for first 100g + incremental per additional 100g).
(Exact tiers vary by size tier and weight band.)

Additional hazmat / lithium battery fee: €0.10 per unit (if applicable).

Storage (DE/FR/IT/ES/NL/PL/BE/IE):
€18.17/m³/month (Jan–Sep) and €26.58/m³/month (Oct–Dec) for standard size, “all other categories.”
Hazmat storage is higher.

Amazon optional service fees (if Amazon performs prep/label): fees exist for labeling, bagging, bubble wrap, etc.

How we use these in the pipeline

Stage C uses fulfillment fee, referral fee, and sale‑time costs.

Stage B uses inbound prep/label/QC, freight, duties/VAT, and inbound timing.

### 6.2 EU 3PL “hub” pricing — baseline ranges

Netherlands market snapshot (useful as a hub baseline for EU):

Storage per pallet/month (small volume): €10–15

Pick & pack per order (small volume): €2.50–3.50

Shipping NL 0–10kg: €5.95–7.95

Returns processing: €4.50–5.50

These are market ranges, not guarantees—always quote for your profile.

### 6.3 Example public price list: Germany FBA prep center (for pilots)

One Germany-based prep provider publishes indicative pricing:

Full FBA prep service: €0.70 / unit

Product labeling: from €0.30 / unit

Inbound inspection: €0.10 / unit if that’s the only service

Hazmat prep: from €0.30 / unit

Storage: €15 / m³ / month (after free allowance)

Container unloading: €200 (20ft), €400 (40ft)

This is not “the market,” but it’s a useful starting anchor for Stage B.

### 6.4 Air freight “linehaul signal” (not door‑to‑door)

Freightos weekly market update (Dec 12, 2025) reported China → Europe air rates dipped to about $3.50/kg (market index signal).
Use this as a linehaul indicator, then add provider-specific fixed charges and customs/delivery costs via quotes.

## 7) Duty + VAT treatment (don’t oversimplify)

### 7.1 Practical reality for the pipeline

Duties are a real cost.

Import VAT is often reclaimable (if you’re VAT registered and compliant), but it is still a cash outflow until reclaimed → it affects peak cash and payback time (Stage K), even if it doesn’t reduce long-run profit.

### 7.2 Safe modelling rule (non‑coder friendly)

For M0/M1 ranking:

Always calculate a “cash‑out landed cost” including duty + import VAT.

Separately, decide whether VAT is reclaimable and if so, model a reclaim delay (e.g., 30–90 days depending on setup).

If you cannot model VAT reclaim timing confidently, treat import VAT as worst-case cash tied up for the pilot horizon.

### 7.3 Worked mini-example (illustrative, not tax advice)

Assume:

Goods value: €900

Freight/insurance to EU border: €200

Customs value basis commonly includes goods + transport/insurance.

Duty rate: 4% (HS-code dependent; example only)

Import VAT: Germany standard VAT rate is 19% (example)

Calculations:

Customs value ≈ €900 + €200 = €1,100

Duty ≈ 4% × €1,100 = €44

Import VAT base commonly includes customs value + duty (and can include other import charges)

Import VAT ≈ 19% × (€1,100 + €44) = 19% × €1,144 = €217.36

How to interpret

Duty is a cost.

Import VAT may be reclaimable but still ties up cash until reclaimed.

## 8) Quote basket (the minimum set of profiles we quote)

Instead of quoting every SKU, we quote a small basket representing our expected mix.

Rule: all quotes must specify:

Incoterm (DDP/DAP), delivery point, what is included

Transit time + variance estimate

Itemized charges (linehaul, origin/destination fees, customs brokerage, delivery appointment, etc.)

Validity period (TTL) + surcharges policy

Hazmat policy and exclusions

### 8.1 Basket profiles (v0.2)

Small/light non‑hazmat (pilot)

Example: 1 carton, 10–20kg, 0.05–0.10 CBM

Destination: DE FBA (SPD carton delivery) and/or DE prep center

Standard parcel (repeatable reorder)

Example: 100kg, 0.5 CBM LCL

Destination: NL/DE hub

Bulky / oversize

Example: 1–2 CBM, low density, oversize risk

Destination: hub + then replenish Amazon (to test cost stacking)

Fragile

Example: glass/ceramic equivalents (even if we avoid initially, we quote once)

Require: damage claims process and packaging rules

Apparel / soft goods

Different storage and prep behavior; quote separately

Hazmat profile (explicit)

Example: product with lithium battery OR a hazmat classification candidate

Require: dangerous goods handling capability, documentation list, and explicit surcharges

## 9) Provider shortlist (named candidates) + must‑have gates + scorecard

This is a starter shortlist to collect quotes quickly. It is not a commitment.

### 9.1 Must‑have gates (fail any = not eligible for pilots)

Gate G1 — Compliance posture supported

Will not “wing it” with grey IOR/VAT arrangements

Can provide documentation needed for import and Amazon inbound

Gate G2 — Amazon delivery reliability

Can deliver into Amazon FCs reliably (appointments, labels, POD)

Has process for check-in issues and disputes

Gate G3 — Itemized billing

Invoices must be itemized (linehaul, fees, surcharges)

Clear dispute/claims mechanism

Gate G4 — Hazmat policy clarity

If they can’t handle hazmat, they must state it clearly.

If they can, they must state requirements and surcharges up front.

Gate G5 — Operational responsiveness

Named owner, response SLA, escalation path

### 9.2 Weighted scorecard (for comparing eligible providers)

Score each 1–5 (5 is best), multiply by weight.

| Dimension | Weight | What “5” looks like |
|---|---:|---|
| Total landed cost (our basket) | 25% | Lowest cost with itemized quote |
| Lead time & variance | 20% | Fast + predictable; low variance |
| Amazon inbound reliability | 15% | Proven process; low rejections |
| Billing clarity & dispute handling | 10% | Itemized, clean, predictable |
| Multi‑channel support | 10% | Can support hub + DTC + FBA replenishment |
| Returns + rework capability | 10% | Fast returns triage, rework options |
| Systems/reporting | 5% | Usable dashboards/exports |
| Account/compliance fit | 5% | Supports our chosen IOR/VAT posture |

### 9.3 Shortlist: freight forwarders / customs (quote sources)

Best-bet shortlist (start with 3):

Flexport (forwarding + customs capabilities; good for structured quoting)

DHL Global Forwarding (global forwarding; broad network)

Kuehne+Nagel (large global forwarder)

DSV (large global forwarder)

Optional “multi-quote” source: Freightos (to collect competitive quotes quickly)

How to use: get each to quote the same basket profiles (Section 8) into:

DE FBA (Model A)

NL/DE hub (Model B)

### 9.4 Shortlist: EU 3PL hub (multi‑channel capable)

Best-bet shortlist (start with 2–3):

byrd (positions itself for multichannel/Amazon fulfillment workflows)

Monta (Amazon integration + fulfillment infrastructure)

DHL Fulfillment Network (larger-scale option; may be heavier onboarding)

Optional NL/EU hub candidate: 3PLNL (ecommerce fulfilment operator)

Selection logic

If you want fastest onboarding for M1: pick the one with best software + clear SLAs.

If you want enterprise robustness: DHL/FN-type solutions.

### 9.5 Shortlist: Germany prep/forward (FBA inbound support)

For M0 pilots, using a DE prep center is often the fastest way to avoid Amazon inbound issues.

Best-bet shortlist:

Prepcenter‑FBA (Germany) (publishes pricing)

FBA Prep Germany (Wilhelmshaven) (publishes per‑unit labeling and tiered prep prices)

FLEX. Logistik (FBA prep/forwarding + QA workflow described)

## 10) Where each cost belongs (cash timing matters)

A common mistake is putting inbound costs in “unit contribution” (sale-time). That breaks payback timing.

### 10.1 Classification table (use this every time)

| Cost type | When cash leaves | Stage | Examples |
|---|---|---|---|
| Product purchase | pre-sale | Stage B | unit cost, MOQ |
| Deposit/balance payments | pre-sale | Stage B | deposit %, balance % |
| International freight + insurance | pre-sale | Stage B | air/sea/rail freight |
| Customs duties + import VAT | pre-sale | Stage B | duty %, VAT % |
| Inbound prep/QC/labeling | pre-sale | Stage B | prep center fees, Amazon prep service |
| Storage before sale (hub storage) | pre/sale | usually Stage C (if charged monthly) | 3PL storage, FBA storage |
| Per-sale Amazon fees | sale-time | Stage C | referral fee, FBA fulfillment fee |
| Per-order 3PL fulfillment | sale-time | Stage C | pick/pack, last-mile postage |
| Returns processing | post-sale | Stage C | returns fee, rework/inspection |

If a cost is required to get inventory “sellable,” it belongs in Stage B.

## 11) Stage B / Stage C operator entry mapping (what to enter where)

This mapping is written to match how operators think and to ensure Stage K cashflow is correct.

Stage B — Landed cost + pre‑sale cash schedule (what happens before the first sale)

You must provide

unitsPlanned (batch quantity)

unitCost (supplier unit cost, in EUR)

payment schedule

deposit % and when it’s paid (day 0 vs after PO)

balance % and when it’s paid (pre‑ship vs post‑inspection)

lead time components

production days

transit days (door-to-door)

customs + delivery + Amazon check-in days (or 3PL receiving days)

inbound cost lines

international freight (variable + fixed)

duty and import VAT assumptions

inbound handling / prep / labeling / QC

insurance, certificates, testing (if required to sell)

Rule of thumb entry

Anything you pay before inventory is available to sell → Stage B.

Stage C — Selling & fulfillment economics (per unit sold + payout/refund timing)

You must provide

Sell price assumption (consistent basis across candidates)

Channel fees:

Amazon referral fee %

FBA fulfillment fee OR 3PL pick/pack + shipping cost

Returns/refunds:

return rate %

refund timing / disposal or restock assumption

Ads / promo:

ads cost per unit (or % of revenue)

payout delay

Amazon payout delay days (cash receipt timing)

Rule of thumb entry

Anything that scales with units sold and happens after sale → Stage C.

## 12) What we will do immediately (without pretending the app already has “lane rate cards”)

Repo reality: Stage B/C are currently operator-entered, and there is no first-class lane rate-card model yet.

So for v0 execution we will:

Maintain a Lane Rate Card spreadsheet (or doc) with:

lane name, provider, incoterm, destination

price basis (€/kg, €/CBM, €/shipment)

lead time range, TTL, confidence level

what’s included/excluded

Upload:

the quote PDF/Email as an Artifact

the Lane Rate Card export as an Artifact

Copy numbers from the lane rate card into Stage B/C inputs for each candidate.

Optional (already compatible with “non-coder ops”):
Create “Suppliers” for forwarders and 3PLs and store each quote as a dated “terms” record + attach the quote as an artifact.

## 13) Lane confidence levels (so we know what we’re trusting)

We label every lane assumption:

C0 (Speculative): blog/index signals only (ok for DISCOVER/SCOUT ranking)

C1 (Indicative): non-itemized quote or informal estimate (ok for SCOUT; caution)

C2 (Decision-grade): itemized quote with TTL + clear incoterm (required for VERIFY/SCALE)

C3 (Measured): pilot actuals logged (best; required for SCALE decisions)

Policy

You cannot “SCALE” a product using C0/C1 lanes.

## 14) Governance: instrumentation cadence (required)

To avoid drift and false rankings:

Monthly lane KPI review (owner + checklist)

For each active lane/provider, track:

Quote vs actual landed cost variance (% and €)

Door-to-door lead time (median + p90)

Damage/loss rate and claims resolution time

Amazon check-in issues rate (if FBA)

3PL receiving SLA adherence (if hub)

Billing disputes count and resolution time

Lane confidence level progression (C0→C3)

Quote expiry enforcement

Every quote has a TTL/expiry date.

If expired: lane is flagged “quote_expired” and VERIFY/SCALE decisions are blocked until refreshed.

## 15) Decision pack output (what the decision maker gets)

When we finish the first quoting + pilot loop, we will produce:

Recommended operating model for M0 and M1 (and the trigger to switch)

Provider shortlist with scorecard results

Lane assumptions used in Stage B/C (cost + lead time + confidence + TTL)

Pilot plan:

which SKUs shipped on which lane

success metrics + stop-loss triggers

how actuals feed back into the model

## Appendix A — Sources + effective dates (copy/paste)

URLs are intentionally placed inside a code block so this document stays easy to paste into systems that don’t like inline links.

```text
[S-AMZ-RATECARD-2025-10] Amazon EU FBA Rate Card (EN) – Effective as of 15 Oct 2025:
https://m.media-amazon.com/images/G/02/sell/images/251015-FBA-Rate-Card-EN.pdf

[S-NL-3PL-RANGES-2024] ZENDEQ – Dutch Fulfilment Pricing Overview 2024 (ranges for storage, pick&pack, returns):
https://www.zendeq.com/kb/e-fulfilment-netherlands/

[S-DE-PREP-PREPCENTER] Prepcenter‑FBA (Germany) – Services & Pricing (per-unit prep/label/returns/storage):
https://prepcenter-fba.de/en/services/

[S-DE-PREP-FBAPREPGER] FBA Prep Germany – pricing tiers incl. EUR 0.25+ per unit labeling/prep:
https://fbaprep-germany.eu/

[S-AIR-INDEX-2025-12-12] Freightos weekly freight update (air index China→Europe around $3.50/kg, Dec 12 2025):
https://www.freightos.com/freight-industry-updates/weekly-freight-updates/asia-europe-rates-staying-elevated-on-some-early-pre-lny-start-december-12-2025-update/

[S-ECB-FX-2025-12-19] ECB euro reference exchange rates (example business-day FX table, 19 Dec 2025):
https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html

[S-EU-IMPORT-VAT] European Commission – Import VAT taxable amount guidance:
https://taxation-customs.ec.europa.eu/vat/vat-and-international-trade/vat-imports_en

[S-IE-CUSTOMS-VALUE] Irish Revenue – Customs value includes transport/insurance etc (customs value explanation):
https://www.revenue.ie/en/customs-traders-and-agents/importing-and-exporting/customs-valuation/index.aspx

[S-DE-VAT-RATE] German Customs (Zoll) – VAT in Germany (rate info context):
https://www.zoll.de/EN/Businesses/Movement-of-goods/Import/Taxes-and-duties/VAT/vat_node.html

[S-INCOTERMS-DDP-DAP] ICC Academy – Incoterms explanations (DDP/DAP pages):
https://icc.academy/incoterms/
```

## Appendix B — The “best bet” decision in one page (for quick reference)

Start (M0): Model A (FBA-first, DE-only)

Use a forwarder lane into DE FBA

Use a DE prep center if supplier can’t meet Amazon requirements

Keep lane assumptions conservative (C0→C1) and validate with pilot actuals

Upgrade (M1): Model B (EU hub + replenish FBA + DTC)

Shift reorders to sea/rail into hub

Hub handles kitting/returns and enables customization

Scale (M2): add redundancy + lane confidence governance

At least two viable lanes/providers

Monthly KPI review

Only scale with decision-grade or measured lanes (C2/C3)

Web sources used to build the referenced baseline numbers (for audit in this chat)

Amazon EU FBA rate card (fees/storage/optional service fees, effective as of 15 Oct 2025).
NL 3PL market ranges (storage/pick&pack/returns, “Pricing Overview 2024”).
Germany prep center published pricing (per‑unit prep/label/returns/storage).
Freightos air-rate signal (China→Europe ~$3.50/kg, Dec 12 2025).
ECB reference FX methodology/example table used for conversion rule.
EU import VAT base guidance + customs value context + DE VAT context sources.
