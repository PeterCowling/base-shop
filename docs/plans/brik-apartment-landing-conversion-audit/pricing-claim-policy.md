---
Type: Decision-Artifact
Task: TASK-02
Status: Approved
Owner: Peter Cowling (product/ops)
Approved: 2026-02-17
---

# Pricing Claim Policy — Apartment Routes

## Decision

**Option A: Allow static "from EUR" copy with mandatory qualifiers.**

Static price copy is permitted provided:
1. The figure represents a genuine minimum that will never be undercut without updating copy.
2. The claim always includes a "from" qualifier.
3. A season or context qualifier is included ("in shoulder season", "starting from", etc.).

Engine-backed dynamic validation is not required for a single-unit property at this time.

## Allowed Phrasing

| ✓ Allowed | ✗ Disallowed |
|---|---|
| "From €265/night in shoulder season" | "€265/night" (no qualifier) |
| "Prices from €265 in shoulder season" | "€265 guaranteed" |
| "Starting from €265/night" (with context) | "Always from €265" |
| "From €265 — check availability for your dates" | Specific total stay costs without engine data |

## Operational Commitment

- Copy must be updated whenever the true minimum floor changes.
- If Octorate pricing drops below €265 for any bookable period, copy must be updated before the period goes on sale.
- No dynamic validation infrastructure required at this stage.

## Review Trigger

- Revisit this policy if a second property or seasonal pricing tier is introduced.
