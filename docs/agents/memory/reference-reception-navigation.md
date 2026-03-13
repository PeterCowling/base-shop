# Reception App Navigation

## How it works

There is **no persistent sidebar**. Navigation is entirely keyboard-driven via overlaid modals.

- **ArrowUp** or **ArrowRight** → cycle to the next modal (forward)
- **ArrowDown** or **ArrowLeft** → cycle to the previous modal (backward)
- Keys cycle through 4 modals in a loop: `operations → till → management → man → operations → …`
- Pressing a key when no modal is open opens the first (or last) modal in the cycle
- Each modal shows a 3-column grid of icon+label buttons — clicking one navigates to that route and closes the modal

**Important for browser automation**: dispatch a `keydown` event with `key: "ArrowUp"` on `window` to open the first modal. Do not target an input/textarea element as focus when pressing — those elements capture arrow keys and the modal won't open.

```js
// Open next modal:
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
// Open previous modal:
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
```

---

## Modal 1: OPERATIONS

**Cycle position**: 1st (first on ArrowUp from no modal)
**Permission**: none — always accessible

| Label | Route | What it does |
|---|---|---|
| Bar | `/bar` | Bar POS — take food/drink orders, assign bleepers, process payments (SALES or COMP mode) |
| Check-in | `/checkin` | Guest check-in — assign rooms, collect city tax, insert doc records |
| Rooms | `/rooms-grid` | Visual room availability grid — see occupancy across dates |
| Check-out | `/checkout` | Guest departure — settle outstanding balances |
| Loans | `/loan-items` | Track items loaned to guests (e.g. towels, adaptors) |
| Extension | `/extension` | Extend a guest's stay dates |
| Inbox | `/inbox` | Email workspace — read guest threads, generate and send AI draft replies |
| Prime Requests | `/prime-requests` | View and action incoming booking requests from the Prime booking system |

---

## Modal 2: TILL

**Cycle position**: 2nd
**Permission**: `TILL_ACCESS` role required

| Label | Route | What it does |
|---|---|---|
| Till | `/till-reconciliation` | Daily cash till reconciliation — count denominations, record transactions |
| Safe | `/safe-reconciliation` | Safe cash audit — verify safe contents against expected total |
| Workbench | `/reconciliation-workbench` | Multi-transaction reconciliation tool for resolving discrepancies |
| Live | `/live` | Live financial activity stream — real-time view of transactions as they happen |
| Variance | `/variance-heatmap` | Variance heatmap — visual anomaly detection across till sessions |
| End of Day | `/end-of-day` | EOD closing procedures — checklist and summary for end-of-shift |

---

## Modal 3: MANAGEMENT

**Cycle position**: 3rd
**Permission**: none — always accessible

| Label | Route | What it does |
|---|---|---|
| Prepare | `/prepare-dashboard` | Room preparation dashboard — track cleaning/readiness for incoming guests |
| Prepayments | `/prepayments` | Prepayment tracking — view outstanding prepayments, send payment reminders |
| Opt-In | `/email-automation` | Email automation opt-in settings — configure which guests get automated emails |
| Search | `/audit` | Guest/booking search — look up any booking or guest record, view audit trail |

---

## Modal 4: MAN (Admin)

**Cycle position**: 4th (last — wraps back to OPERATIONS on next forward press)
**Permission**: `MANAGEMENT_ACCESS` role required

| Label | Route | What it does |
|---|---|---|
| Alloggiati | `/alloggiati` | Italian guest registration database — required legal guest records |
| Stock | `/stock` | General inventory management — track and update stock levels |
| Ingredients | `/ingredient-stock` | Bar/kitchen ingredient stock — track ingredient quantities |
| Real Time | `/real-time-dashboard` | Admin analytics dashboard — live metrics and KPIs |
| Manager Audit | `/manager-audit` | Manager activity audit trails — review staff actions |
| EOD Checklist | `/eod-checklist` | End-of-day supervisor checklist — distinct from Till EOD |
| Menu Performance | `/menu-performance` | Bar menu sales analysis — which items sell, revenue breakdown |
| Statistics | `/statistics` | Detailed historical analytics — year-on-year trends, performance |
| Staff Accounts | `/staff-accounts` | User provisioning — create/manage staff Firebase accounts (Pete only) |

> Note: Staff Accounts only appears for Pete's identity (`peter.cowling1976@gmail.com`).

---

## Summary: modal cycle order

```
[no modal] --ArrowUp--> OPERATIONS --ArrowUp--> TILL --ArrowUp--> MANAGEMENT --ArrowUp--> MAN --ArrowUp--> OPERATIONS ...
[no modal] --ArrowDown--> MAN --ArrowDown--> MANAGEMENT --ArrowDown--> TILL --ArrowDown--> OPERATIONS --ArrowDown--> MAN ...
```
