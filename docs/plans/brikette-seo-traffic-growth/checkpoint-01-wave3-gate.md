---
Type: Checkpoint
Status: Draft
---

# CHECKPOINT-01 — Wave 3 Gate Decision

Date: 2026-02-22
Checkpoint: `CHECKPOINT-01`
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Inputs Reviewed

- `TASK-11` indexation sample:
  - `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md`
- `TASK-10` internal link audit:
  - `docs/plans/brikette-seo-traffic-growth/task-10-internal-link-audit.md`
- `TASK-05` schema validation sample:
  - `docs/plans/brikette-seo-traffic-growth/task-05-schema-validation.md`
- `TASK-04` hreflang sampling pre/post:
  - `docs/plans/brikette-seo-traffic-growth/task-04-hreflang-sample.md`
- `TASK-03b` run-gate check:
  - `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md`

## Key Evidence

1. `TASK-11` is a hard gate failure for guides:
- `30/30` sampled guide URLs returned `URL is unknown to Google`.
- No canonical pair signals surfaced in sample rows.

2. `TASK-10` confirms discovery path weakness:
- Guide corpus audited: `119` EN guide URLs.
- Reachable within 3 clicks from `/en`: `64`.
- Not reachable in 3 clicks: `55` (orphans in crawl graph).
- Transport/help clusters are materially underlinked.

3. `TASK-05` found schema-hygiene gaps:
- `5` critical findings in sampled guide/article pages (`Article.datePublished` missing).
- Not primary growth lever, but should be corrected.

4. `TASK-04` hreflang/canonical post-rollout is healthy:
- Reciprocity and self-reference pass on all 5 tested locale pairs.
- Slashless normalization landed correctly post rollout.

5. `TASK-03b` recrawl timing gate not met:
- No sampled baseline URL shows post-deploy crawl timestamp yet.
- Earliest compliant run date remains `2026-03-01`.

## Checkpoint Decision

Wave-3 content activation is **partially gated**:
- Do **not** start `TASK-13` yet.
- Prioritize discoverability/internal surfacing work (`TASK-14`) before content expansion.
- Keep `TASK-03b` pending until recrawl gate date/condition is met.

## Replan Output (Confidence Recalibration)

| Task | Previous | Updated | Decision |
|---|---:|---:|---|
| `TASK-12` scoped sitemap `lastmod` | 85% | 80% | Keep pending; low-risk technical signal, but impact uncertain until indexing improves |
| `TASK-13` content quality pass | 60% | 45% | Keep deferred; blocked by current `URL is unknown to Google` state |
| `TASK-14` homepage featured guides section | 65% | 82% | Promote from deferred to active pending; evidence now strongly supports it |
| `TASK-15` Italian meta/title pass | 75% | 65% | Keep pending; deprioritized while discovery/indexation is the dominant constraint |
| `TASK-17` backlink outreach targeting | 60% | 55% | Keep deferred and blocked by `TASK-18` baseline export |

## Next Actions

1. Execute `TASK-14` as the next implementation priority.
2. Complete `TASK-18` once Search Console UI login/export is available.
3. Run full `TASK-03b` on/after `2026-03-01` (or earlier only with fresh recrawl evidence).
