---
Type: Task-Artifact
Status: Complete
---

# TASK-03b — GSC URL Inspection Post-Change Canonical Validation

Date: 2026-02-25
Task: `TASK-03b` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Run-Gate Check

Per plan gate, TASK-03b should run no earlier than `T+7` after deployment, or earlier only when URL Inspection indicates fresh recrawl on sampled URLs.

Deployment reference: `2026-02-22T22:24:52Z`.

**Gate override:** Fresh recrawl confirmed on 4/8 sampled URLs (crawl timestamps post-deploy). Task run early on 2026-02-25 (T+3) per operator instruction.

## Inspection Run

- **Run date:** 2026-02-25
- **API:** `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`
- **Property:** `sc-domain:hostel-positano.com`
- **Artifact:** `docs/plans/brikette-seo-traffic-growth/artifacts/task-03b-recrawl-gate-check.json`

## Results Table

| URL | Verdict | Coverage state | User canonical | Google-selected canonical | Match? | Last crawl |
|---|---|---|---|---|---|---|
| `https://hostel-positano.com/` | `NEUTRAL` | `Page with redirect` | `/en` | `/en` | **Yes** | `2026-02-24T16:27:07Z` |
| `https://hostel-positano.com/en` | `PASS` | `Submitted and indexed` | `/en` | `/en` | **Yes** | `2026-02-24T16:27:07Z` |
| `https://hostel-positano.com/en/rooms` | `PASS` | `Submitted and indexed` | `/en/rooms` | `/en/rooms` | **Yes** | `2026-02-24T10:16:50Z` |
| `https://hostel-positano.com/en/experiences` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/experiences/positano-beaches` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/help/how-to-get-to-positano` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://hostel-positano.com/en/how-to-get-here/naples-to-positano` | `NEUTRAL` | `URL is unknown to Google` | - | - | n/a | - |
| `https://www.hostel-positano.com/` | `NEUTRAL` | `Page with redirect` | `/en` | `/en` | **Yes** | `2026-02-24T16:27:07Z` |

## Canonical Mismatch Comparison

| Metric | Baseline (TASK-03a, 2026-02-22) | Post-fix (TASK-03b, 2026-02-25) |
|---|---|---|
| URLs inspected | 8 | 8 |
| Fresh recrawl (post-deploy) | 0 | 4 |
| Rows with both canonicals | 4 | 4 |
| Canonical mismatches | **2 (50%)** | **0 (0%)** |

## Key Findings

### 1. Canonical mismatch fully resolved — PASS

Both previously-mismatched URLs (`/en` and `/en/rooms`) now show `userCanonical == googleCanonical` with slashless values. TASK-02 canonical alignment took effect and Google accepted it within 2 days of deploy.

Baseline mismatches:
- `/en`: declared `/en/` (slash), Google selected `/en` (slashless) → **now both `/en`**
- `/en/rooms`: declared `/en/rooms/` (slash), Google selected `/en/rooms` (slashless) → **now both `/en/rooms`**

### 2. Fresh recrawl confirms Googlebot activity post-deploy

4 URLs were recrawled on 2026-02-24, just 2 days after the canonical/redirect fixes shipped. Recrawl velocity is healthy — no delay concern.

### 3. Redirect targets are slashless — consistent with policy

Both `hostel-positano.com/` and `www.hostel-positano.com/` report `userCanonical: /en` (slashless), confirming the redirect chain now terminates at the slashless apex locale.

### 4. Guide and category pages remain unknown — confirms TASK-13 remains relevant

4 URLs (`/en/experiences`, `/en/experiences/positano-beaches`, `/en/help/how-to-get-to-positano`, `/en/how-to-get-here/naples-to-positano`) still show `URL is unknown to Google`. This is unchanged from baseline. Internal surfacing work (TASK-14: homepage featured guides) may take several weeks to produce crawl signals. TASK-13 content quality pass remains gated on evidence of indexation.

### 5. Sitemap field empty for all URLs

The URL inspection response returns `sitemap: []` for all 8 URLs, including indexed ones. This is consistent with static export (no dynamic sitemap submission) — Google may be discovering these via crawl, not sitemap pings. Worth watching in GSC Coverage report.

## Decision Output

**TASK-03b: Complete.**

- Canonical fix confirmed working. Primary blocking technical issue resolved.
- Phase B (TASK-13 content quality, TASK-17 backlinks) dependencies remain correctly gated on indexation signal for guide URLs.
- No new actions required from this check. Monitor GSC Coverage report over the coming weeks for guide page indexation progress.
