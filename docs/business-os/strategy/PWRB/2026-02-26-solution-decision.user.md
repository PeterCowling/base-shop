---
Type: Solution-Decision
Stage: ASSESSMENT-03
Business: PWRB
Status: Active
Created: 2026-02-26
Source: docs/business-os/strategy/PWRB/2026-02-26-solution-profile-results.user.md
Problem-statement: docs/business-os/strategy/PWRB/2026-02-26-problem-statement.user.md
Downstream: docs/business-os/strategy/PWRB/candidate-names-prompt.md
---

# Option Selection Decision — PWRB

## Evaluation Matrix

| Option | Launch Feasibility | Distribution Path | Regulatory Burden | Problem Fit | Status |
|---|---|---|---|---|---|
| 1 — Shared powerbank rental station network | Pass | Pass | Flag | Pass | **Shortlisted** |
| 2 — Vending machine powerbanks (buy-to-keep) | Pass | Flag | Flag | Fail | Eliminated |
| 3 — Venue lending programme (hotel/reception) | Pass | Flag | Pass | Flag | Eliminated |
| 4 — Fixed mains charging lockers | Flag | Flag | Fail | Flag | Eliminated |
| 5 — Wireless charging furniture / embedded pads | Pass | Pass | Pass | Fail | Eliminated |
| 6 — Solar-powered public charging kiosks | Fail | Flag | Fail | Flag | Eliminated |
| 7 — Compact single-use/recyclable powerbank | Flag | Pass | Flag | Flag | Eliminated |
| 8 — Tourist concierge app + venue charging points | Pass | Flag | Pass | Fail | Eliminated |
| 9 — Subscription / tourist-pass charging | Pass | Pass | Flag | Flag | Eliminated |
| 10 — Peer-to-peer / crowd-charged network | Fail | Fail | Flag | Fail | Eliminated |

---

## Evaluation Rationale

**Option 1 — Shared powerbank rental station network**
- Launch feasibility: **Pass** — Turnkey white-label platforms (Naki, ChargeSPOT, Chimpy) handle hardware, app, and operator dashboard; a 1–3 person team can launch a 10-station pilot within 6 months using off-the-shelf supplier units from Shenzhen. The IPEI customer base eliminates the venue cold-start problem that makes this model hard elsewhere.
- Distribution path: **Pass** — Venues are the acquisition surface; the station is visible in-place. IPEI's existing relationships with hotels, restaurants, and cafés in the core towns means first placements are relationship-led, not cold-pitch.
- Regulatory burden: **Flag** — CE/GPSR compliance is required but manageable via established CE-marked station suppliers. Payment flows need a PSD2-compliant PSP with pre-auth hold capability (PWRB-RISK-001 — under investigation). GDPR applies to station-finder and rental identity data; manageable with standard consent/minimisation design. None of these are hard blockers, but PSP validation is a named pre-launch gate.
- Problem fit: **Pass** — Directly solves "charge while moving" (tourist carries the powerbank away from the station) and "return anywhere" (multi-venue network). Serves all three user segments including day-trippers with no hotel base. No problem reframing required.

**Option 2 — Vending machine powerbanks (buy-to-keep)**
- Launch feasibility: Pass — simple mechanically.
- Distribution path: Flag — vending requires transport hub or high-dwell placement; IPEI customer base is in hospitality, not ferry/bus terminals.
- Regulatory burden: Flag — battery EPR, WEEE, GPSR; "single-use" positioning risks misleading-environmental-claim exposure.
- Problem fit: **Fail** — Tourist still acquires a battery they must carry home on the flight. This directly recreates the "carry-back friction" failure mode named in the problem statement for the "buy a cheap local powerbank" workaround. The buy-to-keep model does not solve the disposability problem; it replicates it with a branded unit.

**Option 3 — Venue lending programme (hotel/reception model)**
- Launch feasibility: Pass — low complexity.
- Distribution path: Flag — serves only hotel-staying guests; Group 3 (day-trippers, ferry/coach arrivals) is excluded by design.
- Regulatory burden: Pass.
- Problem fit: **Flag** — tourist must return to the same hotel before hotel checkout, constraining the day's range. "Return anywhere in the network" — the core value for a multi-town itinerary — is absent. The problem statement names day-trippers with no home base as a user segment; this option structurally excludes them. Could serve as an add-on sales channel for station-holding venues but is not a viable standalone solution.

