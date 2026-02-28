---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: xa-currency-conversion-rates
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-currency-conversion-rates/plan.md
Trigger-Why: operator-stated
Trigger-Intended-Outcome: type: operational | statement: xa-b storefront shows per-currency prices derived from configurable USD-base rates entered in the uploader; prices are correct for all four supported currencies (AUD, EUR, GBP, USD) when visitors switch currency | source: operator
Dispatch-ID: IDEA-DISPATCH-20260228-0067
---

# XA Currency Conversion Rates Fact-Find Brief

## Scope

### Summary
xa-b displays products in four currencies (AUD, EUR, GBP, USD) but there are no per-currency prices — the same raw number is shown in all currencies regardless of the selected currency. The `CurrencyContext` / `Price` component only changes the currency symbol and locale formatting, not the numeric value. The operator wants to enter a USD base price per product and configure multiplier rates for EUR, GBP, and AUD; an "Apply" action derives per-currency prices for all products and publishes them to the live website.

### Goals
- Add a currency rates configuration screen to `apps/xa-uploader`
- Rates persisted server-side in a JSON sidecar (`currency-rates.json`)
- Sync pipeline reads rates and computes per-currency prices per product in `catalog.json`
- xa-b reads and displays the correct currency price for each visitor's selected currency

### Non-goals
- Dynamic at-request-time currency conversion (xa-b is a static export — prices are baked at build time)
- Automatic exchange rate updates from an external feed (operator sets rates manually)
- Widening the CSV with per-currency price columns (avoid CSV schema churn)
- Changing the `price` field semantics in the catalog CSV (keep existing USD-base price as the canonical input)

### Constraints & Assumptions
- Constraints:
  - xa-b is a static export (Cloudflare Pages). Prices are baked into `catalog.runtime.json` at build time. Updating prices requires a full xa-b rebuild+redeploy.
  - The catalog contract (xa-drop-worker) is the intermediary: uploader sync PUTs updated catalog; xa-b build GETs it via `build-xa.mjs`.
  - `price` in the CSV and catalog.json is currently stored as a whole-dollar integer (e.g. 11800 = $11,800). No minor-unit conversion is applied by `toNonNegativeInt`.
  - Supported currencies: `AUD`, `EUR`, `USD`, `GBP` — defined in `apps/xa-b/src/lib/currency.ts`.
  - USD is the fixed base rate (1.0); operator enters multipliers for AUD, EUR, GBP.
  - All price arithmetic uses whole-number rounding (`Math.round`) to stay consistent with existing `toNonNegativeInt` convention.
- Assumptions:
  - The operator is the only user of xa-uploader; no concurrent rate edits are a concern.
  - Existing products that pre-date this feature will continue to display their USD price in all currencies until the operator applies rates.
  - Triggering the xa-b Cloudflare Pages rebuild after sync is a separate manual step for now (deploy-hook integration is out of scope for V1 but flagged as a risk).

## Outcome Contract

