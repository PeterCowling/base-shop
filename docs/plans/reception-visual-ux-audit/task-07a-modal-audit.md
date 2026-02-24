# Modal Migration Guide (TASK-07a)

Audit date: 2026-02-24
Auditor: TASK-07a automated read pass
Scope: 17 custom `fixed inset-0` modal implementations in `apps/reception/src`

---

## SimpleModal API Reference

**Import path:** `@acme/ui/molecules` (exported from `packages/ui/src/molecules/index.ts`)
**Source:** `packages/ui/src/molecules/SimpleModal.tsx`

```tsx
import { SimpleModal } from "@acme/ui/molecules";
```

SimpleModal is NOT exported from `@acme/design-system`. It lives exclusively in `@acme/ui`.

### Props

| Prop | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| `isOpen` | `boolean` | yes | — | Controls visibility |
| `onClose` | `() => void` | yes | — | Called when Radix Dialog fires `onOpenChange(false)` (Escape key, backdrop click, or close button) |
| `title` | `string` | no | — | Renders a `<DialogTitle>` in the header; omit to suppress header entirely |
| `children` | `React.ReactNode` | yes | — | Body content, rendered in a `px-6 py-4` wrapper |
| `maxWidth` | `string` | no | `"max-w-lg"` | A Tailwind max-width class applied to the content panel |
| `footer` | `React.ReactNode` | no | — | Rendered in a bottom bar with `flex justify-end gap-2`; use for action buttons |
| `showCloseButton` | `boolean` | no | `true` | Shows the X icon button in the header |
| `className` | `string` | no | `""` | Extra classes on the content panel |
| `backdropClassName` | `string` | no | `""` | Extra classes on the backdrop overlay |

### Behaviour

- Built on Radix `@radix-ui/react-dialog`. Gets focus trapping, scroll locking, and Escape-to-close for free.
- Backdrop is `bg-black/50 backdrop-blur-sm` by default.
- Header is only rendered when `title` or `showCloseButton` are present.
- Footer alignment is `justify-end`; to centre buttons wrap them in a `<Cluster justify="center">` as seen in `AlertModal`.
- The component returns `null` when `isOpen` is false — callers that conditionally render the modal (e.g. `if (!isOpen) return null`) can keep that guard or remove it; both are safe.

### Reference usage (AlertModal.tsx)

```tsx
<SimpleModal
  isOpen={isOpen}
  onClose={onClose}
  title={title}
  maxWidth="max-w-sm"
  className=""
  backdropClassName=""
  footer={
    <Cluster justify="center" className="w-full">
      <Button type="button" onClick={onClose} autoFocus color={colors.buttonColor} tone="solid">
        {buttonLabel}
      </Button>
    </Cluster>
  }
>
  {/* body content */}
</SimpleModal>
```

---

## Modal Inventory

### withIconModal.tsx — Complexity: M

**File:** `apps/reception/src/hoc/withIconModal.tsx`

- **Props (generated component):** `visible: boolean`, `onClose: () => void`, `onLogout: () => void`, `user: { email: string; user_name: string }`, `interactive?: boolean`
- **Internal State:** none (state lives in consumers — AppNav etc.)
- **Event Handlers:**
  - `handleActionClick(route)` — calls `onClose()` then `router.push(route)`
  - Close button calls `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` ← `visible`
  - `onClose` ← `onClose`
  - `title` ← `config.label` (passed at HOC creation time)
  - `maxWidth` ← `"max-w-md"`
  - `footer` — not needed (Close button moves to footer or stays inline)
- **Migration Notes:** This is a HOC factory, not a single component. Migration requires updating the HOC to wrap the generated `IconModal` component in `<SimpleModal>` instead of the hand-rolled overlay. The `interactive` prop controls button disabled state — that stays internal. The `onLogout` prop is declared in `IconModalProps` but not used inside the HOC body itself (consumers use it directly). The four consumer files (`ManagementModal.tsx`, `ManModal.tsx`, `TillModal.tsx`, `OperationsModal.tsx`) do not need to change their call sites if the HOC signature is preserved. The `Grid` layout inside stays as-is in the body.

---

### AppNav.tsx — Complexity: S (not a true modal — sidebar drawer)

**File:** `apps/reception/src/components/appNav/AppNav.tsx`