**Option 4 — Fixed mains charging lockers / smart lockers**
- Launch feasibility: Flag — each installation requires site permitting; in the Amalfi/Positano area, heritage-zone and municipal occupation rules are explicitly documented as a process with canone payments and approval timelines. A 6-month pilot timeline is at risk.
- Distribution path: Flag — municipal and transport-authority partnerships needed; not accessible via the IPEI venue relationship network.
- Regulatory burden: **Fail** — "Occupazione suolo pubblico" concession requirements in Amalfi/Positano would materially delay launch beyond a 6-month horizon for any public-land placement. Device-in-custody liability for a tourist's €1,000 smartphone creates insurance and legal exposure that is structurally complex for a new operator.
- Problem fit: Flag — tourist must leave their phone at the locker site while exploring, which conflicts with the navigation and photography use case that creates the problem in the first place.

**Option 5 — Wireless charging furniture / embedded charging pads**
- Launch feasibility: Pass.
- Distribution path: Pass — accessible via IPEI hospitality venues.
- Regulatory burden: Pass.
- Problem fit: **Fail** — Tourist can only charge while seated at a participating venue. The problem statement describes the failure as occurring during "coastal paths, waiting for a bus, or on a ferry" — all locations where wireless table pads provide zero coverage. This option requires reframing the problem from "charge while moving" to "charge while at a venue," which is a different and narrower problem.

**Option 6 — Solar-powered public charging kiosks**
- Launch feasibility: **Fail** — Permitting lead time for public-land installations in Italian comuni dominates the project timeline. Amalfi and Positano publish formalised "occupazione suolo pubblico" and canone processes; obtaining concessions for multiple kiosks in heritage-protected streetscapes is not a 6-month achievable milestone.
- Distribution path: Flag — requires municipal partnerships not available through IPEI customer base.
- Regulatory burden: **Fail** — Public-land concession requirements + electrical safety for outdoor public hardware + accessibility rules create a compounding regulatory workstream that would block a small team from launching within 6 months.
- Problem fit: Flag — tourist must wait at the kiosk; doesn't address the on-the-move charging need.

**Option 7 — Compact single-use/recyclable emergency powerbank**
- Launch feasibility: Flag — EPR producer registration, WEEE compliance, GPSR conformity documentation, and Italian Batteries Regulation labelling together create a compliance workstream that could delay first sales beyond 6 months for a new brand with no prior EU regulatory standing.
- Distribution path: Pass — tabaccherie, pharmacies, hotel gift corners are proven channels.
- Regulatory burden: Flag — EU Batteries Regulation, WEEE/RAEE (Legislative Decree 49/2014), GPSR. Positioning as "recyclable" adds take-back scheme requirements that are non-trivial to establish.
- Problem fit: **Flag** — Creates new problems identified in the problem statement as workarounds to be avoided: tourist must carry the unit home (air-travel lithium battery rules) or dispose of it (e-waste friction). The "buy and bin" failure state is explicitly named in the problem statement's Documented Failure States section. This option replicates a known failed workaround at a higher brand quality level without resolving the structural carry-back and disposal problem.

**Option 8 — Tourist-facing charging concierge app + venue charging points**
- Launch feasibility: Pass.
- Distribution path: Flag — requires 10–20 venues signed before the network has tourist utility; venue compliance and access consistency is a known operational risk.
- Regulatory burden: Pass.
- Problem fit: **Fail** — Tourist remains tethered to a venue socket or USB hub while charging. The concierge app finds a venue; it does not solve "charge while moving." Same structural limitation as Option 5: charging only occurs during dwell time, not during the active exploration window where the problem manifests.

**Option 9 — Subscription / tourist-pass charging service**
- Launch feasibility: Pass.
- Distribution path: Pass — city-pass bundle model is proven in tourist destinations.
- Regulatory burden: Flag — PSD2/e-money boundary risk if the pass functions as stored value.
- Problem fit: **Flag** — This is a pricing and packaging layer, not a standalone solution type. A tourist-pass provides access to an underlying charging network; without that network, the pass has no value. If the underlying network is Option 1 (shared rental stations), this becomes a revenue model variant, not a competing solution. It cannot be carried forward independently — it depends on another option being selected first.