- **Why:** XA-B is live on staging; prices show incorrect values for non-USD visitors (EUR/GBP/AUD visitors see raw USD numbers). Operator wants correct per-currency pricing before user testing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four supported currencies show the correct converted price on xa-b based on operator-configured rates; the uploader provides a screen to set and apply rates in one action.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/UploaderHome.client.tsx` — top-level uploader shell; mounts `CatalogConsole`. New `CurrencyRatesPanel` will be added as a sibling section here or in `CatalogConsole`.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — POST triggers validate + run-xa-pipeline + publish. The pipeline script is where per-currency price computation must be injected.
- `apps/xa-b/src/lib/demoData.ts` — imports `catalog.runtime.json` and exposes `XA_PRODUCTS`. Currently exposes `price` (USD) and `compareAtPrice` as the only price fields. Will be extended with `prices` and `compareAtPrices` maps consumed by 5 display components listed below.
- `apps/xa-b/src/components/XaBuyBox.client.tsx` — renders `PriceCluster` with `product.price` + `product.compareAtPrice`; savings calculation uses `compareAtPrice - price`.
- `apps/xa-b/src/components/XaProductCard.tsx` — displays `product.price`, computes discount badge percentage and saving amount from `compareAtPrice - price`.
- `apps/xa-b/src/app/cart/page.tsx` — subtotal and per-line price from `sku.price`.
- `apps/xa-b/src/app/checkout/page.tsx` — subtotal, order-line display, and `unitPrice` in API payload all use `sku.price`.
- `apps/xa-b/src/lib/useXaListingFilters.ts` — min/max price filters use `product.price`; sale filter uses `compareAtPrice > price` boolean (currency-independent).
- `apps/xa-b/src/lib/xaListingUtils.ts` — discount sort uses `compareAtPrice - price` ratio (currency-independent proportion).

### Key Modules / Files

1. `scripts/src/xa/run-xa-pipeline.ts` — converts CSV rows to `CatalogProduct` objects and writes `catalog.json`. `price` is set via `toNonNegativeInt(draft.price)`. **Must be extended** to read `currency-rates.json` and add `prices: {AUD, EUR, GBP, USD}` per product.
2. `apps/xa-uploader/src/lib/catalogContractClient.ts` — `publishCatalogArtifactsToContract()` PUTs `catalog` + `mediaIndex` to `XA_CATALOG_CONTRACT_BASE_URL/xa-b`. New `prices` field on products will pass through transparently (no schema validation at the contract layer).
3. `apps/xa-b/scripts/build-xa.mjs` — fetches catalog from contract at build time → writes `catalog.runtime.json`. No changes needed here (passes through whatever the contract serves).
4. `apps/xa-b/src/lib/demoData.ts` — `XaProduct` type extends `SKU` which has `price: number`. Will need `prices?: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>` added (canonical type shape, matching Data & Contracts section).
5. `apps/xa-b/src/lib/currency.ts` — defines `XA_SUPPORTED_CURRENCIES: ["AUD", "USD", "EUR", "GBP"]` and `XA_DEFAULT_CURRENCY: "AUD"`. The rates screen should derive its currency list from this source of truth.
6. `packages/platform-core/src/contexts/CurrencyContext.tsx` — `type Currency = "AUD" | "EUR" | "USD" | "GBP"`. No changes needed.
7. `packages/design-system/src/atoms/Price.tsx` — `formatPrice(amount, cur)` — formats the raw number with the chosen currency locale. Display changes in `XaBuyBox.client.tsx` will pass `product.prices?.[currency] ?? product.price` as `amount`.
8. `apps/xa-uploader/src/components/catalog/` — home for the new `CurrencyRatesPanel.client.tsx`.
9. **New file**: `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` — GET returns saved rates; PUT saves rates. Auth via `hasUploaderSession`.
10. **New file**: `apps/xa-uploader/data/currency-rates.json` — persisted rates: `{EUR: 0.93, GBP: 0.79, AUD: 1.55}`. The `data/` directory already holds other uploader artifacts (sync state, backups).

### Patterns & Conventions Observed

- **Auth pattern**: all `api/catalog/*` routes call `hasUploaderSession(request)` → return `404` if unauthenticated. The new `/api/catalog/currency-rates` route must follow the same pattern.
- **Rate limiting**: all existing API routes use `rateLimit({ key, windowMs, max })`. New route needs a rate-limit guard.
- **ESLint exemption ticket pattern**: `/* eslint-disable ... -- XAUP-XXXX [ttl=2026-12-31] ... */` — any hardcoded copy or machine-token exemptions need a ticket.
- **Atomic file writes**: `writeCsvFileAtomically` is used for CSV writes. The new `currency-rates.json` write should use `fs.writeFile` with a temp-file+rename pattern (or leverage existing helpers) for safety.
- **i18n**: The uploader has a full i18n system (`uploaderI18n.ts` with EN + ZH keys). Any new UI copy must be added to both locales.
- **`toNonNegativeInt` for prices**: all price fields round to non-negative integers. The per-currency price computation must do the same.

### Data & Contracts

- **Types/schemas:**
  - `CatalogProduct` in `scripts/src/xa/run-xa-pipeline.ts` (line 47): `price: number`, `compareAtPrice?: number`. Must add `prices?: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>` (for correct discount display in non-USD currencies).
  - `XaProduct` in `apps/xa-b/src/lib/demoData.ts`: extends `SKU` (`price: number`, `compareAtPrice?: number`). Add `prices?: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>`.
  - `XaCatalogSeed` in `demoData.ts`: `products: XaProductSeed[]`. `XaProductSeed` inherits `XaProduct` — `prices` will propagate.
  - New type: `CurrencyRates = { EUR: number; GBP: number; AUD: number }` — USD is always 1.0 and not stored.
  - `Currency` union type from `@acme/platform-core/contexts/CurrencyContext`: `"AUD" | "EUR" | "USD" | "GBP"`. All per-currency price maps are typed as `Partial<Record<Currency, number>>`, not `Record<string, number>`.
- **Persistence:**
  - `apps/xa-uploader/data/currency-rates.json` — new JSON file; written by PUT `/api/catalog/currency-rates`.
  - `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json` — extended to include `prices` per product.
  - `apps/xa-b/src/data/catalog.runtime.json` — downstream; updated by `build-xa.mjs` at build time from contract.
- **API/contracts:**
  - xa-drop-worker: `PUT /catalog/xa-b` receives `{ catalog, mediaIndex }`. The `catalog.products[].prices` field will round-trip transparently (worker stores as opaque JSON blob). No worker changes needed. (Note: xa-drop-worker does validate top-level payload shape — `catalog` and `mediaIndex` must be objects — but does not enforce product field schema.)
  - New route: `GET /api/catalog/currency-rates` → `{ ok: true, rates: CurrencyRates | null }`.
  - New route: `PUT /api/catalog/currency-rates` → body `{ rates: CurrencyRates }` → `{ ok: true }`. Rate-limited, session-gated. **Validation constraints:** each rate must be a finite positive number; reasonable bounds: `min: 0.01, max: 1000.0` (prevents zero/near-zero rates that would produce $0 after rounding). Invalid rates return `400 Bad Request`.

### Dependency & Impact Map

- **Upstream dependencies:**
  - `apps/xa-uploader/data/currency-rates.json` must exist and be readable by `run-xa-pipeline.ts` at sync time. If missing, pipeline defaults to no rate conversion (all prices = USD price).
  - `XA_CATALOG_CONTRACT_BASE_URL` / `XA_CATALOG_CONTRACT_WRITE_TOKEN` env vars must be configured for sync to publish.
- **Downstream dependents:**
  - `apps/xa-b` — reads catalog from contract at build time. Confirmed price touch points (greppable):
    - `XaBuyBox.client.tsx` — `product.price` (PriceCluster), `product.compareAtPrice` (savings calculation)
    - `XaProductCard.tsx` — `product.price` (display), `product.compareAtPrice` (discount badge, savings amount)
    - `cart/page.tsx` — `sku.price` (line price display, subtotal)
    - `checkout/page.tsx` — `sku.price` (subtotal, order API `unitPrice`)
    - `useXaListingFilters.ts` — `product.price` (min/max price range filter)
    - `xaListingUtils.ts` — `compareAtPrice / price` ratio (discount sort — proportion is currency-neutral; no per-currency update needed)
    - `sale/page.tsx` — `compareAtPrice > price` boolean (sale filter — also currency-neutral; no per-currency update needed)
  - `apps/xa-b/src/lib/demoData.ts` `XaProduct` type — widened with `prices` and `compareAtPrices`.
  - Cart context (`XaCartContext.tsx`) — stores `sku: XaProduct`; `sku.price` is used at display time, so cart/checkout components need to read `sku.prices?.[currency] ?? sku.price`.
- **Likely blast radius:**
  - `apps/xa-uploader`: new panel, new API route — isolated, low blast radius.
  - `scripts/src/xa/run-xa-pipeline.ts`: price computation extension — isolated to catalog.json generation.
  - `apps/xa-b`: 5 files need per-currency price reading (`XaBuyBox`, `XaProductCard`, `cart/page`, `checkout/page`, `useXaListingFilters`). 2 files use price ratios only and are currency-neutral (`xaListingUtils`, `sale/page`) — no changes needed there.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (unit + integration), e2e via Playwright in `apps/xa-uploader/e2e/`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`; xa-b uses the same governed runner with its own jest.config.
