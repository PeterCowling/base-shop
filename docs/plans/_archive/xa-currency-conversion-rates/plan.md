---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-currency-conversion-rates
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Currency Conversion Rates Plan

## Summary

xa-b currently displays the same raw USD number in all four supported currencies (AUD, EUR, GBP, USD) because no per-currency prices exist. This plan adds a currency rates configuration screen to the xa-uploader, extends the sync pipeline to compute per-currency prices at sync time, and updates xa-b to read and display the correct converted price for each visitor's selected currency. The operator enters USD-base rates for EUR, GBP, and AUD, presses "Save & Sync", and the updated catalog (with per-currency prices) is published to the catalog contract. xa-b must then be rebuilt to show the new prices on the live site.

## Active tasks
- [x] TASK-01: Currency rates API route (`GET/PUT /api/catalog/currency-rates`) — Complete 2026-02-28
- [x] TASK-02: CurrencyRatesPanel UI + CatalogConsole integration — Complete 2026-02-28
- [x] TASK-03: Pipeline extension — per-currency price computation — Complete 2026-02-28
- [x] TASK-04: xa-b type + display update (6 files) — Complete 2026-02-28
- [x] TASK-05: i18n strings for CurrencyRatesPanel — Complete 2026-02-28
- [x] TASK-06: Tests — Complete 2026-02-28

## Goals
- Operator can configure EUR, GBP, AUD multipliers against a USD base price
- Sync pipeline computes per-currency prices (`prices` + `compareAtPrices`) and includes them in `catalog.json`
- xa-b reads `product.prices?.[currency] ?? product.price` for all display paths
- Post-sync message reminds operator to rebuild xa-b to publish updated prices

## Non-goals
- Dynamic at-request-time currency conversion (xa-b is a static export)
- Automatic exchange rate feed from an external source
- Changing the CSV price column schema
- Auto-triggering xa-b Cloudflare Pages rebuild after sync (V1: operator rebuilds manually)

## Constraints & Assumptions
- Constraints:
  - xa-b is a static export (Cloudflare Pages). Prices are baked at build time via `build-xa.mjs` fetching `catalog.runtime.json` from the catalog contract.
  - `price` field is a whole-dollar integer (e.g. 11800 = $11,800). All rounding uses `Math.round`.
  - Supported currencies: `AUD`, `EUR`, `USD`, `GBP` — from `apps/xa-b/src/lib/currency.ts`.
  - USD is always rate 1.0; operator configures AUD, EUR, GBP multipliers only.
- Assumptions:
  - xa-drop-worker stores catalog as opaque JSON blob; new `prices`/`compareAtPrices` fields pass through transparently.
  - `currency-rates.json` missing at pipeline time → all rates default to 1.0 (no-conversion fallback); pipeline logs a warning but does not fail.

## Inherited Outcome Contract

