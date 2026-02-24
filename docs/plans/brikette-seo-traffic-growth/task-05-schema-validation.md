---
Type: Task-Artifact
Status: Draft
---

# TASK-05 — Structured Data Validation Sample

Date: 2026-02-22
Task: `TASK-05` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope

Sampled 7 URLs per plan contract:
- Homepage: `https://hostel-positano.com/en`
- Rooms: `https://hostel-positano.com/en/rooms`
- Transport guide 1: `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-bus`
- Transport guide 2: `https://hostel-positano.com/en/how-to-get-here/naples-center-positano-ferry`
- Beach guide: `https://hostel-positano.com/en/experiences/arienzo-beach-guide`
- Activity guide: `https://hostel-positano.com/en/experiences/capri-on-a-budget`
- Assistance article: `https://hostel-positano.com/en/help/how-to-get-to-positano`

Raw artifact:
- `docs/plans/brikette-seo-traffic-growth/artifacts/task-05-schema-scan.json`

## Validation Method

- Parsed live `application/ld+json` blocks from each URL.
- Checked JSON parse validity.
- Applied template-level required-field checks for sampled schema types (`Article`, `BreadcrumbList`, `FAQPage`, `HowTo`, `Hotel`/`Hostel`, `HotelRoom`, `Offer`).

Note:
- This is an automated schema-hygiene scan.
- Manual Rich Results Test / validator.schema.org UI checks were not completed in this run.

## Results Table

| URL label | HTTP | JSON-LD scripts | Nodes | Critical | Warnings | Types detected |
|---|---:|---:|---:|---:|---:|---|
| homepage | 200 | 3 | 3 | 0 | 0 | `Organization`, `WebSite` |
| rooms | 200 | 1 | 24 | 0 | 0 | `HotelRoom`, `Offer`, `OfferCatalog` |
| transport_1 | 200 | 3 | 3 | 1 | 0 | `Article`, `BreadcrumbList` |
| transport_2 | 200 | 3 | 3 | 1 | 0 | `Article`, `BreadcrumbList` |
| beach | 200 | 3 | 3 | 1 | 0 | `Article`, `BreadcrumbList` |
| activity | 200 | 3 | 3 | 1 | 0 | `Article`, `BreadcrumbList` |
| assistance | 200 | 3 | 3 | 1 | 0 | `Article`, `BreadcrumbList` |

Aggregate:
- Critical findings: `5`
- Warning findings: `0`
- URLs with critical findings: `5/7`

Critical finding pattern:
- All 5 affected guide/article URLs are missing `Article.datePublished`.

## Decision Output

Decision: **Schema fixes are in scope (hygiene-level), but not a primary Wave-3 growth lever.**

Recommended follow-on:
- Add/derive `datePublished` for guide/article schema payloads where absent.
- Re-run this scan plus manual Rich Results Test spot-check on updated pages.

## Acceptance Check

- 7 URLs validated: **Pass**
- Error/warning counts by URL and schema type: **Pass**
- Decision output produced: **Pass**
