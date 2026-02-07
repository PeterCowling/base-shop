Type: Audit
Status: Reference

# AUDIT-03: Financial Math Usage Audit

**Audit Date:** 2026-01-21
**Scope:** `packages/platform-core/src/pricing/`, `**/discount*.ts`, `**/margin*.ts`, `**/money*.ts`, `**/tax*.ts`, financial calculations across packages and apps
**Related Plan:** [lib-primitives-enhancement-plan.md](../plans/lib-primitives-enhancement-plan.md)
**Status:** Reference

---

## Executive Summary

This audit identifies all financial calculations across the codebase to inform the design of the new `@acme/lib/math/financial` module. Key findings:

1. **Existing money utilities are display-focused** - `@acme/lib/format/money` handles currency formatting and minor/major unit conversion, NOT financial math
2. **No conflicts identified** - The proposed financial module addresses a distinct gap (calculations vs. display)
3. **Several ad-hoc implementations exist** - Rounding, discounts, tax calculations are implemented inline
4. **Reception app has `roundDownTo50Cents()`** - Prime candidate for migration to library
5. **Currency conversion and pricing are in platform-core** - Business logic specific to the domain

---

## 1. Existing Money/Decimal Utilities

### 1.1 `@acme/lib/format/money` (Display Utilities)

**Location:** `/Users/petercowling/base-shop/packages/lib/src/format/money.ts`

| Function | Purpose | Signature |
|----------|---------|-----------|
| `normalizeCurrencyCode()` | Validates and uppercases ISO 4217 codes | `(currency: string) => string` |
| `getCurrencyFractionDigits()` | Gets decimal places for currency | `(currency: string) => number` |
| `assertMinorInt()` | Type guard for minor unit integers | `(value: unknown) => asserts value is number` |
| `toMinor()` | Major to minor unit conversion | `(inputMajor: string \| number, currency: string) => number` |
| `fromMinor()` | Minor to major unit conversion | `(minor: number, currency: string) => string` |
| `formatMinor()` | Format minor units with Intl | `(minor: number, currency: string, locale?: string) => string` |

**Implementation Details:**
- Uses `bigint` internally for precision (avoids floating-point errors)
- Currency-aware fraction digits (e.g., JPY = 0, USD = 2)
- Rounds half-up at currency precision
- Caches `Intl.NumberFormat` instances

**Conflict Assessment:** NONE - These are display/conversion utilities, not calculation primitives.

### 1.2 `@acme/lib/format/formatPrice` and `formatCurrency`

**Locations:**
- `/Users/petercowling/base-shop/packages/lib/src/format/formatPrice.ts`
- `/Users/petercowling/base-shop/packages/lib/src/format/formatCurrency.ts`

| Function | Purpose | Input Units |
|----------|---------|-------------|
| `formatPrice()` | Format major-unit amounts | Major (e.g., dollars) |
| `formatCurrency()` | Format minor-unit amounts | Minor (e.g., cents) |

Both use `Intl.NumberFormat` and support locale/currency parameters.

### 1.3 `@acme/pipeline-engine/money` (BigInt Money Type)

**Location:** `/Users/petercowling/base-shop/packages/pipeline-engine/src/money.ts`

```typescript
export type Money = bigint;

export const money = {
  zero: 0n as Money,
  fromCents(value: number | bigint): Money,
  fromEuros(value: number): Money,
  toEuros(value: Money): number,
  add(a: Money, b: Money): Money,
  subtract(a: Money, b: Money): Money,
  max(a: Money, b: Money): Money,
  min(a: Money, b: Money): Money,
  abs(value: Money): Money,
};
```

**Purpose:** EUR-centric calculations for product pipeline cost modeling.

**Conflict Assessment:** Domain-specific; the proposed library module is unit-agnostic.

---

## 2. Financial Calculations Found

### 2.1 Pricing Module (`packages/platform-core/src/pricing/index.ts`)

**Location:** `/Users/petercowling/base-shop/packages/platform-core/src/pricing/index.ts`

