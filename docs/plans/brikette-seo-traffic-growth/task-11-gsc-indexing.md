# TASK-11 — GSC Page Indexing and Guide Coverage Sample

Date: 2026-02-22
Task: `TASK-11` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`
Property: `sc-domain:hostel-positano.com`
API: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

## Sample Design

Required 30-URL sample was executed as specified:
- 10 EN guides (`/en/experiences/*`)
- 10 IT transport guides (`/it/come-arrivare/*`)
- 10 EN transport guides (`/en/how-to-get-here/*`)

Source pool counts from sitemap at run time:
- EN guides pool: `54`
- IT transport pool: `31`
- EN transport pool: `31`

Raw artifact:
- `docs/plans/brikette-seo-traffic-growth/artifacts/task-11-url-inspection-sample.json`

## Indexation Breakdown

| Bucket | Indexed | Crawled/Discovered currently not indexed | Duplicate | URL unknown to Google | Sample size |
|---|---:|---:|---:|---:|---:|
| EN guides | 0 | 0 | 0 | 10 | 10 |
| IT transport guides | 0 | 0 | 0 | 10 | 10 |
| EN transport guides | 0 | 0 | 0 | 10 | 10 |
| **Total** | **0** | **0** | **0** | **30** | **30** |

Additional observations:
- Canonical pairs exposed (`userCanonical` + `googleCanonical`): `0/30`
- Canonical mismatch rate on paired rows: `n/a` (no paired rows)
- `lastCrawlTime` was absent on all sampled guide URLs.

## URL Sample (Executed)

### EN guides (10)
- `https://hostel-positano.com/en/experiences/arienzo-beach-guide`
- `https://hostel-positano.com/en/experiences/boat-tours-positano`
- `https://hostel-positano.com/en/experiences/bus-back-from-arienzo-beach`
- `https://hostel-positano.com/en/experiences/bus-back-from-laurito-beach`
- `https://hostel-positano.com/en/experiences/bus-back-to-hostel-brikette-from-positano-main-beach`
- `https://hostel-positano.com/en/experiences/bus-down-to-positano-main-beach`
- `https://hostel-positano.com/en/experiences/bus-to-arienzo-beach`
- `https://hostel-positano.com/en/experiences/camping-on-the-amalfi-coast`
- `https://hostel-positano.com/en/experiences/capri-on-a-budget`
- `https://hostel-positano.com/en/experiences/cheap-eats-in-positano`

### IT transport guides (10)
- `https://hostel-positano.com/it/come-arrivare/amalfi-positano-bus`
- `https://hostel-positano.com/it/come-arrivare/amalfi-positano-ferry`
- `https://hostel-positano.com/it/come-arrivare/capri-positano-ferry`
- `https://hostel-positano.com/it/come-arrivare/chiesa-nuova-bar-internazionale-to-hostel-brikette`
- `https://hostel-positano.com/it/come-arrivare/da-napoli-a-positano-come-arrivare`
- `https://hostel-positano.com/it/come-arrivare/da-salerno-a-positano-come-arrivare`
- `https://hostel-positano.com/it/come-arrivare/ferry-dock-to-hostel-brikette-with-luggage`
- `https://hostel-positano.com/it/come-arrivare/fornillo-beach-to-hostel-brikette`
- `https://hostel-positano.com/it/come-arrivare/hostel-brikette-to-chiesa-nuova-bar-internazionale`
- `https://hostel-positano.com/it/come-arrivare/hostel-brikette-to-ferry-dock-with-luggage`

### EN transport guides (10)
- `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-bus`
- `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-ferry`
- `https://hostel-positano.com/en/how-to-get-here/capri-positano-ferry`
- `https://hostel-positano.com/en/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette`
- `https://hostel-positano.com/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage`
- `https://hostel-positano.com/en/how-to-get-here/fornillo-beach-to-hostel-brikette`
- `https://hostel-positano.com/en/how-to-get-here/hostel-brikette-to-chiesa-nuova-bar-internazionale`
- `https://hostel-positano.com/en/how-to-get-here/hostel-brikette-to-ferry-dock-with-luggage`
- `https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus`
- `https://hostel-positano.com/en/how-to-get-here/naples-center-positano-ferry`

## Wave-3 Gate Decision

Decision: **Wave 3 blocked**.

Rationale:
- The sample is not showing a rank-quality problem (`indexed but weak`); it is showing a discovery/indexation failure state (`URL is unknown to Google`) across all sampled guide classes.
- Executing content-quality expansion (`TASK-13`) before resolving indexation/discovery will likely produce low signal return.

Operational interpretation for CHECKPOINT-01:
- `TASK-13` remains deferred pending indexing recovery evidence.
- `TASK-14` (internal-link surfacing) is a higher-priority precursor because discovery is currently weak.
- `TASK-03b` should not run early: recrawl freshness gate still unmet (see `task-03b-gsc-canonical-validation.md`).

## Acceptance Check

- 30 URLs inspected: **Pass**
- Status breakdown produced: **Pass**
- Wave-3 go/no-go recommendation produced: **Pass**