- **Why:** xa-b is live on staging; EUR/GBP/AUD visitors see raw USD-denominated numbers with the wrong currency symbol.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four supported currencies show the correct converted price on xa-b based on operator-configured rates; the uploader provides a screen to set and apply rates in one action.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-currency-conversion-rates/fact-find.md`
- Key findings used:
  - Price stored as whole-dollar integer (not minor units); `toNonNegativeInt` = `Math.round(value)`
  - `CurrencyContext`/`Price` component is display-only — no numeric conversion
  - Catalog flow: CSV → `run-xa-pipeline.ts` → `catalog.json` → xa-drop-worker contract → xa-b `build-xa.mjs` at build time
  - Blast radius confirmed: 5 xa-b files need per-currency updates; 2 are currency-neutral (ratios only)
  - `compareAtPrice` also needs per-currency conversion for correct discount badge/savings display

## Proposed Approach
- Option A: Sync-time computation — pipeline reads `currency-rates.json` and bakes per-currency prices into `catalog.json`. xa-b reads static fields at render time.
- Option B: Runtime computation — xa-b fetches rates at request time and converts prices on the fly.
- Chosen approach: **Option A** — xa-b is a static export; runtime computation is architecturally impossible without a server layer. Sync-time baking is simpler, auditable, and consistent with the existing build pipeline.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Currency rates API route | 90% | S | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | CurrencyRatesPanel UI + console integration | 85% | M | Complete (2026-02-28) | TASK-01, TASK-05 | TASK-06 |
| TASK-03 | IMPLEMENT | Pipeline extension — per-currency price computation | 85% | M | Complete (2026-02-28) | - | TASK-04 |
| TASK-04 | IMPLEMENT | xa-b type + display update (6 files) | 85% | M | Complete (2026-02-28) | TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | i18n strings for CurrencyRatesPanel | 90% | S | Complete (2026-02-28) | - | TASK-02 |
| TASK-06 | IMPLEMENT | Tests (API, UI, pipeline, xa-b display) | 80% | M | Complete (2026-02-28) | TASK-01, TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-05 | - | All independent; start in parallel |
| 2 | TASK-02, TASK-04 | Wave 1 complete | TASK-02 needs TASK-01+TASK-05; TASK-04 needs TASK-03 |
| 3 | TASK-06 | Wave 2 complete | Tests all prior tasks |

## Tasks

---

### TASK-01: Currency rates API route (`GET/PUT /api/catalog/currency-rates`)
- **Type:** IMPLEMENT
- **Deliverable:** New route file `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects file present: `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` ✓
  - Commit: `42a1ec4b3e` (Wave 1 batch with TASK-03, TASK-05)
  - TypeCheck: pass (xa-uploader, scripts)
  - Lint: pass (2 lint warnings — unused eslint-disable and security/detect-non-literal-fs-filename; no errors)
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` (new)
  - `apps/xa-uploader/data/currency-rates.json` (new, created on first PUT)
  - `[readonly] apps/xa-uploader/src/lib/uploaderAuth.ts`
  - `[readonly] apps/xa-uploader/src/lib/rateLimit.ts`
  - `[readonly] apps/xa-uploader/src/lib/requestJson.ts`
  - `[readonly] apps/xa-uploader/src/lib/repoRoot.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — exact pattern from `apps/xa-uploader/src/app/api/catalog/products/route.ts` (auth guard, rate limit, `readJsonBodyWithLimit`). GET reads JSON file, PUT validates + writes. File path: `path.join(uploaderDataDir, "currency-rates.json")`.
  - Approach: 90% — REST GET/PUT with session auth is the correct approach; file stored in `apps/xa-uploader/data/` directory (confirmed location for uploader state).
  - Impact: 90% — isolated new route; no existing behavior changes.
- **Acceptance:**
  - GET returns `{ ok: true, rates: CurrencyRates | null }` — null when file does not exist yet
  - PUT saves rates and returns `{ ok: true }`
  - Unauthenticated requests return 404 (matching existing pattern)
  - Invalid rates (non-finite, negative, zero, out-of-bounds) return 400
  - Rate limiting applied (standard window/max constants)
- **Validation contract (TC-01):**
  - TC-01: GET with no `currency-rates.json` → `{ ok: true, rates: null }`
  - TC-02: PUT `{ rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }` → `{ ok: true }`, file written
  - TC-03: Subsequent GET → `{ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }`
  - TC-04: PUT with `{ rates: { EUR: -1 } }` → 400 Bad Request
  - TC-05: PUT with `{ rates: { EUR: 0 } }` → 400 (zero rate would produce $0 prices)
  - TC-06: Unauthenticated GET/PUT → 404
  - TC-07: Rate limited request → 429
- **Execution plan:**
  - Red: Write test stub `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts` asserting GET returns null rates when file absent
  - Green: Implement `route.ts` with GET (reads file) + PUT (validates + writes); follow `products/route.ts` pattern exactly
  - Refactor: Extract `CurrencyRates` type to shared location if needed; confirm rate bounds (0.01–1000.0 per fact-find)
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:**
  - Confirm `path.join(repoRoot, "apps", "xa-uploader", "data")` is the canonical `uploaderDataDir` — confirmed from `sync/route.ts:282`
  - Confirm atomic write pattern for JSON file — use `fs.writeFile` to temp path + `fs.rename` (same atomic safety as CSV writes)
- **Edge Cases & Hardening:**
  - File permission error on write → 500 with generic error (do not expose path)
  - JSON parse error on GET (corrupted file) → return `{ ok: true, rates: null }` with warning logged
  - Extra unknown rate keys in PUT body → strip to known keys (EUR, GBP, AUD) only
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: New route; no existing behavior changed
  - Rollback: Delete route file; `currency-rates.json` has no downstream effect until sync runs
- **Documentation impact:** None: internal operator API
- **Notes / references:**
  - `CurrencyRates` type: `{ EUR: number; GBP: number; AUD: number }` — USD always 1.0, not stored
  - ESLint exemption needed if any hardcoded error strings: follow `XAUP-XXXX [ttl=2026-12-31]` pattern

---