- CI integration: `xa.yml` runs on `apps/xa-b/**` and `apps/xa-uploader/**` path triggers.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| catalogAdminSchema | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Tests price field validation (`price: "189"` input) |
| catalogCsvMapping | Unit | `apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts` | Tests CSV ↔ draft round-trip |
| useCatalogConsole | Unit | `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx` | Tests console domain logic |
| xaCatalog | Unit | `apps/xa-b/src/lib/__tests__/xaCatalog.test.ts` | Tests catalog utilities (no price tests) |
| e2e uploader | E2E | `apps/xa-uploader/e2e/catalog-console.spec.ts` | End-to-end console flow |

#### Coverage Gaps
- Untested paths:
  - Per-currency price derivation logic (`Math.round(price * rate)`) — needs unit tests.
  - New `/api/catalog/currency-rates` API route — needs unit tests for GET/PUT, auth guard, rate limiting, validation.
  - `CurrencyRatesPanel` UI component — needs unit test for save + preview behavior.
  - xa-b `XaBuyBox` with `product.prices` populated vs. fallback to `product.price` — needs unit test.
- Extinct tests: none identified.

#### Testability Assessment
- Easy to test: rate derivation math, rates API route (follows existing route test pattern), UI panel state.
- Hard to test: full sync pipeline with real rate file (integration test scope).
- Test seams needed: `currency-rates.json` read path in pipeline should accept an optional injected rates object for testing.

