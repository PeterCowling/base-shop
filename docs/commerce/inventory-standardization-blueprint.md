<!-- docs/commerce/inventory-standardization-blueprint.md -->

Type: Blueprint
Status: Draft
Domain: Commerce
Last-reviewed: 2025-12-22

# Inventory Standardization Blueprint (Current State → Unified Path)

Audience: Product, Engineering, Ops, Finance  
Purpose: Explain the repo’s *current* inventory reality and the smallest set of decisions required to standardize inventory across storefronts/runtimes—so unified checkout can be correct without the reader needing access to the codebase.

If behaviour in this blueprint contradicts the code, treat the code as canonical.

---

## 0) Scope and definitions

### Glossary

- **Inventory authority**: the single system that answers “is this purchasable right now?” and (in `reserve_ttl`) owns hold/commit/release.
- **Inventory store**: where inventory rows are persisted (today: Prisma/Postgres or JSON fallback).
- **Variant**: a unique purchasable row identified by `(shopId, sku, variantAttributes)`.
- **`variantKey`**: deterministic identifier derived from `sku + variantAttributes` used for DB uniqueness and map keys.
- **`validate_only`**: checkout creation re-reads canonical inventory and rejects if insufficient availability; **does not** prevent concurrency oversell.
- **`reserve_ttl`**: checkout creation creates a centralized hold with TTL; webhook success commits; failure/expiry releases.

### In scope (this blueprint)

- Standardize “inventory correctness” for checkout creation across Node and Worker runtimes.
- Standardize variant identity used for availability checks.
- Decide one inventory authority and define the transition from `validate_only` → `reserve_ttl`.

### Out of scope / non-goals (explicit)

Not currently represented in the repo’s inventory model (and must be treated as separate decisions if needed):

- Multi-warehouse/location-aware availability (beyond storing a `location` attribute as data).
- Bundles/kits and component-level inventory.
- Backorders/oversell-allowed SKUs (inventory quantity is validated as an integer `>= 0` today).

## 1) Executive summary (what leadership needs to know)

### What exists today (strong signal)

- There *is* a real “inventory store” in the platform: per-shop `InventoryItem[]` persisted via Prisma **or** JSON fallback (selected by `INVENTORY_BACKEND` / `DB_MODE`).
- Inventory is operationally usable today: CMS has an inventory editor + import/export + patch endpoints, plus low‑stock alerts and a scheduler.

### What is *not* true today (the blocker for unified checkout)

- Storefront cart/checkout enforcement is **not inventory-authoritative**:
  - Platform checkout uses **`sku.stock` stored inside cart lines** for validation.
  - Worker checkout shims use **hardcoded `inStock` booleans** in an in-memory catalog.
- There is **no reservation/hold authority** (no TTL holds, no commit/release on webhook). The Stripe metadata key exists (`inventory_reservation_id`) but is currently unused/empty.

Snapshot (repo reality → target):

| Runtime path | Current validation | Uses inventory store? | Target `validate_only` | Target `reserve_ttl` |
| --- | --- | --- | --- | --- |
| Template/tenant (Node) | `line.sku.stock` | No | read canonical inventory and reject | create hold; pass `inventory_reservation_id` |
| Worker shim | in-memory `inStock` | No | call authority and reject | create hold via authority; commit/release via webhook |

### The decision to make

To standardize inventory the same way as unified checkout, pick a single *inventory authority* that both Node and Worker runtimes can rely on, then phase in:

1) **Baseline**: `inventoryMode=validate_only` (consistent rejection of invalid checkouts everywhere, using fresh inventory reads; **still races under concurrency**)  
2) **Target**: `inventoryMode=reserve_ttl` (central reservation holds with TTL + webhook commit/release)

Recommended authority (lowest program risk given current repo direction): **Node/Prisma as canonical, with Worker calling Node APIs for validation/holds**.

---

## 2) Repo reality: “Inventory” today (what it is and where it lives)

### 2.1 Data model (current)

Inventory is stored as `InventoryItem` records keyed per shop:

- Required: `sku`, `productId`, `quantity`, `variantAttributes` (free-form map)
- Optional operational fields: `lowStockThreshold`, `wearCount`, `wearAndTearLimit`, `maintenanceCycle`
- DB uniqueness uses a computed `variantKey` (derived from `sku + variantAttributes`) to identify a specific variant row.

**Repo constraint (important for decision-makers):**

- `quantity` is an integer `>= 0` today (no backorders/infinite stock in the current model).
- `variantAttributes` is a `Record<string, string>` at the type boundary (imports may coerce values to strings).

**What “quantity” currently means in practice (repo reality):**

- In the inventory store, `quantity` is treated as a count of units for that `(sku, variantAttributes)` row.
- Low-stock alerts, CMS inventory management, and maintenance scans treat it as “units remaining”.
- Platform checkout **does not** currently validate against this store; it validates against `line.sku.stock` embedded in the cart.

**Standardization requirement (decision needed):**

