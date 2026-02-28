# Critique History: caryina-catalog-cart

## Round 3 — 2026-02-26 (plan.md — first plan critique)

Score: 4.0 / 5.0 | Verdict: credible | 0 Critical / 0 Major / 3 Moderate / 3 Minor

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-02 Approach / Decision Log | lowStockThreshold hardcoded to `2` factually wrong — `inventory.json` has per-SKU values 1, 2, 1; silver/peach threshold=1 means hardcode causes wrong "Low stock" at stock=2 |
| 3-02 | Moderate | TASK-07 Horizon assumptions | CHECKPOINT-07 lacks explicit replan branch if TASK-08 finds no viable stateless cart approach |
| 3-03 | Moderate | TASK-11 Edge Cases / Constraints | `driftPolicy` for `createCheckoutSession` not set in Constraints; default may be strict and cause checkout failures on price drift |
| 3-04 | Minor | TASK-05 Scouts / Planning validation | `readRepo` draft-status behaviour flagged as "Scout to confirm" but planning validation claims it's already confirmed — conflict between task sections |
| 3-05 | Minor | TASK-04 Green step | ID generation method ambiguous: "ULID or `crypto.randomUUID`" — UUID and ULID are different formats; existing product IDs should be matched |
| 3-06 | Minor | Contrarian / TASK-10 | Oversell risk (client-side qty ≤ stock check only; no atomic inventory decrement at checkout) not documented as accepted trade-off |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-04 | Moderate | CartProvider App Router compatibility unverified (carried 2 rounds) | Plan now explicitly gates TASK-09 on CHECKPOINT-07 + TASK-08; anonymous-state is a TASK-08 investigation question; carried-open status accepted as managed risk in TASK-08 scope |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Minor | 3 | Order record persistence not in scope — accepted trade-off, no change needed |
| 1-07 | Minor | 3 | Admin form fields MVP-scoped (English-only, media URL as text) — documented and accepted |

### Autofixes Applied This Round

| Fix | Target | Action |
|---|---|---|
| F9 | TASK-02 Approach | Replaced hardcode logic with per-SKU `lowStockThreshold` prop (from InventoryItem, default 2 if absent) |
| F10 | TASK-02 Acceptance | Updated StockBadge acceptance to use `lowStockThreshold` prop |
| F11 | TASK-02 TC-01 | Added silver SKU threshold=1 test case to validation contract |
| F12 | TASK-02 Green step | Updated Green step: StockBadge accepts `lowStockThreshold` prop; parent PLP/PDP reads inventory |
| F13 | TASK-02 Planning validation | Corrected: `lowStockThreshold` IS in InventoryItem; per-SKU values documented |
| F14 | Decision Log | Corrected lowStockThreshold entry: per-SKU from InventoryItem, prop-based, fallback 2 |
| F15 | Plan Gates | Updated edge-case review note: "stock threshold (per-SKU from InventoryItem)" |
| F16 | TASK-07 Horizon assumptions | Added explicit replan branch for TASK-08 no-viable-approach outcome |
| F17 | TASK-07 Validation contract | Updated to reference replan branch |
| F18 | TASK-11 Edge Cases | Set `driftPolicy: "log_only"` explicitly for Caryina MVP |
| F19 | Constraints | Added `driftPolicy: "log_only"` to global constraints |

---

## Round 2 — 2026-02-26

Score: 4.0 / 5.0 | Verdict: credible | No Critical / No Major remaining

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | `lowStockThreshold` not in SKU | Data gap note added; B1 updated to hardcoded threshold `2` |
| 1-02 | Major | Worker build prerequisite absent | Constraint added; A0 task seed added as hard prerequisite |
| 1-03 | Major | Stripe webhook absent | C5b task added (session.retrieve() verify on /success) |
| 1-05 | Moderate | C2 CartContext phrasing circular | C2 rewritten to describe `/api/cart` route handler implementation |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 2 | CartProvider App Router compatibility — typecheck spike needed before C1 |
| 1-06 | Minor | 2 | Order record persistence not in scope |
| 1-07 | Minor | 2 | Admin form fields not specified |

### Autofixes Applied This Round

| Fix | Target | Action |
|---|---|---|
| F8 | Task seed C2 | Rewrote to describe `/api/cart` route handler + anonymous-state verification gate |

---

## Round 1 — 2026-02-26

Score: 4.0 / 5.0 | Verdict: credible | Schema: Current

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Data & Contracts / Task seed B1 | `lowStockThreshold` not in `SKU` type — B1 unimplementable as written |
| 1-02 | Major | Constraints / Task seeds | Caryina Worker deployment prerequisite absent; all API routes unreachable without A0 |
| 1-03 | Major | Task seeds Workstream C | Stripe webhook / payment verification absent — checkout unreliable |
| 1-04 | Moderate | Remaining Assumptions | CartProvider App Router compatibility unverified; status `Ready-for-planning` despite untested load-bearing assumption |
| 1-05 | Moderate | Task seed C2 | `/api/cart` server-side implementation path unclear; CartContext is client-only |
| 1-06 | Minor | Task seed C5 | Order record persistence (`addOrder`) absent from C5 scope |
| 1-07 | Minor | Task seed A4 | Admin form field specification missing — multilingual + media scope unclear |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Moderate | 1 | CartProvider App Router compatibility — typecheck spike needed before C1 |
| 1-05 | Moderate | 1 | C2 CartContext phrasing ambiguity — verify `/api/cart` works anonymous |
| 1-06 | Minor | 1 | Order record persistence not in scope |
| 1-07 | Minor | 1 | Admin form fields not specified |

### Autofixes Applied This Round

| Fix | Target | Action |
|---|---|---|
| F1 | Data & Contracts | Added `lowStockThreshold` data gap note — MVP hardcode recommended |
| F2 | Task seed B1 | Replaced `lowStockThreshold` reference with `stock ≤ 2` hardcoded threshold |
| F3 | Constraints | Added Worker build prerequisite constraint |
| F4 | Task seeds | Added A0: Configure Caryina for Worker build |
| F5 | Task seeds | Added C5b: Stripe payment verify on `/success` |
| F6 | Risks | Added admin auth key leakage row with cookie security requirements |
| F7 | Remaining Assumptions | Clarified CartProvider anonymous-state assumption |
