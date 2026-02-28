---
Type: Reflection-Debt
Status: Resolved
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Last-updated: 2026-02-25
Resolved-date: 2026-02-25
artifact: reflection-debt
---

# Reflection Debt

Deterministic debt ledger emitted by `/lp-do-build` when `results-review.user.md` is missing minimum payload.

- Default lane: `IMPROVE`
- SLA: 7 days
- Breach behavior: `block_new_admissions_same_owner_business_scope_until_resolved_or_override`

## Debt Items

| Debt ID | Build ID | Status | Lane | Due | Missing Minimum Sections |
|---|---|---|---|---|---|
| reflection-debt:lp-do-ideas-source-trigger-operating-model:2026-02-25 | lp-do-ideas-source-trigger-operating-model:2026-02-25 | resolved | IMPROVE | 2026-03-04T13:28:06.574Z | — |

## Machine Ledger

<!-- REFLECTION_DEBT_LEDGER_START -->
```json
{
  "schema_version": "reflection-debt.v1",
  "feature_slug": "lp-do-ideas-source-trigger-operating-model",
  "generated_at": "2026-02-25T13:28:06.574Z",
  "items": [
    {
      "debt_id": "reflection-debt:lp-do-ideas-source-trigger-operating-model:2026-02-25",
      "build_id": "lp-do-ideas-source-trigger-operating-model:2026-02-25",
      "feature_slug": "lp-do-ideas-source-trigger-operating-model",
      "lane": "IMPROVE",
      "status": "resolved",
      "created_at": "2026-02-25T13:28:06.574Z",
      "updated_at": "2026-02-25T00:00:00.000Z",
      "due_at": "2026-03-04T13:28:06.574Z",
      "resolved_at": "2026-02-25T00:00:00.000Z",
      "sla_days": 7,
      "breach_behavior": "block_new_admissions_same_owner_business_scope_until_resolved_or_override",
      "owner_scope": "agent/codex",
      "business_scope": "BOS",
      "source_paths": {
        "build_record_path": "/Users/petercowling/base-shop/docs/plans/lp-do-ideas-source-trigger-operating-model/build-record.user.md",
        "results_review_path": "/Users/petercowling/base-shop/docs/plans/lp-do-ideas-source-trigger-operating-model/results-review.user.md"
      },
      "minimum_reflection": {
        "results_review_exists": false,
        "missing_sections": [
          "Observed Outcomes",
          "Standing Updates",
          "New Idea Candidates",
          "Standing Expansion"
        ]
      }
    }
  ]
}
```
<!-- REFLECTION_DEBT_LEDGER_END -->
