# Brikette SEO Monitoring Log

**Property:** `sc-domain:hostel-positano.com`
**Cadence:** Every other day (odd days preferred to distribute load)
**Script:** `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts`
**Started:** 2026-02-25 (T+0 baseline)

---

## Seed List Definition

The monitoring seed rotates through guide-type pages across three URL classes:

| Class | Count | Description |
|---|---|---|
| `en_guides` | 10/run | EN experience guides (`/en/experiences/`) |
| `it_transport` | 10/run | IT transport guides (`/it/come-arrivare/`) |
| `en_transport` | 10/run | EN transport guides (`/en/how-to-get-here/`) |
| **Total** | **30/run** | Well within 2,000/day GSC quota |

Full seed list: `docs/plans/brikette-seo-traffic-growth/artifacts/task-11-url-inspection-sample.json`

---

## Transition Triggers

| Condition | Action |
|---|---|
| ≥3 URLs transition from "URL is unknown to Google" to any other state in a single run | Promote TASK-13 (content quality pass) to eligible — post in plan notes |
| ≥1 URL reaches "Submitted and indexed" state | Log transition date; accelerate monitoring frequency to daily for 1 week |
| 0 transitions in 6 consecutive weeks (≥12 runs) | Invoke `/lp-do-replan` for aggressive internal linking pass |

---

## Single-Command Monitoring Invocation

Run from repo root:

```bash
tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts \
  docs/plans/brikette-seo-traffic-growth/artifacts/task-11-url-inspection-sample.json \
  --output docs/plans/brikette-seo-api-optimization-loop/monitoring/run-$(date +%Y-%m-%d).json
```

Analytics baseline (run alongside inspection):

```bash
tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts \
  --start $(date -v-7d +%Y-%m-%d) --end $(date +%Y-%m-%d) \
  --output docs/plans/brikette-seo-api-optimization-loop/monitoring/analytics-$(date +%Y-%m-%d).json
```

---

## After Each Deploy

Run Sitemaps re-ping (TASK-06 complete, use after every content deploy):

```bash
tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts
```

Returns: `OK (HTTP 204): Sitemap re-pinged successfully.`

---

## Run Log

### Run 01 — T+0 Baseline — 2026-02-25

**URL Inspection Results:** `monitoring/run-2026-02-25.json`
**Search Analytics Results:** `monitoring/analytics-2026-02-25.json`

> **Note:** This baseline was captured before structured-data fields were added to the inspection script. `richResultsResult` was not recorded in this run. From Run 02 onwards, each URL entry in the run JSON includes: `richResultsVerdict` (raw GSC verdict string, e.g. `"PASS"` / `"FAIL"` / `null`), `richResultsDetectedTypes` (array of detected schema.org type names, empty if none), and `articleStructuredDataValid` (`true` for PASS, `false` for FAIL, `null` when Google returned no structured-data verdict).

**Coverage state summary (T+0):**

| State | Count | Buckets |
|---|---|---|
| URL is unknown to Google | 29 | en_guides(10), it_transport(10), en_transport(9) |
| Submitted and indexed | **1** | en_transport(1) |

**First indexed URL:** `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-bus`
- Last crawl: 2026-02-25T08:22:06Z (same day as this baseline run)
- googleCanonical: `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-bus`
- Verdict: PASS, indexingState: INDEXING_ALLOWED, robotsTxtState: ALLOWED

**Search Analytics (2026-02-18 — 2026-02-25):** 122 rows. Guide pages (`/en/experiences/`, `/en/how-to-get-here/`, `/it/come-arrivare/`) show 0 impressions as expected at T+0. Homepage and rooms pages have impressions.

**Observation:** The first Phase A indexation signal has arrived — `amalfi-positano-bus` was crawled and indexed on the same day as this baseline run. This is 1/30 = 3.3% of the seed sample transitioning. The unlock threshold is ≥3 URLs. Current status: 1 transition, 2 more needed.

**Transition count this run:** 1 (first transition ever)
**Cumulative transitions:** 1 / 30 seed URLs = 3.3%

---

## Unlock Conditions

- **TASK-13 eligible:** When ≥3 URLs show "Submitted and indexed" in a single run
- **Current status (2026-02-25):** 1/3 transitions achieved
- **Stagnation gate:** If 0 NEW transitions in 6 consecutive weeks → `/lp-do-replan`

---

## Run Summary Fields (from Run 02 onwards)

Each URL entry in run JSON files includes the following structured-data fields captured from the URL Inspection API response (no additional API calls — these come from the same response as the indexing data):

| Field | Type | Notes |
|---|---|---|
| `richResultsVerdict` | `string \| null` | Raw GSC verdict: `"PASS"`, `"FAIL"`, or `null` (Google returned no verdict) |
| `richResultsDetectedTypes` | `string[]` | Schema.org type names detected (e.g. `["Article"]`); empty array if none |
| `articleStructuredDataValid` | `boolean \| null` | `true` = PASS, `false` = FAIL, `null` = no verdict returned |

Run 01 (2026-02-25) does not contain these fields — that baseline was captured before structured-data capture was implemented.

---

## Notes

- GSC URL Inspection API quota: 2,000/day. 30-URL runs consume 1.5% of quota.
- Search Analytics data has ~3 day lag. Use `--start` date accordingly.
- Script requires ESM mode: always use `tsx --tsconfig scripts/tsconfig.json`.
- `sitemap: []` for all 29 unknown URLs confirms static sitemap submission is not driving discovery (consistent with TASK-03b findings).
