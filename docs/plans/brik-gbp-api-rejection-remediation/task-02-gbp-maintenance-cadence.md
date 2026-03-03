---
Type: Task-Artifact
Plan: docs/plans/brik-gbp-api-rejection-remediation/plan.md
Task: TASK-02
Created: 2026-02-25
Status: Complete
---

# GBP Monthly Maintenance Cadence — Hostel Brikette

**Target time per session:** 25–30 minutes
**Frequency:** Once per month
**Access:** Desktop browser, signed in as manager/owner at `business.google.com`

---

## Before You Start (2 min)

1. Open `https://business.google.com/locations`
2. Confirm `Brikette Hostel` profile card is visible
3. Confirm you can click `Edit profile`, `Photos`, `Q&A`, and `Posts` (or `Add update`)

---

## Area 1: Photos (5–8 min)

**Access path:** `https://business.google.com/locations` → click `Photos`

**What to do:**
1. Review existing photos — remove any that are blurry, outdated, or no longer accurate
2. If the total live photo count is below 25, upload at least 3 new photos from the current season
3. Suitable sources: `apps/brikette/public/img/` (any `.jpg`/`.png`/`.webp` showing rooms, terrace, entrance, or Positano views)

**Acceptance condition:** Pass if photo count is ≥25 OR if no new photos are available and existing set remains clean. Fail if count has dropped below 20 (investigate suppression/moderation).

**Time estimate:** 5–8 min (including upload wait)

**Evidence format:** Note the photo count at start and end of session in the Monthly Log table below. No screenshot required unless count dropped.

---

## Area 2: Q&A (5–8 min)

**Access path:** `https://business.google.com/locations` → click `Q&A`
Fallback if Q&A menu is missing: `https://www.google.com/search?q=Brikette+Hostel+Positano` → knowledge panel → `Questions & answers`

**What to do:**
1. Scan all questions for unanswered items — answer as the business owner
2. Priority topics to keep answered:
   - Naples airport → hostel route and timing
   - Check-in / check-out times
   - Dorm types and guest suitability
3. If a new question has appeared since last month, answer it this session

**Acceptance condition:** Pass if zero unanswered questions remain after the session.

**Time estimate:** 5–8 min

**Evidence format:** Record unanswered count at start and end in the Monthly Log table below.

---

## Area 3: Posts (5–8 min)

**Access path:** `https://business.google.com/locations` → click `Posts` or `Add update`

**What to do:**
1. Publish one Update post per month
2. Suggested rotation (use whatever is most current):
   - Transport / directions update (how to get here, ferry/bus tips)
   - Seasonal availability or booking open message
   - Local events or Amalfi Coast tips
3. CTA: `Learn more` → `https://hostel-positano.com/en/how-to-get-here` (or another relevant page)

If the Posts UI is unavailable: capture a screenshot and note "Posts feature unavailable" in the Monthly Log.

**Acceptance condition:** Pass if one post was published this session, or if an unavailability exception is documented.

**Time estimate:** 5–8 min

**Evidence format:** Note post headline and publish date in the Monthly Log below.

---

## Area 4: Insights Capture (5–8 min)

**Access path:** `https://business.google.com/locations` → click `View profile` → `Performance` (or `Insights`)
Direct link: `https://business.google.com/business/u/0/view/businessperformance`

**What to do:**
1. Set date range to the previous calendar month
2. Record the five core metrics in the Monthly Log table below:
   - Views
   - Searches (how customers found you)
   - Calls
   - Direction requests
   - Website clicks
3. If metrics are flat or declining two months in a row, flag for investigation

**Acceptance condition:** Pass if all five metrics are recorded in the log.

**Time estimate:** 5 min

**Evidence format:** Values entered in the Monthly Log table (this file). No screenshot required unless investigating a metric anomaly.

---

## Monthly Log

Record results here after each session.

| Month | Photos (start→end) | Q&A unanswered (start→end) | Post headline | Views | Searches | Calls | Directions | Website clicks | Session notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| 2026-03 |  |  |  |  |  |  |  |  |  |
| 2026-04 |  |  |  |  |  |  |  |  |  |
| 2026-05 |  |  |  |  |  |  |  |  |  |
| 2026-06 |  |  |  |  |  |  |  |  |  |
| 2026-07 |  |  |  |  |  |  |  |  |  |
| 2026-08 |  |  |  |  |  |  |  |  |  |

---

## Probe A: Description Edit Control (Monthly — Until Resolved)

Run this probe at every maintenance session until the description field becomes available.

**Access path:** `https://business.google.com/locations` → `Edit profile` → `Business description`

**What to check:** Is the `Business description` field editable?

| Month | Description field available? | Note |
|---|---|---|
| 2026-03 |  |  |
| 2026-04 |  |  |
| 2026-05 |  |  |
| 2026-06 |  |  |

**Escalation trigger:** If still unavailable at the June 2026 session (3 months since first confirmed unavailability on 2026-02-23), open a Google Business Profile support case to investigate the profile restriction cause. Reference: description control was last available before 2026-02-23.

**If the field becomes available:** Use this draft text:

> Hostel Brikette is a social, budget-friendly hostel in Positano on the Amalfi Coast, close to Chiesa Nuova bus stop and routes to the beach, ferry dock, Sorrento, Amalfi, and Naples. We offer mixed and female dorm options, practical local guidance, and daily transport tips so guests can move around Positano with less stress. Ideal for travelers looking for a hostel in Positano with local know-how and easy connections across the Amalfi Coast.

After saving: record date in the Monthly Log session notes and close this probe (mark "Resolved — description updated YYYY-MM-DD").

---

## Probe B: Hotel Center Property Matching (One-Time — After Octorate Activation)

Run this probe **once only**, within 48 hours of activating the Octorate Metasearch toggle as part of the `brikette-google-hotel-free-listing` plan.

**Access path:** Octorate dashboard → Menu → Metasearch → Property matching status

**What to check:** Is the Brikette property status `MATCHED` in Google Hotel Center?

| Check date | Status (MATCHED / NOT_MATCHED / pending) | Action taken |
|---|---|---|
|  |  |  |

**If MATCHED:** No action needed. Mark probe resolved.

**If NOT_MATCHED after 48 hours:**
1. Confirm GBP business name matches exactly: Octorate account name = GBP listed name = `Brikette Hostel` (or `Hostel Brikette` — use whichever is currently in GBP)
2. Confirm address in Octorate matches GBP exactly (street, city, postcode)
3. Re-check matching status after 24 hours
4. If still NOT_MATCHED after 72 hours total: escalate to Octorate support. Reference the activation date and the GBP profile URL.

---

## VC-03 Self-Review Checklist

Used to confirm this artifact meets the task acceptance criteria at time of creation.

| Check | Pass rule | Status |
|---|---|---|
| Area 1 (Photos) included | Access path + acceptance condition + time estimate + evidence format present | ✅ |
| Area 2 (Q&A) included | Access path + acceptance condition + time estimate + evidence format present | ✅ |
| Area 3 (Posts) included | Access path + acceptance condition + time estimate + evidence format present | ✅ |
| Area 4 (Insights) included | Access path + acceptance condition + time estimate + evidence format present | ✅ |
| Description edit probe included | Monthly probe with escalation trigger at 3 months | ✅ |
| Hotel Center matching probe included | One-time post-Octorate-activation probe with 48h check and escalation path | ✅ |

**VC-03 result: Pass**
