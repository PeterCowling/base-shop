---
Task: TASK-08
Plan: caryina-catalog-cart
Produced: 2026-02-26
---

# TASK-08: Cart API Storage Backend — Investigation Findings

## Question 1: Auth requirement

**No session/auth token required. The cart API uses anonymous HMAC-signed cookies only.**

Every handler in `cartApiForShop.ts` reads identity exclusively from the `__Host-CART_ID` cookie:

```
// packages/platform-core/src/cartApiForShop.ts:55, 120, 165, 197, 218
let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as string | null;
```

There is no `Authorization` header check, no session middleware, no user-ID lookup. If the cookie is absent, the GET and POST handlers automatically create a new anonymous cart (`createCart()`) and set the cookie in the response. The cookie itself is HMAC-signed (SHA-256 via `CART_COOKIE_SECRET`) to prevent forgery, but the client just receives an opaque signed blob as a plain browser cookie.

---

## Question 2: Is `cartCookie.ts` stateless?

**No. The cookie stores only a signed cart ID — the backend holds cart state. The API is NOT stateless.**

`cartCookie.ts` exposes two helpers:

- `encodeCartCookie(value: string)` — base64url-encodes a string then appends an HMAC-SHA256 signature. The `value` is the cart UUID, not the cart contents. (`cartCookie.ts:48`)
- `decodeCartCookie(raw)` — verifies the signature and returns the decoded cart UUID. (`cartCookie.ts:61`)

Cookie name is `__Host-CART_ID` (`cartCookie.ts:14`). The cookie value is a signed cart UUID. Cart state (items, quantities, totals) is held server-side in whichever backend is active. Route handlers call `getCart(cartId)` and `setCart(cartId, cart)` after decoding the cookie, confirming the backend is the authoritative store.

---

## Question 3: Cookie-based route handler?

**Yes. `cartApiForShop.ts` is exactly this and is directly adaptable for Caryina.**

`packages/platform-core/src/cartApiForShop.ts` exports `createShopCartApi({ shop, locale, includeDraft })` — a factory that returns `{ GET, POST, PATCH, DELETE, PUT }` Next.js route handlers wired to:

1. The cookie-based session (`__Host-CART_ID` cookie read/write on every response)
2. The configurable CartStore backend (Memory/Redis/Cloudflare — selectable via env var)
3. Shop-scoped SKU resolution via `getShopSkuById(shop, skuId, locale, { includeDraft })` (`cartApiForShop.ts:39`)

This is distinct from the simpler `cartApi.ts`, which is hardwired to a monolithic `PRODUCTS` array. `cartApiForShop.ts` is the correct multi-tenant handler.

**Minimum implementation for Caryina `apps/caryina/src/app/api/cart/route.ts`:**

```ts
import { createShopCartApi } from "@acme/platform-core/cartApiForShop";

export const { GET, POST, PATCH, DELETE, PUT } = createShopCartApi({ shop: "caryina" });
```

---

## Question 4: Memory backend viability?

**Conditionally acceptable for Caryina MVP, with localStorage as the existing client-side fallback.**

The `MemoryCartStore` stores carts in a Node.js `Map` inside the server process (`memoryStore.ts:9-11`). Each entry has a TTL (default 30 days, `cartStore.ts:40`). `CartContext.tsx` already implements localStorage as the client-side fallback:

- On initial load failure: reads `localStorage.getItem("cart")` and restores state client-side (`CartContext.tsx:91-95`)
- On coming back online: sends a `PUT` to sync the cached localStorage cart back to the server (`CartContext.tsx:121-148`)

**Risk in Cloudflare Worker environment**: Workers run stateless edge instances — `MemoryCartStore` will **not** share state between requests routed to different Worker instances. Cart items will appear lost between page navigations.

**Verdict for MVP**: Acceptable for development and low-traffic staging (single Worker instance). **Before production traffic**, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to switch to the Redis backend automatically.

---

## Question 5: Required env vars

| Var | Status | Purpose |
|---|---|---|
| `CART_COOKIE_SECRET` | **Mandatory** — throws at runtime if missing | HMAC signing key for `__Host-CART_ID` cookie (`cartCookie.ts:21-22`) |
| `CART_STORE_PROVIDER` | Optional | `"memory"` / `"redis"` / `"cloudflare"` — overrides auto-detection (`cartStore.ts:96`) |
| `CART_TTL` | Optional | Cart lifetime in seconds (default: 2,592,000 = 30 days) (`cartStore.ts:88`) |
| `UPSTASH_REDIS_REST_URL` | Required if using Redis | Redis backend URL (`cartStore.ts:91,101`) |
| `UPSTASH_REDIS_REST_TOKEN` | Required if using Redis | Redis backend token (`cartStore.ts:92,102`) |

If neither Redis vars nor `CART_STORE_PROVIDER=cloudflare` is set, `createCartStore()` falls back to Memory backend (`cartStore.ts:120`).

---

## Recommended approach for Caryina

Use `createShopCartApi({ shop: "caryina" })` from `cartApiForShop.ts` to create the `/api/cart` route handler in one line. This gives Caryina the full anonymous cookie-based cart with shop-scoped SKU resolution.

For the initial MVP:
- No Redis required — Memory backend is acceptable for a single-Worker deployment.
- `CART_COOKIE_SECRET` must be set (strong random value, ≥32 chars) before first deploy.
- `CartContext` localStorage fallback is already built-in — no additional code needed for client persistence.

For production (before real customer traffic):
- Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Cloudflare Worker env. The backend switches to Redis automatically; no code change needed.

---

## Implementation notes for TASK-09

1. Create `apps/caryina/src/app/api/cart/route.ts` — one-liner factory call as shown above.
2. Wrap `apps/caryina/src/app/[lang]/layout.tsx` children in `<CartProvider>` imported from `@acme/platform-core/contexts/CartContext`.
3. The `CartProvider` will use `/api/cart` as its backend endpoint. Confirm the endpoint is at `/api/cart` (not `/[lang]/api/cart`) — the provider uses the root-relative path by default.
4. `CART_COOKIE_SECRET` must be added to `.env.local` for development and to the Cloudflare Worker env secrets for production.
5. Scope expansion note: `[readonly]` files in TASK-08 (`cartStore.ts`, `cartCookie.ts`, `CartContext.tsx`) were read as intended — no modifications required to platform-core.

---

## Updated confidence for TASK-09

**80%** (raised from 75%)

Justification: All five questions answered from direct code inspection. The route handler factory (`cartApiForShop.ts`) exists, is purpose-built for multi-tenant use, requires a single call-site to instantiate, and the env-var surface is small and well-documented. The 20% residual uncertainty is in the Worker runtime deployment (TASK-01 must be complete first) and in confirming that `getShopSkuById("caryina", ...)` resolves correctly for the specific SKU IDs in caryina's products.json.
