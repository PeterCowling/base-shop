---
schema_version: pattern-reflection.v1
feature_slug: hbag-proof-bullets-real-copy
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: Materializer CLI silently fails when run from wrong working directory
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-proof-bullets-real-copy/results-review.user.md#new-idea-candidates
    idea_key: materializer-cwd-missing-sanity-check
    classifier_input:
      idea_id: materializer-cwd-missing-sanity-check
      title: Add cwd sanity check to materializer CLI to prevent silent "Missing source packet" errors
      source_path: docs/plans/hbag-proof-bullets-real-copy/results-review.user.md
      source_excerpt: pnpm --filter scripts resolves repoRoot to scripts/ package directory; produces misleading Missing source packet error
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      evidence_refs:
        - docs/plans/hbag-proof-bullets-real-copy/build-record.user.md#scope-deviations
      area_anchor: startup-loop materializer CLI reliability
      content_tags:
        - reliability
        - dx
  - pattern_summary: Markdown section extractor stop pattern was too narrow, causing content spill
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-proof-bullets-real-copy/build-record.user.md#what-was-built
    idea_key: extractbulletlist-stop-pattern-bug
    classifier_input:
      idea_id: extractbulletlist-stop-pattern-bug
      title: extractBulletList stop pattern matched only h3 headings, spilling into subsequent h2 sections
      source_path: docs/plans/hbag-proof-bullets-real-copy/build-record.user.md
      source_excerpt: extractBulletList() stop pattern was ^###\s+ (h3 only); fixed to ^#{2,}\s+ (h2 or h3). Bug caught during TASK-04 integration run.
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      evidence_refs:
        - docs/plans/hbag-proof-bullets-real-copy/build-record.user.md#scope-deviations
      area_anchor: startup-loop materializer extraction reliability
      content_tags:
        - reliability
        - content-pipeline
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Materializer CLI silently fails when run from wrong working directory` | routing: `defer` | occurrences: `1`
  - The materializer defaults `repoRoot` to `process.cwd()`, which resolves to the `scripts/` package directory when run via `pnpm --filter scripts`. This produces a "Missing source packet" error with no helpful hint about the working directory mismatch. Occurs when running the CLI via pnpm workspace filter. Fixed for this build by running from repo root directly, but no permanent guard exists.

- `deterministic` | `Markdown section extractor stop pattern was too narrow, causing content spill` | routing: `defer` | occurrences: `1`
  - `extractBulletList()` stopped at the next h3 heading only (`^###\s+`). The HBAG content packet has no h3 after `### Product Proof Bullets` before `## Operational Integration` (h2), so extraction continued into unrelated sections. Fixed to `^#{2,}\s+` (stops at h2 or h3). First observed occurrence; below `loop_update` threshold of 3.

## Access Declarations

None identified.
