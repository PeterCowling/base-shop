/**
 * Financial Math Primitives
 *
 * Pure mathematical functions for financial calculations including:
 * - Markup and margin calculations
 * - Discount operations
 * - Tax calculations
 * - Compound interest and present/future value
 * - Installment and amortization
 * - Currency-aware rounding
 *
 * Design principles:
 * - All functions operate on plain numbers (callers handle unit conversion)
 * - Uses banker's rounding (round half to even) for financial accuracy
 * - No dependencies on display/formatting utilities
 * - Complements @acme/lib/format/money (display) with calculation primitives
 *
 * @example
 * ```typescript
 * import {
 *   margin,
 *   applyDiscount,
 *   addTax,
 *   roundCurrency,
 *   installmentAmount,
 * } from '@acme/lib/math/financial';
 *
 * // Calculate margin on a product
 * const marginPercent = margin(80, 100); // 0.2 (20%)
 *
 * // Apply a 15% discount
 * const salePrice = applyDiscount(100, 0.15); // 85
 *
 * // Add 19% VAT
 * const withTax = addTax(100, 0.19); // 119
 *
 * // Round to currency precision
 * const rounded = roundCurrency(19.995, 'EUR'); // 20.00
 * const yenRounded = roundCurrency(1234.5, 'JPY'); // 1234
 *
 * // Calculate monthly payment
 * const payment = installmentAmount(10000, 0.05, 12); // ~856.07
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * A row in an amortization schedule
 */
export interface AmortizationRow {
  /** Period number (1-indexed) */
  period: number;
  /** Total payment for this period */
  payment: number;
  /** Principal portion of payment */
  principal: number;
  /** Interest portion of payment */
  interest: number;
  /** Remaining balance after this payment */
  balance: number;
}

/**
 * Rounding mode for roundToNearest
 */
export type RoundingMode = "round" | "floor" | "ceil";

// ============================================================================
// Internal Utilities
// ============================================================================

/**
 * Banker's rounding (round half to even) at a specific number of decimal places.
 * This is the standard rounding method for financial calculations.
 *
 * @param value - The value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 *
 * @example
 * bankersRound(2.225, 2) // 2.22 (half to even - 2 is even)
 * bankersRound(2.235, 2) // 2.24 (half to even - 4 is even)
 * bankersRound(2.245, 2) // 2.24 (half to even - 4 is even)
 * bankersRound(2.255, 2) // 2.26 (half to even - 6 is even)
 */
function bankersRound(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  const shifted = value * multiplier;
  const floor = Math.floor(shifted);
  const fraction = shifted - floor;

  // Check if we're exactly at the halfway point
  // Use a small epsilon to handle floating point imprecision
  const epsilon = 1e-9;
  const isHalfway = Math.abs(fraction - 0.5) < epsilon;

  if (isHalfway) {
    // Round to even
    if (floor % 2 === 0) {
      return floor / multiplier;
    } else {
      return (floor + 1) / multiplier;
    }
  }

  // Standard rounding
  return Math.round(shifted) / multiplier;
}

/**
 * Currency fraction digits cache using Intl.NumberFormat
 */
const currencyDigitsCache = new Map<string, number>();

/**
 * Gets the number of decimal places for a currency code.
 * Uses Intl.NumberFormat to determine the standard fraction digits.
 *
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY')
 * @returns Number of decimal places (0 for JPY, 2 for most currencies)
 */
function getCurrencyDecimals(currency: string): number {
  const normalized = currency.toUpperCase();
  const cached = currencyDigitsCache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
    });
    const resolved = formatter.resolvedOptions();
    const digits =
      resolved.maximumFractionDigits ?? resolved.minimumFractionDigits ?? 2;
    currencyDigitsCache.set(normalized, digits);
    return digits;
  } catch {
    // Default to 2 for unknown currencies
    return 2;
  }
}

// ============================================================================
// Markup & Margin Functions
// ============================================================================

