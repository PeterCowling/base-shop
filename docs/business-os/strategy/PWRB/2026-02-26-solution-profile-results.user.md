---
Type: Solution-Profile-Results
Stage: ASSESSMENT-02
Business: PWRB
Status: Active
Created: 2026-02-26
Prompt-file: docs/business-os/strategy/PWRB/2026-02-26-solution-profiling-prompt.md
Source: Operator deep research run (2026-02-26)
Downstream: docs/business-os/strategy/PWRB/2026-02-26-solution-decision.user.md
Owner: Pete
Review-trigger: Refresh when channel, regulatory, or supplier assumptions materially change
---

# Solution-Profiling Results — PWRB

*Output from running `2026-02-26-solution-profiling-prompt.md` in a deep research tool. Saved verbatim for consumption by `/lp-do-assessment-03-solution-selection`.*

---

## Option 1 — Shared powerbank rental station network

**Description:** A network of fixed stations in high-footfall venues where a tourist unlocks a portable powerbank (typically via QR/app or contactless), carries it while exploring, and returns it to any station in the same network. The core value is "charge while moving" plus "return anywhere", avoiding being tethered to a wall socket.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Plausible if the first release uses an off‑the‑shelf turnkey platform (stations + powerbanks + app + operator dashboard) rather than building custom IoT hardware and payments from scratch. Turnkey providers explicitly position themselves as supplying branded stations, powerbanks, apps, and management tooling.
- Minimum capital to first paying customer: Hardware purchase or lease of at least one station plus a starter fleet of powerbanks (often 8–24 per station), plus installation materials and basic on‑site support. Market pricing varies widely by supplier; small "sample" orders are advertised, but reliable, CE‑compliant units and spares raise upfront cost.
- Minimum viable footprint: Inference: at least 3–6 stations across the densest tourist path nodes (e.g., ferry/bus interface points + one or two town centres) to make "return anywhere" a believable promise during a 6–10 hour day. Networks market "return at any station" as core, but usability degrades if returns are scarce or far from the day's route.

**B. Distribution channels:**
- On-the-ground discovery is viable: Many networks rely on conspicuous physical stations and QR flows; some also support "web app / no app" rental to reduce adoption friction for tourists.
- Natural distribution partners: Hospitality and retail venues are common placement partners for these networks; networks position stations as an amenity that improves guest experience and dwell time.
- Pre‑arrival discovery not required: The station itself can be the primary acquisition surface; app store discovery is a secondary channel.

**C. Operational and capital constraints:**
- Inventory balancing & uptime: Keeping powerbanks charged, present, and functional across venues is the enduring operational challenge (lost units, damaged cables, empty slots, offline station connectivity). Networks explicitly warn users about broken integrated cables and customer support processes, signalling this is common.
- Theft/loss management: Operators often use deposits or pre‑authorisation holds, plus "non‑return = charged fee" policies; this reduces but does not eliminate loss and dispute handling.
- Capital at risk: Stations + embedded screens + powerbank fleet are the primary stranded assets if utilisation is low; resale value is uncertain due to software locks and brand‑specific docking compatibility. Regular inspection, cleaning, and spare cable modules are likely.
- Tourist-destination analogue evidence exists in Europe: Operators market thousands of "venues" and multi‑country coverage, implying the model has scaled in European cities and visitor venues.

**D. Adjacent business evidence:**
- Naki — claims 2,000+ stations/venues across Europe (scale as stated).
- ChargeSPOT — publishes "facts and stats" including tens of thousands of stations, multi‑million app downloads, and annual rentals (scale as stated).
- Chimpy — claims 4,000+ locations in Europe (scale as stated).

