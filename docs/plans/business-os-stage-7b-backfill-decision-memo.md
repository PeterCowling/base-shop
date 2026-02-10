---
Type: Decision-Memo
Status: Approved
Domain: Business-OS
Created: 2026-02-09
Last-reviewed: 2026-02-09
Relates-to charter: docs/business-os/business-os-charter.md
Relates-to plan: docs/plans/business-os-ideas-surface-and-automation-plan.md
---

# Stage 7b Backfill Budget Decision Memo

## Decision
- Keep Stage 7b **disabled by default** in Phase 0.
- Approve an implementation-ready optional contract for later activation:
  - max **1** existing P1/P2 card without a fact-find doc per sweep,
  - selected deterministically,
  - reported separately from Stage 7 Top-K newly promoted ideas.

## Why
- Preserves deterministic Top-K behavior from the current sweep.
- Addresses fairness starvation risk for older high-priority cards.
- Avoids mixed-pool ambiguity in reporting and operator workflows.

## Contract (Implementation-Ready)

### Activation policy
- Default: `stage7b_backfill_enabled = false`.
- Enable only via explicit run-level flag/config (never implicit): `stage7b_backfill_enabled = true`.
- If not explicitly enabled, Stage 7b is skipped.

### Eligibility pool (existing cards only)
A card is eligible only if all are true:
- It existed before current sweep start time.
- Priority is `P1` or `P2`.
- No existing `fact-find` stage doc.
- Not archived/completed (`Lane` not `Done`/`Reflected`/archived equivalent).

Exclusions:
- Any card created in current sweep (those are Stage 7 pool only).
- Any card already selected by Stage 7.

### Deterministic selector (single-slot)
When Stage 7b is enabled:
1. Priority ascending (`P1` before `P2`)
2. Card created date ascending (oldest first)
3. Card ID ascending (stable final tie-breaker)
4. Select first 1 card

### Output semantics
- Stage 7 output remains: Top-K from newly promoted ideas only.
- Stage 7b output is separate section:
  - `Backfill-Selected: <card-id|none>`
  - `Backfill-Reason: oldest eligible P1/P2 without fact-find`
  - `Backfill-Selector-Version: v1`
- Never merge Stage 7b into Stage 7 Top-K list.

### Failure behavior
- If Stage 7b selection or stage-doc create fails, run stays fail-closed per existing policy:
  - mark run `partial`,
  - include reconciliation checklist,
  - include exact rerun command and owner handoff.

### Disable path
- Set `stage7b_backfill_enabled = false`.
- No migration/cleanup required; feature is additive and no-op when disabled.

## Worked Example (20-Idea Fixture)
Assume sweep result summary:
- Newly promoted this sweep: 6 ideas (P1x2, P2x2, P3x2)
- Existing eligible backlog cards (no fact-find):
  - `BRIK-OPP-0014` (P1, created 2026-01-10)
  - `PLAT-ENG-0009` (P1, created 2026-01-22)
  - `CMS-OPP-0007` (P2, created 2026-01-05)

Stage 7 (always-on):
- Top-K=3 from newly promoted only -> `[new-P1-a, new-P1-b, new-P2-a]`

Stage 7b (if enabled):
- Eligible set sorted by selector:
  - `BRIK-OPP-0014` (P1, 2026-01-10)
  - `PLAT-ENG-0009` (P1, 2026-01-22)
  - `CMS-OPP-0007` (P2, 2026-01-05)
- Selected: `BRIK-OPP-0014` (single slot)

Resulting report shape:
- `Stage 7 Top-K`: 3 newly promoted cards
- `Stage 7b Backfill`: 1 existing card (or `none`)

## Recommendation
- Keep Stage 7b disabled in current rollout.
- Treat this memo as the approved contract for future activation work (`TASK-04B`/follow-on implementation).