/**
 * Calculates the markup percentage given cost and selling price.
 *
 * Markup = (sellPrice - cost) / cost
 *
 * @param cost - The cost/purchase price
 * @param sellPrice - The selling price
 * @returns Markup as a decimal (0.25 = 25% markup)
 * @throws RangeError if cost is zero or negative
 *
 * @example
 * ```typescript
 * markup(80, 100);  // 0.25 (25% markup)
 * markup(100, 150); // 0.5 (50% markup)
 * markup(50, 50);   // 0 (no markup)
 * ```
 */
export function markup(cost: number, sellPrice: number): number {
  if (cost <= 0) {
    throw new RangeError("Cost must be greater than zero");
  }
  return (sellPrice - cost) / cost;
}

/**
 * Calculates the margin percentage given cost and selling price.
 *
 * Margin = (sellPrice - cost) / sellPrice
 *
 * @param cost - The cost/purchase price
 * @param sellPrice - The selling price
 * @returns Margin as a decimal (0.2 = 20% margin)
 * @throws RangeError if sellPrice is zero or negative
 *
 * @example
 * ```typescript
 * margin(80, 100);  // 0.2 (20% margin)
 * margin(100, 100); // 0 (no margin)
 * margin(0, 100);   // 1 (100% margin)
 * ```
 */
export function margin(cost: number, sellPrice: number): number {
  if (sellPrice <= 0) {
    throw new RangeError("Sell price must be greater than zero");
  }
  return (sellPrice - cost) / sellPrice;
}

/**
 * Calculates the selling price given cost and markup percentage.
 *
 * SellPrice = cost * (1 + markupPercent)
 *
 * @param cost - The cost/purchase price
 * @param markupPercent - Markup as a decimal (0.25 = 25%)
 * @returns The selling price
 *
 * @example
 * ```typescript
 * priceFromMarkup(80, 0.25);  // 100 (25% markup on 80)
 * priceFromMarkup(100, 0.5);  // 150 (50% markup on 100)
 * priceFromMarkup(50, 0);     // 50 (no markup)
 * ```
 */
export function priceFromMarkup(cost: number, markupPercent: number): number {
  return cost * (1 + markupPercent);
}

/**
 * Calculates the selling price given cost and margin percentage.
 *
 * SellPrice = cost / (1 - marginPercent)
 *
 * @param cost - The cost/purchase price
 * @param marginPercent - Margin as a decimal (0.2 = 20%)
 * @returns The selling price
 * @throws RangeError if marginPercent is 1 or greater (would result in infinite/negative price)
 *
 * @example
 * ```typescript
 * priceFromMargin(80, 0.2);  // 100 (20% margin means cost is 80% of price)
 * priceFromMargin(100, 0.5); // 200 (50% margin means cost is 50% of price)
 * priceFromMargin(50, 0);    // 50 (no margin)
 * ```
 */
export function priceFromMargin(cost: number, marginPercent: number): number {
  if (marginPercent >= 1) {
    throw new RangeError(
      "Margin percentage must be less than 1 (100%)"
    );
  }
  return cost / (1 - marginPercent);
}

// ============================================================================
// Discount Functions
// ============================================================================

/**
 * Applies a discount percentage to a price.
 *
 * @param price - The original price
 * @param discountPercent - Discount as a decimal (0.15 = 15%)
 * @returns The discounted price
 *
 * @example
 * ```typescript
 * applyDiscount(100, 0.15); // 85 (15% off)
 * applyDiscount(50, 0.1);   // 45 (10% off)
 * applyDiscount(100, 0);    // 100 (no discount)
 * applyDiscount(100, 1);    // 0 (100% off - free)
 * ```
 */
export function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent);
}

/**
 * Calculates the discount amount given original price and discount percentage.
 *
 * @param price - The original price
 * @param discountPercent - Discount as a decimal (0.15 = 15%)
 * @returns The discount value (amount saved)
 *
 * @example
 * ```typescript
 * discountAmount(100, 0.15); // 15 (saved 15)
 * discountAmount(50, 0.2);   // 10 (saved 10)
 * ```
 */
export function discountAmount(price: number, discountPercent: number): number {
  return price * discountPercent;
}