**Regulatory flags:**
- HIGH — EU product safety (GPSR) & CE conformity: Charging hardware and consumer power products placed on the EU market are within the post‑2024 general product safety regime.
- HIGH — EMC / radio compliance: Stations and powerbanks can fall under EMC requirements; stations with cellular/Wi‑Fi modules trigger Radio Equipment Directive scope for the radio component.
- HIGH — Battery and WEEE obligations: Batteries and EEE implicate EU Batteries Regulation and WEEE marking/producer responsibility; Italy implements WEEE via Legislative Decree 49/2014 (EPR obligations).
- MEDIUM — Payment services / deposits: Card pre‑authorisation and payment flows typically run via regulated PSPs; stored‑value designs can drift toward e‑money concepts depending on structure (flag for PSD2 / e‑money analysis).
- MEDIUM — GDPR: Location-enabled station finders and background proximity features constitute personal data processing when linked to an identifiable user.
- MEDIUM — Local permitting for installations in public/heritage areas: If stations are placed on public land or in regulated streetscapes, municipal concessions and "occupazione suolo pubblico" rules apply.
- UNKNOWN — Insurance/liability structure for damaged devices while using rented powerbanks — research gap.

**Supply chain flags:**
- MOQ: 1–10 units (sample/small orders) advertised by some suppliers; 50–100+ common for larger production runs.
- Lead time: ~1 week for samples; ~30 days mass production (supplier-stated), plus international freight to Italy (~30–40 days by sea, faster by air).
- Supplier geography: China (notably Guangdong/Shenzhen) dominates; EU build/support exists but is less common in commodity units.
- White-label available: Yes — turnkey "launch your branded network" offerings are marketed.
- Maintenance considerations: Coastal deployment increases corrosion risk for connectors, locks, and enclosures due to salt air; IP ratings address water/dust but do not necessarily cover corrosion performance.

---

## Option 2 — Vending machine powerbanks (buy-to-keep, low price)

**Description:** "Dispense and sell" powerbanks via vending machines at hotspots (transport nodes, viewpoints, town squares). Tourists buy a unit outright (no return), solving the day's charge problem at the cost of acquiring additional hardware they must carry and later dispose of or fly home with.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Plausible if using existing vending machine form factors and standard CE‑compliant powerbanks; product complexity is lower than a returnable rental fleet, but reliability and safety expectations are higher because the user owns the battery.
- Minimum capital to first paying customer: One vending unit placed under a host agreement plus inventory stock. Some suppliers advertise MOQ as low as one set for charging kiosks/lockers, signalling small-batch pilots are feasible.
- Minimum viable footprint: 1–2 machines can reach "first paying customer" if placed at a single dominant arrival/transfer point; broader utility depends on whether tourists reliably pass the machine early enough in the day.

**B. Distribution channels:**
- Proven arrival channels: Airports, rail, ferry terminals, and major shopping centres commonly host electronics vending.
- On-the-ground discovery: Strong — the vending machine itself (plus signage) is the channel.
- Partners: Transport hubs and high-footfall retail/visitor venues are natural hosts.

**C. Operational and capital constraints:**
- Safety & brand risk: If a product batch is unsafe or defective, recalls can occur quickly and publicly; iStore powerbank recall (battery overheating/fire risk) illustrates reputational blast radius.
- Waste/recycling burden shifts to the tourist: Selling a battery creates downstream disposal obligations; misalignment with "reduce e‑waste" narratives is a reputational and compliance consideration.
- Stockouts and cash handling: Replenishment frequency and payment uptime are key in unattended operation.
- Air-travel friction remains: Powerbanks are treated as spare lithium batteries in air travel guidance; tourists must carry them home under airline rules.

**D. Adjacent business evidence:**
- Lifesaver Power — airport supplier listings describe vending/rental charging kiosk products for airports.
- iStore — recalled magnetic wireless power bank illustrates reputational/safety downside when battery products fail.
- FuelRod — long-running kiosk model in major attractions/airports (exchange-based, not buy-to-keep); consumer expectation controversies documented historically.

**Regulatory flags:**
- HIGH — Battery safety, CE, labelling and EPR: Selling batteries directly to consumers triggers Batteries Regulation / producer-responsibility and labelling expectations, plus WEEE end‑of‑life pathways.
- HIGH — GPSR product safety and recalls: Consumer products must be safe; GPSR applicability after 13 Dec 2024 increases compliance expectations.
- MEDIUM — Local permits for vending placement.
- UNKNOWN — Italy-specific consumer information/language requirements for vending-delivered electronics warranties/refunds — research gap.

