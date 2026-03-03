---
Type: Data-Source-Manifest
Status: Active
Business: BRIK
Linked-doc: product-spec.user.md
Created: 2026-02-17
Updated: 2026-02-17
Owner: Pete
---

# Brikette Product Spec — Data Source Manifest

One entry per source. Each entry says: what the source is, what it provides, which fields in the product spec it covers, the refresh cadence, and exactly how to refresh it.

---

## [OCT-CAL] — Octorate Calendar Export

**What:** Automated weekly export of the 18-month forward calendar from Octorate. Produced by `packages/mcp-server/octorate-export-final-working.mjs`. Contains one row per room per date.

**File pattern:** `data/octorate/octorate-calendar-YYYY-MM-DD.xlsx`
Four sheets:
- `Price` — nightly price per room per date
- `Availability` — gross availability (total beds) per room per date
- `Length of stay` — minimum/maximum stay restrictions per room per date
- `Real availability` — net availability after bookings per room per date

**Room mapping:** `data/octorate/room-inventory.json` maps Octorate internal room IDs to Brikette room numbers (Room 3, Room 4, etc.).

**Fields covered in product spec:**
- Section 1 Rooms — nightly pricing (not entered manually; queried at runtime)
- Section 1 Rooms — real availability per date (not entered manually; queried at runtime)
- Section 1 Rooms — length-of-stay restrictions (not entered manually; queried at runtime)
- Section 8 Pricing Summary — dorm bed and private room live rates

**Refresh cadence:** Weekly (automated). The export script runs on schedule and drops a new dated file into `data/octorate/`.

**How to refresh manually if needed:** Run `node packages/mcp-server/octorate-export-final-working.mjs` from the repo root. Confirm a new file appears in `data/octorate/` with today's date suffix.

**Staleness trigger:** More than 7 days since the date suffix on the most recent `octorate-calendar-YYYY-MM-DD.xlsx` file in `data/octorate/`. Check with: `ls -lt data/octorate/octorate-calendar-*.xlsx | head -1`.

**Room pricing analysis:** After each new calendar export, run the pricing analysis script to regenerate the seasonal pricing summary:

```
pnpm brik:analyse-room-pricing
```

Script: `scripts/brik/analyse-room-pricing.py`
Config: `scripts/brik/room-config.json` (static [OCT-CFG] room config used as metadata join)
Output: `docs/business-os/strategy/BRIK/room-pricing-analysis.md` (auto-generated, do not edit manually)

The output shows per-room seasonal pricing bands (Low/Mid/Peak), sample sizes, and data quality notes. The output file is dated and stamped with the source export filename so you can always tell which data it reflects.

**Important:** Pricing and availability from this source are queried at runtime — they are never manually copied into the product spec. Any version of the product spec showing manually entered per-night prices is by definition stale.

---

## [OCT-CFG] — Octorate Room Configuration

**What:** Room-level configuration held in the Octorate admin UI. This data is NOT included in any automated export. It must be read manually from the admin interface.

**Fields covered in product spec:**
- Section 1 Rooms — room type (dorm / private)
- Section 1 Rooms — gender policy (female-only / mixed / male-only)
- Section 1 Rooms — bed count per room
- Section 1 Rooms — max capacity
- Section 2 Apartment — rate plan structure (non-refundable, flexible)
- Section 8 Pricing Summary — rate plan names and seasonal bands for dorm and private room

**Refresh cadence:** On change, not scheduled. The product spec must be updated whenever a room configuration is changed in Octorate. There is no automated notification — this relies on Pete (or whoever makes the Octorate config change) also updating the product spec in the same operation.

**How to refresh:**
1. Log in to the Octorate admin panel.
2. Navigate to Rooms (or the room configuration section).
3. For each room, record: room type, gender policy, bed count, max capacity.
4. Compare to the current values in Section 1 of the product spec.
5. Update any rows that have changed. Commit the change with a note about what changed and when.
6. Update the `Updated` date in the product spec front matter.

**Staleness trigger:** Any Octorate room configuration change — gender policy, bed reconfiguration, capacity change, rate plan rename or restructure. This is the most likely source of the stale-gender-policy failure mode: room switched in Octorate admin (e.g. Room 3 changed from female-only to mixed on Jan 20) but product spec not updated, causing S2B Offer Design to run with wrong gender policy.

**Note:** Octorate room names in the calendar export (e.g. "OTA, Refundable, Room 3") are rate-plan labels, not descriptive room names. They cannot be used as a substitute for reading the actual room configuration from the admin UI.

---

## [BKG-COM] — Booking.com Listing

**What:** The Booking.com property and room listings for the hostel and the apartment. Managed via the Booking.com extranet.

**Fields covered in product spec:**
- Section 1 Rooms — room descriptions as presented to guests on OTA
- Section 4 Facilities — amenity lists as presented on OTA
- Section 6 Channels — confirmation that the property is live on Booking.com
- Section 2 Apartment — confirmation that the apartment is live on Booking.com

**Refresh cadence:** On change. Whenever the Booking.com listing is updated (room descriptions, amenity lists, photos, category labels), the product spec should be reviewed to confirm it still reflects the listing accurately.

**How to refresh:**
1. Log in to the Booking.com extranet for the property.
2. Navigate to the room/property listing.
3. Compare the listing descriptions and amenity lists against Section 1 (Rooms) and Section 4 (Facilities) of the product spec.
4. Update any fields in the product spec that have diverged from the live listing.
5. Update the `Updated` date in the product spec front matter.

