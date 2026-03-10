---
Type: Fact-Find
Status: Ready-for-planning
Feature-Slug: reception-simplify-backlog
Created: 2026-03-09
Last-updated: 2026-03-09
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
---

# Fact-Find: Reception App Simplify Backlog

## Area Anchor

Reception app architectural simplify backlog — 7 clusters identified in round 3 simplify sweep. Scope: `apps/reception/src/`.

## Access Declarations

None — investigation is purely local codebase reads.

## Clusters: Status After Investigation

The simplify sweep flagged 7 architectural clusters. Investigation reveals that **6 of 7 are already resolved**. Only cluster 7 requires a plan.

### Cluster 1 — Bar mutation type duplication ✅ Already resolved

All three mutation hooks (`useAddItemToOrder.ts`, `useRemoveItemFromOrder.ts`, `useConfirmOrder.ts`) already import `BarOrder` and `BarOrderItem` from `apps/reception/src/types/bar/BarOrderDomain.ts`. No local copy-pasted interfaces remain. The domain file also coexists cleanly with `BarTypes.ts` (which covers `SalesOrder`/`SalesOrderItem` — the confirmed/persisted side).

Evidence:
- `useAddItemToOrder.ts:11`: `import type { BarOrder, BarOrderItem } from "../../../../../types/bar/BarOrderDomain";`
- `useRemoveItemFromOrder.ts:11`: `import type { BarOrder } from "../../../../../types/bar/BarOrderDomain";`
- `useConfirmOrder.ts:8`: `import type { BarOrder, BarOrderItem } from "../../../../../types/bar/BarOrderDomain";`

### Cluster 2 — Thin client wrapper hooks ✅ Already resolved

The three hooks named in the sweep (`useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts`) do not exist. The actual till hooks are:
- `useTillShifts.ts` — 698 lines, substantive shift lifecycle logic (open, close, reconcile)
- `useTillReconciliationUI.ts` — UI state for reconciliation forms
- `useTillUIControls.ts`, `useTillAlerts.ts`, `useDenominationCalculator.ts`, `useShiftCalculations.ts`

None are thin pass-through wrappers. Cluster is moot.

### Cluster 3 — Copy-paste radio components ✅ Already resolved

`DocumentTypeSelector.tsx` and `PaymentMethodSelector.tsx` both already import and use the shared `RadioOption` component. No local `RadioButton` sub-component logic exists in either file. Already extracted.

### Cluster 4 — Auth error mapper duplication ✅ Effectively resolved

`mapAuthError` is centralised in `apps/reception/src/services/authErrors.ts`. One remaining inline `auth/user-not-found` check exists in `firebaseAuth.ts:109` (password reset flow), but this is intentional: the reset flow explicitly does NOT reveal whether a user exists (security behaviour) — so it can't delegate to the shared mapper. No action needed.

### Cluster 5 — SafeManagement modal state ✅ Already resolved

`SafeManagement.tsx` already uses `activeModal: SafeModal | null` (line 68) — a discriminated union, not 9 boolean flags. Conditional rendering is keyed off this single state value. Already done.

### Cluster 6 — KeycardDepositButton complex state ✅ Already resolved

`useDropdownMenu` hook exists at `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts`. It manages `menuOpen`, `menuVisible` (fade animation), `menuPosition`, `buttonRef`, and timeout cleanup. `KeycardDepositButton.tsx` already consumes it. Already extracted.

---

## Cluster 7 — Missing segment-level error boundaries ❌ GENUINE GAP

### Evidence

The app has a root-level `error.tsx` at `apps/reception/src/app/error.tsx` plus segment-level boundaries in:
- `bar/error.tsx` ✓
- `safe-management/error.tsx` ✓
- `till-reconciliation/error.tsx` ✓

**26 route segments have no `error.tsx`:**
`alloggiati`, `audit`, `checkin`, `checkout`, `doc-insert`, `email-automation`, `end-of-day`, `eod-checklist`, `extension`, `inbox`, `ingredient-stock`, `live`, `loan-items`, `manager-audit`, `menu-performance`, `prepare-dashboard`, `prepayments`, `prime-requests`, `real-time-dashboard`, `reconciliation-workbench`, `rooms-grid`, `safe-reconciliation`, `staff-accounts`, `statistics`, `stock`, `variance-heatmap`

(`api/` and `__tests__` are not route segments and correctly have no error.tsx.)

### Risk without segment-level error.tsx

When a route segment throws during render or in a React effect, Next.js App Router bubbles to the nearest error boundary. Without a segment-level boundary, the **entire app UI crashes** to the root `error.tsx` — the user loses all navigation context. High-risk routes (Firebase subscriptions, financial operations) are most exposed.

### Risk triage (priority order for `error.tsx` addition)

