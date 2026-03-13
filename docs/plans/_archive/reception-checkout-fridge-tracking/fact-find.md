---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-checkout-fridge-tracking
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-checkout-fridge-tracking/analysis.md
Trigger-Why: "Staff need to record at checkout whether a guest used the fridge, and see that flag on the checkout screen so nothing is missed before the guest leaves."
Trigger-Intended-Outcome: "type: operational | statement: Staff can toggle a fridge-used flag per guest on the checkout screen; the FRIDGE column shows a fridge icon when the flag is set, so staff know to retrieve fridge items before the guest departs. | source: operator"
---

# Fridge Item Tracking on the Checkout Screen — Fact-Find Brief

## Scope
### Summary
The checkout screen (`/checkout`) already has a FRIDGE column in `CheckoutTable.tsx` but it is always blank. `Checkout.tsx` line 323 hardcodes `fridge: ""`. No Firebase path, data hook, schema, or mutation exists for fridge storage. The operator has confirmed the data model and UX:

- **Data model**: boolean flag `{ used: boolean }` at `fridgeStorage/<occupantId>` — mirrors `bagStorage/<occupantId>` exactly.
- **Write path**: inline toggle button per guest row on the checkout screen.
- **Display**: fridge icon (same approach as the Luggage icon for bag storage) when `used === true`.

The bag-storage feature is the direct analogue: Firebase node per occupant, Zod schema, read hook, mutation, wired end-to-end in the checkout screen. Fridge tracking follows this pattern with the addition of an inline toggle on the checkout row.

### Goals
- Staff can toggle whether a guest used the fridge, directly on the checkout screen.
- The FRIDGE column shows a fridge icon when `used === true`, blank otherwise.
- The fridge flag is archived when the guest is archived (same lifecycle as bagStorage).

### Non-goals
- No POS/financial transaction associated with fridge storage.
- No fridge tracking on any screen other than the checkout screen.
- No free-text description or item list — boolean only.

### Constraints & Assumptions
- Constraints:
  - Must follow the bag-storage pattern exactly: Firebase node per occupant, Zod schema, read hook via `useFirebaseSubscription`, integrated into `Checkout.tsx` useMemo guest derivation, archived by `useArchiveCheckedOutGuests`.
  - Write path requires a new mutation hook and a toggle button per checkout row (unlike bag storage which is written by a Prime request resolver — fridge is written directly from the checkout screen).
  - Firebase rules must include an explicit `fridgeStorage` rule block (role-gated write, same roles as all other guest-facing mutations).
  - Tests run in CI only — no local Jest runs.
- Assumptions:
  - The fridge flag is recorded against the occupant (not the booking).
  - The feature is write-enabled for `staff`, `admin`, `manager`, `developer`, and `owner` roles.
  - The toggle is stateful: clicking when `used === false` sets it to `true`; clicking again reverses it (same toggle semantics as the Complete/Undo button).
  - No initialization of the node at guest creation — the node is created on first toggle. The read hook handles a missing node gracefully (returns `{}`).

## Outcome Contract

- **Why:** Staff need to record at checkout whether a guest used the fridge, and see that flag on the checkout screen so nothing is missed before the guest leaves.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can toggle a fridge-used flag per guest on the checkout screen; the FRIDGE column shows a fridge icon when the flag is set, so staff know to retrieve fridge items before the guest departs.
- **Source:** operator

## Current Process Map