**Staleness trigger:** Any Booking.com listing update — new photos, revised room descriptions, changed amenity set, category relabel, pricing band change visible on the listing.

---

## [MANUAL] — Owner-Confirmed Physical Facts

**What:** Facts about the physical property confirmed by Pete through direct observation or explicit owner decision. These cannot be derived from any system — they require someone to be in the building or to have made an explicit operational decision.

**Fields covered in product spec:**
- Section 1 Rooms — view from each room, floor, stair access, noise profile, standout feature, bed size/type/privacy curtain, bathroom arrangement
- Section 1 Rooms — accessibility notes
- Section 2 Apartment — all physical spec fields (size, layout, capacity, beds, bathrooms, kitchen, laundry, Wi-Fi, AC, TV, amenities)
- Section 2 Apartment — access and accessibility details (step-free entry, interior stairs, stair count/handrail/steepness)
- Section 2 Apartment — noise profile (road noise, terrace noise, quiet hours)
- Section 2 Apartment — hostel amenities available to apartment guests and on what terms
- Section 3 Experiences — all fields (every experience is owner-defined and physically delivered)
- Section 4 Facilities — all fields (terrace capacity/hours/atmosphere, bar offering/hours, breakfast format/price, lounge, kitchen, lockers, linen, Wi-Fi speed, events)
- Section 5 Service — all fields (reception hours, languages, local knowledge offer, check-in/out times, late check-out, luggage storage, messaging SLA)
- Section 6 Channels — WhatsApp secondary CTA policy; direct booking URL confirmation
- Section 7 Audience — all demographic and behavioural characterisations

**Refresh cadence:** Quarterly review (every 90 days), or immediately when a physical change is made to the property (room reconfiguration, new facility, service level change, new experience added).

**How to refresh:**
1. Pete reviews each `[MANUAL]`-tagged field in the product spec.
2. Confirms each field still accurately describes the current physical reality.
3. Updates any fields that have changed.
4. Updates `Last-reviewed` in the product spec front matter to today's date.
5. Commits the update with a brief note on what was reviewed and what (if anything) changed.

**Staleness trigger:** `Last-reviewed` date in product spec front matter older than 90 days, or any known physical change to the property since the last review date.

---

## [DERIVED] — Calculated Metrics

**What:** Metrics computed from other sources at analysis time. These are not stored in the product spec — they are outputs of the startup loop's analytical stages (S3 Forecast, S10 Weekly Decision).

**Fields covered in product spec:**
- Section 1 Room pricing — ADR (average daily rate = net booking revenue / bed-nights sold). Requires `[OCT-CAL]` net booking data and `[OCT-CFG]` bed count to calculate bed-nights denominator.
- Section 6 Channels — OTA share percentage (65–78% historical baseline) and direct share target (27% by day 60–90). Calculated from booking source breakdown.
- Section 7 Audience — age and gender percentages where derived from booking records rather than direct observation.
- Section 8 Pricing Summary — RevPAR (ADR × occupancy rate). Requires ADR and occupancy rate as inputs.

**Dependencies:**
- ADR requires: net booking revenue per room per period (`[OCT-CAL]`) AND bed count per room (`[OCT-CFG]`).
- Occupancy rate requires: actual bookings per room per period (`[OCT-CAL]` real availability) AND total capacity per room per period (`[OCT-CFG]` bed count × days).
- RevPAR requires: ADR and occupancy rate (both `[DERIVED]`).

**Important:** Derived metrics become stale whenever their upstream sources are updated. The `[OCT-CFG]` bed count is the most common source of a silently wrong denominator — if a room is reconfigured and `[OCT-CFG]` is not refreshed, occupancy and RevPAR calculations will be wrong even if `[OCT-CAL]` is current.

**Where computed:** S3 Market Intelligence and S10 Weekly Decision stages of the startup loop. The product spec records the methodology and dependencies, not the computed values themselves.

---

## Refresh checklist (run at S0 loop start per business cycle)

Run through this checklist at the start of each startup loop cycle, before S2B Offer Design runs. The goal is to confirm the product spec is current and no stale data will corrupt the offer.

- [ ] **[OCT-CAL] currency check** — confirm the most recent `octorate-calendar-YYYY-MM-DD.xlsx` in `data/octorate/` is no more than 7 days old. If stale, run the export script manually before proceeding.
- [ ] **[OCT-CAL] pricing analysis** — after confirming the calendar is current, run `pnpm brik:analyse-room-pricing` to regenerate `docs/business-os/strategy/BRIK/room-pricing-analysis.md`. Confirm the `Source-File` in the output front matter matches the latest export. Do not use a pricing analysis output that pre-dates the current calendar file.
- [ ] **[OCT-CFG] change check** — confirm whether any Octorate room configuration has changed since the last loop cycle (ask Pete; check Octorate admin if uncertain). If any change has occurred, update Section 1 of the product spec before proceeding.
- [ ] **[BKG-COM] change check** — confirm whether the Booking.com listing has been updated since the last loop cycle. If yes, review Sections 1, 4, and 6 against the live extranet and update as needed.
- [ ] **[MANUAL] staleness check** — confirm `Last-reviewed` in the product spec front matter is within the last 90 days. If not, Pete must review all `[MANUAL]` fields before S2B Offer Design runs.
- [ ] **[NEEDS INPUT] review** — scan the product spec for any remaining `[NEEDS INPUT]` markers. For each one, decide: is this gap a blocker for S2B Offer Design? If yes, it must be resolved before the loop continues.
- [ ] **Front matter update** — update `Updated` in the product spec front matter to today's date before committing.