**Supply chain flags:**
- MOQ: ~1 set for some kiosk suppliers; 2–100+ units for larger production.
- Lead time: ~5–8 working days for some standard kiosk products.
- Supplier geography: China dominates commodity kiosk manufacturing.
- White-label available: Yes.
- Maintenance considerations: Coastal salt air increases corrosion and electrical fault risk.

---

## Option 3 — Venue lending programme (hotel/reception model)

**Description:** Hotels and guesthouses lend portable powerbanks directly to guests (check-in/check-out), managed by front desk operations. The tourist carries the charger throughout the day and returns it to the same property later, avoiding a coast-wide return network.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: High feasibility; operationally closer to "amenity lending" than IoT infrastructure. A minimal pilot can be executed as a managed service or as a hotel‑owned inventory programme.
- Minimum capital to first paying customer: Low if hotels self-procure retail powerbanks; moderate if deploying a dedicated charging-lending cabinet.
- Minimum viable footprint: One property can be "useful" because the guest has a home base; usefulness to day‑trippers without accommodation is limited by design.

**B. Distribution channels:**
- Proven channels: Hotel check‑in desks, concierge, room collateral, and lobby signage.
- Can be marketed in booking emails and guest apps.
- Partners: Hotels are the primary channel.

**C. Operational and capital constraints:**
- Loss management: Hotels must manage deposits/holds or charge replacement fees; creates front-desk friction.
- Battery health and cable failure: Powerbanks degrade; hotels need a nightly charging and periodic replacement process.
- Capital at risk: Small and modular at a single venue.

**D. Adjacent business evidence:**
- Zappy — positions itself as a hotel solution for portable chargers.
- Grab-N-Go Charging — markets hotel-focused charging solutions with "no liability, inventory, or staffing required" (managed-service variant).
- Joos — markets hospitality solutions where guests rent via QR/tap and use integrated multi-cable powerbanks.

**Regulatory flags:**
- MEDIUM — Product safety obligations if the operator supplies devices.
- MEDIUM — Payments and deposits (PSD2 framing).
- MEDIUM — Liability/insurance: Lending implies duty of care and handling potential device damage claims.
- UNKNOWN — Whether Italian hospitality regulations impose specific rules on "rental of equipment to guests" vs included amenities — research gap.

---

## Option 4 — Fixed mains charging lockers / smart lockers

**Description:** A secured locker bank at hotspots (transport nodes, viewpoints, town squares) where a tourist plugs in and locks their phone, leaves for 30–90 minutes, then returns to retrieve a charged device. The phone remains on premises.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Plausible for a pilot; charging locker products are widely available. Complexity lies in site permissions and installation in public spaces.
- Minimum capital to first paying customer: A single locker unit (4–12 bays) with power supply and physical anchoring.
- Minimum viable footprint: 1–2 installations at natural waiting zones can work.

**B. Distribution channels:**
- On-site discovery: Very strong.
- Partners: Transport operators, municipalities, and major attractions.

**C. Operational and capital constraints:**
- Custody/liability: Operator takes temporary custody of a high‑value personal device; increased liability exposure.
- Vandalism and tampering: Public kiosks need physical hardening; vendors explicitly advise on anti-vandal measures.
- Cybersecurity perception ("juice jacking"): Public USB charging has been flagged by the FBI as a malware risk vector; perception can reduce willingness to plug into unknown USB ports.
- Capital at risk: A single expensive, location-specific asset; difficult to redeploy if permissions lapse.

**D. Adjacent business evidence:**
- Charger4you — markets charging lockers for public locations, cites deployments in tourism settings.
- InCharged — rents/sells charging stations and lockers for events and venues.
- Charge-it — sells coin-operated multi-bay charging lockers (Ireland).

