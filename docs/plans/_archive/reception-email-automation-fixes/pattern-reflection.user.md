---
schema_version: pattern-reflection.v1
feature_slug: reception-email-automation-fixes
generated_at: 2026-03-14T12:04:33.247Z
entries:
  - canonical_title: Gmail credential health-check — proactive alert before auth expiry
    pattern_summary: Auth-expiry fix is reactive; proactive credential probe would prevent staff disruption
    category: new-loop-process
    routing_target: fact_find_ready
    occurrence_count: 1
---

# Pattern Reflection

## Patterns

- `new-loop-process` | `Auth-expiry fix is reactive; proactive credential probe would prevent staff disruption` | routing: `fact_find_ready` | occurrences: `1`

  **Summary:** The Gmail 401 detection added in TASK-04 tells staff the credential has already expired. A recurring health-check that probes credential validity before staff try to send would let the admin rotate credentials before any email fails. This gap appears each time auth-expiry handling is added reactively (first occurrence).

## Access Declarations

None identified.
