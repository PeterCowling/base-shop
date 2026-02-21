---
Type: Prompt-Template
Status: Active
Domain: Venture-Studio
Stage: S2A-Data-Request
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
---

# Prompt — S2A Historical Data Request

Replace all `{{...}}` placeholders before use.

```text
You are preparing the minimum data pack required to build a historical performance baseline for an existing ecommerce business.

Business:
- code: {{BUSINESS_CODE}}
- name: {{BUSINESS_NAME}}
- date: {{DATE}}
- required window: trailing {{MONTH_WINDOW}} months, monthly granularity

Current blocker summary:
{{BLOCKER_SUMMARY}}

Scope for this run (temporary):
- Focus only on net monthly value + Cloudflare monthly proxies.
- Treat bookings count and cancellations/refunds as out-of-scope for now.

Task:
Return a complete data pack for baseline consolidation. If any file cannot be produced, return an explicit reason.

Required files:
1) net_value_by_month.csv
   columns: month, net_booking_value, method, notes
2) cloudflare_monthly_proxies.csv
   columns: month, visits_or_requests, top_pages_summary, top_geo_summary, device_summary, notes
3) data_quality_notes.md
   include: coverage window, missing months, extraction limits, and field definitions

Rules:
- Do not invent values.
- Use YYYY-MM for month.
- Keep one row per month.
- Mark estimated values explicitly in notes.
- For unavailable values, write `unavailable` and explain why.

Output contract:
- Provide a delivery checklist showing each required file as: provided / unavailable.
- Include exact source system used for each file.
```