**Regulatory flags:**
- HIGH — Public-space permitting / concessions: "occupazione suolo pubblico" and canone payments; Amalfi and Positano publish local rules.
- HIGH — Electrical safety & product safety.
- MEDIUM — Data protection (GDPR) if lockers require login or usage analytics.
- MEDIUM — Liability/insurance for custody-based device services.
- UNKNOWN — Italy-specific insurance norms for custody-based device services — research gap.

**Supply chain flags:**
- MOQ: 1 unit for some products; ~3–100+ units for bulk.
- Lead time: ~15 working days for some locker suppliers.
- Supplier geography: UK/EU integrators and China-based manufacturers.
- White-label available: Yes.
- Maintenance considerations: Coastal corrosion, vandalism, anchoring, and routine checks.

---

## Option 5 — Wireless charging furniture / embedded charging pads at hospitality venues

**Description:** Qi-enabled wireless chargers embedded into tables, counters, nightstands, or lounge furniture in cafés/restaurants/hotels. Tourists charge while seated.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Feasible as a B2B installation service partnering with a small number of venues.
- Minimum capital: Small tools + inventory of pads/modules; pilots can use standard certified units.
- Minimum viable footprint: A handful of high-traffic cafés can create utility but only during dwell time.

**B. Distribution channels:**
- Venue partnerships are the main channel.
- Discovery via table stickers/signage.

**C. Operational and capital constraints:**
- Compatibility: Qi/Qi2 interoperability is improving but not universal.
- Venue wear: Spills, heat, and cleaning chemicals can degrade table-embedded units; coastal humidity adds stress.
- Limited mobility value: Does not replace a portable charger for transit/hiking. Intrinsic constraint.

**D. Adjacent business evidence:**
- Chargifi — venue wireless charging service targeting hospitality and travel venues.
- Zens — wireless charging integration into bars/restaurants/hotels.
- Akkut — sells built‑in chargers designed to integrate into facilities/furniture.

**Regulatory flags:**
- HIGH — Product safety and EMC: CE conformity required.
- MEDIUM — Qi certification (quality/commercial trust, not a regulatory requirement).
- LOW/MEDIUM — GDPR if analytics are tied to identifiable users.
- UNKNOWN — Local building/electrical inspection requirements for embedded electrics in hospitality furniture in Campania — research gap.

**Supply chain flags:**
- MOQ: ~500–1,000 pcs for OEM-branded pads; pilots can use retail/standard units.
- Lead time: 15–30 days production, plus freight.
- Supplier geography: China dominant; EU brands integrate/assemble.
- White-label available: Yes.

---

## Option 6 — Solar-powered public charging kiosks

**Description:** Fixed public kiosks (benches or tower units) powered by solar panels and internal batteries, providing USB/AC charging in outdoor public spaces. Can be free, ad-supported, or coin/card-operated.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Feasible for a single pilot if municipal permission and a site sponsor can be secured; harder to scale quickly because each installation is a public-works-like project.
- Minimum capital: One kiosk/bench plus installation and ongoing maintenance.
- Minimum viable footprint: 1 kiosk is a proof of concept; queuing constrains utility.

**B. Distribution channels:**
- On-site discovery: Strong at obvious stopping points.
- Partners: Municipalities and transport/attraction operators.

**C. Operational and capital constraints:**
- Weather and reliability: Solar output variability, shading, and seasonal peaks reduce charge availability.
- Coastal corrosion: Salt fog accelerates corrosion of electronics and connectors.
- Cybersecurity perception ("juice jacking"): Public USB warnings apply; AC outlets or charge-only ports recommended.
- Capital at risk: High-cost fixed asset; relocation is costly.

**D. Adjacent business evidence:**
- Strawberry Energy — designs and sells solar "smart" urban furniture.
- EnGoPlanet — provides solar smart benches/kiosks in public spaces.
- Soofa — well-known smart-bench provider in same category.

**Regulatory flags:**
- HIGH — Municipal concession / occupation rules: Amalfi/Positano publish detailed processes.
- HIGH — Electrical safety / consumer product safety.
- MEDIUM — Accessibility and public liability.
- MEDIUM — Waste obligations (batteries inside kiosks regulated at end-of-life).
- UNKNOWN — Specific municipal accessibility rules for charging kiosks in Amalfi/Positano — research gap.