/**
 * Calculates the discount percentage given original and discounted prices.
 *
 * @param original - The original price
 * @param discounted - The discounted price
 * @returns Discount as a decimal (0.15 = 15%)
 * @throws RangeError if original price is zero or negative
 *
 * @example
 * ```typescript
 * discountPercent(100, 85); // 0.15 (15% discount)
 * discountPercent(50, 40);  // 0.2 (20% discount)
 * discountPercent(100, 100); // 0 (no discount)
 * ```
 */
export function discountPercent(original: number, discounted: number): number {
  if (original <= 0) {
    throw new RangeError("Original price must be greater than zero");
  }
  return (original - discounted) / original;
}

// ============================================================================
// Tax Functions
// ============================================================================

/**
 * Adds tax to a price.
 *
 * @param price - The price before tax
 * @param taxRate - Tax rate as a decimal (0.19 = 19%)
 * @returns The price including tax
 *
 * @example
 * ```typescript
 * addTax(100, 0.19);  // 119 (19% VAT)
 * addTax(100, 0.0725); // 107.25 (7.25% sales tax)
 * addTax(100, 0);      // 100 (no tax)
 * ```
 */
export function addTax(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}

/**
 * Removes tax from a tax-inclusive price.
 *
 * @param priceWithTax - The price including tax
 * @param taxRate - Tax rate as a decimal (0.19 = 19%)
 * @returns The price excluding tax
 *
 * @example
 * ```typescript
 * removeTax(119, 0.19);   // 100 (remove 19% VAT)
 * removeTax(107.25, 0.0725); // 100 (remove 7.25% sales tax)
 * removeTax(100, 0);      // 100 (no tax to remove)
 * ```
 */
export function removeTax(priceWithTax: number, taxRate: number): number {
  return priceWithTax / (1 + taxRate);
}

/**
 * Calculates the tax amount from a pre-tax price.
 *
 * @param price - The price before tax
 * @param taxRate - Tax rate as a decimal (0.19 = 19%)
 * @returns The tax amount
 *
 * @example
 * ```typescript
 * taxAmount(100, 0.19);  // 19 (19% of 100)
 * taxAmount(100, 0.0725); // 7.25 (7.25% of 100)
 * ```
 */
export function taxAmount(price: number, taxRate: number): number {
  return price * taxRate;
}

// ============================================================================
// Compound Interest Functions
// ============================================================================

/**
 * Calculates compound interest final amount.
 *
 * A = P * (1 + r)^n
 *
 * @param principal - The initial principal amount
 * @param rate - Interest rate per period as a decimal (0.05 = 5%)
 * @param periods - Number of compounding periods
 * @returns The final amount (principal + interest)
 *
 * @example
 * ```typescript
 * // $1000 at 5% annual interest for 10 years
 * compoundInterest(1000, 0.05, 10); // ~1628.89
 *
 * // $5000 at 0.5% monthly interest for 12 months
 * compoundInterest(5000, 0.005, 12); // ~5308.39
 * ```
 */
export function compoundInterest(
  principal: number,
  rate: number,
  periods: number
): number {
  return principal * Math.pow(1 + rate, periods);
}

/**
 * Calculates the present value of a future amount.
 *
 * PV = FV / (1 + r)^n
 *
 * @param futureValue - The future value
 * @param rate - Interest rate per period as a decimal (0.05 = 5%)
 * @param periods - Number of periods
 * @returns The present value
 *
 * @example
 * ```typescript
 * // What's $10,000 in 5 years worth today at 5% annual rate?
 * presentValue(10000, 0.05, 5); // ~7835.26
 * ```
 */
export function presentValue(
  futureValue: number,
  rate: number,
  periods: number
): number {
  return futureValue / Math.pow(1 + rate, periods);
}

/**
 * Calculates the future value of a present amount.
 *
 * FV = PV * (1 + r)^n
 *
 * This is equivalent to compoundInterest but named for clarity in
 * time-value-of-money calculations.
 *
 * @param pv - The present value
 * @param rate - Interest rate per period as a decimal (0.05 = 5%)
 * @param periods - Number of periods
 * @returns The future value
 *
 * @example
 * ```typescript
 * // What will $1000 be worth in 10 years at 5% annual rate?
 * futureValue(1000, 0.05, 10); // ~1628.89
 * ```
 */
