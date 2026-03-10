---
Type: Fact-Find
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-reviewed: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-results-review-historical-carryover
Related-Plan: docs/plans/startup-loop-results-review-historical-carryover/plan.md
---

# Startup Loop Results-Review Historical Carry-Over Fact Find

## Outcome

The queue-unification thread successfully killed the live dual backlog path, but it did not and should not pretend to mechanize the archive. Historical carry-over is a separate problem because the archived build-review sidecars do not satisfy the canonical build-origin contract and the worthwhile remainder still needs human triage.

This follow-on exists to carry forward only the worthwhile historical ideas into the canonical queue without reviving legacy backlog reads.

## Current State

- The live backlog path is now queue-backed.
- Archive carry-over remains manual.
- The archive surface contains:
  - `15` raw machine rows across both legacy sidecar types
  - `12` human-normalized thematic candidates after collapsing truncated-source duplicates
  - `6` worthwhile unresolved candidates
  - `0` candidates deterministically mappable to the canonical build-origin contract

## Worthwhile Unresolved Candidates

1. Build artifact caching for staging
2. Chunk count monitoring for Brikette staging
3. Extract shared PIN digit colour array into a single constant
4. Duplicate component detection before drift compounds
5. Add a post-deploy recovery telemetry review checkpoint
6. Add a standing ops feed for inbox recovery outcomes

## Why This Is Separate

This is not “run the new bridge over old files”.

The carry-over job requires:

- manual normalization of legacy rows that do not share canonical `build_signal_id`
- explicit discard rationale for superseded or moot candidates
- new queue packet authoring for the six worthwhile unresolved items
- explicit historical provenance so future readers can tell these were backfilled, not newly emitted

That is a bounded project, but it is not part of queue-path unification anymore.

## Recommended Direction

1. Define a historical carry-over packet/manifest format.
2. Normalize the `12` thematic archive candidates into one audited manifest.
3. Admit only the `6` worthwhile unresolved candidates into the canonical queue with explicit historical provenance.
4. Record explicit non-carry-forward disposition for the discarded six so the cutover stays auditable.

## Relationship To Queue Unification

This project is the explicit split selected by:

- `docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md`

It must not:

- re-enable direct archive reads in `generate-process-improvements.ts`
- reintroduce `results-review.user.md` backlog scraping
- create a second active backlog surface outside queue state

## Next Step

- `/lp-do-plan startup-loop-results-review-historical-carryover --auto`