**Supply chain flags:**
- MOQ: 1–5 sets for solar benches/kiosks; higher for custom municipal programmes.
- Lead time: ~7–30 days off-the-shelf units, plus installation and permitting lead time (often dominant).
- Supplier geography: China-based manufacturing common; some specialised urban-tech firms globally.
- White-label available: Partial.

---

## Option 7 — Compact single-use/recyclable emergency powerbank (retail product)

**Description:** A lightweight emergency retail powerbank offering roughly one phone-charge of capacity, sold through tourist retail (souvenir shops, pharmacies, tabaccherie). Positioned as minimal hassle with a take-back/recycling story.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Feasible as a product launch if sourcing an existing OEM design; certification, labelling, and EPR setup can dominate timelines.
- Minimum capital: More front-loaded — inventory, packaging, compliance documentation, retail placement agreements, and take-back logistics.
- Minimum viable footprint: Single high-traffic retail partner can sell; availability at arrival points improves utility.

**B. Distribution channels:**
- Proven tourist channels: Pharmacies, tabacchi, minimarkets, hotel gift corners, and transport-node shops.
- Pre-arrival not required: Purchase is impulsive at low-battery moments.

**C. Operational and capital constraints:**
- Quality and safety risk: Safety incidents are existential for a small brand; iStore recall illustrates reputational blast radius.
- Air-travel friction remains: Tourists must carry powerbanks home under airline rules.
- E-waste management is non-optional: Take-back and EPR scheme must actually exist.

**D. Adjacent business evidence:**
- XTAR — advertises OEM/ODM battery and charging solutions with stated MOQ and lead times.
- DNK Power — publishes typical sample and bulk delivery timelines.
- Global Sources — lists powerbank suppliers with commonly stated lead times.

**Regulatory flags:**
- HIGH — EU Batteries Regulation + EPR + labelling.
- HIGH — WEEE/RAEE & marking; Italy's Legislative Decree 49/2014 implements WEEE.
- HIGH — GPSR product safety.
- UNKNOWN — Feasibility of legally positioning the product as "single-use" under consumer protection and waste frameworks in Italy without creating misleading environmental claims — research gap.

**Supply chain flags:**
- MOQ: ~1,000 pcs common OEM threshold for branded battery/charging products.
- Lead time: ~20–30 days ex‑factory, plus sea freight (~30–40 days to Italy).
- Supplier geography: China dominant.
- White-label available: Yes.

---

## Option 8 — Tourist-facing charging concierge app + network of venue charging points

**Description:** A software-led network that maps participating venues where tourists can access charging (socket/USB/charging hub) for a small fee or minimum purchase, via QR code check-in and payment. Venue-side installs are lightweight (branded USB hubs, charge-only ports, or staff-managed access).

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Feasible on the software side; the "useful network" threshold depends on signing enough venues quickly. A partnership sales problem more than a manufacturing problem.
- Minimum capital: A basic app/web app plus payment acceptance; optional low-cost venue hardware.
- Minimum viable footprint: 10–20 venues across main tourist nodes to avoid "walk 25 minutes to the only charger" failure mode.

**B. Distribution channels:**
- On-the-ground discovery: Achievable through hotel front desks, tourism offices, and physical decals at partner venues.
- Pre-arrival discovery helpful but not required.
- Partners: Hotels and cafés are natural.

**C. Operational and capital constraints:**
- Partner compliance and experience consistency: Venues may restrict access during peaks, creating inconsistent experiences.
- Security perception (USB data risk): "Juice jacking" warnings apply; standardise on safe charging practices.
- Capital at risk: Lower hardware risk; primary risk is partner acquisition and data maintenance.

**D. Adjacent business evidence:**
- Aircharge — large wireless charging ecosystem (thousands of locations, dozens of countries) with "find location" discovery.
- chargeFUZE — positions itself as "largest network" of mobile charging kiosks distributed through venue operators.
- DeviceCharger — sells coin-operated and pay-to-use charging stations.

