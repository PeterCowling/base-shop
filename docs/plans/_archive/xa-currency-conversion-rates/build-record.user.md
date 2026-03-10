---
Type: Build-Record
Status: Complete
Feature-Slug: xa-currency-conversion-rates
Build-date: 2026-02-28
artifact: build-record
---

# Build Record — XA Currency Conversion Rates

## What Was Built

**Wave 1 (TASK-01, TASK-03, TASK-05):** Added a `GET/PUT /api/catalog/currency-rates` API route to the xa-uploader with session auth, rate limiting, atomic JSON write, and input validation (rates must be positive, 0.01–1000.0 range). The route stores `currency-rates.json` in the uploader data directory and returns `{ ok: true, rates: null }` when no file exists yet. Extended `run-xa-pipeline.ts` with a `--currency-rates <path>` CLI argument, a `CurrencyRates` type, and an `applyCurrencyRates(usdPrice, rates)` pure function. Every product in `catalog.json` now includes `prices: { AUD, EUR, GBP, USD }` and `compareAtPrices` where applicable, computed at sync time. Updated `sync/route.ts` to pass the rates file path to the pipeline. Missing or malformed rates file defaults all rates to 1.0 with a logged warning. Added 13 `currencyRates*` i18n keys (EN + ZH) to `uploaderI18n.ts`.

**Wave 2 (TASK-02, TASK-04):** Created `CurrencyRatesPanel.client.tsx` — a self-contained operator panel that loads existing rates on mount (GET), accepts EUR/GBP/AUD multiplier inputs, and saves + triggers sync on submit (PUT → `handleSync()`). Post-save message prompts operator to rebuild xa-b to publish updated prices. Panel is gated behind `uploaderMode === "internal"` and wired into `CatalogConsole.client.tsx`. Updated `XaProduct` type in `demoData.ts` with optional `prices` and `compareAtPrices` fields. Updated all five xa-b consumer files (`XaBuyBox.client.tsx`, `XaProductCard.tsx`, `XaProductListing.client.tsx`, `cart/page.tsx`, `useXaListingFilters.ts`) to use `product.prices?.[currency] ?? product.price` (nullish coalesce, not `||`, to preserve zero-priced products). `checkout/page.tsx` already had `useCurrency` and was updated to use per-currency `unitPrice` in the order API payload.

**Wave 3 (TASK-06):** Added 20 tests across 4 suites: `applyCurrencyRates` unit tests in scripts (5 tests covering rate computation, zero/negative rate guards, zero-price products); API route tests in xa-uploader (8 tests covering GET null, invalid JSON, invalid shape, valid GET/PUT, zero-rate 400, missing rates 400, unauthenticated 404); `CurrencyRatesPanel` render tests (2 tests: inputs present, save button disabled when busy); and xa-b pricing fallback logic (5 tests confirming `??` vs `||` behaviour for zero-priced products).

## Tests Run

```
pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=currencyRateComputation --no-coverage
# PASS scripts/src/xa/__tests__/currencyRateComputation.test.ts — 5 tests

pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs --rootDir=apps/xa-uploader --testPathPattern=currency-rates|CurrencyRatesPanel --no-coverage
# PASS apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts — 8 tests
# PASS apps/xa-uploader/src/components/catalog/__tests__/CurrencyRatesPanel.test.tsx — 2 tests

pnpm -w run test:governed -- jest -- --config=apps/xa-b/jest.config.cjs --testPathPattern=xaCurrencyPricing --no-coverage
# PASS apps/xa-b/src/lib/__tests__/xaCurrencyPricing.test.ts — 5 tests
```

Total: 20 tests passing, 0 failing, 0 skipped.

## Validation Evidence

**TASK-01 (TC-01–TC-06):**
- TC-01: ENOENT → `{ ok: true, rates: null }` ✓ (route test)
- TC-02: PUT valid rates → `{ ok: true }` ✓ (route test)
- TC-03: GET after PUT → returns stored rates ✓ (route test)
- TC-04: PUT zero EUR → 400 ✓ (route test)
- TC-05: PUT missing rates object → 400 ✓ (route test)
- TC-06: Unauthenticated → 404 ✓ (route test)

**TASK-03 (TC-01–TC-02):**
- TC-01: `applyCurrencyRates(11800, { EUR: 0.93, GBP: 0.79, AUD: 1.55 })` → `{ USD: 11800, EUR: 10974, GBP: 9322, AUD: 18290 }` ✓ (scripts test)
- TC-01b: Zero/negative rates → defensive 1.0 fallback ✓ (scripts test)

**TASK-02 (TC-01, TC-03):**
- TC-01: Panel renders EUR/GBP/AUD inputs ✓ (CurrencyRatesPanel test)
- TC-03: Save button disabled when `busy=true` ✓ (CurrencyRatesPanel test)

**TASK-04 (??-vs-|| edge case):**
- `prices?.[currency] = 0` returns 0, not fallback price ✓ (xaCurrencyPricing test)
- TypeScript compiles cleanly for xa-b, xa-uploader, scripts ✓

## Scope Deviations

**TASK-06 test file name change:** Plan specified `apps/xa-b/src/components/__tests__/XaBuyBox.currency.test.tsx` but codex produced `apps/xa-b/src/lib/__tests__/xaCurrencyPricing.test.ts` — pure logic tests for the `??` vs `||` fallback pattern rather than a component render test. The acceptance criteria are fully met by the pure logic tests; component render coverage was not required by the plan's TC contracts.

**Wave 1 commit was empty:** Commit `42a1ec4b3e` had a correct message but no actual file changes (lint-staged/writer-lock interaction). All Wave 1 code was committed in `86b65ed9b4` alongside TASK-06 tests.

## Outcome Contract

- **Why:** xa-b is live on staging; EUR/GBP/AUD visitors see raw USD-denominated numbers with the wrong currency symbol.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four supported currencies show the correct converted price on xa-b based on operator-configured rates; the uploader provides a screen to set and apply rates in one action.
- **Source:** operator