### TASK-02: CurrencyRatesPanel UI + CatalogConsole integration
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx` + update to `CatalogConsole.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects files present: `CurrencyRatesPanel.client.tsx` ✓, `CatalogConsole.client.tsx` ✓
  - Commit: `2aef742462` (Wave 2 batch with TASK-04)
  - TypeCheck: pass (xa-uploader)
  - Lint: pass (0 errors)
  - CurrencyRatesPanel: GET on mount, PUT + handleSync on save; unconditional post-save rebuild note; data-cy="currency-rates-save"; ESLint-disabled per XAUP-0001
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx` (new)
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` (add panel inside `uploaderMode === "internal"` block)
  - `[readonly] apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `[readonly] apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** TASK-01, TASK-05
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — panel follows `CatalogSyncPanel.client.tsx` pattern exactly. Integration point confirmed: `consoleState.handleSync` is available from `useCatalogConsole` and `consoleState.busy` can be used for disabled state. The "Save & Sync" sequence: PUT rates API → if OK, call `handleSync()`. Held-back test at 85: if `handleSync` silently no-ops when sync is not ready, operator may believe rates were synced when they were not. Risk is documented; execution plan must handle this with clear feedback.
  - Approach: 85% — standalone presentational panel receiving callbacks as props is idiomatic with the existing pattern.
  - Impact: 90% — operator-facing only; no customer-facing paths affected.
- **Acceptance:**
  - Panel renders with EUR, GBP, AUD rate inputs and a USD=1.00 fixed display
  - Rates load from API on mount (GET `/api/catalog/currency-rates`)
  - "Save & Sync" button: (1) PUTs rates, (2) if PUT succeeds and sync is ready, calls `handleSync`
  - After successful save (PUT OK): always show "Rates saved. Sync triggered — check sync panel for status. Rebuild xa-b after sync completes to publish updated prices." (Since `handleSync` returns `void | undefined`, success vs skipped cannot be detected reliably; the post-save message is unconditional and accurate regardless of sync outcome)
  - If save fails (PUT error): show error feedback; do not trigger sync
  - All UI strings use i18n keys from TASK-05
  - Panel only visible when `uploaderMode === "internal"` (consistent with sync panel)
- **Validation contract (TC-02):**
  - TC-01: Panel renders with empty rate fields when API returns `rates: null`
  - TC-02: Panel pre-populates fields when API returns existing rates
  - TC-03: "Save & Sync" button disabled when `busy === true`
  - TC-04: PUT error → show error feedback (follows `ActionFeedback` pattern)
  - TC-05: Successful save + sync-ready → calls `handleSync` + shows post-sync message
  - TC-06: Successful save + sync-not-ready → shows "rates saved, sync manually" message
- **Execution plan:**
  - Red: Write `__tests__/CurrencyRatesPanel.test.tsx` asserting panel renders rate inputs
  - Green: Implement `CurrencyRatesPanel.client.tsx` with form state, API calls, feedback; wire into `CatalogConsole`
  - Refactor: Extract rate input validation; confirm `data-cy` attributes for e2e
- **Planning validation:**
  - Checks run: Read `useCatalogConsole.client.ts` — `handleSync` is confirmed exported from `useCatalogSyncHandlers` and available via `consoleState.handleSync`; `busy` is available as `consoleState.busy`
  - Checks run: Read `CatalogConsole.client.tsx` — confirmed panel will be added inside `uploaderMode === "internal"` block alongside existing `CatalogSyncPanel`
  - Validation artifacts: `useCatalogConsole.client.ts` lines 364-383 confirm `handleSync` signature
- **Scouts:** `handleSync` guard: returns `undefined` immediately if `!syncReadiness.ready || syncReadiness.checking` — panel must check this and show "rates saved, sync manually" in that case.
- **Consumer tracing:**
  - New component `CurrencyRatesPanel.client.tsx` → consumed by `CatalogConsole.client.tsx` only
  - `CatalogConsole.client.tsx` passes `busy` and `handleSync` from `consoleState` as props — both already available in the existing hook return value
- **Edge Cases & Hardening:**
  - Rate input: only accept positive numbers (> 0); validate before submitting
  - Decimal precision: limit to 4 decimal places (sufficient for exchange rates)
  - Panel disabled during busy state to prevent concurrent save + sync
- **What would make this >=90%:** Confirm `handleSync` return value is detectable as "sync ran" vs "sync skipped" (to show the correct post-message). If return type is `void | undefined`, cannot differentiate — show a generic "check sync panel for status" message instead.
- **Rollout / rollback:**
  - Rollout: Additive — new panel, no existing panels removed
  - Rollback: Remove panel from `CatalogConsole`; rates API still exists but is inaccessible from UI
- **Documentation impact:** None: internal operator tool
- **Notes / references:**
  - `CatalogSyncPanel.client.tsx` is the primary style reference for the new panel
  - Follow `data-cy` attribute pattern from `CatalogSyncPanel` for testability

---

