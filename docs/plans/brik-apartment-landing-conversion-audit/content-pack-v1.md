---
Type: Business-Artifact
Task: TASK-10
Status: Draft — Awaiting owner review
Owner: BRIK product/ops + legal owner
Reviewer: Peter Cowling
Approval-Evidence:
  - docs/plans/brik-apartment-landing-conversion-audit/apartment-facts-v1.md
  - docs/plans/brik-apartment-landing-conversion-audit/apartment-terms-scope.md
Created: 2026-02-17
---

# Apartment Content Pack v1

Canonical copy and fallback reference for all apartment landing and booking route surfaces.
All claims derive from approved decision artifacts (TASK-02, TASK-03, TASK-04, TASK-06).
Any field marked `[EXCLUDED — UNVERIFIED]` must not appear in production copy until verified.

---

## Section 1: Quick Facts (VC-01)

Source: `apartment-facts-v1.md` (Status: Approved, Owner: Peter Cowling, 2026-02-17)

| Field | Approved Value | Notes |
|---|---|---|
| Floor area | 100sqm | Verified from lease/physical measurement |
| Occupancy | Up to 4 guests | From Octorate config (codice=45111) |
| Bedrooms | 2 (double bed upstairs; sofa bed downstairs) | Physical layout |
| Bathrooms | 2 full bathrooms | Physical layout |
| Layout | Split-level: living + kitchen downstairs; bedroom upstairs | Physical layout |
| Internal stairs | Yes — between living area and bedroom upstairs | Must be disclosed to guests |
| Arrival | Step-free from road to apartment entrance | No street stairs — verified |
| Kitchen | Full kitchen with appliances (refrigerator, hob, oven) | Physical inventory |
| Laundry | Washer and dryer included | Physical inventory |
| Climate control | Air conditioning | Physical inventory |
| Internet | Wi-Fi included | Physical inventory |
| Pets | Not permitted | Policy |
| Terrace | Communal terrace with sea view — available next door (hostel) | Optional; not private to apartment |
| Breakfast | Optional — available next door at the hostel | Not included by default |
| Bar | Optional — available next door at the hostel | Not included by default |
| Management | Professional hospitality team based next door | Operational |

**VC-01 status: PASS** — all required fields present; source `apartment-facts-v1.md` has owner sign-off.

---

## Section 2: Approved Pricing Copy (VC-02 partial)

Source: `pricing-claim-policy.md` (Status: Approved, 2026-02-17)

### Canonical pricing sentence

> From €265/night in shoulder season.

### Variants approved for use

| Context | Copy | Notes |
|---|---|---|
| Page hero / meta description | "From €265/night in shoulder season" | Include in page meta |
| Inline body paragraph | "Prices from €265 in shoulder season" | Alternate form |
| CTA + date prompt | "From €265 — check availability for your dates" | Use near booking widget |

### Disallowed phrasing (do not use)

- "€265/night" — missing qualifier
- "€265 guaranteed" — no guarantee exists
- "Always from €265" — implies permanence
- Specific stay totals without engine data (e.g. "7 nights from €1,855")

**Operational commitment**: Copy must be updated when the floor price changes. If Octorate pricing drops below €265 for any bookable period, copy must be updated before the period goes on sale.

---

## Section 3: Legal Terms and Perks Policy (VC-02)

Source: `apartment-terms-scope.md` (Status: Approved, 2026-02-17)

### Terms label (all routes including apartment)

| Route | Label text | Target |
|---|---|---|
| All routes | "Terms & Conditions" | Existing terms page |

Label must NOT use: "Hostel terms", "Room Bookings terms", or any hostel-specific framing.

### Perks and direct-booking banner

Per `perks-decision.md` (TASK-04): `perks_apply_apartment: false`.

- `NotificationBanner` is suppressed on all `/[lang]/apartment/**` routes.
- No direct-booking perks claims (e.g., "Book direct and save") on apartment pages.
- Deals page (`/[lang]/deals`) is also not surfaced via apartment route CTA.

### Cancellation and rate terms

Apartment-specific cancellation and rate terms (non-refundable vs. flexible) are surfaced in the booking UI at rate selection step. No additional footer legal surface is required.

**VC-02 status: PASS** — legal-approved terms wording is mapped to apartment landing + booking routes.

---

## Section 4: Fit-Check Copy

The fit-check section (`fitCheck` in `apartmentPage.json`) is the disclosure surface for honest qualification of guests. All fields must remain factually grounded.

### Approved fit-check copy

| Field | Approved copy |
|---|---|
| Arrival | "No street stairs from the road to the apartment entrance." |
| Inside | "Split-level interior with internal stairs between living area and bedroom." |
| Sleeping | "Sofa bed downstairs; double bed upstairs." |
| Sound | "Some road and terrace ambience; terrace quiet hours from midnight." |
| Best fit | "Ideal for couples. If anyone in your group prefers to avoid stairs, the downstairs sofa bed is a comfortable alternative. Not recommended for very light sleepers." |

**Note on "Ideal for couples"**: The apartment sleeps up to 4 guests, but the double + sofa-bed layout and 100sqm size make it genuinely best-fit for 2. The "Ideal for couples" framing is accurate and not exclusionary — the copy correctly notes the sofa bed alternative for groups. Approved as-is.

### Excluded claim

- `heroIntro` currently contains: *"Perfect for couples seeking authentic Positano character."*
- **"authentic Positano character"** is a subjective marketing claim without factual anchor. `[EXCLUDED — UNVERIFIED]`
- Recommended replacement: *"100sqm of independence with step-free arrival. Full kitchen, 2 bathrooms, and professional hospitality support next door."* (already used in `heroIntro` after the problematic phrase — trim to remove the last sentence or replace with factual highlight).

---

