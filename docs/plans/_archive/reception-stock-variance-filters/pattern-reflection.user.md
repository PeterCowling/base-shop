---
schema_version: pattern-reflection.v1
feature_slug: reception-stock-variance-filters
generated_at: 2026-03-01T00:00:00Z
entries:
  - pattern_summary: WIP type error in shared package blocks pre-commit hook for unrelated commit
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/reception-stock-variance-filters/build-record.user.md#scope-deviations
---

# Pattern Reflection — reception-stock-variance-filters

## Patterns

- **WIP type error in shared package blocks pre-commit hook for unrelated commit** (ad_hoc, defer)
  - A pre-existing WIP change in `packages/ui/src/organisms/RoomsSection.tsx` introduced a TypeScript error (`string` not assignable to `AppLanguage` union) that caused the pre-commit typecheck hook to fail when committing TASK-01 changes to `@apps/reception`. Required a minimal 2-line fix (AppLanguage import + cast) in `RoomsSection.tsx` to unblock the commit. Occurred once in this build. Routing: defer until occurrence_count >= 2.

## Access Declarations

None
