---
schema_version: pattern-reflection.v1
feature_slug: xa-currency-conversion-rates
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: Empty commit from codex offload when lint-staged unstages files on writer-lock conflict
    category: ad_hoc
    routing_target: defer
    occurrence_count: 2
    evidence_refs:
      - docs/plans/xa-currency-conversion-rates/build-record.user.md#scope-deviations
    idea_key: writer-lock-staged-file-loss
---

# Pattern Reflection

## Patterns

- **Empty commit from writer lock + concurrent staged files**: Commit `42a1ec4b3e` (Wave 1) was created with a correct message but no file changes. Root cause: a concurrent agent session had files staged alongside the xa-currency files; `lint-staged` with `--no-stash` unstaged the xa-currency changes. The Wave 1 code was recovered and committed in `86b65ed9b4`. This same pattern was observed in the brikette-direct-booking build (Wave 2 xa-currency files ended up in an hbag-pdp-shipping-returns commit). | Category: `ad_hoc` | Occurrences: 2 | Routing: defer (not yet at skill_proposal threshold of 2 distinct builds — this is 2 occurrences within the same feature build cycle; a recurrence in a subsequent build would justify a skill_proposal)

## Access Declarations

None identified