## Section 5: No-Availability Fallback Copy (VC-03)

These states cover the apartment booking flow when dates are unavailable or the user is not ready to book. Minimum 3 states required.

### State A: Dates unavailable (hard block)

**Trigger**: Octorate returns no availability for selected dates.

**Copy block**:

> **These dates aren't available.**
> Our apartment books quickly — especially in peak season.
> Try adjusting your dates, or [contact us on WhatsApp] and we'll let you know when we have a gap.

- Primary action: date picker reset / "Try different dates" button
- Secondary action: WhatsApp CTA (see prefill template 1 below)

### State B: No dates selected / empty state

**Trigger**: User lands on booking page without selecting dates.

**Copy block**:

> **Choose your dates to check availability.**
> From €265/night in shoulder season. [Check availability for your dates] on WhatsApp if you'd like help finding the right window.

- Primary action: date picker open
- Secondary action: WhatsApp CTA (see prefill template 2 below)

### State C: Extended stay / long-stay inquiry

**Trigger**: User selects dates > 14 nights, or we detect a long-stay signal (heuristic).

**Copy block**:

> **Planning a longer stay?**
> For stays over 14 nights, reach out directly for a tailored rate.
> [WhatsApp us with your dates] and we'll come back to you within a few hours.

- Primary action: WhatsApp CTA with long-stay prefill (see prefill template 2 below)
- Secondary action: none (do not redirect to Booking.com for long stays without confirming rates)

**VC-03 status: PASS** — 3 fallback states documented.

---

## Section 6: WhatsApp Prefill Templates (VC-03)

Minimum 2 prefill templates required.

### Template 1: No-availability fallback (State A)

```
Hi, I was looking to stay at the Brikette apartment and my dates aren't showing as available. Could you let me know if [DATES] might work, or suggest the next available window?
```

**URL pattern** (encode for `wa.me`):
```
https://wa.me/393287073695?text=Hi%2C+I+was+looking+to+stay+at+the+Brikette+apartment+and+my+dates+aren%27t+showing+as+available.+Could+you+let+me+know+if+%5BDATES%5D+might+work%2C+or+suggest+the+next+available+window%3F
```

Notes:
- `[DATES]` should be replaced dynamically with the user's selected dates if available.
- If no dates selected, use static template without the date placeholder.

### Template 2: General inquiry / empty state / long-stay

```
Hi, I'm interested in staying at the Brikette apartment. Could you tell me about availability and pricing for [DATES / approximate period]?
```

**URL pattern**:
```
https://wa.me/393287073695?text=Hi%2C+I%27m+interested+in+staying+at+the+Brikette+apartment.+Could+you+tell+me+about+availability+and+pricing+for+%5BDATES%5D%3F
```

Notes:
- Use as the default WhatsApp CTA across all apartment pages when no specific fallback state applies.
- The existing `whatsappCta` copy ("WhatsApp for quick answers") is approved copy for link labels.

**VC-03 status: PASS** — 2 WhatsApp prefill templates documented.

---

## Section 7: Locale Link Targets

Source: `internal-link-map-v1.md` (Status: Approved, 2026-02-17)

All apartment copy that references internal links must use canonical route patterns.

| From page | Link target | Canonical EN path |
|---|---|---|
| Apartment hub | Street-level arrival | `/en/apartment/street-level-arrival/` |
| Apartment hub | Private stay | `/en/apartment/private-stay/` |
| Apartment hub | Booking | `/en/apartment/book/` |
| Apartment booking | Back to hub | `/en/apartment/` |
| All apartment pages | WhatsApp | `https://wa.me/393287073695` |

Non-EN locales: use localised slug prefix from slug-map (e.g. `/it/appartamento/`). Verify before TASK-13 ships.

---

## Section 8: Copy Claims Audit Summary

| Claim | Status | Notes |
|---|---|---|
| "100sqm" | Approved ✓ | Verified in apartment-facts-v1.md |
| "Step-free arrival" | Approved ✓ | Verified physical layout |
| "No street stairs" | Approved ✓ | Verified physical layout |
| "2 full bathrooms" | Approved ✓ | Verified physical layout |
| "Full kitchen" | Approved ✓ | Verified inventory |
| "Washer and dryer included" | Approved ✓ | Verified inventory |
| "Air conditioning" | Approved ✓ | Verified inventory |
| "Wi-Fi included" | Approved ✓ | Verified inventory |
| "Professional hospitality team next door" | Approved ✓ | Operational fact |
| "Terrace with sea view" | Approved with qualifier ✓ | Must say "communal terrace … next door" — not presented as private to the apartment |
| "From €265/night in shoulder season" | Approved ✓ | Pricing policy compliant |
| "Sleeps up to 4 guests" | Approved ✓ | From Octorate config |
| "Ideal for couples" | Approved ✓ | Accurate framing; caveat in fit-check |
| "authentic Positano character" | **EXCLUDED** | Subjective, unverified — remove from heroIntro |
| "Breakfast available next door" | Approved with qualifier ✓ | Must say "optional" and "next door" |
| "Bar available next door" | Approved with qualifier ✓ | Must say "optional" and "next door" |

---

## Review Checklist

Before marking this artifact Approved:

- [ ] Owner has reviewed Section 1 quick facts against current physical inventory
- [ ] Owner confirms pricing floor (€265) remains accurate
- [ ] Owner confirms WhatsApp number `393287073695` is the correct inbound contact
- [ ] Legal/ops owner confirms terms label "Terms & Conditions" is appropriate for all accommodation types
- [ ] `heroIntro` unverified claim ("authentic Positano character") removed from `apartmentPage.json`
- [ ] Fallback copy states (Section 5) reviewed for tone and accuracy
- [ ] WhatsApp prefill templates (Section 6) tested for correct URL encoding
