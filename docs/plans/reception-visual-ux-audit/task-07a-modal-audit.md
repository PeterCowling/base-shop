# TASK-07a: Modal Migration Audit

Audit date: 2026-02-27
Auditor: TASK-07a fresh read pass of all 17 files
Scope: All files returned by `grep "fixed inset-0"` in `apps/reception/src`

> **Key finding:** All 16 dialog-pattern modals in this list already use `SimpleModal`. The `fixed inset-0` grep over-captured. The one genuine raw backdrop is in `AppNav.tsx`, which is a sidebar drawer, not a modal — it requires a Drawer/Sheet primitive, not `SimpleModal`. There is no outstanding modal migration backlog for these 17 files.

---

## SimpleModal API Reference

Source: `/Users/petercowling/base-shop/packages/ui/src/molecules/SimpleModal.tsx`
Import: `import { SimpleModal } from "@acme/ui/molecules";`

`SimpleModal` is **not** exported from `@acme/design-system`. It lives exclusively in `@acme/ui`.

```ts
export interface SimpleModalProps {
  isOpen: boolean;            // required — controls open/closed state
  onClose: () => void;        // required — fires on Esc, backdrop click, or X button
  title?: string;             // optional — rendered as DialogTitle; if omitted header is hidden
  children: React.ReactNode;  // required — body content in a px-6 py-4 wrapper
  maxWidth?: string;          // optional — Tailwind max-w class, default "max-w-lg"
  footer?: React.ReactNode;   // optional — rendered in footer bar (flex, justify-end, gap-2)
  showCloseButton?: boolean;  // optional — show X icon in header, default true
  className?: string;         // optional — extra classes on the dialog content panel
  backdropClassName?: string; // optional — extra classes on the backdrop overlay
}
```

**Behaviour notes:**

- Built on Radix UI `@radix-ui/react-dialog`. Focus trapping, scroll locking, Esc-to-close, and `aria-modal` are provided automatically.
- Returns `null` when `isOpen` is false — no DOM node rendered.
- The footer bar applies `flex items-center justify-end gap-2` automatically; do not add an outer wrapper just for alignment.
- `showCloseButton={false}` suppresses the X button (used during async operations that must not be interrupted).
- `backdropClassName` is additive on top of the default `bg-surface/50 backdrop-blur-sm`.

---

## Per-Modal Analysis

### 1. `hoc/withIconModal.tsx`

**File:** `apps/reception/src/hoc/withIconModal.tsx`

- **Pattern:** HOC factory — `withIconModal(config)` returns an `IconModal` component. Already delegates to `SimpleModal`.
- **Props (generated component):**
  ```ts
  interface IconModalProps {
    visible: boolean;     // isOpen equivalent (non-standard prop name)
    onClose: () => void;
    onLogout: () => void; // declared but unused inside the HOC body
    user: { email: string; user_name: string };
    interactive?: boolean;
  }
  ```
- **State:** None.
- **Handlers:** `handleActionClick(route)` — calls `onClose()` then `router.push(route)`. Disabled when `interactive=false`.
- **SimpleModal mapping:**
  - `isOpen` ← `visible`
  - `onClose` ← `onClose`
  - `title` ← `config.label`
  - `maxWidth` ← `"max-w-lg"` (hardcoded in HOC)
  - `footer` ← Close button (hardcoded in HOC)
  - `backdropClassName` ← `"bg-surface/80 backdrop-blur-md"` (hardcoded in HOC)
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.
- **Notes:** `onLogout` is declared in `IconModalProps` but never referenced inside the returned `IconModal` component. This is a pre-existing dead prop.

---

### 2. `checkins/header/ArchiveConfirmationModal.tsx`

**File:** `apps/reception/src/components/checkins/header/ArchiveConfirmationModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded (parent mounting controls visibility).
- **Props:**
  ```ts
  interface ArchiveConfirmationModalProps {
    onClose: () => void;
    onArchiveComplete: () => void;
  }
  ```
- **State:** None. Loading/error states live in `useArchiveCheckedOutGuests` and `useArchiveEligibleBookings` hooks.
- **Handlers:** `handleConfirm()` — async; calls archive mutation, refreshes bookings, calls `onArchiveComplete()`, then `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true` (hardcoded; parent controls mounting)
  - `onClose` ← `onClose`
  - `title` ← `"Archive Bookings"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Archive buttons
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 3. `checkins/header/DeleteConfirmationModal.tsx`

