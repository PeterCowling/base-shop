---
Type: Measurement-Plan
Stage: ASSESSMENT-07
Business: HBAG
Status: Draft
Created: 2026-02-21
Updated: 2026-03-09
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# Measurement Plan — Caryina (HBAG)

## A) Tracking Setup

| Field | Value |
|---|---|
| Primary tracking tool/method | GA4 (website) + Etsy dashboard + `docs/plans/mini-handbag-pmf/demand-log.md` + `docs/business-os/strategy/HBAG/channel-health-log.user.md` |
| Instagram/TikTok | Native analytics + manual DM enquiry count in `demand-log.md` |
| Setup feasibility | Conditional — GA4 setup required at website build time; Etsy dashboard available once shop created; manual logs are available immediately and now active |

## B) Key Metrics

| Metric | Capture method | Frequency |
|---|---|---|
| Paid orders (units sold) | Website (GA4 ecommerce) + Etsy dashboard + manual log | Weekly |
| Net revenue (€) | Website + Etsy dashboard + manual log | Weekly |
| Website sessions | GA4 / Plausible (confirm at build time) | Weekly |
| Etsy listing views | Etsy dashboard | Weekly |
| In-destination units sold | `channel-health-log.user.md` by store / placement | Weekly |
| Net contribution after partner commission | `channel-health-log.user.md` + margin stack | Weekly |

## C) Success Thresholds

| Horizon | "Working" threshold | Reassessment trigger |
|---|---|---|
| 30 days | ≥5 paid orders via website, Etsy, or in-destination channels | — |
| 60 days | — | <2 orders/month across owned + in-destination channels → pause and replan |

## D) Data Collection Feasibility

| Check | Status | Notes |
|---|---|---|
| GDPR/privacy compliance | ⚠️ Requires action at build time | Website needs cookie consent and privacy policy before launch; Etsy and social platforms handle their own data; manual channel logs are internal only |
| Tooling availability | ⚠️ Requires setup | GA4 to be configured at website build time; Etsy dashboard live once shop created; `demand-log.md` and `channel-health-log.user.md` are immediate |