- **Props:** `user: { user_name: string; roles?: User["roles"] }`, `onLogout: () => void`
- **Internal State:** `isOpen: boolean` (sidebar open/close toggle, `useState`)
- **Event Handlers:**
  - `toggleNav` — toggles `isOpen`
  - `closeNav` — sets `isOpen` to false
  - `navigateTo(route)` — pushes route, calls `closeNav`
  - `canAccessSection(permission)` — permission check helper
- **SimpleModal Mapping:** N/A — This is a sidebar navigation drawer, not a dialog modal. The `fixed inset-0 bg-black/50` div is a backdrop-only element (the nav slides from the left; it is not centred). SimpleModal is inappropriate here.
- **Migration Notes:** **Do not migrate to SimpleModal.** This component should be migrated to the DS `Drawer` primitive (`@acme/design-system/primitives/drawer`) which provides slide-in panel semantics, focus trapping, and backdrop. The `isOpen` / `closeNav` / `toggleNav` state maps cleanly to Drawer's `open` / `onOpenChange` API. Mark as separate task (AppNav-Drawer migration).

---

### VoidTransactionModal.tsx — Complexity: M

**File:** `apps/reception/src/components/till/VoidTransactionModal.tsx`

- **Props:** `transaction: Transaction`, `onClose: () => void`
- **Internal State:** `reason: string` (textarea value)
- **Event Handlers:**
  - `handleVoid` — validates reason, calls `voidTransaction(txnId, reason)`, then `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` — prop not present; caller conditionally renders. Add `isOpen={true}` or lift to caller. Suggested: add `isOpen` prop and gate on it, or keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Void Transaction"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` — Cancel button + `<PasswordReauthInline>` block (the reauth submits the void). The footer cannot hold PasswordReauthInline cleanly since it spans the full width with its own button; keep PasswordReauthInline in the body after the Cancel row, or restructure footer to two stacked elements.
- **Migration Notes:** Contains `<PasswordReauthInline>` which has its own submit button. The current layout puts Cancel in a separate row above PasswordReauthInline. This two-row button arrangement requires thoughtful footer layout — consider keeping PasswordReauthInline in the body and placing only Cancel in the footer, or using a vertical stack in footer. The `error` and warning paragraphs move to the body. Complexity rating M (internal state + reauth sub-component).

---

### PreorderButtons.tsx (ConfirmDeleteModal) — Complexity: S

**File:** `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`

- **Props (ConfirmDeleteModal inner component):** `onConfirm: () => void`, `onCancel: () => void`
- **Internal State:** none (state is in `PreorderButton` parent: `isDeleteModalOpen: boolean`)
- **Event Handlers:**
  - `onConfirm` — passed through; parent calls `deletePreorder`
  - `onCancel` — passed through; parent sets `isDeleteModalOpen(false)`
- **SimpleModal Mapping:**
  - `isOpen` ← `isDeleteModalOpen` (from `PreorderButton` state, passed as `{isDeleteModalOpen && <ConfirmDeleteModal .../>}`)
  - `onClose` ← `onCancel`
  - `title` ← `"Delete Preorder"` (suggested)
  - `maxWidth` ← `"max-w-xs"` (currently `w-300px` — narrow confirmation)
  - `footer` ← Yes/No buttons in a `<Cluster justify="center">` or `justify="between"`
- **Migration Notes:** The `ConfirmDeleteModal` is a purely presentational confirm dialog with no internal state. It is the simplest possible migration. The unusual `w-300px` custom width should become `max-w-xs`. The render gate `{isDeleteModalOpen && <ConfirmDeleteModal .../>}` can remain as-is since SimpleModal also returns null when `isOpen` is false, or convert to always-mounted with `isOpen={isDeleteModalOpen}`.

---

### PettyCashForm.tsx — Complexity: M

**File:** `apps/reception/src/components/safe/PettyCashForm.tsx`

- **Props:** `onConfirm: (amount: number) => void`, `onCancel: () => void`
- **Internal State:** `amount: string`
- **Event Handlers:**
  - `handleCancel` — clears `amount`, calls `onCancel()`
  - `handleAmountChange` — updates `amount`
  - `handleReauthSubmit` — validates amount via Zod schema, calls `onConfirm(amt)`, clears amount
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Add `isOpen` prop or keep caller-side conditional.
  - `onClose` ← `onCancel` (maps to `handleCancel` to clear state on close)
  - `title` ← `"Petty Cash Withdrawal"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` — none needed (PasswordReauthInline provides its own submit; no separate action row)
