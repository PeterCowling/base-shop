---
Type: Evidence-Artifact
Status: Active
Business: BRIK
Date: 2026-02-17
Owner: Pete
Relates-to:
  - docs/plans/brikette-octorate-funnel-reduction/plan.md
  - docs/plans/brikette-octorate-funnel-reduction/fact-find.md
---

# Octorate Export Observed Schema (Sanitized)

## Source
- Operator-provided Octorate export file name: `1771331323819.xlsx`
- Observation method: schema and value-shape review only; no guest PII persisted in this artifact.

## Observed Columns Used in Current Pipeline
- `Create time` (booking creation timestamp)
- `Check in` (arrival date)
- `Refer` (booking reference field used by current dedupe/channel logic)
- `Room`
- `Total room`

## Observed Value Shapes (Sanitized)
- `Refer` examples observed in export:
  - `TK2SI9` (6-char alphanumeric)
  - `5986921538_6092062020` (compound numeric token)
- Interpretation:
  - values behave as booking reference identifiers,
  - values do not contain URL query parameters,
  - values are not HTTP referrer URLs.

## Planning Implication
- Current no-API reconciliation cannot do deterministic click-level join from export alone.
- Deterministic join can be enabled only if a future export includes query-bearing referrer data or another shared join key field.
