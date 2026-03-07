---
Type: Runbook
Status: Active
Business: HBAG
Last-updated: 2026-03-04
---

# HBAG PDP Funnel Feed Runbook

## Purpose
Generate a standing weekly KPI snapshot for HBAG PDP progression:
- `view_item` (aliased from `product_view`)
- `begin_checkout` (aliased from `checkout_started`)

## Command

```bash
pnpm --filter scripts startup-loop:hbag-pdp-funnel-feed
```

Optional flags:

```bash
pnpm --filter scripts startup-loop:hbag-pdp-funnel-feed -- --as-of 2026-03-04 --days 7
```

## Outputs
- `docs/business-os/startup-baselines/HBAG/pdp-funnel-feed.json`
- `docs/business-os/startup-baselines/HBAG/pdp-funnel-feed.user.md`

## Results-review usage
When `results-review.user.md` evaluates trust-cues or PDP funnel outcomes, cite:
- the latest `view_item_count`
- the latest `begin_checkout_count`
- `begin_checkout_rate`

If counts are low, include that context in the verdict notes.
