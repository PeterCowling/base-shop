---
Type: Task-Artifact
Status: Draft
---

# TASK-03a — GSC URL Inspection Pre-Change Canonical Baseline

Date: 2026-02-22
Task: `TASK-03a` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`
Property: `sc-domain:hostel-positano.com`
API: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

## Baseline Timing

Inspection run window: `2026-02-22T21:08:36Z` -> `2026-02-22T21:09:28Z`.

At inspection time, plan status still showed `TASK-01a` and `TASK-01b` as `Pending`, so this capture is treated as the required **pre-change baseline**.

## URL Sample

Required sample set (8 URLs):
- `https://hostel-positano.com/`
- `https://hostel-positano.com/en`
- `https://hostel-positano.com/en/rooms`
- `https://hostel-positano.com/en/experiences`
- `https://hostel-positano.com/en/experiences/positano-beaches`
- `https://hostel-positano.com/en/help/how-to-get-to-positano`
- `https://hostel-positano.com/en/how-to-get-here/naples-to-positano`
- `https://www.hostel-positano.com/`

## Results Table

| URL | Verdict | Coverage state | User canonical | Google-selected canonical | Declared != selected | Last crawl |
|---|---|---|---|---|---|---|
| `https://hostel-positano.com/` | `NEUTRAL` | `Page with redirect` | `https://hostel-positano.com/en/` | `https://hostel-positano.com/en/` | No | `2026-02-17T10:39:48Z` |
| `https://hostel-positano.com/en` | `PASS` | `Submitted and indexed` | `https://hostel-positano.com/en/` | `https://hostel-positano.com/en` | **Yes** | `2026-02-12T12:27:52Z` |
| `https://hostel-positano.com/en/rooms` | `PASS` | `Submitted and indexed` | `https://hostel-positano.com/en/rooms/` | `https://hostel-positano.com/en/rooms` | **Yes** | `2026-02-17T02:39:45Z` |
| `https://hostel-positano.com/en/experiences` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/experiences/positano-beaches` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/help/how-to-get-to-positano` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/how-to-get-here/naples-to-positano` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://www.hostel-positano.com/` | `NEUTRAL` | `Page with redirect` | `https://hostel-positano.com/en/` | `https://hostel-positano.com/en/` | No | `2026-02-22T11:20:53Z` |

## Canonical Mismatch Metrics

- URLs inspected: `8`
- URLs with both user + Google canonical present: `4`
- Canonical mismatches (`userCanonical != googleCanonical`): `2`
- Mismatch rate (on rows with both canonicals): `2/4 = 50%`

## Indexing-State Observations

- `PASS` + `Submitted and indexed`: `2` URLs (`/en`, `/en/rooms`)
- Redirect-state URLs: `2` URLs (`/`, `www/`)
- `URL is unknown to Google`: `4` URLs (category + guide sample URLs)
- Explicit `CRAWLED_CURRENTLY_NOT_INDEXED`: not returned in this sample.

Supplementary check on trailing-slash variants (same run, non-required rows):
- `/en/experiences/positano-beaches/` and `/en/how-to-get-here/naples-to-positano/` returned `Discovered - currently not indexed`, still without canonical pair exposed.

## Required Questions Answered

1. For homepage `/en`, does Google-selected canonical match declared canonical?
- **No.** Declared: `/en/`; Google-selected: `/en`.

2. What % of sampled URLs show declared != selected canonical?
- **50%** among rows where both values are available (`2/4`).

3. Any `NOT_INDEXED` / `CRAWLED_CURRENTLY_NOT_INDEXED` style signals?
- Yes, non-indexed states appear as `URL is unknown to Google` and `Discovered - currently not indexed` (supplementary run).

4. Does www appear as a separate canonical?
- In this sample, **no**. For `https://www.hostel-positano.com/`, Google-selected canonical resolved to apex `/en/` (same as user canonical on that URL inspection record).

## Decision Output

**TASK-02 confirmed high priority.**

Reason:
- Canonical mismatch is explicit on indexed core templates (`/en`, `/en/rooms`) and directly matches the slash-normalization problem already identified in fact-find.
- The sample also shows multiple guide/category URLs not yet surfaced with canonical pairs (unknown/discovered states), reinforcing that metadata normalization and indexing diagnostics should proceed before content-CTR work.

## Notes

- This artifact is baseline-only and should be compared against `TASK-03b` after TASK-01a/TASK-01b/TASK-02 rollout and recrawl propagation.