| Route | Risk | Reason |
|---|---|---|
| `inbox` | High | Email orchestration, AI draft generation, complex Firebase state |
| `checkin` | High | Core guest workflow, multiple modal layers |
| `checkout` | High | Core guest workflow, payment state |
| `reconciliation-workbench` | High | Financial reconciliation |
| `end-of-day` | High | Financial operations, shift closure |
| `prepayments` | High | Payment handling |
| `loan-items` | Moderate | Loan state management |
| `rooms-grid` | Moderate | Real-time Firebase subscriptions |
| `real-time-dashboard` | Moderate | Real-time subscriptions |
| `prime-requests` | Moderate | Async request state |
| `eod-checklist` | Moderate | End-of-day checklist state |
| `alloggiati` | Low | Police reporting, infrequent |
| `audit`, `statistics`, `variance-heatmap` | Low | Read-only analytics |
| `ingredient-stock`, `stock`, `menu-performance` | Low | Infrequent stock operations |
| `staff-accounts`, `manager-audit` | Low | Admin-only |
| `extension`, `live`, `prepare-dashboard` | Low | Supplementary views |
| `doc-insert`, `email-automation` | Low | Automated flows |

### Implementation pattern

The existing `bar/error.tsx` is the canonical template:
```tsx
"use client";
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function Error({ error, reset }: ErrorProps) { ... }
```

Each `error.tsx` only needs its route name in the description string. The template body is otherwise identical across all routes. All files will be `"use client"` as required by Next.js.

### Validation path
- `pnpm --filter @apps/reception typecheck` — confirms no type errors
- `pnpm --filter @apps/reception lint` — confirms no lint errors
- Manual smoke: Next.js `error.tsx` files are type-checked at build time

---

## Key Files

| File | Role |
|---|---|
| `apps/reception/src/app/error.tsx` | Root-level error boundary (exists) |
| `apps/reception/src/app/bar/error.tsx` | Canonical template for segment boundaries |
| `apps/reception/src/app/inbox/` | Highest-priority missing boundary |
| `apps/reception/src/app/checkin/` | High-priority missing |
| `apps/reception/src/app/checkout/` | High-priority missing |
| `apps/reception/src/app/reconciliation-workbench/` | High-priority missing |
| `apps/reception/src/app/end-of-day/` | High-priority missing |
| `apps/reception/src/app/prepayments/` | High-priority missing |

## Test Landscape

No existing tests cover `error.tsx` files. Validation is TypeScript + lint only. Next.js's own error boundary behaviour is framework-guaranteed.

## Risks

1. **Mechanical volume**: 26 route segments need error.tsx. Risk of typo in route-specific description strings — mitigated by shared template. `diff` of existing boundaries confirms only the route name in the description string varies.
2. **`api/` routes**: Must NOT get error.tsx (Route Handlers don't use it). Already excluded.
3. **Root error.tsx already catches everything**: Adding segment boundaries is strictly additive — no regression risk.

## Open Questions

All questions self-resolved:
- **Q: Are any routes already guarded by a parent-segment error.tsx?** Resolved: No — all 28 unguarded routes are direct children of the app root.
- **Q: Should error messages be route-specific?** Resolved: Yes, include the route name for diagnostics, but the template structure is identical.
- **Q: What about `loading.tsx` and `not-found.tsx` gaps?** Resolved: Out of scope for this plan — error boundaries are the highest-risk gap.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bar mutation types (cluster 1) | Yes | None — already uses BarOrderDomain.ts | No |
| Till wrapper hooks (cluster 2) | Yes | Hooks don't exist; useTillShifts.ts has real logic | No |
| Radio duplication (cluster 3) | Yes | RadioOption already shared by both selectors | No |
| Auth error mapper (cluster 4) | Yes | One inline check is intentional security behaviour | No |
| SafeManagement modal state (cluster 5) | Yes | Already uses discriminated union activeModal | No |
| KeycardDepositButton state (cluster 6) | Yes | useDropdownMenu already extracted and used | No |
| Error boundaries (cluster 7) | Yes | 28 routes without segment error.tsx | No |

## Evidence Gap Review

### Gaps Addressed
- Verified each cluster against actual file content (not just filenames)
- Confirmed BarOrderDomain.ts is the single source of truth for mutation types
- Confirmed RadioOption is the shared component (not just hoped to be)
- Confirmed SafeManagement uses discriminated union (not assumed from flag names)
- Confirmed useDropdownMenu is already extracted (not speculative)
- Enumerated all 28 missing error.tsx routes by name

### Confidence Adjustments
- Cluster 7 confidence raised to 95%: template is proven (bar/error.tsx), implementation is mechanical, no architectural decisions required.

### Remaining Assumptions
- `api/` routes confirmed excluded (no error.tsx semantics for Route Handlers).
- The description string in each error.tsx is the only variable — all else is identical.

## Scope Signal

Signal: right-sized
Rationale: Clusters 1–6 are resolved; cluster 7 is a bounded mechanical task with a clear template, no architectural decisions, and a direct validation path. Scope is appropriately narrowed.

## Outcome Contract

- **Why:** Route-level crashes in high-risk segments (inbox, checkin, checkout, financial flows) currently surface the root error boundary, destroying navigation context — users cannot recover without a full reload.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 26 unguarded reception route segments have a segment-level error boundary, limiting crash blast radius to the affected route rather than the full app.
- **Source:** auto
