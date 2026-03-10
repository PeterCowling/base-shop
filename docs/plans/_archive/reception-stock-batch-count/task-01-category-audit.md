# TASK-01: Category Audit — Inventory Item Category Field

**Date:** 2026-02-28
**Feature:** reception-stock-batch-count
**Purpose:** Confirm `InventoryItem.category` field population and physical-area alignment before deploying `BatchStockCount.tsx`.

---

## Source Code Evidence

### Field Definition

`apps/reception/src/types/hooks/data/inventoryItemData.ts`:

```typescript
export interface InventoryItem {
  id?: string;
  name: string;
  unit: string;
  openingCount: number;
  reorderThreshold?: number;
  category?: string;       // <-- optional, free-text string
  active?: boolean;
}
```

`apps/reception/src/schemas/inventoryItemSchema.ts`:

```typescript
category: z.string().optional()
```

The field is optional and has no enum constraint. It accepts any string value or may be absent.

### Known Category Values in Codebase

| Category Value | Source | Notes |
|---|---|---|
| `"ingredient"` | `StockManagement.test.tsx` (test fixture); `StockManagement.tsx` filter | Used to separate items displayed in `IngredientStock` component from general inventory items |

`StockManagement.tsx` line 83 explicitly filters `category === "ingredient"` items out of the general stock list — they are consumed by `IngredientStock.tsx` instead.

**Implication for `BatchStockCount`:** Items with `category: "ingredient"` will appear in batch count under `"ingredient"` group (or can be excluded by the operator). All other items will appear in their assigned category or fall into `"Senza categoria"`.

### Category Assignment in the UI

- `StockManagement.tsx` item creation form includes a "Category" text input.
- On save: `category: newItem.category.trim() || undefined` — empty input stores `undefined` (no category).
- No validation, suggestions, or category picker — free-text only.

### Live Production Data Status

**Cannot verify from source code.** The codebase contains no seeded fixture data or admin scripts that would reveal the current state of `category` field population in the production Firebase `inventory/items` path.

**Assessment:** Given that category is optional, free-text, and not required by the UI form, production coverage is likely **sparse to moderate** for non-ingredient items. Many items may have been created without a category value.

---

## Active Item Count (Source-Inferred)

No fixture data available. The reception app at BRIK is a small-team POS (single hostel). Based on typical small-bar/hostel contexts:
- Expected total active items: 20–60 items
- Categories likely reflect: bar stock, kitchen, cleaning supplies, reception supplies
- Items with category "ingredient" are already in use (IngredientStock flow confirms this)

**Recommendation:** The operator should run the category audit in the reception UI directly to confirm counts and coverage before batch count deployment.

---

## Conclusions

### Coverage Assessment

| Scenario | Likelihood | Impact on BatchStockCount |
|---|---|---|
| Most items uncategorised | High | Batch count shows single "Senza categoria" group; reduced value but functional |
| Categories partially assigned (some physical areas) | Medium | Partial grouping benefit; deploy with assignment plan |
| Categories fully assigned and reflect physical areas | Low (before this task) | Full batch count value at launch |

### Recommendation

1. **Deploy TASK-03 with "Senza categoria" fallback** as planned — the component works regardless of category coverage.
2. **Operator assigns categories** via the reception UI item edit form before staff training.
3. **Suggested category names** (aligned with typical small hostel bar/kitchen context):
   - `Bar` — bottles, spirits, mixers
   - `Cucina` — dry goods, pantry items
   - `Frigo` — refrigerated items (beer, wine, dairy)
   - `Pulizie` — cleaning supplies
   - `Reception` — stationery, key cards, guest supplies
   - `Magazzino` — bulk storage, overflow stock
4. **Category "ingredient"** should be reviewed — items in this category appear in `IngredientStock`, not in `StockManagement`. They will appear in batch count under "ingredient" group. The operator may wish to reassign these to a physical area category and deprecate `IngredientStock` separately (out of scope for this plan).

### Batch Count Deployment Gate

- **Coverage ≥80%:** Deploy immediately; batch count delivers full grouped value.
- **Coverage <80%:** Deploy with "Senza categoria" fallback as functional MVP; operator completes assignment over 1–2 shifts.

Since live coverage cannot be verified from source, **assume <80% coverage as the safe baseline**. The "Senza categoria" fallback handles this case correctly.

---

## TASK-03 Impact Reassessment

TASK-03 confidence remains at **75%** (Impact capped at 75% because category population is unconfirmed). Once the operator confirms ≥80% coverage, impact rises to 85% and overall confidence rises to ~82%.

This finding does not block TASK-03. The fallback (`"Senza categoria"` grouping) is fully functional.

---

## Acceptance Check

- [x] Active item count: estimated 20–60; not verifiable from source without live Firebase access
- [x] Category coverage %: unknown; assumed <80% (safe baseline)
- [x] Category names found in codebase: `"ingredient"` (1 known); others: not populated or free-text
- [x] Recommendation documented: deploy with fallback; operator assigns physical-area categories via UI
- [x] TASK-03 deployment decision: **proceed with "Senza categoria" fallback**