Define whether `quantity` is “on-hand” or “available to promise” and how operational fields (maintenance/retirement) affect availability. Today, those semantics are implemented ad hoc (e.g., rental allocation checks wear limits) rather than centrally.

#### Variant identity (`variantKey`) (repo-accurate)

Current implementation (`packages/platform-core/src/types/inventory.ts`) is deterministic:

- Sort variant attribute keys lexicographically.
- Serialize each entry as `${key}:${value}` and join with `|`.
- If any attributes exist, return `${sku}#${variantPart}`, otherwise return `sku`.

**Important limitation:** keys/values are not escaped; if keys/values contain `#`, `|`, or `:`, collisions are possible. Standardization should either:

- restrict allowed characters for variant attribute keys/values (and enforce in CMS import/editor), or
- migrate `variantKey` to a hash of a canonical serialization (recommended long-term).

Storage backends (selected once per process):

- **Prisma/Postgres** (preferred when configured): table `InventoryItem` exists in `packages/platform-core/prisma/schema.prisma`.
- **JSON fallback**: `data/shops/<shop>/inventory.json` with a file lock (`.lock`) for local/offline safety.

Important governance detail: if one runtime uses `INVENTORY_BACKEND=json` and another uses `INVENTORY_BACKEND=prisma`, inventory becomes split‑brain. The resolver does not automatically sync between the two.

**Guardrail recommendation (not fully enforced today):** shared/production environments should explicitly set `DB_MODE=prisma` (and avoid JSON inventory writes) so “unified checkout correctness” is not undermined by backend drift.

### 2.2 Operational surfaces (current)

Inventory can be managed today through the CMS:

- Inventory editor UI at `apps/cms/src/app/cms/shop/[shop]/data/inventory/page.tsx`
- Admin API (import/export/write/patch):
  - `GET /api/data/:shop/inventory/export?format=json|csv`
  - `POST /api/data/:shop/inventory` (write full list; **replace semantics** in both Prisma + JSON backends)
  - `POST /api/data/:shop/inventory/import` (CSV/JSON upload)
  - `PATCH /api/data/:shop/inventory/:sku` (patch single variant; variant selection is `sku + variantAttributes`, defaulting to `{}` if omitted)

### 2.3 Background/ops behaviour (current)

- Low-stock alerts are implemented (`checkAndAlert`) and triggered:
  - automatically after inventory writes/updates, and/or
  - by a periodic scheduler (`scheduleStockChecks`).
- There are scripts for migration parity checks between JSON files and Prisma (`scripts/src/inventory/*`).
- There is a rental-ops notion in inventory (`wearCount`, maintenance/retirement checks) used by a maintenance scan job.

---

## 3) Repo reality: how checkout currently “checks inventory” (validate_only today)

### 3.1 Platform path (template app / cover-me-pretty)

Cart and checkout validation are currently based on `sku.stock` stored in the cart:

- Cart API (`@platform-core/cartApi`) rejects adds/updates when `newQty > sku.stock`.
- Checkout session creation (`@platform-core/checkout/createSession.ts`) throws `Insufficient stock` if `line.qty > line.sku.stock`.

This means the system is only as correct as the *SKU snapshot stored in the cart*, which can be stale relative to the inventory store.

### 3.2 Worker path (cochlearfit-worker)

The worker checkout shim validates against an in-memory catalog’s `inStock` flag and does not consult the platform inventory store.

It includes `metadata[inventory_reservation_id]` but sets it to an empty string.

---

## 4) Why this matters for unified checkout

Unified checkout across multiple sites/runtimes (sharing one Stripe account) creates new failure modes:

- **Oversell risk**: two runtimes can accept checkout for the last unit if they don’t share a single inventory authority.
- **Stale-cart risk**: “validate-only” checks that use `sku.stock` embedded in the cart are not a strong guarantee if inventory changes after add-to-cart.
- **Variant correctness risk**: the inventory store supports variant attributes, but cart/checkouts often validate only against a single numeric stock count.

This is why the checkout blueprint treats `reserve_ttl` as the real target once a centralized hold authority exists.

Guarantee note (important): even a perfect `validate_only` implementation (fresh inventory reads) **still allows oversell under concurrency** without holds/locks. It improves correctness and consistency, but not the “last-unit race”.

---

## 5) Decision options for a unified inventory authority

### Option A (recommended): Node + Prisma as canonical authority; Worker calls Node for inventory

What it means:

- Treat the platform inventory store (Prisma) as canonical.
- Expose a small Node API surface for:
  - validate availability (baseline), and
  - create/commit/release holds (target).
- Worker runtimes call these APIs over HTTPS.

Pros:

- Reuses existing schema + repository patterns.
- Minimizes new infra primitives while Worker is still in “shim” mode for commerce.
- Aligns with the already-selected standard “Node for checkout + webhook”.

Cons:

- Worker paths require a network call to Node for inventory correctness.
- Requires careful rate limiting + caching policy to avoid load spikes.
- Requires an explicit **fail policy** for outages (recommended: fail-closed for authoritative operations) and service-to-service auth.