**Option 10 — Peer-to-peer / crowd-charged network**
- Launch feasibility: **Fail** — Coverage cannot be controlled by the operator; supply density in tourist hotspots depends entirely on participant willingness. In the Amalfi Coast context, local resident density is modest and local supply cannot be predicted.
- Distribution path: **Fail** — Requires tourists to find and trust strangers for a time-sensitive need; no physical acquisition surface means digital-only discovery, which has very low conversion for a tourist who is already stressed about battery level.
- Regulatory burden: Flag.
- Problem fit: **Fail** — Reliability of supply is unpredictable; a tourist with 8% battery cannot depend on a P2P network to have a unit nearby. The problem statement establishes that the failure mode is acute (missed peak-moment photos; navigation failures mid-route) — P2P cannot deliver the reliability required.

---

## Elimination Log

- **Option 2 (Vending/buy-to-keep):** Eliminated — Problem fit Fail: replicates the "buy a cheap local powerbank and carry it home" workaround that the problem statement explicitly names as a failed solution; does not resolve carry-back or e-waste friction.
- **Option 3 (Hotel lending):** Eliminated — Problem fit Flag insufficient: constrains return to the same hotel (no "return anywhere"), excludes day-trippers (Group 3 in problem statement) by design, and fails to address multi-town itinerary patterns that define the primary user group's day.
- **Option 4 (Charging lockers):** Eliminated — Regulatory burden Fail: occupazione suolo pubblico concession requirements in Amalfi/Positano municipalities would materially delay launch beyond the viable pilot window; device-in-custody liability creates uninsurable risk for a new operator.
- **Option 5 (Wireless charging pads):** Eliminated — Problem fit Fail: charges only during venue dwell time; does not address the stated problem of charging failure during active movement (hiking, ferry, bus waiting).
- **Option 6 (Solar kiosks):** Eliminated — Launch feasibility Fail and Regulatory burden Fail: Italian public-land concession processes in heritage municipalities make a 6-month launch impossible; the regulatory and permitting workstream would consume the entire timeline before a single kiosk is operational.
- **Option 7 (Single-use retail powerbank):** Eliminated — Problem fit Flag combined with Regulatory burden Flag: replicates the "buy and discard" failure mode named in the problem statement; EPR/WEEE compliance workstream for a new battery product brand is a disproportionate burden relative to the marginal problem fit improvement over existing workarounds.
- **Option 8 (Concierge app + venue charging):** Eliminated — Problem fit Fail: tourist remains tethered to a venue socket; does not solve charging during active exploration between venues.
- **Option 9 (Tourist-pass service):** Eliminated — Problem fit Flag: this is a revenue model/packaging layer, not an independent solution type; it depends on an underlying network (Option 1) being operational and adds no independent problem-solving value at this evaluation stage.
- **Option 10 (P2P crowd-charged network):** Eliminated — Launch feasibility Fail, Distribution path Fail, and Problem fit Fail: operator cannot control supply coverage; P2P discovery is digital-only with no physical acquisition surface; reliability of supply is insufficient for an acute battery emergency scenario.

---

## Shortlist

1. **Option 1 — Shared powerbank rental station network**

The only option that satisfies all four evaluation criteria at a Pass or manageable Flag level. Directly solves the stated problem: tourists pick up a portable powerbank at a café, hotel, or shop at the start of the day; carry it while hiking, taking ferries, and navigating; return it at any participating venue before or after dinner. The "return anywhere" model is the feature that unlocks multi-town day trips — it is specifically why Options 3 and 8 (which require returning to the same venue) fail. The IPEI customer base provides direct venue access that eliminates the cold-start distribution problem that makes this model capital-intensive elsewhere. Turnkey supplier platforms (white-label stations + app + dashboard) make the 6-month launch timeline achievable for a 1–3 person team. The PSP pre-auth validation (PWRB-RISK-001) is an unresolved dependency but is a solvable technical/commercial gate, not a structural blocker.

---

## Decision

**Status:** GO

**Carry forward:** Option 1 — Shared powerbank rental station network

Proceed to `/lp-do-assessment-04-candidate-names --business PWRB`. Scope the naming research to a shared powerbank rental network serving tourists in a specific destination region (Amalfi Coast / southern Italy). The brand name needs to:
- Work in Italian, English, and ideally other European tourist languages without confusing pronunciation
- Signal "charging" or "power" without being generic ("PowerNet", "ChargeCo")
- Support a place-specific identity (Amalfi / Sorrento / coastal Italy) if that direction is chosen, OR a generic travel-charging identity if multi-destination expansion is the ambition
- Be domain-available (.com or .eu or .it)
