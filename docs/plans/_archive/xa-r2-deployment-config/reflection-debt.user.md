---
Type: Reflection-Debt
Status: Clear
Feature-Slug: xa-r2-deployment-config
Last-updated: 2026-03-03
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
| reflection-debt:xa-r2-deployment-config:2026-03-03 | xa-r2-deployment-config:2026-03-03 | resolved | IMPROVE | 2026-03-10T18:56:50.412Z | - |

## Machine Ledger

<!-- REFLECTION_DEBT_LEDGER_START -->
```json
{
  "schema_version": "reflection-debt.v1",
  "feature_slug": "xa-r2-deployment-config",
  "generated_at": "2026-03-03T19:00:32.440Z",
  "items": [
    {
      "debt_id": "reflection-debt:xa-r2-deployment-config:2026-03-03",
      "build_id": "xa-r2-deployment-config:2026-03-03",
      "feature_slug": "xa-r2-deployment-config",
      "lane": "IMPROVE",
      "status": "resolved",
      "created_at": "2026-03-03T18:56:50.412Z",
      "updated_at": "2026-03-03T19:00:32.440Z",
      "due_at": "2026-03-10T18:56:50.412Z",
      "resolved_at": "2026-03-03T19:00:32.440Z",
      "sla_days": 7,
      "breach_behavior": "block_new_admissions_same_owner_business_scope_until_resolved_or_override",
      "owner_scope": null,
      "business_scope": null,
      "source_paths": {
        "build_record_path": "/Users/petercowling/base-shop/docs/plans/xa-r2-deployment-config/build-record.user.md",
        "results_review_path": "/Users/petercowling/base-shop/docs/plans/xa-r2-deployment-config/results-review.user.md"
      },
      "minimum_reflection": {
        "results_review_exists": true,
        "missing_sections": []
      }
    }
  ]
}
```
<!-- REFLECTION_DEBT_LEDGER_END -->