**Regulatory flags:**
- MEDIUM — GDPR: QR check-ins, payment identities, and location data.
- MEDIUM — PSD2/payment flows via regulated PSPs.
- MEDIUM — Consumer transparency (fee terms, refunds, language requirements for Italy).
- LOW/MEDIUM — Electrical safety if operator installs venue-side USB hubs.

---

## Option 9 — Subscription / tourist-pass charging service

**Description:** A time-bounded "charge pass" (1–3 days) sold to tourists at hotels or tourism offices that grants access to defined charging benefits (e.g., free minutes at powerbank rental stations, or unlimited sessions at participating venues).

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Feasible if piggybacking on existing networks (issuing promo codes or bundles) rather than building infrastructure. City-pass precedent shows "free rental minutes" can be bundled via codes.
- Minimum capital: Low if reselling/bundling with partners.
- Minimum viable footprint: Depends entirely on underlying network density.

**B. Distribution channels:**
- Proven for tourists: City passes and attraction bundles are an established tourist product form.
- On-the-ground purchase strong via hotels and tourism offices.
- Pre-arrival plausible via itinerary planning platforms.

**C. Operational and capital constraints:**
- Pass fraud and sharing: Codes/cards must be controlled; abuse risk grows with "unlimited" entitlements.
- Settlement complexity: Revenue sharing and reconciliation with venues/networks.
- Payment/consumer disputes: Subscription cancellation, refunds, and chargebacks create admin overhead.

**D. Adjacent business evidence:**
- Caricami — documented promotion bundled with a city pass (free charging minutes for pass holders) in Italy.
- Chargo — offers subscription plans with "unlimited rentals" style entitlement.
- Bank of Energy — references a "Battery Pass" style packaging.

**Regulatory flags:**
- MEDIUM — PSD2 / e‑money boundary risk: A "pass" can resemble stored value; limited-network exemptions may apply.
- MEDIUM — Consumer protection/terms clarity (prepaid-pass refund rules and expiry terms).
- MEDIUM — GDPR: Pass usage tracking.
- LOW/MEDIUM — Local licensing depending on whether pass includes public installations.

---

## Option 10 — Peer-to-peer or crowd-charged network

**Description:** A platform where locals or other tourists rent out powerbanks (or facilitate ad-hoc charging exchanges) via platform-mediated payments and guarantees.

**Feasibility signals:**

**A. Launch feasibility:**
- 6‑month / 1–3 person launch: Software MVP is feasible, but practical usefulness depends on supply density, trust/verification, and dispute handling. Cannot "force" coverage by installing hardware.
- Minimum capital: Low on hardware; higher on trust & safety (ID verification), customer support, and insurance/guarantee mechanisms.
- Minimum viable footprint: High local density required around hotspots; otherwise collapses to a classifieds experience.

**B. Distribution channels:**
- Discovery on the ground is hard: Tourists must know the platform exists and find nearby hosts without physical signage.
- Partner channels: Hotels/tourism offices could distribute, but may prefer lower-risk options.

**C. Operational and capital constraints:**
- Trust and safety: Device loss, no-shows, and damage disputes are core; underwriting and claims processes required.
- Regulatory complexity in payments: Deposit/escrow-like flows raise PSD2/e‑money questions.
- No hardware control: Cable compatibility and battery health are unpredictable.

**D. Adjacent business evidence:**
- Hygglo — lists powerbanks for rent within a peer-to-peer rental marketplace.
- Samsung Wireless PowerShare — device-to-device energy sharing as enabling-tech adjacency.
- Google Pixel Battery Share — another enabling-tech adjacency for "crowd charging" behaviours.

**Regulatory flags:**
- HIGH — GDPR: Location data and behavioural data in meetup-facilitation context.
- HIGH — Payments regulation risk if platform holds funds or manages deposits.
- MEDIUM — Consumer protection & dispute resolution.
- UNKNOWN — Insurance feasibility for short-duration P2P rentals of small electronics in Italy — research gap.
