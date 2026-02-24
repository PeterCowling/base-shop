---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Operations
Created: 2026-02-21
Last-updated: 2026-02-21
Feature-Slug: email-templates-terms-anchors
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/_archive/email-templates-terms-anchors/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email Templates — Full T&C Link Audit and Migration

## Scope

### Summary

A full audit of all 53 email templates to determine which should link to the live terms and conditions page at `https://hostel-positano.com/en/terms`, and which section of the terms is most relevant to each. Rather than linking to the page root, each email should link to the specific section relevant to its topic with a descriptive hyperlink label. This requires: (1) adding subsection-level `id` attributes to the terms page, and (2) updating the email template JSON with correct anchor URLs and human-readable link text.

### Goals

- Every template that should reference the T&C does so with a precise anchored URL.
- Every template that should NOT link to T&C (either because the topic isn't covered there, or because a different page is more appropriate) is clearly identified.
- All existing Google Docs T&C links are replaced.
- Two templates (T46, T50) that currently have a Google Docs T&C link in their canonical field are corrected — their topic is not covered by the T&C.
- Link phrasing changes from `"For full details, please see:"` to `"For more information, please see:"`.
- Subsection anchors are auto-generated from the leading number pattern in each paragraph (e.g. `"6.5 No Show…"` → `id="s6-6-5"`).

### Non-goals

- T06, T07 (building access instructions), T18 (hiking route guides) — these link to operational Google Docs with no T&C equivalent. Tracked as a separate migration.
- Translations of `termsPage.json` — anchor IDs are computed from EN headings and work across all locales.
- Any change to `termsPage.json` content itself.

### Constraints & Assumptions

- Constraints:
  - Subsection anchors do not yet exist on the terms page. They require a `page.tsx` code change to add `id` attributes to `<p>` elements.
  - The subsection ID formula: `${sectionKey}-${subsectionNum}` where subsectionNum strips the period and lowercases (e.g. `6.5` → `s6-6-5`, `A1` → `s17-a1`).
  - Email body is plain text. Link format must match the existing pattern: `Descriptive label: <url>` or inline `<url>`.
- Assumptions:
  - Some templates that already link to an assistance page should ADD a T&C link as a secondary reference (the assistance page covers the practical how-to; T&C provides the policy/legal backing).
  - For templates where T&C is the primary policy reference, the T&C link replaces the Google Docs link.

---

## Evidence Audit: Full 53-Template Assessment

### T&C Sections Available (for reference)

| Section | Title | Key subsections |
|---|---|---|
| s1 | 1. Parties and Definitions | 1.6 Visitor, 1.15 No Show, 1.18 Preauthorisation, 1.19 Security Deposit |
| s2 | 2. Booking Requests, Authorised Channels, and Contract Formation | 2.2 Confirmed Booking, 2.5 Verification/fraud/cancellation, 2.6 Booking size limits (7 nights max, 5 people) |
| s3 | 3. Rates, Inclusions, and Room Allocation | 3.1 What's included, 3.2 Room/bed allocation (groups may be split), 3.3 Upgrades |
| s4 | 4. Payments, Deposits, and Preauthorisations | 4.2 When payment is due, 4.3 OTA payments and refunds |
| s5 | 5. Security Deposit and Safeguarding | 5.1 Deposit rule (one night per guest), 5.2 Use of deposit |
| s6 | 6. Cancellations, Changes, No Shows, Early Departure | 6.3 Cancellation rules/fees, 6.4 Changes = new booking, 6.5 No Show, 6.6 Early departure, 6.7 Termination for breach (eviction) |
| s7 | 7. Check-In Requirements | 7.1 Check-in window 15:00–22:00 + late arrivals, 7.2 Proof of identity, 7.3 Balance payment, 7.4 Age and minors (under 18) |
| s8 | 8. Defects, Maintenance, and Remedies | 8.3 Serious Defects — alternative room remedy |
| s10 | 10. Personal Belongings and Property Storage | Guest responsibility for belongings |
| s11 | 11. Liability | 11.3 Liability caps |
| s14 | 14. Health and Safety | Travel insurance recommendation; refunds follow Rate Type |
| s15 | 15. Promotions and Coupons | Coupon validity conditions |
| s17 | Appendix A — Rate & Fee Schedule | A1 Non-Refundable Rate (100% payment, no refund), A2 Refundable Rate (72h free cancel), A3 Cancellation admin fee (€5) |

---

### Full Template Assessment Table

| ID | Subject | Category | Current link | → T&C? | Best T&C section | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| T01 | Why Pre-paid Booking Type Cancelled | booking-issues | Google Docs T&C | **YES** | s17 / A1 | `#s17-a1` | Non-refundable rate — steps not completed → booking cancelled |
| T02 | Agreement Received | general | None | **YES** | s2 | `#s2-2-booking-requests-authorised-channels-and-contract-formation` | Guest just agreed to T&C; link gives them access to what they agreed |
| T03 | Alcohol Policy | policies | Google Docs T&C | **YES (partial)** | s6 / 6.7 | `#s6-6-cancellations-changes-no-shows-early-departure` | Alcohol = House Rules; s6.7 (Termination for Breach) backs up "discontinuation of your stay" warning |
| T04 | Transportation to Hostel Brikette | transportation | /en/assistance/travel-help | **NO** | — | — | Transport only; T&C has no transport section |
| T05 | Arriving before check-in time | check-in | /en/assistance/checkin-checkout | **YES** | s7 | `#s7-7-check-in-requirements-eligibility-id-and-payment` | Email mentions ID, payment, keycard deposit — all covered in s7 |
| T06 | Essential — Inner Building Door | access | Google Docs (access guide) | **NO** | — | — | Building access instructions; not T&C |
| T07 | Essential — Outer Building Door | access | Google Docs (access guide) | **NO** | — | — | Same as T06 |
| T08 | Arrival Time check | check-in | /en/assistance/checkin-checkout | **YES** | s7 / 7.1 | `#s7-7-check-in-requirements-eligibility-id-and-payment` | s7.1 covers check-in window and no-show risk if arrive after 22:00 |
| T09 | Change Credit Card Details | payment | Octorate card link | **NO** | — | — | Pure operational action email; T&C not relevant |
| T10 | Out of hours check-in | check-in | /en/assistance/late-checkin | **YES** | s7 / 7.1 | `#s7-7-check-in-requirements-eligibility-id-and-payment` | s7.1 says late arrivals must request instructions in advance |
| T11 | Prepayment — Cancelled post 3rd Attempt | prepayment | None | **YES** | s6 | `#s6-6-cancellations-changes-no-shows-early-departure` | "Cancelled in line with booking policy" — T&C backs this up (s2.5, s6.3) |
| T12 | Prepayment — 1st Attempt Failed (Octorate) | prepayment | None | **BORDERLINE** | s17 / A1 | `#s17-a1` | First attempt; gentle stage. A T&C link to Appendix A signals consequences without threatening |
| T13 | Prepayment — 2nd Attempt Failed | prepayment | None | **YES** | s6 | `#s6-6-cancellations-changes-no-shows-early-departure` | "Reservation will be cancelled automatically according to policy" — T&C must be cited |
| T14 | Prepayment — 1st Attempt Failed (Hostelworld) | prepayment | None | **BORDERLINE** | s17 / A1 | `#s17-a1` | Same reasoning as T12 |
| T15 | Cancellation of Non-Refundable Booking | cancellation | Google Docs T&C | **YES** | s17 / A1 | `#s17-a1` | Non-refundable rate rules live in Appendix A1 |
| T16 | No Show | cancellation | Google Docs T&C | **YES** | s6 / 6.5 | `#s6-6-5` *(new subsection anchor)* | s6.5 is the No Show rule; Appendix A lists fee |
| T17 | Age Restriction | policies | Google Docs T&C | **YES (partial)** | s7 / 7.4 | `#s7-7-4` *(new subsection anchor)* | s7.4 covers age/minors at check-in; over-35 dorm restriction is a House Rule not in T&C — note in plan |
| T18 | Path of the Gods Hike | activities | /en/assistance/path-of-gods-hike + 3 Google Docs | **NO** | — | — | Hiking guides; T&C irrelevant |
| T19 | Prepayment Successful | prepayment | None | **NO** | — | — | Positive confirmation; no policy clarification needed |
| T20 | Breakfast — Eligibility and Hours | breakfast | /en/assistance/booking-basics | **NO** | — | — | T&C s3.1 mentions breakfast in one line; assistance page is sufficient |
| T21 | Breakfast — Not Included (OTA Booking) | breakfast | /en/assistance/booking-basics | **NO** | — | — | Same |
| T22 | Luggage Storage — Before Check-in | luggage | /en/assistance/luggage-storage-positano | **NO** | — | — | T&C s10 defers to House Rules; assistance page is better |
| T23 | Luggage Storage — After Checkout | luggage | /en/assistance/luggage-storage-positano | **NO** | — | — | Same |
| T24 | Luggage Storage — Porter Service | luggage | /en/assistance/luggage-storage-positano | **NO** | — | — | Same |
| T25 | WiFi Information | wifi | /en/assistance (excluded) | **NO** | — | — | T&C has no WiFi section |
| T26 | Booking Change — Date Modification | booking-changes | /en/assistance/changing-cancelling | **YES** | s6 / 6.4 | `#s6-6-cancellations-changes-no-shows-early-departure` | s6.4: changes may be treated as cancellation of original booking |
| T27 | Booking Change — Room Type | booking-changes | /en/assistance/changing-cancelling | **YES** | s6 / 6.4 + s3 / 3.2 | `#s6-6-cancellations-changes-no-shows-early-departure` | Same basis; also s3.2 room allocation rules |
| T28 | Booking Extension Request | booking-changes | /en/assistance/changing-cancelling | **YES** | s2 / 2.6 | `#s2-2-booking-requests-authorised-channels-and-contract-formation` | s2.6 explicitly states 7-night maximum stay limit |
| T29 | Checkout Reminder | checkout | /en/assistance/checkin-checkout | **NO** | — | — | Operational reminder; assistance page sufficient |
| T30 | Late Checkout Request | checkout | /en/assistance/checkin-checkout | **NO** | — | — | Late checkout is a paid commercial service; not in T&C |
| T31 | Quiet Hours Reminder | house-rules | /en/assistance/rules | **YES** | s6 / 6.7 | `#s6-6-cancellations-changes-no-shows-early-departure` | s6.7 (Termination for Breach) backs up "repeated disturbances may result in further action" |
| T32 | Visitor Policy | house-rules | /en/assistance/rules | **YES** | s1 | `#s1-1-parties-and-definitions` | s1.6 formally defines Visitor as permitted in communal areas only |
| T33 | Deposit and Keycard Info | check-in | /en/assistance/checkin-checkout | **YES** | s5 | `#s5-5-security-deposit-and-safeguarding` | s5 is the Security Deposit section — keycard deposit = Security Deposit |
| T34 | Coupon Code Redemption | promotions | / (excluded) | **YES** | s15 | `#s15-15-promotions-and-coupons` | s15 explicitly covers coupons and their validity conditions |
| T35 | Job Application — Acknowledgement | employment | None | **NO** | — | — | Employment; T&C has no employment section |
| T36 | Lost Item — Report Received | lost-found | /en/assistance (excluded) | **YES** | s10 | `#s10-10-personal-belongings-and-property-storage` | s10 states guests are responsible for their belongings |
| T37 | Booking Inquiry — Availability | booking-issues | /en/assistance/booking-basics | **NO** | — | — | Availability/sales inquiry; T&C not relevant |
| T38 | Room Capacity Clarification | booking-issues | /en/assistance/booking-basics | **YES** | s3 / 3.2 + s2 / 2.6 | `#s3-3-rates-inclusions-and-room-allocation` | s3.2: group bookings may be split; s2.6: max 5 people per booking |
| T39 | Hostel Facilities and Services | faq | /en/assistance | **NO** | — | — | Facilities overview; T&C too thin here; assistance page is right |
| T40 | Cancellation Request — Medical Hardship | cancellation | Google Docs T&C | **YES** | s6 + s14 | `#s14-14-health-and-safety` | s14: refunds follow Rate Type; travel insurance recommended. s6.3 covers the rate rule. Two links warranted. |
| T41 | Cancellation Confirmation | cancellation | Google Docs T&C (canonical only) | **YES** | s6 + s4 / 4.3 | `#s6-6-cancellations-changes-no-shows-early-departure` | s6.3 covers rate-based refunds; s4.3 covers OTA merchant-of-record refunds |
| T42 | Payment Dispute — Acknowledgement | payment | Google Docs T&C | **YES** | s4 | `#s4-4-payments-deposits-and-preauthorisations` | s4 covers payment terms and dispute context |
| T43 | Overbooking Support — Next Steps | booking-issues | /en/assistance/changing-cancelling | **YES** | s8 / 8.3 | `#s8-8-defects-maintenance-and-remedies` | s8.3 covers alternative room / cancellation options when hostel cannot fulfil booking |
| T44 | Bar and Terrace — Hours and Access | faq | /en/assistance | **NO** | — | — | Bar policy = House Rules / licensed premises; not in T&C |
| T45 | Parking — Not Available, Nearby Options | transportation | /en/assistance/travel-help | **NO** | — | — | No parking section in T&C |
| T46 | Pets — Policy | policies | Google Docs T&C | **NO** ⚠️ | — | — | **Pets not mentioned in T&C at all. Current link is wrong. Remove and replace with appropriate URL (House Rules or assistance/rules page).** |
| T47 | City Tax — What to Expect at Check-in | check-in | /en/assistance/checkin-checkout | **NO** | — | — | City tax is a statutory local levy; T&C doesn't cover it |
| T48 | Private Room vs Dormitory — Comparison | booking-issues | /en/assistance/booking-basics | **NO** | — | — | Sales/comparison content; assistance page sufficient |
| T49 | Things to Do in Positano | activities | /en/assistance | **NO** | — | — | Local activity guide; T&C irrelevant |
| T50 | Receipt / Invoice Request | payment | Google Docs T&C (canonical only) | **NO** ⚠️ | — | — | **T&C not relevant to invoice requests. Current canonical_reference_url is wrong. Remove.** |
| T51 | Group Booking — How It Works | booking-issues | /en/assistance/booking-basics | **YES** | s2 / 2.6 | `#s2-2-booking-requests-authorised-channels-and-contract-formation` | s2.6 explicitly states 7-night max and 5-person limit — directly cited in the email |
| T52 | Out of Hours Check-In Instructions | check-in | /en/assistance/late-checkin | **YES** | s7 / 7.1 | `#s7-7-check-in-requirements-eligibility-id-and-payment` | s7.1 states late arrivals must request instructions in advance |
| T53 | Arriving by Bus | transportation | /en/assistance/arriving-by-bus | **NO** | — | — | Bus directions only; T&C irrelevant |

---

### Summary Counts

| Verdict | Count | Templates |
|---|---|---|
| **YES — link to T&C** | 26 | T01, T02, T03, T05, T08, T10, T11, T13, T15, T16, T17, T26, T27, T28, T31, T32, T33, T34, T36, T38, T40, T41, T42, T43, T51, T52 |
| **BORDERLINE — link to T&C** | 2 | T12, T14 |
| **NO — do not link to T&C** | 23 | T04, T09, T18, T19, T20, T21, T22, T23, T24, T25, T29, T30, T35, T37, T39, T44, T45, T47, T48, T49, T53 |
| **NO + fix wrong existing link** | 2 | T46 (remove Google Docs T&C link — pets not in T&C), T50 (remove Google Docs T&C canonical_reference_url — not relevant) |
| **NO (out of scope — different doc)** | 3 | T06, T07, T18 (building access + hiking guides need separate migration) |

---

### Subsection Anchors Required (new, needs page.tsx change)

The terms page currently has section-level anchors only (`<h2 id="s6-6-cancellations-…">`). The following subsection anchors need to be added to `<p>` elements:

| Anchor ID | Paragraph text prefix | Used by templates |
|---|---|---|
| `s2-2-6` | `2.6 Booking size limits` | T28, T38, T51 |
| `s3-3-2` | `3.2 Room and bed allocation` | T27, T38 |
| `s5-5-1` | `5.1 Security Deposit rule` | T33 |
| `s6-6-4` | `6.4 Changes and extensions` | T26, T27 |
| `s6-6-5` | `6.5 No Show` | T16 |
| `s6-6-7` | `6.7 Termination for breach` | T03, T31 |
| `s7-7-1` | `7.1 Check-in window and late arrivals` | T08, T10, T52 |
| `s7-7-4` | `7.4 Age and minors` | T17 |
| `s8-8-3` | `8.3 Serious Defects` | T43 |
| `s17-a1` | `A1. Non‑Refundable Rate` | T01, T12, T14, T15 |
| `s17-a2` | `A2. Refundable Rate` | — (future use) |
| `s17-a3` | `A3. Cancellation administration fee` | — (future use) |

Section-level anchors (already exist) used by new links:
- `s1-1-parties-and-definitions` → T02 (s2.2 is inside s2 — close enough), T32
- `s2-2-booking-requests-authorised-channels-and-contract-formation` → T02, T28, T51
- `s4-4-payments-deposits-and-preauthorisations` → T41, T42
- `s5-5-security-deposit-and-safeguarding` → T33 (section level if subsection not created)
- `s6-6-cancellations-changes-no-shows-early-departure` → T11, T13, T26, T27, T40, T41
- `s7-7-check-in-requirements-eligibility-id-and-payment` → T05, T08, T10, T17, T52
- `s8-8-defects-maintenance-and-remedies` → T43
- `s10-10-personal-belongings-and-property-storage` → T36
- `s14-14-health-and-safety` → T40
- `s15-15-promotions-and-coupons` → T34

---

## Terms Linking Spec — Complete Implementation Reference

This section is the authoritative working spec for the build. Every template update reads from here. No judgment calls during build — copy the values exactly.

### Anchor status key

- **EXISTS** — anchor is already live on the page as a `<h2 id="…">` element
- **NEW** — subsection anchor, requires `<p id="…">` to be added in `page.tsx` first

### Anchor registry

| Anchor ID | T&C text it points to | Status |
|---|---|---|
| `s1-1-parties-and-definitions` | Section 1 — Parties and Definitions (includes s1.6 Visitor definition) | **EXISTS** |
| `s2-2-booking-requests-authorised-channels-and-contract-formation` | Section 2 — Booking Requests and Contract Formation (includes s2.2 Confirmed Booking, s2.6 stay/group limits) | **EXISTS** |
| `s2-2-6` | 2.6 Booking size limits — maximum stay 7 nights, maximum group 5 people | **NEW** |
| `s3-3-rates-inclusions-and-room-allocation` | Section 3 — Rates, Inclusions, Room Allocation | **EXISTS** |
| `s3-3-2` | 3.2 Room and bed allocation — group bookings may be split | **NEW** |
| `s4-4-payments-deposits-and-preauthorisations` | Section 4 — Payments, Deposits, Preauthorisations | **EXISTS** |
| `s5-5-security-deposit-and-safeguarding` | Section 5 — Security Deposit and Safeguarding | **EXISTS** |
| `s6-6-cancellations-changes-no-shows-early-departure` | Section 6 — Cancellations, Changes, No Shows, Early Departure | **EXISTS** |
| `s6-6-4` | 6.4 Changes and extensions — may be treated as cancellation of original booking | **NEW** |
| `s6-6-5` | 6.5 No Show — fees apply according to Rate Type and Appendix A | **NEW** |
| `s6-6-7` | 6.7 Termination for breach — eviction / refusal of continued stay | **NEW** |
| `s7-7-check-in-requirements-eligibility-id-and-payment` | Section 7 — Check-In Requirements | **EXISTS** |
| `s7-7-1` | 7.1 Check-in window 15:00–22:00 — late arrivals must request instructions in advance | **NEW** |
| `s7-7-4` | 7.4 Age and minors — under 18 may be restricted to private rooms | **NEW** |
| `s8-8-defects-maintenance-and-remedies` | Section 8 — Defects, Maintenance, Remedies (s8.3 alternative room/cancellation when booking cannot be honoured) | **EXISTS** |
| `s10-10-personal-belongings-and-property-storage` | Section 10 — Personal Belongings and Property Storage | **EXISTS** |
| `s14-14-health-and-safety` | Section 14 — Health and Safety (travel insurance recommendation; refunds follow Rate Type) | **EXISTS** |
| `s15-15-promotions-and-coupons` | Section 15 — Promotions and Coupons | **EXISTS** |
| `s17-appendix-a-rate-und-fee-schedule` | Appendix A — Rate & Fee Schedule (section level) | **EXISTS** |
| `s17-a1` | A1. Non-Refundable Rate — 100% payment at booking, no refund, no show = no refund | **NEW** |
| `s17-a2` | A2. Refundable Rate — free cancel up to 72h before arrival | **NEW** |

---

### Per-template spec

Column definitions:
- **Action**: `replace` = swap existing Google Docs link body + canonical field; `add-primary` = add new T&C link to body that has none; `add-secondary` = add T&C link alongside existing assistance link; `field-only` = update `canonical_reference_url` field only, no body change; `remove` = delete existing wrong T&C link from body/field
- **Position**: where the link sits in the email body
- **Phrasing prefix**: the sentence that precedes the link label and URL
- **Link label**: the clickable/readable text (NOT a bare URL)
- **Full URL**: the exact URL to use — copy verbatim

---

#### T01 — Why Pre-paid Booking Type Cancelled

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s17-a1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s17-a1` |
| Link label | `Non-Refundable Rate rules` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s17-a1` |

---

#### T02 — Agreement Received

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s2-2-booking-requests-authorised-channels-and-contract-formation` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s2-2-booking-requests-authorised-channels-and-contract-formation` |
| Link label | `Our booking terms` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s2-2-booking-requests-authorised-channels-and-contract-formation` |

---

#### T03 — Alcohol Policy

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s6-6-7` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-7` |
| Link label | `Termination for breach of house rules` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s6-6-7` |

---

#### T05 — Arriving before check-in time

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s7-7-check-in-requirements-eligibility-id-and-payment` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s7-7-check-in-requirements-eligibility-id-and-payment` |
| Link label | `Check-in requirements` |
| Phrasing prefix | `For the booking terms on check-in, please see:` |
| Position | Add as new line after the existing `/en/assistance/checkin-checkout` line |
| canonical_reference_url | Keep existing (`/en/assistance/checkin-checkout`) — assistance page remains primary |

---

#### T08 — Arrival Time

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s7-7-1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s7-7-1` |
| Link label | `Check-in window and no-show terms` |
| Phrasing prefix | `For the booking terms on check-in and no-shows, please see:` |
| Position | Add as new line after the existing `/en/assistance/checkin-checkout` line |
| canonical_reference_url | Keep existing |

---

#### T10 — Out of hours check-in

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s7-7-1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s7-7-1` |
| Link label | `Check-in window and late arrival terms` |
| Phrasing prefix | `For the booking terms on late arrivals, please see:` |
| Position | Add as new line after the existing `/en/assistance/late-checkin` line |
| canonical_reference_url | Keep existing |

---

#### T11 — Prepayment — Cancelled post 3rd Attempt

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s6-6-cancellations-changes-no-shows-early-departure` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |
| Link label | `Cancellation policy` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |

---

#### T12 — Prepayment — 1st Attempt Failed (Octorate)

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s17-a1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s17-a1` |
| Link label | `Non-Refundable Rate rules` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s17-a1` |

---

#### T13 — Prepayment — 2nd Attempt Failed

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s6-6-cancellations-changes-no-shows-early-departure` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |
| Link label | `Cancellation policy` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |

---

#### T14 — Prepayment — 1st Attempt Failed (Hostelworld)

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s17-a1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s17-a1` |
| Link label | `Non-Refundable Rate rules` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s17-a1` |

---

#### T15 — Cancellation of Non-Refundable Booking

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s17-a1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s17-a1` |
| Link label | `Non-Refundable Rate rules` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s17-a1` |

---

#### T16 — No Show

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s6-6-5` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-5` |
| Link label | `No Show policy and fees` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s6-6-5` |

---

#### T17 — Age Restriction

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s7-7-4` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s7-7-4` |
| Link label | `Age and minors policy` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s7-7-4` |
| Note | s7.4 covers under-18 restrictions. The over-35 dorm restriction in this email is a House Rule not in T&C — the link is to the closest applicable T&C clause. |

---

#### T26 — Booking Change — Date Modification

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s6-6-4` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-4` |
| Link label | `Booking changes and cancellation policy` |
| Phrasing prefix | `For the booking terms on changes, please see:` |
| Position | Add as new line after the existing `/en/assistance/changing-cancelling` line |
| canonical_reference_url | Keep existing |

---

#### T27 — Booking Change — Room Type

| Field | Value |
|---|---|
| Action | `add-secondary` (two T&C links) |
| Anchor 1 | `s6-6-4` (NEW) |
| Full URL 1 | `https://hostel-positano.com/en/terms#s6-6-4` |
| Link label 1 | `Booking changes and cancellation policy` |
| Phrasing prefix 1 | `For the booking terms on changes, please see:` |
| Anchor 2 | `s3-3-2` (NEW) |
| Full URL 2 | `https://hostel-positano.com/en/terms#s3-3-2` |
| Link label 2 | `Room and bed allocation policy` |
| Phrasing prefix 2 | `For the booking terms on room allocation, please see:` |
| Position | Add both as new consecutive lines after the existing `/en/assistance/changing-cancelling` line |
| canonical_reference_url | Keep existing |

---

#### T28 — Booking Extension Request

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s2-2-6` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s2-2-6` |
| Link label | `Maximum stay and booking limits` |
| Phrasing prefix | `For the booking terms on stay limits, please see:` |
| Position | Add as new line after the existing `/en/assistance/changing-cancelling` line |
| canonical_reference_url | Keep existing |

---

#### T31 — Quiet Hours Reminder

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s6-6-7` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-7` |
| Link label | `Termination for breach of house rules` |
| Phrasing prefix | `For the booking terms on breach of rules, please see:` |
| Position | Add as new line after the existing `/en/assistance/rules` line |
| canonical_reference_url | Keep existing |

---

#### T32 — Visitor Policy

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s1-1-parties-and-definitions` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s1-1-parties-and-definitions` |
| Link label | `Visitor definition and conditions` |
| Phrasing prefix | `For the booking terms on visitor access, please see:` |
| Position | Add as new line after the existing `/en/assistance/rules` line |
| canonical_reference_url | Keep existing |

---

#### T33 — Deposit and Keycard Info

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s5-5-security-deposit-and-safeguarding` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s5-5-security-deposit-and-safeguarding` |
| Link label | `Security deposit terms` |
| Phrasing prefix | `For the booking terms on the security deposit, please see:` |
| Position | Add as new line after the existing `/en/assistance/checkin-checkout` line |
| canonical_reference_url | Keep existing |

---

#### T34 — Coupon Code Redemption

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s15-15-promotions-and-coupons` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s15-15-promotions-and-coupons` |
| Link label | `Promotions and coupon terms` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s15-15-promotions-and-coupons` |

---

#### T36 — Lost Item — Report Received

| Field | Value |
|---|---|
| Action | `add-primary` |
| Anchor | `s10-10-personal-belongings-and-property-storage` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s10-10-personal-belongings-and-property-storage` |
| Link label | `Personal belongings and storage policy` |
| Phrasing prefix | `For more information, please see:` |
| Position | Add as new final line of body |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s10-10-personal-belongings-and-property-storage` |

---

#### T38 — Room Capacity Clarification

| Field | Value |
|---|---|
| Action | `add-secondary` (two T&C links) |
| Anchor 1 | `s3-3-2` (NEW) |
| Full URL 1 | `https://hostel-positano.com/en/terms#s3-3-2` |
| Link label 1 | `Room and group booking allocation` |
| Phrasing prefix 1 | `For the booking terms on room allocation and groups, please see:` |
| Anchor 2 | `s2-2-6` (NEW) |
| Full URL 2 | `https://hostel-positano.com/en/terms#s2-2-6` |
| Link label 2 | `Maximum stay and booking limits` |
| Phrasing prefix 2 | `For the booking terms on maximum stay and group size, please see:` |
| Position | Add both as new consecutive lines after the existing `/en/assistance/booking-basics` line |
| canonical_reference_url | Keep existing |

---

#### T40 — Cancellation Request — Medical Hardship

| Field | Value |
|---|---|
| Action | `replace` (two links replace one) |
| Anchor 1 | `s6-6-cancellations-changes-no-shows-early-departure` (EXISTS) |
| Full URL 1 | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |
| Link label 1 | `Cancellations and rate rules` |
| Phrasing prefix 1 | `For more information on our cancellation policy, please see:` |
| Anchor 2 | `s14-14-health-and-safety` (EXISTS) |
| Full URL 2 | `https://hostel-positano.com/en/terms#s14-14-health-and-safety` |
| Link label 2 | `Health and safety terms` |
| Phrasing prefix 2 | `For health-related cancellations and travel insurance guidance, please see:` |
| Position | End of body, replacing the single Google Docs link with these two consecutive lines |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s14-14-health-and-safety` |

---

#### T41 — Cancellation Confirmation

| Field | Value |
|---|---|
| Action | `field-only` (reference_optional_excluded — no body change) |
| Anchor | `s6-6-cancellations-changes-no-shows-early-departure` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure` |

---

#### T42 — Payment Dispute — Acknowledgement

| Field | Value |
|---|---|
| Action | `replace` |
| Anchor | `s4-4-payments-deposits-and-preauthorisations` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s4-4-payments-deposits-and-preauthorisations` |
| Link label | `Payments and preauthorisations policy` |
| Phrasing prefix | `For more information, please see:` |
| Position | End of body, replacing current Google Docs link line |
| canonical_reference_url | `https://hostel-positano.com/en/terms#s4-4-payments-deposits-and-preauthorisations` |

---

#### T43 — Overbooking Support — Next Steps

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s8-8-defects-maintenance-and-remedies` (EXISTS) |
| Full URL | `https://hostel-positano.com/en/terms#s8-8-defects-maintenance-and-remedies` |
| Link label | `Defects and remedies policy` |
| Phrasing prefix | `For the booking terms on remedies and alternative accommodation, please see:` |
| Position | Add as new line after the existing `/en/assistance/changing-cancelling` line |
| canonical_reference_url | Keep existing |

---

#### T46 — Pets — Policy

| Field | Value |
|---|---|
| Action | `remove` |
| Body change | Remove the final line `For full details, please see: <https://docs.google.com/…>` — the body is self-contained without it |
| canonical_reference_url | Set to `null` (pets not covered in T&C; future: link to House Rules page when available) |

---

#### T50 — Receipt / Invoice Request

| Field | Value |
|---|---|
| Action | `field-only-remove` (reference_optional_excluded — no body change) |
| canonical_reference_url | Set to `null` |

---

#### T51 — Group Booking — How It Works

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s2-2-6` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s2-2-6` |
| Link label | `Group booking limits and stay terms` |
| Phrasing prefix | `For the booking terms on group limits and maximum stay, please see:` |
| Position | Add as new line after the existing `/en/assistance/booking-basics` line |
| canonical_reference_url | Keep existing |

---

#### T52 — Out of Hours Check-In Instructions

| Field | Value |
|---|---|
| Action | `add-secondary` |
| Anchor | `s7-7-1` (NEW) |
| Full URL | `https://hostel-positano.com/en/terms#s7-7-1` |
| Link label | `Check-in window and late arrival terms` |
| Phrasing prefix | `For the booking terms on late arrivals, please see:` |
| Position | Add as new final line of body, after the existing `/en/assistance/late-checkin` reference |
| canonical_reference_url | Keep existing |

---

### New subsection anchors required in page.tsx (summary)

The build must add `id` attributes to these specific `<p>` elements before any template link using them can go live:

| id to add | Paragraph starts with | Section key |
|---|---|---|
| `s2-2-6` | `2.6 Booking size limits` | s2 |
| `s3-3-2` | `3.2 Room and bed allocation` | s3 |
| `s6-6-4` | `6.4 Changes and extensions` | s6 |
| `s6-6-5` | `6.5 No Show` | s6 |
| `s6-6-7` | `6.7 Termination for breach` | s6 |
| `s7-7-1` | `7.1 Check-in window and late arrivals` | s7 |
| `s7-7-4` | `7.4 Age and minors` | s7 |
| `s17-a1` | `A1. Non‑Refundable Rate` | s17 |
| `s17-a2` | `A2. Refundable Rate` | s17 |

---

### Implementation Scope

**Part 1 — Website: `apps/brikette/src/app/[lang]/terms/page.tsx`**

Add subsection `id` attributes to `<p>` elements. Logic: detect leading subsection number pattern in paragraph text (`/^\d+\.\d+/` or `/^A\d+\./`), generate `id="${sectionKey}-${num.replace('.', '-').toLowerCase()}"`. Extract to a testable helper function `getSubsectionId(sectionKey, paragraphText)`.

**Part 2 — Data: `packages/mcp-server/data/email-templates.json`**

For each YES/BORDERLINE template:
1. Update `canonical_reference_url` to `https://hostel-positano.com/en/terms#<anchor>`
2. Update body: change `"For full details, please see:"` → `"For more information, please see:"` where applicable
3. Change link label from bare URL to descriptive text
4. For templates that already link to an assistance page: add T&C as a secondary reference

For T46 and T50: remove the Google Docs T&C `canonical_reference_url` (set to `null` or replace with a more appropriate URL — user to decide on T46).

---

## Key Modules / Files

- `packages/mcp-server/data/email-templates.json` — 53-template data source
- `apps/brikette/src/app/[lang]/terms/page.tsx` — terms page renderer; subsection IDs to be added
- `apps/brikette/src/locales/en/termsPage.json` — English terms content (17 sections, read-only for this task)
- `apps/brikette/src/utils/slugify.ts` — deterministic slug algorithm (anchor ID formula verified)

---

## Dependency & Impact Map

- Upstream: `termsPage.json` content → `page.tsx` renders anchors → template JSON consumes anchor URLs.
- Downstream: guests clicking links in emails land on the correct terms section.
- Blast radius:
  - `page.tsx` change is additive (adds `id` to `<p>` elements). No visual or routing change.
  - Template JSON change is data-only; no code deploy required for JSON updates alone.
  - Subsection anchor IDs are stable as long as the leading `N.N ` or `AN.` pattern in paragraph text is preserved.

---

## Test Landscape

- `apps/brikette/src/test/utils/slugify.test.ts` — slugify algorithm well-tested; anchor computation is deterministic
- No test exists for terms page `<p>` ID attributes
- `packages/mcp-server/scripts/lint-templates.ts` — template linter (validate URL format after JSON changes)

Recommended test additions:
- Unit test: `getSubsectionId()` helper returns correct IDs for known inputs
- Snapshot or integration test: terms page `<p>` elements with leading `N.N ` patterns have correct `id` attributes

---

## Confidence Inputs

- Implementation: 90% — all 53 templates assessed, T&C sections fully mapped, anchor IDs computed. The only ambiguity is T12/T14 (borderline), T17 (partial T&C match for age restriction), and T40 (two-section link).
- Approach: 85% — subsection anchor auto-detection from paragraph text is stable and deterministic.
- Impact: 95% — contained, no infrastructure changes. Guest experience improves (links point to relevant sections, not a Google Doc).
- Delivery-Readiness: 90% — plan can be written immediately. One residual decision: T46 canonical_reference_url replacement URL.
- Testability: 75% — subsection logic needs helper extraction for proper unit testing.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| T17 age restriction template links to s7.4 (under-18 rule) but email is about over-35 dorm policy | Medium | Low | Note in template body that s7.4 covers age requirements generally; over-35 dorm restriction is a House Rule. No T&C section covers it better. |
| Subsection anchors break if terms paragraph text is reworded and loses its `N.N ` prefix | Low | Medium | IDs are keyed to the subsection number, not word content. As long as the number prefix is preserved in any rewrite, anchors remain stable. |
| T46 gets no link after removal of incorrect Google Docs T&C link | Low | Low | Either link to /en/assistance/rules (House Rules page) or leave with no external link. Decide at plan stage. |
| T40 dual-section reference (s6 + s14) may feel cluttered in email body | Low | Low | Use s14 as the primary anchor (travel insurance / health hardship context) and mention s6 inline. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Extract subsection ID logic in `page.tsx` to a named pure function (`getSubsectionId`) for testability.
  - Template JSON edits must pass `packages/mcp-server/scripts/lint-templates.ts`.
  - Link text should be descriptive, not generic (avoid "click here" or bare URLs).
- Rollout/rollback:
  - `page.tsx` change: standard Next.js deploy. Rollback removes subsection anchors but breaks nothing — existing section-level anchors remain.
  - JSON change: data-only, rollback by reverting the file.

---

## Suggested Task Seeds (Non-binding)

1. **Add subsection `id` helper to terms page** — extract `getSubsectionId(sectionKey, text)`, add to `page.tsx`, write unit test.
2. **Update the 10 Google Docs T&C template links** (T01, T03, T15, T16, T17, T40, T42 — body links; T41, T46, T50 — canonical field).
3. **Add new T&C links to templates that currently have none** (T02, T05, T08, T10, T11, T13, T26, T27, T28, T31, T32, T33, T34, T36, T38, T43, T51, T52).
4. **Handle T12 and T14 borderline templates** — decide whether to add Appendix A link.
5. **Fix T46 canonical_reference_url** — decide replacement URL (suggest `/en/assistance/rules`).
6. **Fix T50 canonical_reference_url** — set to `null`.
7. **Run lint-templates after all JSON changes.**

---

## Evidence Gap Review

### Gaps Addressed

- All 53 templates read and assessed against the full terms content.
- T&C sections cross-referenced against each email topic systematically.
- Subsection anchor IDs computed using the verified `slugify.ts` algorithm.
- Section-level anchors (already live) confirmed from `page.tsx` source.
- Two incorrectly linked templates (T46, T50) identified and flagged for correction.

### Confidence Adjustments

- Delivery-Readiness raised to 90% (from 75% in prior draft) — scope is now fully locked.
- T17 flagged as partial match — no T&C section fully covers the over-35 dorm restriction, only s7.4 covers under-18.

### Remaining Assumptions

- T12 and T14 (borderline) — assumed INCLUDE based on the argument that even at the first failure, signalling consequences transparently is better practice. User may override to exclude.
- T46 replacement URL — assumed `/en/assistance/rules` pending user decision.
- T50 `canonical_reference_url` — assumed `null` (no relevant T&C section).

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (T12/T14 and T46 decisions can be made in the plan)
- Recommended next step: `/lp-do-plan email-templates-terms-anchors`