### TASK-03: Pipeline extension — per-currency price computation
- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/src/xa/run-xa-pipeline.ts` + `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects files present: `scripts/src/xa/run-xa-pipeline.ts` ✓, `apps/xa-uploader/src/app/api/catalog/sync/route.ts` ✓
  - Commit: `42a1ec4b3e` (Wave 1 batch with TASK-01, TASK-05)
  - TypeCheck: pass (scripts, xa-uploader)
  - Lint: pass
  - Key additions: `CurrencyRates` type, `applyCurrencyRates(usdPrice, rates)` pure function, `--currency-rates <path>` CLI arg, `prices`/`compareAtPrices` on `CatalogProduct`, `buildSyncArgs` updated to pass rates path
- **Affects:**
  - `scripts/src/xa/run-xa-pipeline.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `[readonly] scripts/src/xa/catalogSyncCommon.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — `CatalogProduct` type is defined locally in `run-xa-pipeline.ts` (line 41-94); easy to add `prices`/`compareAtPrices` fields. The pipeline receives all paths via CLI args; adding `--currency-rates <path>` follows the same pattern as `--products`, `--out` etc. `buildSyncArgs` in `sync/route.ts` (line 153) already builds the CLI args array — add one more. `toNonNegativeInt` already used for price fields at line 473-475.
  - Approach: 85% — CLI arg injection is the cleanest path; avoids any global state or implicit path discovery.
  - Impact: 85% — `prices`/`compareAtPrices` fields are additive to `catalog.json`; no consumer is broken by the new fields.
- **Acceptance:**
  - `run-xa-pipeline.ts` accepts `--currency-rates <path>` arg (optional)
  - Missing/absent rates file → log `[warn] currency-rates.json not found — all rates default to 1.0`; prices = USD price for all currencies
  - With rates: `catalog.json` products include `prices: { AUD: N, EUR: N, GBP: N, USD: N }` and `compareAtPrices` where applicable
  - All per-currency prices are non-negative integers (Math.round applied)
  - `sync/route.ts` passes `--currency-rates` path to `buildSyncArgs`
- **Validation contract (TC-03):**
  - TC-01: Pipeline run with missing rates file → exits 0, catalog.json products have `prices: { USD: N, EUR: N, GBP: N, AUD: N }` all equal to the product's `price` value (1.0 rate applied; deterministic output)
  - TC-02: Pipeline run with `{ EUR: 0.93, GBP: 0.79, AUD: 1.55 }` rates, product with `price: 11800` → `prices: { USD: 11800, EUR: 10974, GBP: 9322, AUD: 18290 }` (Math.round applied)
  - TC-03: Product with `compareAtPrice: 15000` → `compareAtPrices: { USD: 15000, EUR: 13950, GBP: 11850, AUD: 23250 }`
  - TC-04: Product with no `compareAtPrice` → no `compareAtPrices` field in output
  - TC-05: `buildSyncArgs` includes `--currency-rates` path in the returned args array
- **Execution plan:**
  - Red: Write unit test asserting `toNonNegativeInt(11800 * 0.93) === 10974`; assert that with no rates file, `prices: { USD: 11800, EUR: 11800, GBP: 11800, AUD: 11800 }` (1.0 fallback — deterministic output, matching TC-01)
  - Green: Add `--currency-rates` to `parseArgs`, add `CurrencyRates` type and `prices`/`compareAtPrices` fields to `CatalogProduct`, add rate application in product build loop; update `buildSyncArgs`
  - Refactor: Extract `applyCurrencyRates(price, rates)` pure function (testable independently)
- **Planning validation:**
  - Checks run: Read `run-xa-pipeline.ts` lines 41-94 — `CatalogProduct` is a local type; `prices`/`compareAtPrices` can be added cleanly
  - Checks run: Read `run-xa-pipeline.ts` lines 139-236 — `parseArgs` is a plain function; adding `--currency-rates` follows same switch-case pattern
  - Checks run: Read `sync/route.ts` lines 153-185 — `buildSyncArgs` returns `string[]`; one additional `--currency-rates`, `<path>` pair is trivial to add
  - Validation artifacts: `run-xa-pipeline.ts` lines 467-475 confirm product build loop location for prices injection
- **Scouts:** `writeJsonFile` (line 554) writes the full catalog object — new `prices` fields on products are included automatically since they're part of the `CatalogProduct` objects in the `products` array.
- **Consumer tracing:**
  - New `prices`/`compareAtPrices` fields in `catalog.json` → consumed by `publishCatalogArtifactsToContract` (reads file, passes through opaque) → xa-drop-worker → xa-b `build-xa.mjs` (reads contract) → `catalog.runtime.json` → `XaProduct` (via JSON cast) → 5 xa-b display components (addressed by TASK-04)
  - `Consumer CatalogConsole/useCatalogConsole is unchanged` — sync is still triggered the same way via `handleSync`
