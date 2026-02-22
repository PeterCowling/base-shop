---
Schema: idea-backlog
Version: 1.0.0
Stage: IDEAS-01
Status: Active
Created: 2026-02-22
Owner: startup-loop maintainers
Related-stage: IDEAS-02 — Backlog update
Related-skill: /idea-develop
---

# Idea Backlog Schema

The idea backlog is the operator-maintained registry of candidate ideas surfaced from Layer A standing intelligence outputs. It is the primary input artifact for IDEAS-01 (Pack diff scan) and the source pool for IDEAS-02 (Backlog update).

## Artifact location

```
docs/business-os/strategy/<BIZ>/idea-backlog.user.md
```

## Trigger for update

Update the backlog when IDEAS-01 produces `scan-proposals.md` from a changed Layer A pack. Typical triggers are refreshes in:
- MARKET-07..11 outputs (market aggregate pack, demand evidence, ICP refinement)
- SELL-06 aggregate pack
- PRODUCTS-07 aggregate pack
- LOGISTICS-07 aggregate pack (if applicable)

IDEAS-02 applies reviewed proposals from `scan-proposals.md` into this backlog. This schema is the destination contract for that apply step.

## Frontmatter

```yaml
---
Business: <BIZ>
Last-updated: <YYYY-MM-DD>
Review-trigger: <which Layer A output triggered this review>
last_scanned_pack_versions:
  MARKET-11: <YYYY-MM-DD>
  SELL-07: <YYYY-MM-DD>
  PRODUCTS-07: <YYYY-MM-DD>
  LOGISTICS-07: <YYYY-MM-DD>
Owner: <operator name or handle>
---
```

`last_scanned_pack_versions` records the most recent pack version/date that IDEAS-01 has scanned for each Layer A source.
If the field is absent, treat the backlog as first-run and scan all supported packs in full before diff mode begins.

## Idea entries table

| ID | Title | Domain | Source-Date | Status | Score | Notes |
|----|-------|--------|-------------|--------|-------|-------|
| IDEA-<BIZ>-001 | Example idea title | MARKET | 2026-02-22 | new | — | Brief rationale or observation |
| IDEA-<BIZ>-002 | Another candidate | SELL | 2026-02-22 | scored | 4 | Strong ICP fit; evidence: medium |
| IDEA-<BIZ>-003 | Third candidate | PRODUCTS | 2026-02-21 | promoted | 5 | Promoted to fact-find 2026-02-22 |

### Column definitions

| Column | Definition |
|--------|------------|
| `ID` | Unique idea identifier in format `IDEA-<BIZ>-<seq>` (zero-padded 3 digits). Sequence is per-business and never reused. |
| `Title` | One-line human-readable description of the idea. |
| `Domain` | Which Layer A domain surfaced this idea. Values: `MARKET`, `SELL`, `PRODUCTS`, `LOGISTICS`. |
| `Source-Date` | Date the source Layer A artifact was produced or last updated. |
| `Status` | Current lifecycle status. Values: `new`, `scored`, `promoted`, `archived`. |
| `Score` | Operator-assigned score 1–5 after IDEAS-02 review. `—` if not yet scored. |
| `Notes` | Brief rationale, evidence pointer, or disposition note. |

## Status lifecycle

```
new → scored → promoted
           └→ archived
```

- `new`: Captured from Layer A output but not yet reviewed or scored.
- `scored`: Reviewed in IDEAS-02; score 1–5 assigned.
- `promoted`: Top-ranked card promoted to fact-find via IDEAS-03. Idea card file created.
- `archived`: Reviewed and de-prioritised; not discarded — retained for future cycles.

## Maintenance instructions

1. Add new rows for each candidate idea discovered during a Layer A pack review.
2. Assign a new sequential `ID` (never reuse or recycle IDs).
3. Leave `Score` as `—` and `Status` as `new` until IDEAS-02 review is complete.
4. After IDEAS-02: update `Score` and `Status` for each reviewed card.
5. After IDEAS-03 promotion: update `Status` to `promoted` for the winning card.
6. Archive cards that will not be pursued in this cycle (set `Status: archived`; do not delete the row).

## Example (complete artifact)

```markdown
---
Business: BRIK
Last-updated: 2026-02-22
Review-trigger: MARKET-11 market aggregate pack updated 2026-02-22
last_scanned_pack_versions:
  MARKET-11: 2026-02-22
  SELL-07: 2026-02-20
  PRODUCTS-07: 2026-02-19
  LOGISTICS-07: 2026-02-18
Owner: peter
---

# Idea Backlog — BRIK

| ID | Title | Domain | Source-Date | Status | Score | Notes |
|----|-------|--------|-------------|--------|-------|-------|
| IDEA-BRIK-001 | Bundle loyalty card with Positano stay | MARKET | 2026-02-22 | scored | 4 | Fits ICP (boutique travellers); evidence from MARKET-08 demand pack |
| IDEA-BRIK-002 | Hostel welcome kit upsell | SELL | 2026-02-22 | promoted | 5 | Promoted 2026-02-22; fact-find.md created |
| IDEA-BRIK-003 | Accessory subscription box | PRODUCTS | 2026-02-20 | archived | 2 | Low ICP fit at current stage; revisit post-website |
```
