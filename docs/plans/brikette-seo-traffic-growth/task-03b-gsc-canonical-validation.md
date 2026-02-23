# TASK-03b — GSC URL Inspection Post-Change Canonical Validation

Date: 2026-02-22
Task: `TASK-03b` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Run-Gate Check

Per plan gate, TASK-03b should run:
- no earlier than `T+7` after deployment, or
- earlier only when URL Inspection indicates fresh recrawl on sampled URLs.

Deployment reference used for this check:
- Root redirect production deploy observed at `2026-02-22T22:24:52Z`.

Recrawl gate check artifact:
- `docs/plans/brikette-seo-traffic-growth/artifacts/task-03b-recrawl-gate-check.json`

## Gate Check Result

Fresh recrawl count after deploy time: `0/8` sampled baseline URLs.

Observed crawl timestamps:
- `https://hostel-positano.com/` -> `2026-02-17T10:39:48Z`
- `https://hostel-positano.com/en` -> `2026-02-12T12:27:52Z`
- `https://hostel-positano.com/en/rooms` -> `2026-02-17T02:39:45Z`
- `https://www.hostel-positano.com/` -> `2026-02-22T11:20:53Z` (before deploy timestamp)
- Remaining sampled guide URLs: `URL is unknown to Google` (no crawl timestamp)

## Decision

**Do not execute full TASK-03b yet.**

Earliest date per T+7 rule:
- `2026-03-01`

Next run condition:
- Re-run this task on/after `2026-03-01`, or earlier only if recrawl timestamps update past deploy time for sampled URLs.
