# TASK-03: TillReconciliation Children Scope

**Plan:** reception-ui-screen-polish
**Task:** TASK-03 — INVESTIGATE
**Status:** Complete
**Date:** 2026-02-26

---

## Files Read

- `apps/reception/src/components/till/TillReconciliation.tsx`
- `apps/reception/src/components/till/ActionButtons.tsx`
- `apps/reception/src/components/till/ActionDropdown.tsx` (dependency of ActionButtons)
- `apps/reception/src/components/till/FormsContainer.tsx`
- `apps/reception/src/components/till/TillShiftHistory.tsx`
- `apps/reception/src/components/till/SummaryAndTransactions.tsx` (additional context)

---

## 1. Mode Banner Location

**File:** `apps/reception/src/components/till/TillReconciliation.tsx`
**Lines:** 62–71

Both banners live directly in `TillReconciliation.tsx`, inline in JSX, between `<ActionButtons>` and `<FormsContainer>`:

```tsx
// line 62
{props.isEditMode && (
  <div className="text-info-main text-sm font-semibold text-center">
    Click a row to edit the transaction
  </div>
)}
// line 67
{props.isDeleteMode && (
  <div className="text-error-main text-sm font-semibold text-center">
    Click a row to delete the transaction
  </div>
)}
```

Neither banner is delegated to a child component. They are raw `<div>` elements with Tailwind classes directly in the parent. `isEditMode` and `isDeleteMode` come from `useTillReconciliationUI` via the merged `props` object.

---

## 2. ActionButtons Layout and Structure

`ActionButtons.tsx` does **not** render a flat row of `Button` components. It renders a horizontal flex container holding **ActionDropdown** trigger buttons (each a single `Button` that opens a dropdown menu), plus one direct `Button` for the drawer limit update (management-only, right-aligned).

### Top-level layout

```tsx
<div className="flex flex-col gap-4 sm:flex-row">
  <ActionDropdown id="shift" label="Shift" options={[...3 items]} />
  {canManageCash && (
    <>
      <ActionDropdown id="cash" label="Cash" options={[...3 items]} />
      <ActionDropdown id="keycards" label="Keycards" options={[...3 items]} />
    </>
  )}
  {canManageDrawerLimit && (
    <div className="flex items-center gap-2 sm:ms-auto">
      <label>Drawer Limit</label>
      <Input ... />
      <Button>Update</Button>
    </div>
  )}
</div>
```

### Dropdown trigger buttons (always visible)
- **Shift** trigger — 1 button, 3 menu items: Open Shift, Reconcile, Close

### Dropdown trigger buttons (canManageCash only)
- **Cash** trigger — 1 button, 3 menu items: Add, Exchange Notes, Lift
- **Keycards** trigger — 1 button, 3 menu items: Add Keycard, Return Keycard, Count Keycards

### Management-only section (canManageDrawerLimit)
- Drawer Limit label + number Input + **Update** button (1 direct `Button`)
- Floated right (`sm:ms-auto`)

### Button count summary

| Category | Trigger buttons | Menu items (dropdown) | Direct buttons |
|---|---|---|---|
| Always | 1 (Shift) | 3 | 0 |
| canManageCash | 2 (Cash, Keycards) | 6 | 0 |
| canManageDrawerLimit | 0 | 0 | 1 (Update) |
| **Total (all roles)** | **3** | **9** | **1** |

**Visible trigger buttons (all roles): 3**
**Total interactive affordances (triggers + menu items + direct button): 13**

### ActionDropdown implementation
`ActionDropdown.tsx` wraps Radix `DropdownMenu` / `DropdownMenuTrigger` / `DropdownMenuContent` / `DropdownMenuItem`. The trigger is a single `Button` with `className="px-4 py-2 bg-primary-main text-primary-fg rounded hover:bg-primary-dark"`. A shared `openId` state in `ActionButtons` ensures only one dropdown is open at a time.

---

## 3. FormsContainer Structure

`FormsContainer.tsx` is a thin conditional-rendering wrapper. It renders **one form at a time** (at most), controlled by six independent boolean props (`showOpenShiftForm`, `showCloseShiftForm`, `showKeycardCountForm`, `showFloatForm`, `showExchangeForm`, `showTenderRemovalForm`). Each is also gated on shift state (`!shiftOpenTime` or `shiftOpenTime`).

### Conditional render order