export function futureValue(
  pv: number,
  rate: number,
  periods: number
): number {
  return pv * Math.pow(1 + rate, periods);
}

// ============================================================================
// Installment Functions
// ============================================================================

/**
 * Calculates the fixed payment amount for a loan.
 *
 * Uses the standard annuity formula:
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * For zero interest rate, returns principal / periods.
 *
 * @param principal - The loan principal amount
 * @param rate - Interest rate per period as a decimal (0.05 = 5%)
 * @param periods - Number of payment periods
 * @returns The fixed payment amount per period
 * @throws RangeError if periods is zero or negative
 *
 * @example
 * ```typescript
 * // $10,000 loan at 5% annual rate, 12 monthly payments
 * // (Note: use monthly rate = 0.05/12 for monthly payments)
 * installmentAmount(10000, 0.05/12, 12); // ~856.07
 *
 * // $1000 at 0% interest over 12 periods
 * installmentAmount(1000, 0, 12); // 83.33...
 * ```
 */
export function installmentAmount(
  principal: number,
  rate: number,
  periods: number
): number {
  if (periods <= 0) {
    throw new RangeError("Periods must be greater than zero");
  }

  // Special case: zero interest rate
  if (rate === 0) {
    return principal / periods;
  }

  const factor = Math.pow(1 + rate, periods);
  return (principal * rate * factor) / (factor - 1);
}

/**
 * Generates a complete amortization schedule for a loan.
 *
 * Each row shows the payment breakdown into principal and interest,
 * along with the remaining balance. The schedule ensures no floating
 * point drift by adjusting the final payment if needed.
 *
 * @param principal - The loan principal amount
 * @param rate - Interest rate per period as a decimal (0.05 = 5%)
 * @param periods - Number of payment periods
 * @returns Array of AmortizationRow objects
 * @throws RangeError if periods is zero or negative
 *
 * @example
 * ```typescript
 * const schedule = amortizationSchedule(10000, 0.05/12, 12);
 * // Returns 12 rows with payment, principal, interest, balance
 *
 * schedule[0];
 * // { period: 1, payment: 856.07, principal: 814.40,
 * //   interest: 41.67, balance: 9185.60 }
 *
 * schedule[11].balance; // 0 (or very close to 0)
 * ```
 */
export function amortizationSchedule(
  principal: number,
  rate: number,
  periods: number
): AmortizationRow[] {
  if (periods <= 0) {
    throw new RangeError("Periods must be greater than zero");
  }

  const payment = installmentAmount(principal, rate, periods);
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let period = 1; period <= periods; period++) {
    const interestPortion = balance * rate;

    // For the last payment, pay off the exact remaining balance
    // to avoid floating point drift
    const isLastPayment = period === periods;
    let principalPortion: number;
    let actualPayment: number;

    if (isLastPayment) {
      principalPortion = balance;
      actualPayment = balance + interestPortion;
    } else {
      principalPortion = payment - interestPortion;
      actualPayment = payment;
    }

    balance = isLastPayment ? 0 : balance - principalPortion;

    schedule.push({
      period,
      payment: actualPayment,
      principal: principalPortion,
      interest: interestPortion,
      balance,
    });
  }

  return schedule;
}

// ============================================================================
// Rounding Functions
// ============================================================================

/**
 * Rounds a currency amount to the appropriate decimal places using banker's rounding.
 *
 * Uses ISO 4217 currency rules:
 * - JPY, KRW: 0 decimal places
 * - EUR, USD, GBP: 2 decimal places
 * - BHD, KWD, OMR: 3 decimal places
 *
 * @param amount - The amount to round
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY')
 * @returns The rounded amount
 *
 * @example
 * ```typescript
 * roundCurrency(19.995, 'USD'); // 20.00
 * roundCurrency(19.985, 'USD'); // 19.98 (banker's rounding - 8 is even)
 * roundCurrency(1234.5, 'JPY'); // 1234 (JPY has 0 decimals, half to even)
 * roundCurrency(1235.5, 'JPY'); // 1236 (JPY has 0 decimals, half to even)
 *
 * // Banker's rounding examples (round half to even):
 * roundCurrency(2.225, 'USD'); // 2.22 (2 is even)
 * roundCurrency(2.235, 'USD'); // 2.24 (4 is even)
 * roundCurrency(2.245, 'USD'); // 2.24 (4 is even)
 * roundCurrency(2.255, 'USD'); // 2.26 (6 is even)
 * ```
 */