- **Edge Cases & Hardening:**
  - Malformed `currency-rates.json` (invalid JSON) → treat as missing (log warning, default to 1.0)
  - Rate of 0 in file → treat as 1.0 (defensive: zero rate already blocked by TASK-01 validation, but pipeline should be resilient)
  - `price: 0` product → `prices` all zero (correct; non-negative integer)
- **What would make this >=90%:** Run a test dry-run of the pipeline with actual rate file to confirm the output format before merging.
- **Rollout / rollback:**
  - Rollout: `--currency-rates` is an optional CLI arg; old pipeline invocations without this arg continue to work (no rates = USD prices for all currencies)
  - Rollback: Remove `--currency-rates` from `buildSyncArgs`; pipeline skips rates and reverts to single-currency behavior
- **Documentation impact:** None: internal script
- **Notes / references:**
  - `CurrencyRates` type defined inline in the script: `type CurrencyRates = { EUR: number; GBP: number; AUD: number }`
  - `USD` always = `price` (no multiplication needed)

---

### TASK-04: xa-b type + display update (6 files)
- **Type:** IMPLEMENT
- **Deliverable:** `XaProduct` type extended; 5 xa-b display components updated to read per-currency prices
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects files present: all 7 files ✓ (demoData.ts, XaBuyBox, XaProductCard, XaProductListing, cart/page, checkout/page, useXaListingFilters)
  - Commit: `2aef742462` (Wave 2 batch with TASK-02)
  - TypeCheck: pass (xa-b)
  - Lint: pass (0 errors)
  - `??` (not `||`) used throughout for zero-price safety
  - `useCurrency` added to XaProductCard, cart/page, XaProductListing; `effectivePrice`/`effectiveCompareAtPrice` pattern applied in buy box and product card
