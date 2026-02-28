---
schema_version: pattern-reflection.v1
feature_slug: brik-eod-day-closed-confirmation
generated_at: 2026-02-28T20:00:00.000+01:00
entries:
  - pattern_summary: "Concurrent build linter pass injects test stubs into shared component test files"
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-eod-day-closed-confirmation/build-record.user.md#scope-deviations"
---

# Pattern Reflection

## Patterns

- **Concurrent build linter pass injects test stubs into shared component test files** — During TASK-05, the concurrent `brik-eod-float-set` build's lint-staged hook ran against the same test file (`EodChecklistContent.test.tsx`) and injected TC-14–TC-17 (float tests) and a `useCashCountsData` mock. These additions were removed before commit to preserve scope isolation. The pattern is: two builds editing the same test file concurrently can cause lint-staged to apply one build's additions to the other build's staged commit. This is an ad-hoc interaction, occurrence count 1 — route: defer. If observed again, consider a skill proposal for test-file conflict detection in the writer lock.

## Access Declarations

None identified.