| Function | Calculation Type | Formula |
|----------|-----------------|---------|
| `convertCurrency()` | Exchange rate conversion | `amount * rate` with banker's rounding |
| `applyDurationDiscount()` | Duration-based discount | `baseRate * discountRate` (rounds with `Math.round`) |
| `priceForDays()` | Rental pricing | `dailyRate * days` with duration discounts |
| `computeDamageFee()` | Fee calculation | Applies coverage waivers: `Math.max(0, fee - coverage.waiver)` |

**Rounding Strategy:**
```typescript
// Banker's rounding in convertCurrency():
const floor = Math.floor(raw);
const fraction = raw - floor;
if (fraction > 0.5) return Math.ceil(raw);
if (fraction < 0.5) return floor;
return floor % 2 === 0 ? floor : floor + 1;
```

### 2.2 Checkout Calculations (`packages/platform-core/src/checkout/`)

**Locations:**
- `totals.ts` - Subtotal/deposit aggregation
- `lineItems.ts` - Stripe line item generation
- `createSession.ts` - Full checkout session creation

| File | Calculation | Implementation |
|------|-------------|----------------|
| `totals.ts` | Discount application | `Math.round(unit * (1 - discountRate))` |
| `totals.ts` | Subtotal aggregation | Sum of discounted line items |
| `lineItems.ts` | Stripe unit_amount | `Math.round(unitConv * 100)` (convert to cents) |
| `createSession.ts` | Tax calculation | `Math.round(subtotal * taxRate * 100) / 100` |
| `createSession.ts` | Total calculation | `subtotal + depositTotal + taxAmount` |

**Discount Rate Source:**
```typescript
// From Coupon type:
const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
```

### 2.3 Tax Module (`packages/platform-core/src/tax/index.ts`)

**Location:** `/Users/petercowling/base-shop/packages/platform-core/src/tax/index.ts`

| Function | Purpose |
|----------|---------|
| `getTaxRate()` | Loads regional tax rates from JSON |
| `calculateTax()` | External API call to TaxJar |

**Tax Application (in createSession.ts):**
```typescript
const taxRate = await getTaxRate(taxRegion);
const taxAmountCents = Math.round(subtotal * taxRate * 100);
const taxAmount = taxAmountCents / 100;
```

### 2.4 Refund Calculations (`packages/platform-core/src/orders/refunds.ts`)

**Location:** `/Users/petercowling/base-shop/packages/platform-core/src/orders/refunds.ts`

```typescript
const remaining = Math.max(total - alreadyRefunded, 0);
const refundable = Math.min(requested, remaining);
// ...
amount: Math.round(refundable * 100)  // Convert to cents for Stripe
```

### 2.5 Deposit Release (`packages/platform-machine/src/releaseDepositsService.ts`)

**Location:** `/Users/petercowling/base-shop/packages/platform-machine/src/releaseDepositsService.ts`

```typescript
const refund = Math.max(order.deposit - (order.damageFee ?? 0), 0);
// ...
amount: refund * 100  // Convert to cents for Stripe
```

### 2.6 Late Fee Calculation (`packages/platform-machine/src/lateFeeService.ts`)

**Location:** `/Users/petercowling/base-shop/packages/platform-machine/src/lateFeeService.ts`

```typescript
amount: policy.feeAmount * 100  // Convert to cents for Stripe
```

---

## 3. App-Specific Financial Code

### 3.1 Reception App: `roundDownTo50Cents()`

**Location:** `/Users/petercowling/base-shop/apps/reception/src/utils/moneyUtils.ts`

```typescript
export function roundDownTo50Cents(value: number): number {
  return Math.floor(value * 2) / 2;
}
```

**Test Cases (from `/Users/petercowling/base-shop/apps/reception/src/utils/__tests__/moneyUtils.test.ts`):**
- `roundDownTo50Cents(10.99)` => `10.5`
- `roundDownTo50Cents(10.5)` => `10.5`
- `roundDownTo50Cents(10.25)` => `10`