- **Migration Notes:** Contains `<PasswordReauthInline>` in the body (same pattern as VoidTransactionModal). The close button is currently a custom X in the top-right corner — SimpleModal's `showCloseButton={true}` replaces this. The amount `<Input>` goes in the body. `handleCancel` must be used as `onClose` (not `onCancel` directly) because it also clears state. Complexity M due to form state + reauth sub-component.

---

### ArchiveConfirmationModal.tsx — Complexity: M

**File:** `apps/reception/src/components/checkins/header/ArchiveConfirmationModal.tsx`

- **Props:** `onClose: () => void`, `onArchiveComplete: () => void`
- **Internal State:** none (async loading states come from hooks: `loading`, `bookingsLoading`, `bookings`, `error`, `bookingsError`)
- **Event Handlers:**
  - `handleConfirm` — calls `archiveCheckedOutGuests()`, `refreshBookings()`, `onArchiveComplete()`, `onClose()`
  - `useEffect` — triggers `refreshBookings()` on mount
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Add `isOpen` prop or keep conditional at call site.
  - `onClose` ← `onClose`
  - `title` ← `"Archive Bookings"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Archive buttons row
- **Migration Notes:** The scrollable booking list (`max-h-40 overflow-y-auto`) stays in the body. The footer buttons move to `footer` prop. The `useEffect` for `refreshBookings` stays unchanged. Complexity M because of async hook state and side-effect on mount.

---

### DeleteConfirmationModal.tsx (checkins) — Complexity: S

**File:** `apps/reception/src/components/checkins/header/DeleteConfirmationModal.tsx`

- **Props:** `booking: CheckInRow`, `onClose: () => void`
- **Internal State:** none (async states from `useDeleteGuestFromBooking`: `loading`, `error`)
- **Event Handlers:**
  - `handleConfirmDelete` — calls `deleteGuest({ bookingRef, occupantId })`, then `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Confirm Deletion"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Delete buttons
- **Migration Notes:** Pure confirmation dialog with no internal state. The irreversibility warning paragraph stays in the body. Error message paragraph stays in body above footer. This is the cleanest S-complexity migration after ConfirmDeleteModal in PreorderButtons.

---

### DisplayDialogue.tsx (prepayments) — Complexity: S

**File:** `apps/reception/src/components/prepayments/DisplayDialogue.tsx`

- **Props:** `open: boolean`, `details?: PaymentDetails`, `onClose: () => void`, `onEdit: () => void`, `onPaymentStatus: (status) => Promise<void>`, `selectedBooking?: SelectedBooking | null`, `setMessage: (msg: string) => void`, `createPaymentTransaction: (...) => Promise<void>`, `logActivity: (...) => Promise<void>`
- **Internal State:** none
- **Event Handlers:**
  - `handlePaymentSuccess(status)` — calls `onPaymentStatus(status)`
  - `hasCard` computed check for conditional button display
  - `onEdit` button passes through directly
- **SimpleModal Mapping:**
  - `isOpen` ← `open` (already boolean prop — direct mapping)
  - `onClose` ← `onClose`
  - `title` ← `"Existing Payment Details"`
  - `maxWidth` ← `"max-w-sm"` (currently `w-96` fixed width)
  - `footer` ← MarkAsFailedButton + MarkAsPaidButton row
- **Migration Notes:** Already uses `open` as an `isOpen`-equivalent boolean prop with early `return null` guard — the cleanest existing API shape. The header's border-bottom, content section, and actions section are a natural body + footer split. The `font-body` class on the outer div may need to be preserved via `className` prop. Complexity S — no internal state, straightforward prop mapping.

---

### BookingDetailsModal.tsx (roomgrid) — Complexity: L

**File:** `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`

