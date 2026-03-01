# Indicative Pricing Governance

- Tasks: `TASK-09A`, `TASK-09B`
- Verification date: `2026-03-01`
- Dataset: `apps/brikette/src/data/indicative_prices.json`

## Source-of-Truth Contract

| Field | Rule |
|---|---|
| `last_updated` | ISO date of latest manual refresh |
| `currency` | `EUR` |
| `basis` | `from_per_night` |
| `stale_after_days` | Maximum age before suppression (currently `14`) |
| `rooms.<room_id>.from` | Numeric indicative anchor value |

## Ownership / Cadence

- Owner: Growth/Ops (Brikette revenue owner)
- Refresh cadence: weekly minimum, and additionally after major price changes.
- Change control: commit updates to `indicative_prices.json` with explicit date in `last_updated`.

## Stale-Data Suppression Policy

- Condition: `Date.now() - new Date(last_updated) > stale_after_days * 24h`
- Result:
  - Indicative anchors are suppressed automatically.
  - UI falls back to neutral message: `Rates temporarily unavailable. Select dates to check live availability.`

## Runtime Integration Evidence

- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - Uses indicative room price overrides only for absent-search state.
  - Suppresses indicative anchors automatically when seed is stale.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - Displays indicative anchor in absent-search state when seed is fresh.
  - Switches to neutral unavailable copy when seed is stale.

## Operational Checklist

1. Update numeric room anchors.
2. Update `last_updated` date.
3. Commit + deploy.
4. Spot-check `/book` and one room-detail page for fresh indicative copy.