**Usage Locations:**
- `/Users/petercowling/base-shop/apps/reception/src/components/man/Extension.tsx` - Display nightly rates
- `/Users/petercowling/base-shop/apps/reception/src/components/man/modals/ExtensionPayModal.tsx` - Calculate extension payments

**Migration Recommendation:**
- Replace with `@acme/lib/math/financial.roundDownToIncrement(value, 0.50)`
- Ensure identical behavior: floor to nearest 0.50 increment

### 3.2 Reception App: `formatEuro()`

**Location:** `/Users/petercowling/base-shop/apps/reception/src/utils/format.ts`

```typescript
export function formatEuro(value: number): string {
  return `\u20ac${value.toFixed(2)}`;
}
```

**Note:** Simple formatter, not a calculation. Could use `@acme/lib/format/formatPrice` instead.

### 3.3 Brikette App: Menu Pricing

**Location:** `/Users/petercowling/base-shop/apps/brikette/src/data/menuPricing.ts`

- Static price constants (no calculations)
- Uses `Intl.NumberFormat` for formatting with EUR
- `trimTrailingZeros()` helper for display

### 3.4 CochlearFit App: Price Formatting

**Location:** `/Users/petercowling/base-shop/apps/cochlearfit/src/lib/pricing.ts`

```typescript
export function formatPrice(amount: number, currency: CurrencyCode, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount / 100);  // Assumes minor units
}
```

### 3.5 Product Pipeline: EUR Formatting

**Location:** `/Users/petercowling/base-shop/apps/product-pipeline/src/lib/format.ts`