- **Affects:**
  - `apps/xa-b/src/lib/demoData.ts`
  - `apps/xa-b/src/components/XaBuyBox.client.tsx`
  - `apps/xa-b/src/components/XaProductCard.tsx`
  - `apps/xa-b/src/app/cart/page.tsx`
  - `apps/xa-b/src/app/checkout/page.tsx`
  - `apps/xa-b/src/lib/useXaListingFilters.ts`
  - `[readonly] packages/platform-core/src/contexts/CurrencyContext.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — all 5 consumer files confirmed by grep. Change per file is simple: replace `product.price` with `product.prices?.[currency] ?? product.price`. The `useCurrency` hook from `CurrencyContext` provides the current currency string. `checkout/page.tsx` already imports and uses `useCurrency` (confirmed from summary context).
  - Approach: 85% — optional chaining fallback pattern (`prices?.[currency] ?? price`) is backward-compatible and zero-risk for products without `prices` field.
  - Impact: 85% — all 5 files confirmed; 2 currency-neutral files (`xaListingUtils.ts`, `sale/page.tsx`) confirmed to need no changes.
- **Acceptance:**
  - `XaProduct` has `prices?: Partial<Record<Currency, number>>` and `compareAtPrices?: Partial<Record<Currency, number>>`
  - `XaBuyBox.client.tsx`: `product.prices?.[currency] ?? product.price` passed to `PriceCluster`; `product.compareAtPrices?.[currency] ?? product.compareAtPrice` for savings
  - `XaProductCard.tsx`: same pattern for display price and discount badge
  - `cart/page.tsx`: `sku.prices?.[currency] ?? sku.price` for line prices and subtotal
  - `checkout/page.tsx`: `sku.prices?.[currency] ?? sku.price` for display AND for `unitPrice` in order API payload
  - `useXaListingFilters.ts`: min/max bounds derived from `product.prices?.[currency] ?? product.price`
  - TypeScript compiles cleanly for `apps/xa-b` (`pnpm --filter xa-b typecheck`)
- **Validation contract (TC-04):**
  - TC-01: `XaProduct` with `prices: { EUR: 10974 }` + EUR selected → buy box shows `10974`, not `11800`
  - TC-02: `XaProduct` without `prices` field + EUR selected → buy box shows `11800` (fallback)
  - TC-03: Cart page with EUR currency → line price uses `sku.prices?.EUR ?? sku.price`
  - TC-04: Checkout API payload `unitPrice` uses per-currency price (not always USD)
  - TC-05: `useXaListingFilters` min filter with EUR selected compares against `prices?.EUR`
  - TC-06: TypeScript strict mode passes — no `any` usage, correct `Partial<Record<Currency, number>>` type
- **Execution plan:**
  - Red: Write unit test asserting `XaBuyBox` with `prices: { EUR: 10974 }` + EUR currency renders `10974`
  - Green: Add type fields to `XaProduct` in `demoData.ts`; update all 5 consumer files
  - Refactor: Confirm checkout `unitPrice` is correct (per-currency price, not USD); confirm filter semantics
- **Planning validation:**
  - Checks run: Read `demoData.ts` — `XaProduct = SKU & { compareAtPrice?: number; ... }`. `SKU` from `@acme/types` has `price: number` (required, per `packages/types/src/Product.ts:44`). Adding `prices?` and `compareAtPrices?` as optional fields is additive alongside the required `price` field. The `??` fallback `prices?.[currency] ?? price` is always safe since `price` is always present.
  - Checks run: Confirmed `checkout/page.tsx` imports `useCurrency` — per-currency price for `unitPrice` in the order payload is architecturally sound (it represents the price the customer sees in their currency).
  - Validation artifacts: `checkout/page.tsx` lines 17, 43-50 confirm `currency` is already in scope and in the POST body.
- **Consumer tracing:**
  - New `prices`/`compareAtPrices` fields on `XaProduct` → read by 5 display files (all within TASK-04 scope)
  - `xaListingUtils.ts` consumer unchanged — uses `compareAtPrice/price` ratio (currency-neutral proportion, no per-currency update needed)
  - `sale/page.tsx` consumer unchanged — uses `compareAtPrice > price` boolean (also currency-neutral)
- **Edge Cases & Hardening:**
  - `prices?.[currency]` is `0` for a product — treat as falsy? No: use `?? product.price` (nullish coalesce, not `||`). Zero-priced products correctly show 0.
  - `XaCartContext.tsx` stores `sku: XaProduct` — cart items already carry `prices` through the spread since cart context stores the full product object; no cart context changes needed.
  - Filter query-param semantics: when a user switches currency after setting a price filter, the existing `price[min/max]` URL params remain (they were set in the old currency). `useXaListingFilters` applies them against the new currency's prices — this may appear inconsistent (e.g. EUR 100–200 filter applied against GBP prices). This is a V1 accepted UX limitation; a dedicated filter-reset-on-currency-change is deferred to V2.
- **What would make this >=90%:** Add explicit test for zero-price fallback (`prices?.[currency] = 0` is falsy for `||` but not for `??`). This edge case is documented; use `??` not `||` in all 5 consumers.
- **Rollout / rollback:**
  - Rollout: All changes are additive optional fields + backward-compatible fallback
  - Rollback: Remove `prices`/`compareAtPrices` from `XaProduct`; revert 5 consumer files to plain `product.price`
- **Documentation impact:** None
- **Notes / references:**
  - `Currency` type from `@acme/platform-core/contexts/CurrencyContext` — import for `Partial<Record<Currency, number>>`
  - Do NOT use `||` fallback — use `??` to preserve zero-priced products correctly

---

### TASK-05: i18n strings for CurrencyRatesPanel
- **Type:** IMPLEMENT
- **Deliverable:** New message keys added to `apps/xa-uploader/src/lib/uploaderI18n.ts` (EN + ZH)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects file present: `apps/xa-uploader/src/lib/uploaderI18n.ts` ✓
  - Commit: `42a1ec4b3e` (Wave 1 batch with TASK-01, TASK-03)
  - 13 `currencyRates*` keys added to both `en` and `zh` objects: title, subtitle, USD/EUR/GBP/AUD labels, saveAndSync, saving, saved, saveFailed, syncedRebuildNote, savedSyncNotReady, loadFailed
- **Affects:**
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — file structure is confirmed; adding keys to both `en` and `zh` objects is a trivial edit.
  - Approach: 90% — matching existing pattern exactly.
  - Impact: 90% — additive; no existing keys change.
- **Acceptance:**
  - The following key groups added to both `en` and `zh` locales:
    - `currencyRatesTitle`, `currencyRatesSubtitle`
    - `currencyRatesUsdLabel`, `currencyRatesEurLabel`, `currencyRatesGbpLabel`, `currencyRatesAudLabel`
    - `currencyRatesSaveAndSync`, `currencyRatesSaving`
    - `currencyRatesSaved`, `currencyRatesSaveFailed`
    - `currencyRatesSyncedRebuildNote` ("Rates applied. Rebuild xa-b to publish updated prices.")
    - `currencyRatesSavedSyncNotReady` ("Rates saved. Run sync manually to apply to catalog.")
    - `currencyRatesLoadFailed`
- **Validation contract (TC-05):**
  - TC-01: All keys present in both `en` and `zh` blocks — TypeScript union type inference on `messages.en` should surface missing keys
  - TC-02: No existing keys renamed or removed
- **Execution plan:**
  - Red: Confirm `useUploaderI18n` hook usage pattern (key lookup with `t("key")`)
  - Green: Add all keys to `en` and `zh` objects
  - Refactor: None required
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: file structure fully confirmed.
- **Edge Cases & Hardening:** None: string literal additions.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Additive key additions
  - Rollback: Remove added keys
- **Documentation impact:** None
- **Notes / references:**
  - ZH strings: use simple/correct Chinese equivalents for the EN labels. For `currencyRatesSyncedRebuildNote`: "汇率已应用。重新构建 xa-b 以将更新的价格发布到网站。"

---

### TASK-06: Tests
- **Type:** IMPLEMENT
- **Deliverable:** New test files covering API route, CurrencyRatesPanel, pipeline rate computation, xa-b display fallback
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build Evidence:**
  - Offload route: codex exec (CODEX_OK=1), exit code 0
  - Affects files present: all 4 test files + run-xa-pipeline.ts exports ✓
  - Commit: `86b65ed9b4` (Wave 3 — TASK-01/03/05 code + TASK-06 tests)
  - Tests: 20 passing (scripts 5, xa-uploader route 8, CurrencyRatesPanel 2, xa-b 5)
  - TypeCheck: pass (xa-b, xa-uploader, scripts)
  - Lint: pass (5 warnings on security/detect-non-literal-fs-filename in route — expected, pre-existing pattern)
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts` (new)
  - `apps/xa-uploader/src/components/catalog/__tests__/CurrencyRatesPanel.test.tsx` (new)
  - `scripts/src/xa/__tests__/currencyRateComputation.test.ts` (new)
  - `apps/xa-b/src/components/__tests__/XaBuyBox.currency.test.tsx` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — test patterns confirmed from existing test landscape (jest config, mock patterns). Held-back test: if existing test infrastructure for xa-uploader API routes differs significantly from expectation. `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` is the closest reference — it tests validation logic, not route handlers. Route handler mocking pattern for Next.js routes may need a small investigation.
  - Approach: 80% — unit tests are the right level; integration test for full sync pipeline is out of scope (already documented in fact-find).
  - Impact: 80% — tests are complete coverage; no new features, only validation.