### Recent Git History (Targeted)
- `apps/xa-uploader/src` — recent commits: DS compliance audit (DSA-07) migrated to semantic tokens. No recent price-related changes. Stable surface.
- `apps/xa-b/src` — recent changes: static export fixes, account link removal (current session). No price logic changes. Stable surface.

---

## Questions

### Resolved

- **Q: Should rates be applied at sync time (pipeline) or at display time (xa-b runtime)?**
  - A: At sync time, by the pipeline. Reasons: (1) xa-b is a static export — no server-side rendering, no runtime computation; (2) prices baked into static pages are more predictable and auditable; (3) no runtime dependency on rates config. xa-b simply reads `product.prices?.[currency]`.
  - Evidence: `apps/xa-b/src/lib/demoData.ts` — static JSON import; `build-xa.mjs` — bakes catalog at build time.

- **Q: Should the existing `price` field in the catalog remain, or be replaced by per-currency `prices`?**
  - A: Both. Keep `price` (USD) as the canonical field for backward compat and as the fallback. Add `prices: {AUD, EUR, GBP, USD}` as an additive field. xa-b uses `prices?.[currency] ?? price`.
  - Evidence: `XaProduct` extends `SKU` which requires `price`; `SKU.price` cannot be removed without breaking platform-core.

- **Q: Where should currency rates be persisted in xa-uploader?**
  - A: `apps/xa-uploader/data/currency-rates.json`. This directory already holds other uploader state files (sync state, backups). Read by `run-xa-pipeline.ts` at sync time. Written by the new `PUT /api/catalog/currency-rates` route.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:282` — `uploaderDataDir = path.join(repoRoot, "apps", "xa-uploader", "data")`.

- **Q: What currencies need rates?**
  - A: EUR, GBP, AUD (USD = 1.0 always, no entry needed). These are the four supported currencies per `apps/xa-b/src/lib/currency.ts`.
  - Evidence: `XA_SUPPORTED_CURRENCIES = ["AUD", "USD", "EUR", "GBP"]`.

- **Q: Does updating prices on the live website require a separate xa-b rebuild?**
  - A: Yes, for V1. xa-b is a static export; `catalog.runtime.json` is populated at build time by `build-xa.mjs`. After sync updates the catalog contract, xa-b must be rebuilt+redeployed (Cloudflare Pages). V1 does NOT include automatic deploy-hook triggering — the operator triggers a redeploy separately. This is an acceptable tradeoff for the scope.
  - Evidence: `apps/xa-b/scripts/build-xa.mjs` — fetches catalog from `XA_CATALOG_CONTRACT_READ_URL` at build time.

- **Q: Should the "Apply" button in the uploader also trigger a sync, or just save rates?**
  - A: Save rates + trigger sync in one action ("Save & Sync" button). The operator enters rates, presses "Save & Sync", which (1) PUTs rates to the API, (2) calls the existing sync flow (same as the existing "Run Sync" button). This matches the operator's stated intent: "apply rates → pushed to product prices on live website".
  - Evidence: Operator description: "presses a button to apply all new conversion rates to existing products. The update is then pushed to product prices."

### Open (Operator Input Required)

- **Q: After sync, should the uploader auto-trigger a Cloudflare Pages redeploy of xa-b?**
  - Why operator input is required: Requires knowing whether a Cloudflare Pages deploy hook is configured or desired. This is infra/ops intent not documented.
  - Decision impacted: Whether "Apply & Sync" fully completes the "push to live website" flow in one click, or whether the operator manually triggers a redeploy.
  - Decision owner: operator
  - Default assumption (if any) + risk: Default = no deploy hook for V1. Risk: operator may expect immediate live price updates but must separately trigger xa-b redeploy. **Recommend:** document this in the uploader UI with a post-sync message: "Sync complete. Rebuild and redeploy xa-b to publish updated prices to the live website."

---

## Confidence Inputs

- **Implementation: 88%**
  Evidence: Full pipeline traced end-to-end (CSV → pipeline → catalog.json → catalog contract → xa-b runtime.json → display). All touch points confirmed by grep — 5 files need per-currency updates, 2 are currency-neutral (ratios only). Pattern is clear (add `prices` and `compareAtPrices` fields, read rates file, compute).
  What raises to ≥90: Operator confirms deploy-hook preference (open question above).

- **Approach: 88%**
  Evidence: Sync-time computation (not runtime) is architecturally sound for a static site. Sidecar rates file avoids CSV schema changes. Additive `prices` field is backward-compatible.
  What raises to ≥90: Operator confirms deploy-hook preference (open question resolved).

- **Impact: 90%**
  Evidence: Currently EUR/GBP/AUD visitors see USD-denominated numbers displayed with wrong symbols. This is a correctness issue with direct user-facing impact on the live storefront.
  What raises beyond: N/A — already high confidence.

- **Delivery-Readiness: 87%**
  Evidence: All entry points located and blast radius confirmed (5 xa-b files need updates, 2 are currency-neutral). Contracts clear, test patterns established. Unresolved: deploy-hook question (advisory only — does not block implementation).
  What raises to ≥90: Operator confirms deploy-hook preference (currently recommended V1 default = no auto-deploy hook).

- **Testability: 85%**
  Evidence: Rate derivation is pure function (easily unit-tested). API routes follow existing test patterns. xa-b display change is a simple prop change testable with a mock catalog.
  What raises to ≥90: Confirm test seam in pipeline for injecting a mock rates object.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Operator triggers sync but forgets to rebuild xa-b — believes prices are live when they aren't | High | Medium | Post-sync UI message: "Sync complete. Rebuild xa-b to apply prices to the live website." |
| Rounding differences between stored price and rounded converted price cause visible oddity (e.g. 11800 * 0.93 = 10974, not a "round" number) | Medium | Low | Expected behavior for currency conversion. Accept. Operator can manually adjust individual product prices if needed. |
| xa-b pages other than `XaBuyBox` reference `product.price` directly and are missed in the migration | Medium | Medium | Grep `product\.price` and `sku\.price` in xa-b before build task begins; confirm blast radius. |
| `currency-rates.json` missing at sync time — prices silently default to USD value for all currencies | Low | Medium | Pipeline treats missing file as "no conversion" (rates default to 1.0 for all currencies). Log a clear warning at sync time so operator knows conversion was skipped. Do not fail the sync. |
| catalog contract max bytes exceeded if `prices` field adds significant payload | Low | Low | xa-drop-worker: `DEFAULT_CATALOG_MAX_BYTES = 10MB`. Current catalog is ~27KB. Per-product `prices` object adds ~50 bytes × N products — negligible. |

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Currency rates API (GET/PUT `/api/catalog/currency-rates`) | Yes | None | No |
| Pipeline price computation (`run-xa-pipeline.ts` reads rates, computes `prices` map) | Yes | [Scope gap Minor]: `currency-rates.json` path not yet defined as a constant — must be consistent between API route write path and pipeline read path | No (define `CURRENCY_RATES_PATH` constant in `catalogSyncCommon.ts` or `repoRoot` helper) |
| xa-b product type extension (`prices?: Partial<Record<Currency, number>>`) | Yes | None | No |
| xa-b display (`XaBuyBox.client.tsx` — `product.prices?.[currency] ?? product.price`) | Yes | [Missing domain coverage Minor]: `PriceCluster` also receives `product.price` directly — confirm it's the only call site | No (grep before build) |
| Catalog contract pass-through | Yes | None — xa-drop-worker stores opaque JSON; `prices` field will round-trip | No |
| xa-b rebuild dependency | Partial | [Integration boundary Minor]: sync does not trigger xa-b rebuild. Operator must manually redeploy. | No (advisory — document in UI) |
| i18n for new UI copy | Yes | [Scope gap Minor]: new CurrencyRatesPanel strings must be added to both EN and ZH locales in `uploaderI18n.ts` | No |

---

## Evidence Gap Review

### Gaps Addressed
- Full price storage architecture traced from CSV → pipeline → catalog.json → catalog contract → catalog.runtime.json → xa-b display component.
- `formatPrice` behavior confirmed as formatting-only (no numeric conversion).
- Price unit convention confirmed: whole-dollar integers, not minor units (cents).
- xa-uploader `data/` directory confirmed as the right location for `currency-rates.json`.
- xa-drop-worker pass-through confirmed: no schema validation at the contract layer blocks the `prices` field addition.

### Confidence Adjustments
- Implementation confidence raised from initial ~75% to 85% after tracing the full pipeline and identifying all touch points.
- No surprises in the architecture. The xa-drop-worker, catalog contract, and xa-b build script all support the proposed change without modification.

### Remaining Assumptions
- Price blast radius is fully confirmed: 5 xa-b files use `product.price` / `sku.price` for display (`XaBuyBox.client.tsx`, `XaProductCard.tsx`, `cart/page.tsx`, `checkout/page.tsx`, `useXaListingFilters.ts`); 2 files use price ratios that are currency-neutral (`xaListingUtils.ts`, `sale/page.tsx`). No further grep needed at build start.
- Pipeline running environment has `fs` access to `apps/xa-uploader/data/currency-rates.json` (the pipeline runs on the server with access to the repo root — confirmed by `resolveRepoRoot()` usage in sync route).

---

## Planning Constraints & Notes

- **Must-follow patterns:**
  - Auth guard: `hasUploaderSession(request)` on new API route.
  - Rate limiting: add `rateLimit()` call on new route.
  - i18n: all new UI strings in both EN and ZH locales in `uploaderI18n.ts`.
  - Atomic writes: use temp-file rename pattern for `currency-rates.json` writes (or `fs.writeFile` to temp path then `fs.rename`).
  - `toNonNegativeInt` / `Math.round` for all price arithmetic.
  - ESLint exemption tickets if any lint suppressions needed.
- **Rollout/rollback expectations:**
  - `prices` field is additive and backward-compatible. xa-b falls back to `product.price` (USD) if `prices` is absent. No migration needed.
  - Rate file can be deleted to revert to single-price behavior.
- **Observability expectations:**
  - Log a warning in `run-xa-pipeline.ts` when `currency-rates.json` is missing or malformed.
  - Post-sync UI message should confirm that xa-b redeploy is required to publish prices.

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01 — New `GET/PUT /api/catalog/currency-rates` route** in xa-uploader with auth guard, rate limiting, and JSON validation. Writes/reads `apps/xa-uploader/data/currency-rates.json`.
2. **TASK-02 — `CurrencyRatesPanel.client.tsx`** — form with EUR/GBP/AUD rate inputs (USD=1 fixed), sample conversion preview, "Save & Sync" button. Hooks into existing `useCatalogConsole` sync flow.
3. **TASK-03 — Pipeline extension** — `run-xa-pipeline.ts` reads `currency-rates.json` and adds `prices: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>` to each `CatalogProduct` in catalog.json. Missing file = warn + default all rates to 1.0.
4. **TASK-04 — xa-b type + display update** — add `prices?: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>` to `XaProduct`; update all 5 price-using xa-b files (`XaBuyBox.client.tsx`, `XaProductCard.tsx`, `cart/page.tsx`, `checkout/page.tsx`, `useXaListingFilters.ts`) to read `product.prices?.[currency] ?? product.price` and `product.compareAtPrices?.[currency] ?? product.compareAtPrice`. **Filter semantics for `useXaListingFilters`:** the min/max price filter bounds are derived from displayed prices (`prices?.[currency] ?? price`), so they are already in the visitor's selected currency — no URL-param schema change needed; the filter simply applies to whatever `prices?.[currency]` resolves to.
5. **TASK-05 — i18n strings** — add EN + ZH translations for all `CurrencyRatesPanel` UI copy in `uploaderI18n.ts`.
6. **TASK-06 — Tests** — unit tests for rate derivation, `/api/catalog/currency-rates` route, `CurrencyRatesPanel` panel state, and xa-b display fallback logic.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - xa-uploader renders a currency rates panel when authenticated
  - Rates persist across sessions (written to `currency-rates.json`)
  - After "Save & Sync", catalog.json contains `prices.EUR`, `prices.GBP`, `prices.AUD`, `prices.USD` per product, and `compareAtPrices.EUR`, `compareAtPrices.GBP`, `compareAtPrices.AUD`, `compareAtPrices.USD` where applicable
  - xa-b shows correct converted currency prices when currency switcher is used (buy box, product card, cart, checkout, filters)
  - xa-b discount badges and savings amounts show correct values for non-USD currencies
  - POST-sync message instructs operator to rebuild xa-b
- Post-delivery measurement plan:
  - Manual: visit xa-b staging, switch to EUR/GBP/AUD — verify prices change correctly
  - Manual: enter rates in uploader, run sync, rebuild xa-b, verify prices on staging

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-currency-conversion-rates --auto`