```typescript
export function formatCurrency(cents: bigint, locale = "en-GB"): string {
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

---

## 4. Coupon/Discount System

### 4.1 Coupon Type (`packages/types/src/Coupon.ts`)

```typescript
export const couponSchema = z.object({
  code: z.string(),
  description: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
}).strict();
```

### 4.2 Coupon Application

**Location:** `/Users/petercowling/base-shop/packages/platform-core/src/coupons.ts`

- `listCoupons()` - Read coupons from disk
- `saveCoupons()` - Persist coupons
- `findCoupon()` - Case-insensitive lookup

**Discount Application (in checkout):**
```typescript
const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
const discounted = Math.round(unit * (1 - discountRate));
```

---

## 5. Currency Conversion Patterns

### 5.1 Major/Minor Unit Conversions

| Location | Direction | Code |
|----------|-----------|------|
| `checkout/lineItems.ts` | Major to minor | `Math.round(unitConv * 100)` |
| `orders/refunds.ts` | Major to minor | `Math.round(refundable * 100)` |
| `lateFeeService.ts` | Major to minor | `policy.feeAmount * 100` |
| `cochlearfit/pricing.ts` | Minor to major | `amount / 100` |

### 5.2 Exchange Rate Conversion

**Location:** `/Users/petercowling/base-shop/packages/platform-core/src/pricing/index.ts`

```typescript
export async function convertCurrency(amount: number, to: string): Promise<number> {
  const { base, rates } = await loadExchangeRates();
  if (to === base) return amount;
  const rate = rates[to];
  if (!rate) throw new Error(`Missing exchange rate for ${to}`);
  // Banker's rounding implementation
  ...
}
```

---

## 6. Rounding Strategies Summary

| Context | Strategy | Implementation |
|---------|----------|----------------|
| Currency conversion | Banker's rounding | Custom (round half to even) |
| Discount application | Standard rounding | `Math.round()` |
| Tax calculation | Standard rounding | `Math.round()` on cents |
| Reception extension | Floor to 0.50 | `Math.floor(value * 2) / 2` |
| Stripe amounts | Standard rounding | `Math.round()` to cents |

---

## 7. Conflict Analysis with Proposed `math/financial` Module

### 7.1 Proposed Functions vs. Existing Code

| Proposed Function | Existing Equivalent | Assessment |
|-------------------|--------------------|-----------|
| `markup()` | None | NEW - No conflict |
| `margin()` | None | NEW - No conflict |
| `applyDiscount()` | Inline in checkout | NEW - Can consolidate |
| `discountPercent()` | None | NEW - No conflict |
| `addTax()` | Inline in checkout | NEW - Can consolidate |
| `removeTax()` | None | NEW - No conflict |
| `taxAmount()` | Inline in checkout | NEW - Can consolidate |
| `roundCurrency()` | None | NEW - Complements `@acme/lib/format/money` |
| `roundToNearest()` | None | NEW - No conflict |
| `roundDownToIncrement()` | `roundDownTo50Cents()` | NEW - Migration target |
| `roundUpToIncrement()` | None | NEW - No conflict |
| `installmentAmount()` | None | NEW - No conflict |
| `amortizationSchedule()` | None | NEW - No conflict |

### 7.2 Compatibility with `@acme/lib/format/money`

**Existing `format/money` responsibilities:**
1. Currency code validation
2. Minor unit <=> major unit conversion
3. Display formatting with `Intl.NumberFormat`

**Proposed `math/financial` responsibilities:**
1. Markup/margin calculations
2. Discount application
3. Tax calculations
4. Rounding operations
5. Installment calculations

**Verdict:** NO CONFLICTS - Different concerns (display vs. calculation)

---

## 8. Recommendations

### 8.1 High Priority Migrations

1. **`roundDownTo50Cents()`** - Replace with `roundDownToIncrement(value, 0.50)`
   - Location: `apps/reception/src/utils/moneyUtils.ts`
   - Effort: Small (1-2 hours)
   - Impact: Eliminates ad-hoc implementation

### 8.2 Consolidation Opportunities

1. **Discount application** - Extract from checkout into `applyDiscount()`
   - Multiple inline `Math.round(unit * (1 - rate))` patterns
   - Would improve testability

2. **Tax calculation** - Extract from createSession into `addTax()`/`taxAmount()`
   - Currently inline with cents conversion

### 8.3 Design Considerations for New Module

1. **Unit Agnosticism**: Functions should work with any numeric representation (let callers handle major/minor conversion)

2. **Banker's Rounding**: `roundCurrency()` should use banker's rounding (round half to even) per existing convention in `convertCurrency()`

3. **Increment Rounding**: Support arbitrary increments (0.05, 0.50, 1.00) not just currency defaults

4. **No Dependencies**: Keep the module dependency-free (no Intl usage for rounding - that's format/money's job)

---

## 9. Files Audited

| Category | Files Examined |
|----------|----------------|
| Core pricing | `packages/platform-core/src/pricing/index.ts` |
| Checkout | `packages/platform-core/src/checkout/{totals,lineItems,createSession}.ts` |
| Tax | `packages/platform-core/src/tax/index.ts` |
| Refunds | `packages/platform-core/src/orders/refunds.ts` |
| Services | `packages/platform-machine/src/{lateFeeService,releaseDepositsService}.ts` |
| Coupons | `packages/platform-core/src/coupons.ts`, `packages/types/src/Coupon.ts` |
| Format/Money | `packages/lib/src/format/{money,formatPrice,formatCurrency}.ts` |
| Pipeline Money | `packages/pipeline-engine/src/money.ts` |
| Reception | `apps/reception/src/utils/{moneyUtils,format}.ts`, `apps/reception/src/components/man/*.tsx` |
| Brikette | `apps/brikette/src/data/menuPricing.ts` |
| CochlearFit | `apps/cochlearfit/src/lib/pricing.ts` |
| Product Pipeline | `apps/product-pipeline/src/lib/format.ts` |
| Currency configs | `apps/xa*/src/lib/currency.ts` |

---

## 10. Conclusion

The audit confirms:

1. **No conflicts** exist between proposed `math/financial` and existing `@acme/lib/format/money`
2. **`roundDownTo50Cents()`** in reception app is the primary migration target
3. **Ad-hoc discount/tax calculations** in checkout would benefit from standardization
4. **Existing rounding strategies vary** - the new module should support both banker's rounding and increment-based rounding
5. **Unit conversions are handled separately** - the new module should remain unit-agnostic

The new `@acme/lib/math/financial` module will fill a genuine gap and enable cleaner, more testable financial logic across the codebase.