Minimum policy (so correctness has a clear operational posture):

- **Fail closed** for inventory-authoritative operations: if the authority is unavailable, checkout creation must fail (do not “best-effort allow”).
- **Service auth required** for Worker → Node: use a dedicated service credential; Node must validate tenant/shop scope and reject cross-tenant access.

### Option B: Durable Object (or equivalent) as the reservation/availability authority

What it means:

- Put reservation logic into a single-writer entity (per shop or per SKU group).
- Both Worker and Node call it.

Pros:

- Strong concurrency semantics for Edge-first systems.

Cons:

- New infra surface + operational learning curve.
- Needs an explicit strategy to keep the existing Prisma inventory store consistent (or to migrate away from it).

### Option C: Redis (HTTP) holds + eventual consistency back to DB

What it means:

- Store holds and counters in a shared Redis reachable from both runtimes.

Pros:

- Common pattern for short-lived holds.

Cons:

- Additional provider + failure modes (network partitions, reconciliation).
- Requires careful “source of truth” rules (DB vs Redis) and cleanup.

---

## 6) Recommended phasing (how to proceed without stalling the program)

### Phase 1: Make `validate_only` real and consistent

Goal: every runtime rejects invalid checkout creation the same way, using current inventory—not stale cart snapshots.

Minimum changes (conceptual):

- On `POST /api/checkout-session`, re-hydrate/compute requested quantities against the canonical inventory store and reject with a consistent error contract (409/400 policy).
- Do not trust `sku.stock` embedded in cart state for correctness checks.
- Gate behaviour via `capabilities.inventoryMode=validate_only` and add conformance tests.

Guarantees / non-guarantees:

- ✅ Guarantees consistent validation against the inventory authority *at read time*.
- ❌ Does not guarantee “no oversell” under concurrency (two checkouts can validate simultaneously).

Recommended error shape (so UIs and worker shims can behave consistently):

```json
{
  "error": "Insufficient stock",
  "code": "inventory_insufficient",
  "items": [
    {
      "sku": "…",
      "variantAttributes": { "size": "…", "color": "…" },
      "variantKey": "…",
      "requested": 2,
      "available": 1
    }
  ]
}
```

### Phase 2: Implement `reserve_ttl` (shared reservation service)

Goal: once checkout creation succeeds, availability is guaranteed for a short TTL.

Minimum contract:

- `createHold({ shopId, cartId, cartVersion, items }) -> { holdId, expiresAt }` (idempotent)
- `commitHold(shopId, holdId)` on webhook success
- `releaseHold(shopId, holdId, reason)` on failure/expiry
- Pass `holdId` through Stripe as `inventory_reservation_id` and persist it on orders.

Required semantics (to avoid leaked or double-counted holds):

- Idempotency: `createHold` must be idempotent per `(shopId, cartId, cartVersion)`; `commitHold`/`releaseHold` must be idempotent under webhook retries.
- Cart mutation: define one policy (update hold vs release+recreate) and enforce it.
- Expiry: holds must auto-expire and release inventory; optionally extend TTL on active checkout refresh.

Reference stub: `docs/inventory/reservation-service.md`.

### Phase 3: Pull inventory correctness earlier (cart UX + availability messaging)

Goal: avoid “surprise out-of-stock at payment time” via consistent cart-side availability APIs and UI messaging.

---

## 7) Observability (minimum to prevent silent regressions)

- Track `inventory_validation_failures_total` and alert on sudden spikes (often indicates backend drift or a bad deploy).
- For `reserve_ttl`, track hold lifecycle metrics (created, committed, released, expired) and alert on abnormal expiry/leak rates.

---

## 8) Current code entrypoints (for implementers; optional)

- Inventory repository (backend selection, read/write/update):
  - `packages/platform-core/src/repositories/inventory.server.ts`
  - `packages/platform-core/src/repositories/inventory.prisma.server.ts`
  - `packages/platform-core/src/repositories/inventory.json.server.ts`
- Inventory schema + variant key:
  - `packages/platform-core/src/types/inventory.ts`
  - `packages/platform-core/prisma/schema.prisma` (`model InventoryItem`)
- CMS inventory APIs:
  - `apps/cms/src/app/api/data/[shop]/inventory/**`
- Current “validate-only” enforcement paths:
  - `packages/platform-core/src/cartApi.ts`
  - `packages/platform-core/src/checkout/createSession.ts`
  - `apps/cochlearfit-worker/src/index.ts`
- Checkout metadata plumbing for holds (already present):
  - `packages/platform-core/src/checkout/metadata.ts` (`inventory_reservation_id`)
  - `packages/platform-core/src/checkout/createSession.ts` (accepts `inventoryReservationId` option but no hold service exists yet)
  - `packages/platform-core/src/utils/inventory.ts` (has `computeAvailability(quantity, reserved, requested, allowBackorder)` helper; reserved is not persisted today)