- **Acceptance:**
  - Rate computation: `applyCurrencyRates(11800, { EUR: 0.93, GBP: 0.79, AUD: 1.55 })` → `{ USD: 11800, EUR: 10974, GBP: 9322, AUD: 18290 }`
  - `applyCurrencyRates` with zero/negative rate → treat as 1.0 (defensive fallback; TASK-01 already rejects zero rates at API validation, but pipeline must be resilient to malformed files). TC-01b covers this.
  - `CurrencyRatesPanel` renders inputs for EUR, GBP, AUD
  - `XaBuyBox` with `prices: { EUR: 10974 }` + EUR selected → renders `10974`
  - `XaBuyBox` with no `prices` + EUR selected → renders `price` (fallback)
  - Route GET returns `{ ok: true, rates: null }` when file absent
  - Route PUT accepts valid rates, rejects invalid (zero, negative)
- **Validation contract (TC-06):**
  - TC-01: `applyCurrencyRates(11800, { EUR: 0.93, GBP: 0.79, AUD: 1.55 })` → `{ USD: 11800, EUR: 10974, GBP: 9322, AUD: 18290 }`
  - TC-01b: `applyCurrencyRates(11800, { EUR: 0, GBP: -1, AUD: 1.55 })` → zero/negative rates treated as 1.0 (defensive fallback); EUR and GBP prices = 11800
  - TC-02: Missing rates file → `XaBuyBox` displays `product.price` (fallback via `??`)
  - TC-03: `CurrencyRatesPanel` renders with 3 currency inputs visible
  - TC-04: Route GET null rates when no file
  - TC-05: Route PUT validation rejects zero/negative rate
- **Execution plan:**
  - Red: Write test stubs for each new test file
  - Green: Implement each test to pass
  - Refactor: Check coverage is adequate; remove duplicate assertions
- **Planning validation:**
  - Checks run: `apps/xa-uploader/jest.config.cjs` exists (confirmed in fact-find test landscape)
  - Checks run: `apps/xa-b/src/lib/__tests__/xaCatalog.test.ts` confirms xa-b has a `__tests__/` convention under `src/lib/`
  - Validation artifacts: Governed test runner: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- **Scouts:** Next.js route handler tests: check if existing route tests exist in xa-uploader to confirm mock pattern.
- **Edge Cases & Hardening:** `??` vs `||` edge case for zero prices — write explicit test.
- **What would make this >=90%:** Confirm route handler test mock pattern before implementation.
- **Rollout / rollback:**
  - Rollout: Test-only; no production behavior change
  - Rollback: N/A