**File:** `apps/reception/src/components/checkins/header/DeleteConfirmationModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded.
- **Props:**
  ```ts
  interface DeleteConfirmationModalProps {
    booking: CheckInRow;
    onClose: () => void;
  }
  ```
- **State:** None. Loading/error in `useDeleteGuestFromBooking` hook.
- **Handlers:** `handleConfirmDelete()` — async; calls `deleteGuest({ bookingRef, occupantId })`, then `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Confirm Deletion"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Delete buttons
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 4. `checkins/header/BookingModal.tsx`

**File:** `apps/reception/src/components/checkins/header/BookingModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded.
- **Props:**
  ```ts
  interface BookingModalProps {
    booking: CheckInRow;
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [checkIn, setCheckIn] = useState<string>(booking.checkInDate);
  const [checkOut, setCheckOut] = useState<string>(booking.checkOutDate ?? "");
  const [extensionPrice, setExtensionPrice] = useState<string>("");
  const [priceError, setPriceError] = useState<string>("");
  ```
- **Handlers:** `handleCheckInChange`, `handleCheckOutChange`, `handleExtensionPriceChange` — controlled inputs. `handleSave()` — validates extension price if booking is extended, calls `updateBookingDates`, then `onClose()`. `isExtended` computed via `useMemo` comparing old vs new checkout dates. `useEffect` clears extension price when `isExtended` becomes false.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Booking Details"`
  - `maxWidth` ← `"max-w-md"`
  - `footer` ← Cancel + Save buttons
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 5. `checkins/notes/BookingNotesModal.tsx`

**File:** `apps/reception/src/components/checkins/notes/BookingNotesModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded.
- **Props:**
  ```ts
  interface Props {
    bookingRef: string;
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [text, setText] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  ```
- **Handlers:** `handleAdd()` — async, adds note, clears `text`. `handleUpdate()` — async, updates note, clears edit state. `handleDelete(id)` — async, deletes note, clears edit state if match. Inline handlers for per-note Edit/Cancel buttons.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Booking Notes"`
  - `maxWidth` ← `"max-w-md"`
  - `footer` ← Close + Add Note buttons
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 6. `prepayments/DisplayDialogue.tsx`

**File:** `apps/reception/src/components/prepayments/DisplayDialogue.tsx`

- **Pattern:** Controlled externally via `open: boolean` prop. Returns `null` early if `selectedBooking` is incomplete.
- **Props:**
  ```ts
  interface DisplayDialogProps {
    open: boolean;              // isOpen equivalent (non-standard name)
    details?: PaymentDetails;
    onClose: () => void;
    onEdit: () => void;
    onPaymentStatus: (status: PaymentStatus) => Promise<void>;
    selectedBooking?: SelectedBooking | null;
    setMessage: (msg: string) => void;  // declared; unused inside component
    createPaymentTransaction: (bookingRef: string, guestId: string, amount: number) => Promise<void>;
    logActivity: (bookingRef: string, code: number, description: string) => Promise<void>;
  }
  ```
- **State:** None.
- **Handlers:** `handlePaymentSuccess(status)` — calls `onPaymentStatus(status)` and logs errors.
- **SimpleModal mapping:**
  - `isOpen` ← `open`
  - `onClose` ← `onClose`
  - `title` ← `"Existing Payment Details"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← MarkAsFailedButton / disabled button + MarkAsPaidButton
  - `className` ← `"font-body"`
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.
- **Notes:** The `open` prop name (instead of `isOpen`) is a minor interface naming inconsistency relative to SimpleModal's own API. Works correctly at call sites.

---

### 7. `roomgrid/BookingDetailsModal.tsx`

**File:** `apps/reception/src/components/roomgrid/BookingDetailsModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded. No `footer` prop used — X close button only.
- **Props:**
  ```ts
  interface BookingDetailsModalProps {
    bookingDetails: BookingDetails; // { roomNumber, id, date, dayType, dayStatus, idSuffix?, titlePrefix?, info?, bookingRef?, occupantId?, firstName?, lastName? }
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [targetRoom, setTargetRoom] = useState<string>("");
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false);
  const [pendingGuestCount, setPendingGuestCount] = useState(0);
  ```
- **Handlers:** `handleClose()` — wraps `onClose()`. `handleMoveBooking()` — validates bookingRef + targetRoom, counts occupants, opens `ConfirmDialog`. `handleConfirmMoveBooking()` — async; iterates occupants and calls `allocateRoomIfAllowed` per occupant, then closes confirm dialog and calls `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `handleClose`
  - `title` ← `"Booking Details"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← not set (X button only)
- **Status:** Already uses `SimpleModal`. No raw backdrop. Renders a sibling `<ConfirmDialog>` (from `@acme/design-system`) outside the `SimpleModal` for the room-move confirmation step — this is intentional layering.
- **Complexity:** S — fully migrated; nothing to do.

---

### 8. `prepayments/EntryDialogue.tsx`

**File:** `apps/reception/src/components/prepayments/EntryDialogue.tsx`

- **Pattern:** Controlled externally via `open: boolean` prop. Dynamic title based on whether card details exist.
- **Props:**
  ```ts
  interface EntryDialogProps {
    open: boolean;                // isOpen equivalent
    initialCardNumber?: string;
    initialExpiry?: string;
    amountToCharge?: number;
    bookingRef?: string;
    onClose: () => void;
    onProcessPayment: (status: PaymentStatus) => Promise<void>;
    onSaveOrUpdate: (paymentInfo: PaymentInfo) => Promise<void>;
  }
  ```
- **State:**
  ```ts
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  ```
- **Handlers:** `handleCreditCardChange` / `handleCreditCardPaste` — digit-only filtering + space formatting. `handleExpiryChange` — MM/YY auto-format. `handleSaveOrUpdate()` — async, Zod validation, calls `onSaveOrUpdate`. `handleProcessClick()` — async, calls `onProcessPayment`. `useEffect` resets card/expiry state when `open` or initial props change.
- **SimpleModal mapping:**
  - `isOpen` ← `open`
  - `onClose` ← `onClose`
  - `title` ← dynamic (`"Update or Process Payment"` or `"Enter Payment Details"`)
  - `maxWidth` ← `"max-w-md"`
  - `footer` ← Process Payment (conditional) + Save/Update + Cancel buttons
  - `className` ← `"font-body"`
  - `showCloseButton` ← `{!isProcessing && !isSaving}` (suppresses X during async)
- **Status:** Already uses `SimpleModal`. No raw backdrop. The loading overlay inside the body (`absolute inset-0 bg-surface/75`) is a form overlay within `children`, not a modal backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 9. `prepayments/DeleteBookingModal.tsx`

**File:** `apps/reception/src/components/prepayments/DeleteBookingModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded.
- **Props:**
  ```ts
  interface DeleteBookingModalProps {
    booking: PrepaymentData;
    onClose: () => void;
  }
  ```
- **State:** None. Loading/error in `useDeleteBooking` hook.
- **Handlers:** `handleConfirmDelete()` — async; calls `deleteBooking(booking.bookingRef)`, then `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Confirm Deletion"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel + Delete buttons (DS `color="danger" tone="solid"`)
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 10. `loans/KeycardsModal.tsx`

**File:** `apps/reception/src/components/loans/KeycardsModal.tsx`

- **Pattern:** Fully controlled via `isOpen: boolean` prop. Passed to `SimpleModal` as `isOpen={isOpen && !!occupant}`.
- **Props:**
  ```ts
  interface KeycardsModalProps {
    isOpen: boolean;
    occupant?: Occupant; // { guestId, bookingRef, firstName, lastName }
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [editedTypes, setEditedTypes] = useState<Record<string, LoanMethod>>({});
  ```
- **Handlers:** `handleTypeChange(txnId, val)` — updates `editedTypes` map. `handleSave(txnId)` — picks between `convertKeycardDocToCash` or `updateLoanDepositType`; clears entry from `editedTypes` on success.
- **SimpleModal mapping:**
  - `isOpen` ← `isOpen && !!occupant`
  - `onClose` ← `onClose`
  - `title` ← `"Keycards on Loan"`
  - `maxWidth` ← `"max-w-md"`
  - `footer` ← not set (X button only)
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 11. `loans/LoanModal.tsx`

**File:** `apps/reception/src/components/loans/LoanModal.tsx`

- **Pattern:** Fully controlled via `isOpen: boolean` prop. Dynamic title based on `mode`.
- **Props:**
  ```ts
  interface LoanModalProps {
    isOpen: boolean;
    mode: "loan" | "return";
    occupant?: Occupant;
    item?: LoanItem;
    maxCount?: number;
    method?: LoanMethod;
    onClose: () => void;
    onConfirm: (count: number, depositType?: LoanMethod) => void;
  }
  ```
- **State:**
  ```ts
  const [countInput, setCountInput] = useState<string>("1");
  const [depositType, setDepositType] = useState<LoanMethod>("CASH");
  ```
- **Handlers:** `handleCountChange` — controlled input. `handleDepositTypeChange(value)` — updates `depositType`. `handleSubmit()` — parses count, calls `onConfirm(count, depositType)`, then `onClose()`. `useEffect` — resets `countInput` and `depositType` when `isOpen`, `item`, or `method` changes.
- **SimpleModal mapping:**
  - `isOpen` ← `isOpen`
  - `onClose` ← `onClose`
  - `title` ← `mode === "loan" ? "Add Loan" : "Return Item"`
  - `maxWidth` ← `"max-w-lg"`
  - `footer` ← Cancel + Confirm buttons
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 12. `till/EditTransactionModal.tsx`

**File:** `apps/reception/src/components/till/EditTransactionModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded. Submit action handled by `PasswordReauthInline` inside body (not a footer button).
- **Props:**
  ```ts
  interface EditTransactionModalProps {
    transaction: Transaction;
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [method, setMethod] = useState<string>(transaction.method || "");
  const [itemCategory, setItemCategory] = useState<string>(transaction.itemCategory || "");
  const [description, setDescription] = useState<string>(transaction.description || "");
  const [reason, setReason] = useState<string>("");
  ```
- **Handlers:** Per-field `onChange` handlers. `handleSave()` — async; Zod validates all fields + reason, calls `correctTransaction(txnId, {...}, reason)`, then `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Record Correction"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel button only; the Save action lives in body via `PasswordReauthInline`
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.
- **Notes:** The footer-has-cancel / body-has-submit split is intentional — `PasswordReauthInline` owns the submit trigger. This layout is working as designed.

---

### 13. `till/VoidTransactionModal.tsx`

**File:** `apps/reception/src/components/till/VoidTransactionModal.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded. Submit action via `PasswordReauthInline` inside body.
- **Props:**
  ```ts
  interface VoidTransactionModalProps {
    transaction: Transaction;
    onClose: () => void;
  }
  ```
- **State:**
  ```ts
  const [reason, setReason] = useState("");
  ```
- **Handlers:** `handleVoid()` — async; validates reason non-empty, calls `voidTransaction(txnId, reason)`, then `onClose()`.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `onClose`
  - `title` ← `"Void Transaction"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← Cancel button only; void confirm inside body via `PasswordReauthInline`
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 14. `bar/ModalPreorderDetails.tsx`

**File:** `apps/reception/src/components/bar/ModalPreorderDetails.tsx`

- **Pattern:** `isOpen` derived from prop (`!!preorder`). No footer — display-only modal.
- **Props:**
  ```ts
  type ModalPreorderDetailsProps = {
    occupantCheckIn: string;
    guestName: string;
    preorder: { [nightKey: string]: NightData } | null;
    onClose: () => void;
  }
  ```
- **State:** None in the main component. `PreorderNightDetails` child calls multiple data hooks but holds no local state.
- **Handlers:** None — display-only.
- **SimpleModal mapping:**
  - `isOpen` ← `!!preorder`
  - `onClose` ← `onClose`
  - `title` ← `` `Preorders for ${guestName}` ``
  - `maxWidth` ← `"max-w-lg"`
  - `footer` ← not set
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 15. `bar/orderTaking/preorder/PreorderButtons.tsx`

**File:** `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx`

- **Pattern:** Contains an inline `ConfirmDeleteModal` sub-component (not exported). The sub-component uses `SimpleModal` with `isOpen={true}` hardcoded. The parent `PreorderButton` controls mounting via `{isDeleteModalOpen && <ConfirmDeleteModal ... />}`.
- **Props of `ConfirmDeleteModal` (internal):**
  ```ts
  interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```
- **State in `PreorderButton`:**
  ```ts
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bleepNumber, setBleepNumber] = useState<string>("");
  ```
- **State in `PreorderButtons` (outer container):**
  ```ts
  const [snapshotData, setSnapshotData] = useState<PreorderButtonData[]>([]);
  const [displayData, setDisplayData] = useState<PreorderButtonDataWithRemoval[]>([]);
  ```
- **Handlers:** `openDeleteModal()` — sets `isDeleteModalOpen = true`. `handleConfirmDelete()` — async; sets `isDeleteModalOpen = false`, calls `deletePreorder`. `handleClick()` / `handleDoubleClick()` — complimentary order and sale-conversion flows. Firebase live listener in `PreorderButtons` populates `snapshotData`.
- **SimpleModal mapping (inside `ConfirmDeleteModal`):**
  - `isOpen` ← `true` (parent controls mounting)
  - `onClose` ← `onCancel`
  - `title` ← `"Delete Preorder"`
  - `maxWidth` ← `"max-w-xs"`
  - `footer` ← Yes (danger) + No buttons
- **Status:** `ConfirmDeleteModal` already uses `SimpleModal`. The `fixed inset-0` grep hit in this file was from the tooltip positioning `div` (absolute positioning chain on hover tooltip), not a modal backdrop.
- **Complexity:** S — fully migrated; nothing to do.

---

### 16. `safe/PettyCashForm.tsx`

**File:** `apps/reception/src/components/safe/PettyCashForm.tsx`

- **Pattern:** Controlled by parent via conditional render. `isOpen={true}` hardcoded. Submit action via `PasswordReauthInline` inside body. No footer prop.
- **Props:**
  ```ts
  export interface PettyCashFormProps {
    onConfirm: (amount: number) => void;
    onCancel: () => void;  // onClose equivalent (non-standard name)
  }
  ```
- **State:**
  ```ts
  const [amount, setAmount] = useState<string>("");
  ```
- **Handlers:** `handleCancel()` — clears `amount`, calls `onCancel()`. `handleAmountChange` — controlled input. `handleReauthSubmit()` — async; Zod validates amount, calls `onConfirm(amt)`, clears amount.
- **SimpleModal mapping:**
  - `isOpen` ← `true`
  - `onClose` ← `handleCancel` (not `onCancel` directly, because `handleCancel` also clears state)
  - `title` ← `"Petty Cash Withdrawal"`
  - `maxWidth` ← `"max-w-sm"`
  - `footer` ← not set; confirm action inside body via `PasswordReauthInline`
- **Status:** Already uses `SimpleModal`. No raw backdrop.
- **Complexity:** S — fully migrated; nothing to do.
- **Notes:** `onCancel` prop name (not `onClose`) is a minor inconsistency. The cancel-clears-state pattern via `handleCancel` wrapping `onCancel` is correct behaviour.

---

### 17. `appNav/AppNav.tsx`

**File:** `apps/reception/src/components/appNav/AppNav.tsx`

- **Pattern:** This is NOT a dialog modal. It is a slide-in sidebar navigation with a hand-rolled `fixed inset-0 bg-surface/80 backdrop-blur-sm` backdrop div. This is the source of the `fixed inset-0` grep match.
- **Props:**
  ```ts
  interface AppNavProps {
    user: { user_name: string; roles?: User["roles"] };
    onLogout: () => void;
  }
  ```
- **State:**
  ```ts
  const [isOpen, setIsOpen] = useState(false);
  ```
- **Handlers:** `toggleNav()` — flips `isOpen`. `closeNav()` — sets `isOpen = false`. `navigateTo(route)` — pushes route and calls `closeNav()`. `canAccessSection(permission)` — RBAC check.
- **SimpleModal mapping:** Not applicable. This is a sidebar drawer — it slides in from the left edge (`-translate-x-full` / `translate-x-0`), occupies full height, and does not centre content. `SimpleModal` is semantically wrong here.
- **Status:** The `fixed inset-0` is a genuine raw backdrop, but it belongs to a drawer pattern. No dialog migration applies.
- **Complexity:** L — not a modal; out of scope for this migration. A dedicated task should evaluate migrating to a `Drawer` or `Sheet` primitive from `@acme/design-system` (which would provide Radix-backed focus trapping and Esc handling for the sidebar).

---

## Summary Table

| # | File | Uses SimpleModal | Complexity | Notes |
|---|---|:---:|---|---|
| 1 | `hoc/withIconModal.tsx` | Yes | S | Fully migrated; `visible` prop maps to `isOpen` |
| 2 | `checkins/header/ArchiveConfirmationModal.tsx` | Yes | S | `isOpen={true}`; parent-mount pattern |
| 3 | `checkins/header/DeleteConfirmationModal.tsx` | Yes | S | `isOpen={true}`; parent-mount pattern |
| 4 | `checkins/header/BookingModal.tsx` | Yes | S | `isOpen={true}`; 4 state vars; date edit logic |
| 5 | `checkins/notes/BookingNotesModal.tsx` | Yes | S | `isOpen={true}`; inline CRUD for notes |
| 6 | `prepayments/DisplayDialogue.tsx` | Yes | S | `open` prop name (not `isOpen`); no state |
| 7 | `roomgrid/BookingDetailsModal.tsx` | Yes | S | `isOpen={true}`; sibling `ConfirmDialog` for room move |
| 8 | `prepayments/EntryDialogue.tsx` | Yes | S | `open` prop name; body loading overlay; `showCloseButton` during async |
| 9 | `prepayments/DeleteBookingModal.tsx` | Yes | S | `isOpen={true}`; no state |
| 10 | `loans/KeycardsModal.tsx` | Yes | S | `isOpen` prop; `isOpen && !!occupant` guard |
| 11 | `loans/LoanModal.tsx` | Yes | S | `isOpen` prop; 2 state vars; `useEffect` reset |
| 12 | `till/EditTransactionModal.tsx` | Yes | S | `isOpen={true}`; 5 state vars; `PasswordReauthInline` in body |
| 13 | `till/VoidTransactionModal.tsx` | Yes | S | `isOpen={true}`; 1 state var; `PasswordReauthInline` in body |
| 14 | `bar/ModalPreorderDetails.tsx` | Yes | S | `isOpen=!!preorder`; display-only |
| 15 | `bar/orderTaking/preorder/PreorderButtons.tsx` | Yes | S | Inline `ConfirmDeleteModal`; grep hit was tooltip div |
| 16 | `safe/PettyCashForm.tsx` | Yes | S | `isOpen={true}`; `onCancel` prop name; `PasswordReauthInline` in body |
| 17 | `appNav/AppNav.tsx` | N/A | L | Sidebar drawer — genuine `fixed inset-0` backdrop; needs Drawer primitive, not SimpleModal |

---

## Recommendation

### No Modal Migration Backlog

All 16 dialog-pattern components in this list already use `SimpleModal` correctly. The `fixed inset-0` grep returned these files, but the analysis of each file shows:

- **14 files** (entries 1–13, 14–16): Already using `SimpleModal`. The grep hit either came from a prior version that has since been migrated, or from a non-backdrop use of `fixed inset-0` (e.g. the tooltip `div` in `PreorderButtons.tsx`).
- **`PreorderButtons.tsx` (#15):** The `fixed inset-0` class appears in a tooltip positioning chain, not a modal backdrop. The inline `ConfirmDeleteModal` already uses `SimpleModal`.
- **`AppNav.tsx` (#17):** The only genuine raw `fixed inset-0` backdrop in the list. It belongs to a slide-in sidebar, not a dialog. `SimpleModal` is architecturally wrong for this pattern.

### Open Cosmetic Inconsistencies (non-blocking)

These do not affect correctness and can be deferred to a future polish pass:

1. **`open` vs `isOpen` prop naming** — `DisplayDialogue.tsx` and `EntryDialogue.tsx` expose `open: boolean`. Both map correctly to `SimpleModal`'s `isOpen` internally. The inconsistency is at the component's public interface level only.
2. **`onCancel` vs `onClose` prop naming** — `PettyCashForm.tsx` uses `onCancel`. It maps to `handleCancel` which wraps `onCancel` and also clears form state. The distinction is intentional and correct.
3. **`isOpen={true}` hardcoded pattern** — Several components rely on parent-mount-controls-visibility instead of a controlled `isOpen` prop. Both patterns work correctly with `SimpleModal`. The hardcoded-true pattern simplifies components that have no concept of "open state" themselves.

### AppNav Sidebar — Separate Task Required

`AppNav.tsx` contains the only genuine raw `fixed inset-0` backdrop in the audited set. To properly standardise it:

- Evaluate migrating the sidebar to a `Drawer` or `Sheet` primitive (Radix-backed focus trap, Esc key, scroll lock).
- The `isOpen` / `closeNav` / `toggleNav` state maps cleanly to a Drawer's `open` / `onOpenChange` API.
- This should be tracked as a separate task (AppNav-Drawer migration), not bundled with modal migration work.
