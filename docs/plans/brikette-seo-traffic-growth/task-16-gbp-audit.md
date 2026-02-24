---
Type: Task-Artifact
---

# TASK-16 — Google Business Profile Audit and Refresh

Date: 2026-02-23  
Task: `TASK-16` (`IMPLEMENT`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Execution Status

Status: **Complete (2026-02-23; operator-attested manual completion, API entitlement pending for automation only)**

This artifact is complete via manual execution path. API approval is still pending but does not block manual GBP optimization work.

## Manual Execution Report (2026-02-23)

Operator-provided completion report:
- Business description edit control: **Not available** in current GBP UI.
- Photos: **Uploaded new photos (10+)**.
- Q&A: **No unanswered questions requiring action**.
- GBP post: **One update post published**.
- Evidence mode: **Operator attestation** (screenshots explicitly waived by operator instruction in this execution cycle).

## API Access Request Status

- Support request submitted: `2026-02-23`
- Google Business Profile support case ID: `1-1062000040302`
- Current state: awaiting Google review/approval for GBP API access.
- Note: TASK-16 can still be completed manually in GBP UI without API approval.

## Prepared Assets (Ready Now)

Upload-ready photo pack (prepared on 2026-02-23):

- Folder: `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23`
- Includes 12 files (`.jpg`/`.png`) already suitable for GBP upload
- File index: `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23/README.txt`

Suggested upload set (minimum 10): `01` through `10` from that folder.

## No-Think Operator Runbook (Desktop, 20-30 min)

Follow this exactly. Each step has:
- `DO`: exact click path
- `SAVE`: exact filename required
- `DONE WHEN`: pass condition

### Before you start (2 minutes)

DO:
1. Open `https://business.google.com/locations`
2. If that page does not show the managed profile card, open `https://www.google.com/search?q=my+business`
3. Confirm you are signed in as manager/owner and can see `Brikette Hostel`
4. Open Finder to:
   `docs/plans/brikette-seo-traffic-growth/artifacts/task-16-gbp-audit/`

SAVE:
- No screenshot required for this prep step.

DONE WHEN:
- You can click `Edit profile`, `Photos`, `Q&A`, and `Posts` (or `Add update`) from the managed profile UI.

### Step 1: Capture baseline screenshots (required set 01-06)

#### 1A) Category baseline
DO:
1. In managed profile view, keep the line visible that shows category (for example `Hostel in Positano`)
2. Take screenshot

SAVE:
- `01-category-baseline.png`

DONE WHEN:
- Category text is readable in the image.

#### 1B) Description baseline
DO:
1. Click `Edit profile`
2. Open `Business description` editor
3. Keep current description text visible
4. Take screenshot

SAVE:
- `02-description-baseline.png`

DONE WHEN:
- Description edit box and current text are visible.

#### 1C) Photos baseline
DO:
1. Click `Photos`
2. Keep total-photo area/list visible
3. Take screenshot

SAVE:
- `03-photos-baseline.png`

DONE WHEN:
- Existing photo count/grid is visible.

#### 1D) Q&A baseline
DO:
1. Click `Q&A`
2. Keep question list visible (including unresolved if present)
3. Take screenshot

SAVE:
- `04-qna-baseline.png`

DONE WHEN:
- Q&A list is visible and readable.

#### 1E) Posts baseline
DO:
1. Click `Posts` or `Add update`
2. Keep current posts state visible (including "no recent posts" if applicable)
3. Take screenshot

SAVE:
- `05-posts-baseline.png`

DONE WHEN:
- Posts area state is clearly visible.

#### 1F) Contact baseline
DO:
1. Return to profile overview card
2. Keep address, phone, and website visible at the same time
3. Take screenshot

SAVE:
- `06-contact-baseline.png`

DONE WHEN:
- Address + phone + website are all readable.

### Step 2: Upload 10+ photos

DO:
1. Click `Photos` -> `Add photos`
2. Browse to:
   `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23`
3. Select at least 10 files (recommended set: 01-10 from the folder README)
4. Click `Open`/`Upload`
5. Wait until upload completes (or clearly shows processing/pending moderation)
6. Take screenshot showing uploaded set/status

SAVE:
- `07-photos-upload-after.png`

DONE WHEN:
- Screenshot proves 10+ photos were submitted in this session.

### Step 3: Update business description

DO:
1. Click `Edit profile` -> `Business description`
2. Replace description with draft in this file (or final approved variant)
3. Click `Save`
4. Reopen the same description field after save
5. Take screenshot showing saved updated text

SAVE:
- `08-description-after.png`

DONE WHEN:
- Updated description text is visible after save.

### Step 4: Resolve high-intent Q&A

DO:
1. Open `Q&A`
2. Answer unresolved questions for:
   - Naples airport -> hostel route/timing
   - Check-in/check-out
   - Dorm options/suitability
3. Take screenshot showing answers posted (or queue submitted)

SAVE:
- `09-qna-after.png`

DONE WHEN:
- Screenshot shows high-intent items answered or no unresolved high-intent items remaining.

Fallback if Q&A menu is missing:
1. Open `https://www.google.com/search?q=Brikette+Hostel+Positano`
2. In knowledge panel, open `Questions & answers`
3. Answer as owner account
4. Save screenshot as `09-qna-after.png`

### Step 5: Publish one GBP post

DO:
1. Open `Posts` or `Add update`
2. Select post type `Update`
3. Paste post draft from this file
4. Set CTA `Learn more` with URL:
   `https://hostel-positano.com/en/how-to-get-here`
5. Click `Post`
6. Take screenshot of live post confirmation/listing

SAVE:
- `10-post-published.png`

DONE WHEN:
- Screenshot shows post published in GBP.

If post UI is unavailable:
1. Capture screenshot proving post control is unavailable
2. Save it as `10-post-published.png`
3. Add note in reviewer section: "Post feature unavailable in current profile UI; evidence attached."

### Step 6: Verify file pack (hard gate before closeout)

DO:
1. Confirm these 10 files exist in:
   `docs/plans/brikette-seo-traffic-growth/artifacts/task-16-gbp-audit/`
2. Optional terminal check:
   `ls -1 docs/plans/brikette-seo-traffic-growth/artifacts/task-16-gbp-audit`

SAVE:
- No new screenshot required.

DONE WHEN:
- All required filenames are present:
  - `01-category-baseline.png`
  - `02-description-baseline.png`
  - `03-photos-baseline.png`
  - `04-qna-baseline.png`
  - `05-posts-baseline.png`
  - `06-contact-baseline.png`
  - `07-photos-upload-after.png`
  - `08-description-after.png`
  - `09-qna-after.png`
  - `10-post-published.png`

### Step 7: Close TASK-16

DO:
1. Fill VC-03 score rows in this file
2. Tick reviewer sign-off checkboxes
3. Add approval timestamp + note

SAVE:
- Update this markdown artifact in repo

DONE WHEN:
- VC-03 total >=80 and reviewer boxes checked.

## Red — Baseline Capture (Before Any Edits)

Complete these fields first and attach screenshots in `docs/plans/brikette-seo-traffic-growth/artifacts/task-16-gbp-audit/`.

Operator baseline update (from dashboard screenshot, 2026-02-23):
- Total photos: `20`
- Q&A: `13` (needs confirmation whether this is total questions vs unanswered)
- Posts in last 30 days: `0`
- Contact info: `Correct`

| Baseline check | Current state (fill) | Evidence screenshot filename |
|---|---|---|
| Primary category includes `Hostel` | `Yes` (visible as "Hostel in Positano") | `01-category-baseline.png` |
| Business description currently contains `hostel positano` and `amalfi coast` | `Description edit control not available in current GBP UI (operator confirmed 2026-02-23)` | `Operator attestation (no screenshot)` |
| Total photos currently live | `20` | `03-photos-baseline.png` |
| Unanswered Q&A count | `13` (confirm unanswered vs total) | `04-qna-baseline.png` |
| Posts published in last 30 days | `0` | `05-posts-baseline.png` |
| Phone, website, and address are correct | `Yes` (operator confirmed) | `06-contact-baseline.png` |

## Green — Required Changes

### 1) Upload at least 10 new photos

Use this repo-sourced shortlist (upload 10+).  
If needed, convert `.webp`/`.avif` files to `.jpg`/`.png` before upload.

1. `apps/brikette/public/img/landing-xl.webp`
2. `apps/brikette/public/img/hostel-terrace-bamboo-canopy.webp`
3. `apps/brikette/public/img/hostel-communal-terrace-lush-view.webp`
4. `apps/brikette/public/img/rooms-split.avif`
5. `apps/brikette/public/img/6/landing.webp`
6. `apps/brikette/public/img/7/landing.webp`
7. `apps/brikette/public/img/8/landing.webp`
8. `apps/brikette/public/img/9/landing.webp`
9. `apps/brikette/public/img/10/landing.webp`
10. `apps/brikette/public/img/11/landing.webp`
11. `apps/brikette/public/img/guides/naples-airport-positano-bus/hostel-brikette-entrance.jpg`
12. `apps/brikette/public/img/directions/hostel-brikette-entrance-steps.png`

Evidence:
- `07-photos-upload-after.png`

### 2) Update business description

Draft (edit as needed, keep factual):

`Hostel Brikette is a social, budget-friendly hostel in Positano on the Amalfi Coast, close to Chiesa Nuova bus stop and routes to the beach, ferry dock, Sorrento, Amalfi, and Naples. We offer mixed and female dorm options, practical local guidance, and daily transport tips so guests can move around Positano with less stress. Ideal for travelers looking for a hostel in Positano with local know-how and easy connections across the Amalfi Coast.`

Execution outcome (2026-02-23):
- Description field was not exposed in current GBP UI for this profile/account.
- Change treated as **UI-availability exception** (non-blocking for TASK-16 closeout).
- Follow-up: re-check description edit availability after API entitlement approval or GBP UI refresh.

### 3) Review and resolve Q&A

- Answer all currently unanswered questions.
- Add or refine answers for recurring intents:
1. Naples airport to hostel route timing
2. Check-in/check-out timing
3. Dorm options and guest suitability

Evidence:
- `09-qna-after.png`

### 4) Publish one GBP post

Post draft:

Title: `Getting to Hostel Brikette in Positano`  
Body: `Staying with us soon? We updated our local transport guidance for arrivals from Naples, Sorrento, and Amalfi. Check routes before you travel and message us if you want the fastest option for your arrival time.`  
CTA: `Learn more` -> `https://hostel-positano.com/en/how-to-get-here`

Evidence:
- `10-post-published.png`

## Refactor — Monitoring Readiness

Record monthly GBP Performance metrics and neutral-profile SERP checks.

| Month | Views | Searches | Calls | Directions | Website clicks | `hostel positano` local-pack check | `hostels in positano` local-pack check | `amalfi coast hostel` local-pack check |
|---|---:|---:|---:|---:|---:|---|---|---|
| 2026-03 |  |  |  |  |  |  |  |  |
| 2026-04 |  |  |  |  |  |  |  |  |
| 2026-05 |  |  |  |  |  |  |  |  |

Evidence:
- `11-performance-baseline.png`

## VC-03 Scorecard (Pass Threshold: >=80)

| Check | Weight | Pass rule | Score |
|---|---:|---|---:|
| Baseline captured | 15 | Baseline state documented from operator report | 15 |
| 10+ photos uploaded | 25 | Operator attestation confirms 10+ uploads completed | 25 |
| Description updated or UI exception documented | 20 | Description control unavailable documented as UI-availability exception | 20 |
| Q&A reviewed/resolved | 20 | Operator confirms no unanswered high-intent questions remained | 20 |
| GBP post published | 20 | Operator attestation confirms one GBP update published | 20 |
| **Total** | **100** | **>=80 required** | **100** |

## Reviewer Sign-Off (Required to Close TASK-16)

Reviewer: **Peter Cowling**

- [x] VC-03 score >=80
- [x] Operator attestation accepted for this execution cycle (screenshot pack waived by instruction)
- [x] TASK-16 acceptance criteria met (10+ photos, Q&A review, GBP post, description UI exception documented)

Approval timestamp: `2026-02-23`  
Reviewer note: `Manual execution confirmed by operator. Description edit option unavailable in current GBP UI; logged as non-blocking exception.`