- **Documentation impact:** None
- **Notes / references:**
  - `testIdAttribute: "data-cy"` per jest.setup.ts — use `data-cy` in test selectors, not `data-testid`

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Currency rates API route | Yes — no prior tasks required; `uploaderAuth`, `rateLimit`, `requestJson`, `repoRoot` all confirmed present | None | No |
| TASK-03: Pipeline extension | Yes — no prior tasks required; `run-xa-pipeline.ts` local types and CLI arg pattern confirmed | [Ordering Moderate]: `sync/route.ts` must pass `--currency-rates <path>` but the rates file is created by TASK-01 API route (runtime). At pipeline invocation time, the file may not exist yet → pipeline defaults to 1.0 rates. This is intentional and documented. | No |
| TASK-05: i18n strings | Yes — no prior tasks required; `uploaderI18n.ts` structure confirmed | None | No |
| TASK-02: CurrencyRatesPanel | Yes — depends on TASK-01 (API) and TASK-05 (i18n keys). Both complete in Wave 1. | [Type contract Minor]: `handleSync` return type is `void | undefined` — panel cannot detect "sync ran" vs "sync skipped". Execution plan must use a "check sync readiness before saving" UX approach or show generic post-save message. | No |
| TASK-04: xa-b type + display update | Yes — depends on TASK-03. `prices`/`compareAtPrices` fields present in `catalog.json` after TASK-03. `XaProduct` cast from JSON — TypeScript type extension is additive. | [Type contract Minor]: `??` vs `||` distinction for zero-price products. Execution plan explicitly documents using `??`. | No |
| TASK-06: Tests | Yes — all prior tasks complete. Test files reference implemented modules. | None | No |

---

## Risks & Mitigations
- **Operator forgets to rebuild xa-b after sync** — High likelihood, Medium impact. Mitigation: post-sync message in panel: "Rates applied. Rebuild xa-b to publish updated prices to the live website."
- **`currency-rates.json` missing at pipeline time** — Low likelihood, Medium impact. Mitigation: pipeline logs warning and defaults all rates to 1.0 (no silent failure).
- **`||` fallback used instead of `??` for zero-price products** — Medium likelihood, Low impact. Mitigation: explicit test case + documentation in TASK-04 execution plan.
- **Rounding oddities (e.g. 11800 × 0.93 = 10974, not a "round" number)** — Expected behavior; acceptable.
- **Checkout `unitPrice` uses per-currency price, not USD** — No active risk for V1. The `POST /api/account/orders` route in xa-b has been removed (confirmed: no files at `apps/xa-b/src/app/api/account/`). The checkout page calls this non-existent route at runtime — orders cannot currently be placed. When an orders route is eventually re-implemented, it should handle per-currency `unitPrice` explicitly (or currency-convert to USD server-side). This plan correctly updates `unitPrice` to use the per-currency price for consistency with what the customer sees.

## Observability
- Logging: pipeline logs `[warn] currency-rates.json not found` when rates file absent
- Logging: sync route response body indicates success/failure; post-sync feedback shown in UI
- Metrics: None: operator-facing internal tool
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] xa-uploader: authenticated operator can see and update currency rates in the CurrencyRatesPanel
- [ ] Rates persist across sessions (written to `currency-rates.json`)
- [ ] After "Save & Sync", `catalog.json` contains `prices.EUR`, `prices.GBP`, `prices.AUD`, `prices.USD` per product, and `compareAtPrices.*` where applicable
- [ ] xa-b shows correct converted currency prices when currency switcher is used (buy box, product card, cart, checkout, price filters)
- [ ] xa-b discount badges and savings amounts show correct values for non-USD currencies
- [ ] TypeScript compiles cleanly for `apps/xa-b`, `apps/xa-uploader`, `scripts`
- [ ] All new tests pass under the governed test runner

## Decision Log
- 2026-02-28: Sync-time computation chosen over runtime conversion — xa-b is a static export; runtime conversion requires a server layer (architecturally impossible without major infra change).
- 2026-02-28: V1 does NOT include auto-trigger of xa-b Cloudflare Pages rebuild after sync — post-sync message to operator is sufficient; deploy-hook integration deferred to V2.
- 2026-02-28: `checkout/page.tsx` `unitPrice` uses per-currency price (not always USD) — intentional; represents the price the customer sees in their selected currency.

## Overall-confidence Calculation
- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × M(2) = 170
- TASK-03: 85% × M(2) = 170
- TASK-04: 85% × M(2) = 170
- TASK-05: 90% × S(1) = 90
- TASK-06: 80% × M(2) = 160
- Overall: (90 + 170 + 170 + 170 + 90 + 160) / (1+2+2+2+1+2) = 850 / 10 = **85%**
