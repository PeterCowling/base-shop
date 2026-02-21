---
Type: Data-Consolidation-Prompt
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
Target-Output: docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md
---

# BRIK Historical Baseline Prompt

Use the prompt below directly (agent or Deep Research) to consolidate historical BRIK performance data.

```text
You are a performance baseline analyst for an existing ecommerce business.

Task:
Build a historical performance baseline pack for:
- Business code: BRIK
- Business name: Brikette
- Region: Europe (primary Italy)
- Date: 2026-02-12

Context:
- BRIK is an existing website-live business.
- GA4 coverage is missing/insufficient.
- For this run, scope is narrowed to net-value + Cloudflare proxies only.

Input sources to request/ingest:
- Net booking value exports by month/year
- Cloudflare analytics by month/year (traffic proxies, top pages, geos/devices if available)
- Reception/ops logs related to booking fulfillment issues (if available)

Requirements:
1) Consolidate trailing 24 months (or max available) by month.
2) Provide these metrics where available:
   - net booking value
   - Cloudflare traffic proxies (visits/requests/top pages/geo/device)
3) Clearly mark unavailable metrics.
4) Provide data-quality notes and confidence by metric family.
5) Provide 90-day decision implications for BRIK execution priorities.

Output format (strict):
A) Data coverage summary
B) Historical monthly baseline table
C) KPI trend highlights
D) Data quality + blind spots register
E) Decision implications (next 90 days)
F) Missing-data acquisition checklist

Rules:
- Do not invent values.
- Mark every metric as observed, estimated, or unavailable.
- Keep month definitions consistent.
- For this run, treat bookings/cancellations level metrics as out-of-scope.
```

After output is produced:
1. Save to `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md` (or newer dated equivalent).
2. Render HTML:
   `pnpm docs:render-user-html -- docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`

If output status is `Blocked` because core datasets are missing:
1. Hand the user this data-request prompt immediately:
   `docs/business-os/strategy/BRIK/2026-02-12-historical-data-request-prompt.user.md`
2. Pause S2/S6 progression for BRIK until data is supplied.
3. Re-run this baseline prompt after data files are provided.
