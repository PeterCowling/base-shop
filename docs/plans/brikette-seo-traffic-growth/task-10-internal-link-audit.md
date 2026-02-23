---
Type: Task-Artifact
Status: Draft
---

# TASK-10 — Internal Link Coverage Audit

Date: 2026-02-22
Task: `TASK-10` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Method

- Start URL: `https://hostel-positano.com/en`
- Crawl method: internal-link BFS over rendered HTML anchor tags
- Scope filter: EN URLs only (`/en*`)
- Max click depth: `3`
- Crawl result set: `94` discovered EN URLs
- Guide corpus basis (from sitemap):
  - `/en/how-to-get-here/*`
  - `/en/experiences/*`
  - `/en/help/*`

Raw artifact:
- `docs/plans/brikette-seo-traffic-growth/artifacts/task-10-link-depth.json`

## Click-Depth Map (Category Level)

| Category | URLs in category | Reachable in <=3 clicks | Unreachable in <=3 clicks | Min depth | Median depth |
|---|---:|---:|---:|---:|---:|
| Transport (`/en/how-to-get-here/*`) | 31 | 10 | 21 | 2 | 3 |
| Beaches (`/en/experiences/*` beach subset) | 18 | 18 | 0 | 2 | 3 |
| Activities (`/en/experiences/*` activity subset) | 14 | 13 | 1 | 2 | 2 |
| Dining (`/en/experiences/*` dining subset) | 5 | 4 | 1 | 2 | 2 |
| Help (`/en/help/*`) | 34 | 13 | 21 | 2 | 3 |

## Coverage Totals

- Total guide URLs in audited corpus: `119`
- Reachable in <=3 clicks: `64`
- Deeper than 3 clicks: `0`
- Orphan within crawl window (not reachable from homepage graph): `55`

Sample orphan URLs:
- `https://hostel-positano.com/en/how-to-get-here/amalfi-positano-bus`
- `https://hostel-positano.com/en/how-to-get-here/positano-sorrento-ferry`
- `https://hostel-positano.com/en/how-to-get-here/salerno-positano-bus`
- `https://hostel-positano.com/en/experiences/camping-on-the-amalfi-coast`
- `https://hostel-positano.com/en/experiences/digital-concierge-service`

## Decision Output

Decision: **Internal links are not sufficient for transport/help discovery.**

Implications:
- Evidence supports promoting homepage/internal surfacing work (`TASK-14`) as a precursor to Wave-3 content expansion.
- Transport and help clusters are currently underlinked from the homepage graph.

## Acceptance Check

- Click-depth map for 5 guide categories: **Pass**
- Orphan count quantified: **Pass**
- Recommendation for TASK-14 scope: **Pass**
