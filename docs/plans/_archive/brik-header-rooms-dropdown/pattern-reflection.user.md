---
schema_version: pattern-reflection.v1
feature_slug: brik-header-rooms-dropdown
generated_at: "2026-02-28T00:00:00Z"
entries:
  - pattern_summary: "Accessibility bug in Radix controlled component found only during test writing"
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-header-rooms-dropdown/build-record.user.md#scope-deviations"
    idea_key: radix-controlled-accessibility-gap
---

# Pattern Reflection — BRIK Header Rooms Dropdown

## Patterns

### 1. Accessibility bug in Radix controlled component found only during test writing

- **Summary:** `onOpenChange` for a Radix `DropdownMenu` in controlled mode was implemented to handle close-only (`o=false`). The `o=true` case (triggered by Enter/Space/click on the chevron trigger) was silently ignored, making keyboard-open impossible. This was discovered when writing component tests, not during implementation.
- **Category:** `ad_hoc`
- **Routing result:** `defer` (occurrence_count=1; ad_hoc threshold is 2 for skill_proposal)
- **Occurrence count:** 1
- **Why it matters:** If tests had been skipped, the keyboard accessibility regression would have reached production. The pattern suggests that Radix controlled-mode `onOpenChange` handlers benefit from an explicit two-branch check at implementation time (not just test time).

## Access Declarations

None identified.