- **Props:** `bookingDetails: BookingDetails`, `onClose: () => void`
- **Internal State:** `targetRoom: string`, `confirmMoveOpen: boolean`, `pendingGuestCount: number`
- **Event Handlers:**
  - `handleClose` — calls `onClose()`
  - `handleMoveBooking` — validates bookingRef + targetRoom, counts occupants, sets `confirmMoveOpen(true)`
  - `handleConfirmMoveBooking` — async, iterates occupants, calls `allocateRoomIfAllowed` per occupant, closes confirm dialog, calls `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `handleClose`
  - `title` ← `"Booking Details"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Move Booking button (or keep inline since it's contextual to the select)
- **Migration Notes:** Complexity L because: (1) nested `<ConfirmDialog>` (already a DS primitive) is rendered as a sibling — must remain outside SimpleModal or be rendered inside the body; (2) the room move UI (Select + Move button) is a conditional sub-section that only shows when `bookingRef` exists; (3) three pieces of internal state; (4) async multi-step mutation. The `<ConfirmDialog>` sibling cannot be in the SimpleModal footer — render it as a sibling of SimpleModal (or nested inside the body wrapped in a fragment). The X close button in the current overlay (`absolute top-2 right-2`) is replaced by SimpleModal's built-in `showCloseButton`. The Select + Move button can live in the footer or remain in the body.

---

### EntryDialogue.tsx (prepayments) — Complexity: L

**File:** `apps/reception/src/components/prepayments/EntryDialogue.tsx`

- **Props:** `open: boolean`, `initialCardNumber?: string`, `initialExpiry?: string`, `amountToCharge?: number`, `bookingRef?: string`, `onClose: () => void`, `onProcessPayment: (status) => Promise<void>`, `onSaveOrUpdate: (paymentInfo) => Promise<void>`
- **Internal State:** `cardNumber: string`, `expiryDate: string`, `isProcessing: boolean`, `isSaving: boolean`
- **Event Handlers:**
  - `handleCreditCardChange` — digit-only filtering + formatting
  - `handleCreditCardPaste` — paste sanitisation
  - `handleExpiryChange` — MM/YY auto-formatting
  - `handleSaveOrUpdate` — Zod validation, sets `isSaving`, calls `onSaveOrUpdate`
  - `handleProcessClick` — sets `isProcessing`, simulates payment, calls `onProcessPayment`
- **SimpleModal Mapping:**
  - `isOpen` ← `open`
  - `onClose` ← `onClose` (disabled during `isProcessing || isSaving`)
  - `title` ← dynamic: `"Update or Process Payment"` or `"Enter Payment Details"` + subtitle with bookingRef/amount
  - `maxWidth` ← `"max-w-md"`
  - `footer` ← Process Payment (conditional) + Save/Update + Cancel buttons
- **Migration Notes:** Complexity L because: (1) four pieces of internal state; (2) custom paste handler on credit card input; (3) in-body loading overlay (`absolute inset-0` spinner div) that overlays the form during async operations — this conflicts with SimpleModal's content wrapper padding; the loading overlay must be preserved as a relative-positioned wrapper inside the body; (4) dynamic title based on `hasExistingCard`; (5) `onClose` must be disabled during loading but SimpleModal's built-in close button does not accept a `disabled` prop — use `showCloseButton={false}` during loading or override. The `font-body` outer class can be passed via `className`. The `useEffect` that resets state on `open`/initial-data change stays unchanged.

---

### DeleteBookingModal.tsx (prepayments) — Complexity: S

**File:** `apps/reception/src/components/prepayments/DeleteBookingModal.tsx`

- **Props:** `booking: PrepaymentData`, `onClose: () => void`
- **Internal State:** none (async states from `useDeleteBooking`: `loading`, `error`)
- **Event Handlers:**
  - `handleConfirmDelete` — calls `deleteBooking(booking.bookingRef)`, then `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Confirm Deletion"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Delete buttons (already using DS Button `color="danger" tone="solid"`)
- **Migration Notes:** Nearly identical in shape to `DeleteConfirmationModal.tsx`. No internal state. The danger-copy paragraph ("This will remove all guests") and optional error paragraph go in the body. Footer receives the two buttons. Straightforward S migration.

---

### KeycardsModal.tsx — Complexity: M

**File:** `apps/reception/src/components/loans/KeycardsModal.tsx`

- **Props:** `isOpen: boolean`, `occupant?: Occupant`, `onClose: () => void`
- **Internal State:** `editedTypes: Record<string, LoanMethod>` (tracks per-txn pending deposit type changes)
- **Event Handlers:**
  - `handleTypeChange(txnId, val)` — updates `editedTypes`
  - `handleSave(txnId)` — decides between `convertKeycardDocToCash` and `updateLoanDepositType`, clears that key from `editedTypes` on success
- **SimpleModal Mapping:**
  - `isOpen` ← `isOpen` (already the correct prop name — direct mapping)
  - `onClose` ← `onClose`
  - `title` ← `"Keycards on Loan"`
  - `maxWidth` ← `"max-w-md"`
  - `footer` — no dedicated footer needed; close button in header is sufficient
- **Migration Notes:** The early `if (!isOpen || !occupant) return null` guard can be replaced with `isOpen={isOpen && !!occupant}`. The occupant info display, loading/error states, and keycard list are all body content. The inline Save button per keycard row stays inside the list. The header X button in the current implementation is a custom Button element — replaced by SimpleModal's `showCloseButton`. Complexity M due to per-item edit state map and async save per row.

---

### LoanModal.tsx — Complexity: M

**File:** `apps/reception/src/components/loans/LoanModal.tsx`

- **Props:** `isOpen: boolean`, `mode: "loan" | "return"`, `occupant?: Occupant`, `item?: LoanItem`, `maxCount?: number`, `method?: LoanMethod`, `onClose: () => void`, `onConfirm: (count: number, depositType?: LoanMethod) => void`
- **Internal State:** `countInput: string`, `depositType: LoanMethod`
- **Event Handlers:**
  - `handleCountChange` — updates `countInput`
  - `handleDepositTypeChange(value)` — updates `depositType`
  - `handleSubmit` — parses count, calls `onConfirm(count, depositType)`, calls `onClose()`
  - `useEffect` — resets `countInput` and `depositType` when `isOpen`, `item`, or `method` changes
- **SimpleModal Mapping:**
  - `isOpen` ← `isOpen` (direct mapping)
  - `onClose` ← `onClose`
  - `title` ← `mode === "loan" ? "Add Loan" : "Return Item"` (dynamic)
  - `maxWidth` ← `"max-w-lg"` (currently `max-w-lg`, matches default)
  - `footer` ← Cancel + Confirm buttons
- **Migration Notes:** The three `bg-surface-2 p-3 rounded` content sections (occupant details, item details, quantity input, deposit method) all become body content. Footer receives Cancel + Confirm. The `useEffect` reset on `isOpen` stays. The `role="dialog"` and `aria-modal="true"` attributes are handled by Radix Dialog internally — remove manual aria attributes. Complexity M due to two state variables + conditional deposit-method section + useEffect reset.

---

### EditTransactionModal.tsx — Complexity: M

**File:** `apps/reception/src/components/till/EditTransactionModal.tsx`

- **Props:** `transaction: Transaction`, `onClose: () => void`
- **Internal State:** `amount: string`, `method: string`, `itemCategory: string`, `description: string`, `reason: string`
- **Event Handlers:**
  - `handleSave` — Zod validation of all fields + reason, calls `correctTransaction(txnId, {...}, reason)`, then `onClose()`
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Record Correction"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` — `<PasswordReauthInline>` provides its own submit button; place Cancel in footer, keep reauth in body. Or reverse: Cancel in footer, reauth wraps the submit action.
- **Migration Notes:** Five state variables (amount, method, itemCategory, description, reason). Contains `<PasswordReauthInline>` — same layout challenge as VoidTransactionModal and PettyCashForm. The Cancel button currently sits below PasswordReauthInline in a `flex-col gap-3` div. In SimpleModal, putting Cancel in the footer and PasswordReauthInline in the body (bottom of form) preserves this vertical ordering. Complexity M due to multi-field form state + reauth component.

---

### ModalPreorderDetails.tsx — Complexity: L

**File:** `apps/reception/src/components/bar/ModalPreorderDetails.tsx`

- **Props:** `occupantCheckIn: string`, `guestName: string`, `preorder: { [nightKey: string]: NightData } | null`, `onClose: () => void`
- **Internal State:** none (data loading states are in child hooks within `PreorderNightDetails`)
- **Event Handlers:**
  - `useEffect` — attaches `keydown` listener for Escape key to call `onClose()` — this is redundant with SimpleModal/Radix Dialog's built-in Escape handling
  - `onClick` on backdrop — checks `e.target === e.currentTarget` to close on backdrop click only — also redundant with SimpleModal
  - `onKeyDown` on backdrop — Enter/Space close — accessibility pattern, also handled by Radix
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; guarded by `if (!preorder) return null`. Add `isOpen` prop or keep caller-side conditional (preorder null check becomes the isOpen gate).
  - `onClose` ← `onClose`
  - `title` ← `"Preorders for {guestName}"` (dynamic)
  - `maxWidth` ← `"max-w-lg"`
  - `footer` — no footer needed (no action buttons; read-only display)
  - `showCloseButton` ← `true` (replaces the absolute-positioned X button)
- **Migration Notes:** Complexity L because: (1) `preorder` null guard serves as the isOpen gate — must decide on ownership of open/close logic; (2) the `PreorderNightDetails` child calls up to 6 hooks (3x `useCompletedOrder`, 3x `usePlacedPreorder`), producing heavy nested async rendering with many loading states; (3) the `max-h-screen overflow-y-auto` on the content div must be preserved inside the SimpleModal body — use `className` on the body wrapper or constrain height within the children; (4) three manual event listeners/handlers that are superseded by Radix internals (Escape key, backdrop click, keyboard backdrop). Remove manual handlers; trust Radix. The body becomes a scrollable `<div className="max-h-[70vh] overflow-y-auto">` wrapping the night-detail entries.

---

### BookingModal.tsx (checkins dates editor) — Complexity: M

**File:** `apps/reception/src/components/checkins/header/BookingModal.tsx`

- **Props:** `booking: CheckInRow`, `onClose: () => void`
- **Internal State:** `checkIn: string`, `checkOut: string`, `extensionPrice: string`, `priceError: string`
- **Event Handlers:**
  - `handleKeyDown` — Enter/Space on backdrop closes modal (superseded by SimpleModal/Radix)
  - `handleCheckInChange` — updates `checkIn`
  - `handleCheckOutChange` — updates `checkOut`
  - `handleExtensionPriceChange` — updates `extensionPrice`, clears `priceError`
  - `handleSave` — validates extension price if needed, calls `updateBookingDates(...)`, then `onClose()`
  - `useEffect` — clears extensionPrice + priceError when `isExtended` becomes false
  - `isExtended` — `useMemo` comparing old vs new checkOut dates
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Booking Details"`
  - `maxWidth` ← `"max-w-md"` (currently `max-w-md w-11/12`)
  - `footer` ← Cancel + Save buttons
- **Migration Notes:** Four state variables. The backdrop `onClick={onClose}` and `onKeyDown` handlers are superseded by SimpleModal/Radix — remove the manual backdrop div entirely. The read-only fields (Booking Ref, Guest Name, Room Booked, Room Allocated) and editable date inputs all become body content. The conditional extension price input stays in body. Save/Cancel go to footer. The `isLoading` state from `useBookingDatesMutator` should disable the Save button in footer. Complexity M due to multi-field date-editing form with conditional extension logic.

---

### BookingNotesModal.tsx — Complexity: M

**File:** `apps/reception/src/components/checkins/notes/BookingNotesModal.tsx`

- **Props:** `bookingRef: string`, `onClose: () => void`
- **Internal State:** `text: string` (new note draft), `editingId: string | null`, `editText: string`
- **Event Handlers:**
  - `handleAdd` — trims text, calls `addNote(bookingRef, text)`, clears `text`
  - `handleUpdate` — calls `updateNote(bookingRef, editingId, editText)`, clears `editingId`/`editText`
  - `handleDelete(id)` — calls `deleteNote(bookingRef, id)`, clears edit state if editing that note
  - `handleKeyDown` — Enter/Space on backdrop closes (superseded by SimpleModal/Radix)
- **SimpleModal Mapping:**
  - `isOpen` — prop absent; always renders when mounted. Keep caller-side conditional.
  - `onClose` ← `onClose`
  - `title` ← `"Booking Notes"`
  - `maxWidth` ← `"max-w-md"` (currently `max-w-md w-11/12`)
  - `footer` ← Close + Add Note buttons
- **Migration Notes:** Three state variables. The notes list (`max-h-64 overflow-y-auto`) stays in body. The inline edit Textarea + Save/Cancel per note row stays in body. The new note Textarea goes in body above the footer. The `handleKeyDown` backdrop handler is superseded — remove manual backdrop div. The sorted notes derivation (`Object.entries(notes).sort(...)`) is a pure computation that stays. Complexity M due to three state variables and inline CRUD operations per note.

---

## Execution Recommendation

### Summary counts

| Complexity | Count | Files |
|------------|-------|-------|
| S (simple swap) | 5 | ConfirmDeleteModal (PreorderButtons), DeleteConfirmationModal, DisplayDialogue, DeleteBookingModal, AppNav* |
| M (form/state to preserve) | 9 | withIconModal HOC, VoidTransactionModal, PettyCashForm, ArchiveConfirmationModal, KeycardsModal, LoanModal, EditTransactionModal, BookingModal, BookingNotesModal |
| L (complex/nested) | 3 | BookingDetailsModal, EntryDialogue, ModalPreorderDetails |

*AppNav is an S-effort component but should migrate to Drawer, not SimpleModal.

### Effort distribution

- **S modals (5):** ~15–30 min each. Low risk. Can all be batched into a single pass.
- **M modals (9):** ~45–90 min each. Moderate risk (form state, reauth sub-component, useEffect). Recommend grouping by sub-system:
  - **Reauth group (3):** VoidTransactionModal, PettyCashForm, EditTransactionModal — share identical PasswordReauthInline layout challenge; do together.
  - **Loans group (2):** KeycardsModal, LoanModal — share `isOpen` prop naming, straightforward.
  - **Checkins group (3):** ArchiveConfirmationModal, BookingModal, BookingNotesModal — share backdrop keydown removal pattern.
  - **HOC group (1):** withIconModal — isolated, affects 4 consumer files.
- **L modals (3):** ~2–4 hours each. High risk of regressions. Recommend separate PR per component:
  - BookingDetailsModal — nested ConfirmDialog coordination
  - EntryDialogue — in-body loading overlay + disabled close button
  - ModalPreorderDetails — remove manual event listeners, scrollable body, hook-heavy children

### Recommended TASK-07b sequencing

1. **Batch A — S modals** (one PR): DeleteBookingModal, DeleteConfirmationModal, DisplayDialogue, ConfirmDeleteModal (inside PreorderButtons). Quick wins, test snapshot coverage.
2. **Batch B — Reauth M modals** (one PR): VoidTransactionModal, PettyCashForm, EditTransactionModal. Establish the PasswordReauthInline + SimpleModal layout pattern once, apply three times.
3. **Batch C — Loans M modals** (one PR): KeycardsModal, LoanModal. Clean `isOpen` prop naming, no reauth.
4. **Batch D — Checkins M modals** (one PR): ArchiveConfirmationModal, BookingModal, BookingNotesModal.
5. **Batch E — withIconModal HOC** (one PR): Migrate HOC; verify ManagementModal, ManModal, TillModal, OperationsModal automatically inherit.
6. **Batch F — L modals** (one PR each): BookingDetailsModal, EntryDialogue, ModalPreorderDetails.
7. **Separate task — AppNav Drawer migration**.

Total estimated effort: ~3–5 developer-days for full migration.

---

## withIconModal.tsx Consumer List

Files that import and use the `withIconModal` HOC:

| File | Usage |
|------|-------|
| `apps/reception/src/components/appNav/ManagementModal.tsx` | `export default withIconModal({ label: ..., actions: [...] })` |
| `apps/reception/src/components/appNav/ManModal.tsx` | `const BaseManModal = withIconModal({ label: ..., actions: [...] })` — wraps with additional functionality |
| `apps/reception/src/components/appNav/TillModal.tsx` | `const BaseTillModal = withIconModal({ label: ..., actions: [...] })` — wraps with additional functionality |
| `apps/reception/src/components/appNav/OperationsModal.tsx` | `export default withIconModal({ label: ..., actions: [...] })` |
| `apps/reception/src/components/appNav/__tests__/Modals.test.tsx` | Test file — mocks `withIconModal` via `jest.mock` |

All four production consumers use the same HOC pattern and will benefit automatically from any HOC-level migration. The test file mocks the HOC at the module boundary and does not need modification for the migration itself.