1. `showOpenShiftForm && !shiftOpenTime` → `<OpenShiftForm>`
2. `showFloatForm && shiftOpenTime` → `<FloatEntryModal>`
3. `showExchangeForm && shiftOpenTime` → `<ExchangeNotesForm>`
4. `showCloseShiftForm && shiftOpenTime` → `<CloseShiftForm variant={closeShiftFormVariant}>`
5. `showKeycardCountForm && shiftOpenTime` → `<KeycardCountForm>`
6. `showTenderRemovalForm && shiftOpenTime` → `<TenderRemovalModal>`

All six booleans are independent state variables. In practice, the action handlers in `useTillReconciliationLogic` toggle them exclusively (only one is ever true at a time), but `FormsContainer` itself does not enforce mutual exclusion — it relies on caller convention.

The component contains **no layout of its own** — it returns a React Fragment (`<>`) wrapping conditional children. Each child form handles its own layout internally.

---

## 4. Component Decomposition Assessment

### TillReconciliation.tsx
Well-decomposed orchestrator. Imports and composes 7 named child components. Logic is cleanly separated into two hooks (`useTillReconciliationUI`, `useTillReconciliationLogic`). The only concern is the inline mode banner divs (lines 62–71) which are trivial to extract or enhance.

### ActionButtons.tsx
Well-decomposed. Delegates all dropdown rendering to `ActionDropdown`. Internal state is limited to `openId`, `showDrawerReauth`, and `pendingDrawerLimit`. Permission checks use `canAccess` utility. Not monolithic.

### FormsContainer.tsx
Pure routing/dispatch layer. Zero business logic. Well-decomposed — each form is its own component with its own props contract. The container itself is ~150 lines including a 45-line props interface.

### TillShiftHistory.tsx
Self-contained, well-decomposed. Fetches its own data via `useTillShiftsData` (no prop drilling). Renders a standard table with 9 columns. Uses design system `Table` primitives. Handles loading/error/empty states inline.

### SummaryAndTransactions.tsx (additional file read for context)
Light composition layer: delegates to `ShiftSummary` and `TransactionTable`. Passes `isDeleteMode` and `isEditMode` down to `TransactionTable`. Returns null when no shift is open.

**No monoliths found.** The directory contains 20+ well-scoped components.

---

## 5. Visual State Indication for Active Shift Phase

Beyond the edit/delete mode banners in `TillReconciliation.tsx` (lines 62–71), shift phase is indicated through:

- **Button disabled states**: `ActionDropdown` options in the Shift group are conditionally disabled based on `shiftOpenTime` — "Open Shift" is disabled when a shift is open; "Reconcile" and "Close" are disabled when no shift is open. This provides affordance-level phase indication.
- **DrawerLimitWarning component**: conditionally rendered at the top of the page (`show={props.isDrawerOverLimit}`) — a contextual warning, not a phase banner.
- **ShiftSummary component** (inside `SummaryAndTransactions`): only renders when `shiftOpenTime` is set, effectively acting as an "operating" phase indicator by its presence.
- **FormsContainer forms**: each form is only shown when the relevant action is triggered; their presence indicates an in-progress workflow step.

There is **no persistent phase banner** (e.g., "Shift Open" / "Shift Closed" status strip). Phase is communicated implicitly through button availability and the presence/absence of the shift summary block.

---

## Effort Estimate for TASK-04 (Mode Banner Polish)

### Estimate: **S (Small)** — revised downward from plan's M estimate.

Rationale:
- Banners are in a single file, two adjacent JSX blocks (8 lines each, lines 62–71).
- No child component changes needed: banners are not inside any child; changes are self-contained in `TillReconciliation.tsx`.
- No state or logic changes: `isEditMode` and `isDeleteMode` are already computed; only visual treatment needs updating.
- Button count: 13 total interactive affordances — below the 15-button escalation threshold. No grouping restructure required.
- A straightforward polish (richer styling, icon, visual weight) requires changes to at most 1–2 files with no logic impact.

### TASK-04 Approach Refinement

Given the mode banners are two isolated inline JSX blocks in `TillReconciliation.tsx`:
- Add `bg-info-light/20 rounded-lg p-3 flex items-center gap-2` to edit banner
- Add `bg-warning-light/20 rounded-lg p-3 flex items-center gap-2` to delete banner
- Add Lucide icon (`<Info>` for edit, `<AlertTriangle>` for delete)
- Update plan's TASK-04 `Affects` list if needed (likely only `TillReconciliation.tsx`)

No escalation to L effort needed.
