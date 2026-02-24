---
Type: Data-Request-Prompt
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
Target-Data-Dir: docs/business-os/strategy/BRIK/data
Review-trigger: After each completed build cycle touching this document.
---

# BRIK Historical Data Request Prompt

Use this prompt to request and assemble the missing data required for the BRIK historical baseline.

```text
You are preparing the missing data pack for BRIK historical performance baseline.

Business:
- code: BRIK
- name: Brikette
- date: 2026-02-12
- required window: trailing 24 months (monthly)

Context:
- Baseline consolidation is currently blocked because required datasets are missing.
- For this run, scope is intentionally narrow.

Scope for this run (temporary):
- Focus only on net monthly value + Cloudflare monthly proxies.
- Treat bookings_by_month.csv and cancellations_refunds_by_month.csv as out-of-scope.

Task:
Provide the following files with one row per month (YYYY-MM). If a file cannot be produced, mark it unavailable and explain why.

Required files:
1) net_value_by_month.csv
   columns: month, net_booking_value, method, notes
2) cloudflare_monthly_proxies.csv
   columns: month, visits_or_requests, top_pages_summary, top_geo_summary, device_summary, notes
3) data_quality_notes.md
   include: coverage window, missing months, extraction limits, field definitions, and confidence comments

Rules:
- Do not invent values.
- Use YYYY-MM month format only.
- Keep definitions consistent across months.
- Mark estimated values explicitly.
- Write `unavailable` for missing values and state reason.

Delivery checklist:
- net_value_by_month.csv: provided/unavailable
- cloudflare_monthly_proxies.csv: provided/unavailable
- data_quality_notes.md: provided/unavailable

Save the files into:
- docs/business-os/strategy/BRIK/data/
```

## Automated extraction (recommended)

Use this command to pull monthly Cloudflare proxies directly from API:

```bash
export CLOUDFLARE_API_TOKEN="<token-with-account.analytics-read>"
pnpm brik:export-cloudflare-proxies \
  --zone-name "hostel-positano.com" \
  --hostname "hostel-positano.com" \
  --months 24
```

The command writes:
- `docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv`
- `docs/business-os/strategy/BRIK/data/data_quality_notes.md`

After data is supplied:
1. Re-run baseline consolidation prompt:
   - `docs/business-os/strategy/BRIK/2026-02-12-historical-baseline-prompt.user.md`
2. Save updated baseline:
   - `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`
3. Render HTML:
   - `pnpm docs:render-user-html -- docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`
