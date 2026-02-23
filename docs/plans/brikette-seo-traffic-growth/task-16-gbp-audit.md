---
Type: Task-Artifact
---

# TASK-16 — Google Business Profile Audit and Refresh

Date: 2026-02-23  
Task: `TASK-16` (`IMPLEMENT`)  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Execution Status

Status: **Blocked (awaiting operator GBP dashboard execution + screenshots)**

This artifact is execution-ready, but completion requires authenticated owner actions inside Google Business Profile that cannot be performed from repo-only context.

## Prepared Assets (Ready Now)

Upload-ready photo pack (prepared on 2026-02-23):

- Folder: `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23`
- Includes 12 files (`.jpg`/`.png`) already suitable for GBP upload
- File index: `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23/README.txt`

Suggested upload set (minimum 10): `01` through `10` from that folder.

## Fast Execution Sequence (Operator)

1. Open GBP manager for Hostel Brikette and capture baseline screenshots (`01` to `06` evidence files).
2. Upload at least 10 photos from `/Users/petercowling/Downloads/task-16-gbp-photo-pack-2026-02-23`.
3. Update business description using the draft below; capture `08-description-after.png`.
4. Review Q&A and answer unresolved high-intent items; capture `09-qna-after.png`.
5. Publish one GBP post using the draft below; capture `10-post-published.png`.
6. Save all screenshots in `docs/plans/brikette-seo-traffic-growth/artifacts/task-16-gbp-audit/`.
7. Fill the VC-03 scorecard and complete reviewer sign-off at the bottom of this file.

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
| Business description currently contains `hostel positano` and `amalfi coast` | `Pending verification in Edit profile -> Business description` | `02-description-baseline.png` |
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

Evidence:
- `08-description-after.png`

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

| Check | Weight | Pass rule | Score (fill) |
|---|---:|---|---:|
| Baseline captured with screenshots | 15 | All six baseline checks documented |  |
| 10+ photos uploaded | 25 | `07-photos-upload-after.png` proves 10+ new photos live |  |
| Description updated | 20 | `08-description-after.png` shows updated text |  |
| Q&A reviewed/resolved | 20 | `09-qna-after.png` shows no unresolved high-intent gaps |  |
| GBP post published | 20 | `10-post-published.png` confirms live post |  |
| **Total** | **100** | **>=80 required** |  |

## Reviewer Sign-Off (Required to Close TASK-16)

Reviewer: **Peter Cowling**

- [ ] VC-03 score >=80
- [ ] Evidence screenshots attached in `artifacts/task-16-gbp-audit/`
- [ ] TASK-16 acceptance criteria met (10 photos, description, Q&A, post)

Approval timestamp: `____________________`  
Reviewer note: `____________________`
