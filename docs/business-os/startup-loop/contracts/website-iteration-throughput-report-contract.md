---
Type: Contract
Status: Active
Domain: Startup-Loop
Last-reviewed: 2026-02-24
---

# Website Iteration Throughput Report Contract

## Purpose

Defines the minimum telemetry artifact for WEBSITE iteration throughput.

## Metrics (Required)

- `artifact-change -> site-change lead time` (hours, average over complete cycles)
- `manual touches` (total and average per cycle)
- `rework count` (total)

## Data Gap Policy

When any cycle is missing required fields, the report must emit explicit gap entries.
Do not silently coerce missing values to zero.

## Input Schema

`docs/business-os/strategy/<BIZ>/website-iteration-cycles.json`

```json
{
  "cycles": [
    {
      "cycleId": "string",
      "artifactChangedAt": "ISO-8601 timestamp",
      "siteChangeMergedAt": "ISO-8601 timestamp",
      "manualTouches": 0,
      "reworkCount": 0
    }
  ]
}
```

## Output Path

`docs/business-os/strategy/<BIZ>/website-iteration-throughput-report.user.md`