export function roundCurrency(amount: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  return bankersRound(amount, decimals);
}

/**
 * Rounds a value to the nearest increment.
 *
 * @param amount - The value to round
 * @param increment - The increment to round to (e.g., 0.05, 0.50, 1.00)
 * @param mode - Rounding mode: 'round' (default), 'floor', or 'ceil'
 * @returns The rounded value
 * @throws RangeError if increment is zero or negative
 *
 * @example
 * ```typescript
 * // Round to nearest 5 cents
 * roundToNearest(1.23, 0.05);           // 1.25
 * roundToNearest(1.22, 0.05);           // 1.20
 *
 * // Round to nearest 50 cents
 * roundToNearest(1.25, 0.50);           // 1.00
 * roundToNearest(1.75, 0.50);           // 2.00
 *
 * // Floor to nearest dollar
 * roundToNearest(9.99, 1.00, 'floor');  // 9.00
 *
 * // Ceil to nearest 10
 * roundToNearest(91, 10, 'ceil');       // 100
 * ```
 */
export function roundToNearest(
  amount: number,
  increment: number,
  mode: RoundingMode = "round"
): number {
  if (increment <= 0) {
    throw new RangeError("Increment must be greater than zero");
  }

  const quotient = amount / increment;

  switch (mode) {
    case "floor":
      return Math.floor(quotient) * increment;
    case "ceil":
      return Math.ceil(quotient) * increment;
    case "round":
    default:
      return Math.round(quotient) * increment;
  }
}

/**
 * Rounds a value down (floor) to the nearest increment.
 *
 * This is a convenience function equivalent to roundToNearest(amount, increment, 'floor').
 * Use this to consolidate patterns like `roundDownTo50Cents()` into a generic utility.
 *
 * @param amount - The value to round
 * @param increment - The increment to round to (e.g., 0.50, 1.00)
 * @returns The rounded-down value
 * @throws RangeError if increment is zero or negative
 *
 * @example
 * ```typescript
 * // Round down to nearest 50 cents (replaces roundDownTo50Cents)
 * roundDownToIncrement(10.99, 0.50); // 10.50
 * roundDownToIncrement(10.50, 0.50); // 10.50
 * roundDownToIncrement(10.25, 0.50); // 10.00
 * roundDownToIncrement(0.49, 0.50);  // 0.00
 *
 * // Round down to nearest dollar
 * roundDownToIncrement(9.99, 1.00);  // 9.00
 *
 * // Round down to nearest 5
 * roundDownToIncrement(27, 5);       // 25
 * ```
 */
export function roundDownToIncrement(
  amount: number,
  increment: number
): number {
  return roundToNearest(amount, increment, "floor");
}

/**
 * Rounds a value up (ceil) to the nearest increment.
 *
 * This is a convenience function equivalent to roundToNearest(amount, increment, 'ceil').
 *
 * @param amount - The value to round
 * @param increment - The increment to round to (e.g., 0.50, 1.00)
 * @returns The rounded-up value
 * @throws RangeError if increment is zero or negative
 *
 * @example
 * ```typescript
 * // Round up to nearest 50 cents
 * roundUpToIncrement(10.01, 0.50); // 10.50
 * roundUpToIncrement(10.50, 0.50); // 10.50
 * roundUpToIncrement(10.75, 0.50); // 11.00
 *
 * // Round up to nearest dollar
 * roundUpToIncrement(9.01, 1.00);  // 10.00
 *
 * // Round up to nearest 5
 * roundUpToIncrement(22, 5);       // 25
 * ```
 */
export function roundUpToIncrement(amount: number, increment: number): number {
  return roundToNearest(amount, increment, "ceil");
}