- Trigger: Guest hands fridge items to staff at checkout; staff have no digital mechanism to record or be reminded of this.
- End condition: FRIDGE column on checkout screen is always blank, providing no value.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Fridge flag recording | No digital step exists. | Reception staff | n/a | No record, no reminder at checkout |
| Checkout screen FRIDGE column | `Checkout.tsx:323` hardcodes `fridge: ""`. `CheckoutTable.tsx:226` renders `{guest.fridge \|\| ""}` — always blank. No toggle button. | `Checkout.tsx`, `CheckoutTable.tsx` | `apps/reception/src/components/checkout/Checkout.tsx:323` | Column exists but is always empty; no write path |
| Bag storage (analogue — working) | Staff resolves a Prime bag-drop request; `usePrimeRequestResolution` sets `bagStorage/<occupantId>.optedIn = true`. `useBagStorageData` subscribes to the node. `Checkout.tsx` maps the flag to `bagStorageOptedIn` which renders a Luggage icon. | `usePrimeRequestResolution`, `useBagStorageData`, `Checkout.tsx`, `CheckoutTable.tsx` | `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts:218`, `apps/reception/src/hooks/data/useBagStorageData.ts` | None — fully functional. Bag storage has no inline toggle on the checkout screen (set via Prime). Fridge will differ here. |
| Archive | `useArchiveCheckedOutGuests` moves `bagStorage/<occupantId>` → `archive/bagStorage/<occupantId>` and nulls the live node. No equivalent for fridge. | `useArchiveCheckedOutGuests.ts` | `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts:187-297` | No fridge archival exists |

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/checkout/Checkout.tsx` — main checkout component; orchestrates data fetching and derives the `Guest[]` array passed to `CheckoutTable`
- `apps/reception/src/components/checkout/CheckoutTable.tsx` — renders the checkout table; already has FRIDGE column header and `{guest.fridge || ""}` cell; will receive toggle callback

### Key Modules / Files
- `apps/reception/src/components/checkout/Checkout.tsx` — line 323: `fridge: ""` hardcoded in useMemo guest derivation. `bagStorage` already subscribed (lines 96-99) and used (line 325). New hook will be added alongside.
- `apps/reception/src/components/checkout/CheckoutTable.tsx` — `Guest` interface line 34: `fridge?: string`. This will change to `fridgeUsed?: boolean`. Line 226: `{guest.fridge || ""}` will become a conditional icon + toggle button. `CheckoutTableProps` will gain an `onToggleFridge` callback.
- `apps/reception/src/types/component/checkoutrow.ts` — `CheckoutRow` has no fridge field. Correct — fridge is fetched separately like bagStorage and does not flow through `useCheckoutClient`.
- `apps/reception/src/hooks/data/useBagStorageData.ts` — the analogue read hook. Subscribes to `bagStorage` via `useFirebaseSubscription`, validates with `bagStorageSchema`, returns `{ bagStorage, loading, error }`.
- `apps/reception/src/schemas/bagStorageSchema.ts` — Zod schema analogue: `z.object({ optedIn: z.boolean() })`, `z.record(...)`.
- `apps/reception/src/types/hooks/data/bagStorageData.ts` — TypeScript interfaces analogue.
- `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts` — writes `bagStorage/<occupantId>` via Firebase `update()`. Fridge mutation will use the same `update()` pattern.
- `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts` — archives `bagStorage/<occupantId>` at lines 187-297. Must be extended for `fridgeStorage`.
- `apps/reception/database.rules.json` — no explicit `fridgeStorage` rule; `$other` wildcard covers it for now.
- `apps/reception/src/components/checkout/__tests__/CheckoutTable.component.test.tsx` — line 114-141: existing test passes `fridge: "Milk"` and asserts `screen.getByText("Milk")`. This test will need updating: the `fridge` string field becomes `fridgeUsed` boolean, and the display becomes an icon + button, not plain text.
- `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx` — DOM snapshot test; snapshot must be updated.

### Patterns & Conventions Observed
- Firebase read hook pattern: `useFirebaseSubscription<T>(path)` → validated with Zod → returned as typed state. Evidence: `useBagStorageData.ts`.
- Firebase write pattern: `update(ref(database, path), payload)` directly in mutation hook callback. Evidence: `usePrimeRequestResolution.ts:218`.
- Guest derivation pattern: `Checkout.tsx` useMemo looks up per-occupant data from separately-fetched node, maps to a `Guest` field. Evidence: `Checkout.tsx:291-329`.
- Toggle button pattern: stateful button renders current state and inverts on click (Complete/Undo in checkout, Luggage icon for bagStorage). Evidence: `CheckoutTable.tsx:229-254`.
- Archive pattern: read → copy to `archive/<node>/<occupantId>` → null live path. Evidence: `useArchiveCheckedOutGuests.ts:187-297`.
- Schema + type duality: Zod schema in `schemas/` plus separate TS interfaces in `types/hooks/data/`.

### Data & Contracts
- Types/schemas/events:
  - New: `fridgeStorageRecordSchema = z.object({ used: z.boolean() })`, `fridgeStorageSchema = z.record(fridgeStorageRecordSchema)` in `apps/reception/src/schemas/fridgeStorageSchema.ts`.
  - New: `FridgeStorageRecord { used: boolean }`, `FridgeStorage { [occupantId: string]: FridgeStorageRecord }` in `apps/reception/src/types/hooks/data/fridgeStorageData.ts`.
  - Change: `Guest` interface in `CheckoutTable.tsx` — replace `fridge?: string` with `fridgeUsed?: boolean`.
  - Change: `CheckoutTableProps` — add `onToggleFridge: (guestId: string, bookingRef: string, currentValue: boolean) => void`.
- Persistence:
  - Firebase path: `fridgeStorage/<occupantId>` with value `{ used: boolean }`.
  - Firebase archive path: `archive/fridgeStorage/<occupantId>`.
- API/contracts:
  - Firebase Realtime Database only. No HTTP API surface.
  - New explicit `fridgeStorage` rule in `database.rules.json`.

### Dependency & Impact Map
- Upstream dependencies:
  - `useFirebaseSubscription` — existing, unchanged.
  - `useFirebaseDatabase` — existing, unchanged.
  - Firebase Realtime Database — new node `fridgeStorage`.
- Downstream dependents:
  - `CheckoutTable.tsx` — type change (`fridge?: string` → `fridgeUsed?: boolean`), display change (text → icon), new `onToggleFridge` prop.
  - `Checkout.tsx` — new hook import and subscription, loading/error merge, useMemo mapping, and `onToggleFridge` handler wired to new mutation hook.
  - `useArchiveCheckedOutGuests` — additive update for `fridgeStorage` node.
  - `CheckoutTable.component.test.tsx` — fridge test case must be updated for new type and display.
  - `checkout-route.parity.test.tsx` — snapshot update required.
- Likely blast radius:
  - Contained to `apps/reception`. No shared packages, no external services.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library (unit/integration)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only)
- CI integration: tests run on push in GitHub Actions

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| CheckoutTable rendering | Component | `apps/reception/src/components/checkout/__tests__/CheckoutTable.component.test.tsx` | Fridge test at line 114–141 uses `fridge: "Milk"` string. Must be updated to `fridgeUsed: true` and icon/button assertion. |
| Checkout component integration | Integration | `apps/reception/src/components/checkout/__tests__/Checkout.test.tsx` | Mocks all data hooks. No fridge-specific assertion. New test case needed for fridge hook mock + toggle handler. |
| Checkout route parity | Parity | `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx` | DOM snapshot. Must be regenerated after changes. |
| bagStorageSchema | Schema unit | `apps/reception/src/schemas/__tests__/bagStorageSchema.test.ts` | Direct analogue — new `fridgeStorageSchema.test.ts` needed. |

#### Coverage Gaps
- Untested paths:
  - `fridgeStorageSchema.ts` — new, no test yet
  - `useFridgeStorageData.ts` — new, no test yet
  - `useSetFridgeUsedMutation.ts` — new, no test yet
  - Checkout.tsx fridge derivation + toggle handler — no integration test yet
- Existing tests to update:
  - `CheckoutTable.component.test.tsx` line 114–141: `fridge: "Milk"` → `fridgeUsed: true`, assertion changes from text to icon/button.
  - `checkout-route.parity.test.tsx`: snapshot regeneration.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | FRIDGE column header exists. Cell renders `{guest.fridge \|\| ""}` (text). No icon, no toggle button. | Column exists but display and interaction are unimplemented. Icon (e.g. `Refrigerator` from lucide-react or similar) + toggle button needed in the cell. Design-system `Button` component already used in the table. | Replace cell content with icon + Button toggle. Choose appropriate Lucide icon. |
| UX / states | Required | Empty state: blank cell when no fridge data. Loading state: global loading flag gates table render. Error state: global error banner exists. Toggle button: needs pending/disabled state during async write (analogous to Complete button). | Toggle must be disabled or show optimistic update during the Firebase `update()` call to prevent double-fire. No current precedent in checkout for a per-row async toggle with local pending state. | Plan must address per-row pending state for toggle (either optimistic UI or disabled-during-write). |
| Security / privacy | Required | `$other` wildcard allows any authenticated user read/write. All mutation callers in existing hooks gate on staff role. No PII in a boolean flag. | Explicit `fridgeStorage` rule needed with role-gated write. No sensitive data concern. | Add rule. |
| Logging / observability / audit | Required | Bag-storage and checkout mutations use `console.error` on failure + `showToast`. No per-action audit trail. | Same pattern applies. No new instrumentation needed. | Follow existing pattern. |
| Testing / validation | Required | Existing fridge test in `CheckoutTable.component.test.tsx` uses outdated `fridge: string` shape. No schema/hook/mutation tests for fridge. | Significant test gap: schema unit test, hook test, mutation test, updated component test, updated parity snapshot, new integration test case in `Checkout.test.tsx`. | All test files listed above must be created or updated. |
| Data / contracts | Required | No `fridgeStorage` Firebase node. `Guest.fridge?: string` in CheckoutTable — type will change to `fridgeUsed?: boolean`. `CheckoutTableProps` gains `onToggleFridge` callback. `CheckoutRow` unchanged. | Type change to `Guest` interface is a breaking change to the component contract — all callers and tests must be updated. Firebase schema, Zod schema, TS types all new. | Enumerate all callsites of `Guest.fridge` and `CheckoutTableProps`; update them all. |
| Performance / reliability | Required | `useBagStorageData` subscribes to the entire `bagStorage` node. Same approach for `fridgeStorage` is acceptable for a small hostel. Toggle mutation is a single `update()` call — fast and idempotent. | No performance concern. Toggle failure must show toast and not leave UI in inconsistent state (rollback optimistic update if used). | Ensure toggle error path shows toast (existing `showToast` utility). |
| Rollout / rollback | Required | No feature flags in this codebase. Changes are additive for Firebase node; type change to `Guest` interface is non-additive but contained to reception app. | Rollback: revert `Checkout.tsx`, `CheckoutTable.tsx`, and hook files. Firebase node persists but is harmless if not read. No migration required — node is created on first use. | No flag needed. Low risk deploy. |

## Questions
### Resolved
- Q: Does `CheckoutRow` need a fridge field?
  - A: No. Fridge data is fetched separately (same as bagStorage) and merged in `Checkout.tsx` useMemo.
  - Evidence: `apps/reception/src/types/component/checkoutrow.ts`, `apps/reception/src/components/checkout/Checkout.tsx:291-329`

- Q: What Firebase path should fridge use?
  - A: `fridgeStorage/<occupantId>` — mirrors `bagStorage/<occupantId>`.
  - Evidence: `apps/reception/src/hooks/data/useBagStorageData.ts:24`

- Q: Does the archive hook need to change?
  - A: Yes — additive update to read `fridgeStorage/<occupantId>`, copy to `archive/fridgeStorage/<occupantId>`, null live path.
  - Evidence: `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts:187-297`

- Q: Does `useAddGuestToBookingMutation` need to initialize the fridgeStorage node?
  - A: No. The node is created on first toggle. The read hook handles a missing node gracefully (returns `{}`).
  - Evidence: `apps/reception/src/hooks/data/useBagStorageData.ts:34-37`

- Q: What is the data model for fridge — string, list, or boolean?
  - A: Boolean flag `{ used: boolean }` — operator confirmed. Same shape as `bagStorage` (`{ optedIn: boolean }`).
  - Evidence: Operator confirmation 2026-03-13.

- Q: Where and how do staff record the fridge flag?
  - A: Inline toggle per guest row on the checkout screen itself — operator confirmed.
  - Evidence: Operator confirmation 2026-03-13.

- Q: Should the FRIDGE column display plain text or an icon?
  - A: Icon (same approach as the Luggage icon for bag storage) — operator confirmed.
  - Evidence: Operator confirmation 2026-03-13.

- Q: Is the existing `$other` wildcard in `database.rules.json` sufficient?
  - A: Technically yes, but explicit rule with role-gated write is the correct practice. Will add.
  - Evidence: `apps/reception/database.rules.json:263-266`

### Open (Operator Input Required)
None — all questions resolved.

## Confidence Inputs
- Implementation: 92%
  - Evidence: Full analogue (bagStorage) understood. Data model, UX, and display approach confirmed by operator. Implementation path is clear and bounded.
  - Remaining uncertainty: per-row pending state pattern for toggle button (no exact precedent in checkout screen for an async per-row toggle with local pending state).
- Approach: 90%
  - Evidence: Follow bagStorage pattern; add mutation hook and toggle button. No architectural decision open.
- Impact: 85%
  - Evidence: FRIDGE column exists and is already rendering-ready. Boolean + icon is minimal. Immediately useful for daily operations.
- Delivery-Readiness: 92%
  - Evidence: All analogous code understood. Scope fully defined. No blocking questions.
- Testability: 85%
  - Evidence: Schema, hook, and integration test patterns all have analogues. Toggle mutation is straightforward to mock.
  - Remaining uncertainty: archive hook has no existing tests — fridge archival path will also be hard to unit-test without Firebase mock infrastructure.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Toggle fires twice (double-click before disabled) | Low | Low — idempotent write | Disable button during async write or use optimistic update with rollback |
| Archive hook not updated — fridge flag left in active node after checkout archival | Low | Low — data is small and harmless | Archive hook update is in scope |
| Existing `CheckoutTable.component.test.tsx` fridge test breaks on type change | Certain | Low — easy fix | Update test as part of the change |
| Parity snapshot mismatch | Certain | Low — regenerate | Regenerate snapshot as part of the change |
| Lucide icon choice — no `Fridge` or `Refrigerator` icon in older lucide versions | Low | Low — fallback to another icon | Check lucide-react version available in reception app before choosing icon |

## Planning Constraints & Notes
- Must-follow patterns:
  - New schema: `apps/reception/src/schemas/fridgeStorageSchema.ts`
  - New types: `apps/reception/src/types/hooks/data/fridgeStorageData.ts`
  - New data hook: `apps/reception/src/hooks/data/useFridgeStorageData.ts`
  - New mutation hook: `apps/reception/src/hooks/mutations/useSetFridgeUsedMutation.ts`
  - Update `Checkout.tsx`: subscribe, merge loading/error, map to `Guest.fridgeUsed`, add `onToggleFridge` handler
  - Update `CheckoutTable.tsx`: `Guest.fridge?: string` → `Guest.fridgeUsed?: boolean`; add `onToggleFridge` prop; replace cell with icon + Button toggle
  - Update `useArchiveCheckedOutGuests.ts`: additive `fridgeStorage` archival block
  - Update `database.rules.json`: add `fridgeStorage` rule block
  - Update tests: `CheckoutTable.component.test.tsx` fridge test case, parity snapshot, new schema/hook/integration tests
- Rollout/rollback expectations:
  - No feature flag. Deploy is additive for Firebase; type change is contained to reception app.
- Observability expectations:
  - `console.error` + `showToast` on mutation failure (existing pattern).

## Suggested Task Seeds (Non-binding)
1. Create `fridgeStorageSchema.ts` (Zod: `{ used: boolean }`) + `fridgeStorageData.ts` (TS types) + schema unit test
2. Create `useFridgeStorageData.ts` data hook + hook unit test
3. Create `useSetFridgeUsedMutation.ts` mutation hook + unit test
4. Update `CheckoutTable.tsx`: `Guest.fridgeUsed?: boolean`, `onToggleFridge` prop, icon + toggle button in FRIDGE cell; update component test
5. Update `Checkout.tsx`: subscribe to `useFridgeStorageData`, wire `onToggleFridge`, map `fridgeUsed` in useMemo; add integration test case; update parity snapshot
6. Update `useArchiveCheckedOutGuests.ts`: add `fridgeStorage` archival block
7. Update `database.rules.json`: add `fridgeStorage` rule block

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - FRIDGE column shows fridge icon (toggleable) on the checkout screen
  - `Guest.fridgeUsed` boolean flows from Firebase → hook → `Checkout.tsx` → `CheckoutTable.tsx`
  - Toggle button writes to `fridgeStorage/<occupantId>` via mutation hook
  - Archive hook covers `fridgeStorage`
  - Firebase rules include explicit `fridgeStorage` block
  - All new tests pass in CI; updated tests pass; parity snapshot regenerated
- Post-delivery measurement plan:
  - Manual verification: toggle fridge flag for a test occupant; confirm icon appears and persists on reload

## Evidence Gap Review
### Gaps Addressed
- Full bag-storage analogue documented.
- All operator questions resolved.
- Type change to `Guest` interface and `CheckoutTableProps` identified and scoped.

### Confidence Adjustments
- All axes raised 5-10% after operator answers. Implementation confidence now 92%.

### Remaining Assumptions
- Lucide icon choice to be verified against lucide-react version in reception app during build.
- Per-row pending state approach (optimistic vs. disabled-during-write) to be decided at plan stage.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Firebase read hook pattern | Yes | None — bagStorage is direct analogue | No |
| Firebase schema + types pattern | Yes | None | No |
| Firebase mutation pattern | Yes | None — `update()` pattern well established | No |
| Checkout.tsx guest derivation pattern | Yes | `fridge: ""` hardcode at line 323 identified | Yes — replace with live data |
| CheckoutTable.tsx type change | Yes | `Guest.fridge?: string` → `Guest.fridgeUsed?: boolean`; `CheckoutTableProps` needs `onToggleFridge` | Yes — breaking type change, all callsites |
| Toggle button UX | Yes | No per-row async pending state precedent in checkout screen | Yes — plan must specify approach |
| Archive hook pattern | Yes | No fridge archival exists | Yes — additive update needed |
| Firebase rules | Yes | `$other` wildcard covers new node; explicit rule preferred | Yes — add `fridgeStorage` rule |
| Test coverage | Yes | Existing fridge test uses stale `string` type; must be updated; schema/hook/mutation tests new | Yes — multiple test files to create/update |
| Write UI scope | Yes | Inline toggle button per row confirmed by operator | No — fully scoped |

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step:
  - `/lp-do-analysis` then `/lp-do-plan` (auto-chain)
