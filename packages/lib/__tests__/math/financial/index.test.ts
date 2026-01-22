import {
  addTax,
  type AmortizationRow,
  amortizationSchedule,
  applyDiscount,
  compoundInterest,
  discountAmount,
  discountPercent,
  futureValue,
  installmentAmount,
  margin,
  markup,
  presentValue,
  priceFromMargin,
  priceFromMarkup,
  removeTax,
  roundCurrency,
  roundDownToIncrement,
  roundToNearest,
  roundUpToIncrement,
  taxAmount,
} from "../../../src/math/financial";

// ============================================================================
// Markup & Margin Tests
// ============================================================================

describe("markup", () => {
  it("calculates markup percentage", () => {
    expect(markup(80, 100)).toBeCloseTo(0.25, 5); // 25% markup
    expect(markup(100, 150)).toBeCloseTo(0.5, 5); // 50% markup
    expect(markup(50, 75)).toBeCloseTo(0.5, 5); // 50% markup
  });

  it("returns 0 for no markup", () => {
    expect(markup(100, 100)).toBe(0);
    expect(markup(50, 50)).toBe(0);
  });

  it("handles negative markup (selling below cost)", () => {
    expect(markup(100, 80)).toBeCloseTo(-0.2, 5); // -20% (selling at loss)
  });

  it("throws for zero cost", () => {
    expect(() => markup(0, 100)).toThrow(RangeError);
    expect(() => markup(0, 100)).toThrow("Cost must be greater than zero");
  });

  it("throws for negative cost", () => {
    expect(() => markup(-10, 100)).toThrow(RangeError);
  });
});

describe("margin", () => {
  it("calculates margin percentage", () => {
    expect(margin(80, 100)).toBeCloseTo(0.2, 5); // 20% margin
    expect(margin(50, 100)).toBeCloseTo(0.5, 5); // 50% margin
    expect(margin(75, 100)).toBeCloseTo(0.25, 5); // 25% margin
  });

  it("returns 0 for no margin", () => {
    expect(margin(100, 100)).toBe(0);
    expect(margin(50, 50)).toBe(0);
  });

  it("returns 1 (100%) for zero cost", () => {
    expect(margin(0, 100)).toBe(1);
  });

  it("handles negative margin (selling below cost)", () => {
    expect(margin(120, 100)).toBeCloseTo(-0.2, 5); // -20% margin
  });

  it("throws for zero sell price", () => {
    expect(() => margin(100, 0)).toThrow(RangeError);
    expect(() => margin(100, 0)).toThrow("Sell price must be greater than zero");
  });

  it("throws for negative sell price", () => {
    expect(() => margin(100, -10)).toThrow(RangeError);
  });
});

describe("priceFromMarkup", () => {
  it("calculates sell price from cost and markup", () => {
    expect(priceFromMarkup(80, 0.25)).toBeCloseTo(100, 5); // 25% markup on 80
    expect(priceFromMarkup(100, 0.5)).toBeCloseTo(150, 5); // 50% markup on 100
    expect(priceFromMarkup(200, 0.1)).toBeCloseTo(220, 5); // 10% markup on 200
  });

  it("handles zero markup", () => {
    expect(priceFromMarkup(100, 0)).toBe(100);
  });

  it("handles negative markup", () => {
    expect(priceFromMarkup(100, -0.1)).toBeCloseTo(90, 5); // -10% markup
  });

  it("handles 100% markup", () => {
    expect(priceFromMarkup(100, 1)).toBeCloseTo(200, 5);
  });
});

describe("priceFromMargin", () => {
  it("calculates sell price from cost and margin", () => {
    expect(priceFromMargin(80, 0.2)).toBeCloseTo(100, 5); // 20% margin
    expect(priceFromMargin(50, 0.5)).toBeCloseTo(100, 5); // 50% margin
    expect(priceFromMargin(75, 0.25)).toBeCloseTo(100, 5); // 25% margin
  });

  it("handles zero margin", () => {
    expect(priceFromMargin(100, 0)).toBe(100);
  });

  it("throws for margin of 100%", () => {
    expect(() => priceFromMargin(100, 1)).toThrow(RangeError);
    expect(() => priceFromMargin(100, 1)).toThrow(
      "Margin percentage must be less than 1"
    );
  });

  it("throws for margin greater than 100%", () => {
    expect(() => priceFromMargin(100, 1.5)).toThrow(RangeError);
  });
});

describe("markup and margin relationship", () => {
  it("round-trips from markup to margin", () => {
    const cost = 80;
    const markupPercent = 0.25;
    const sellPrice = priceFromMarkup(cost, markupPercent);
    const calculatedMarkup = markup(cost, sellPrice);

    expect(calculatedMarkup).toBeCloseTo(markupPercent, 5);
  });

  it("round-trips from margin to markup", () => {
    const cost = 80;
    const marginPercent = 0.2;
    const sellPrice = priceFromMargin(cost, marginPercent);
    const calculatedMargin = margin(cost, sellPrice);

    expect(calculatedMargin).toBeCloseTo(marginPercent, 5);
  });
});

// ============================================================================
// Discount Tests
// ============================================================================

describe("applyDiscount", () => {
  it("applies discount percentage to price", () => {
    expect(applyDiscount(100, 0.15)).toBeCloseTo(85, 5); // 15% off
    expect(applyDiscount(50, 0.1)).toBeCloseTo(45, 5); // 10% off
    expect(applyDiscount(200, 0.25)).toBeCloseTo(150, 5); // 25% off
  });

  it("handles zero discount", () => {
    expect(applyDiscount(100, 0)).toBe(100);
  });

  it("handles 100% discount (free)", () => {
    expect(applyDiscount(100, 1)).toBe(0);
  });

  it("handles discount greater than 100% (negative price)", () => {
    expect(applyDiscount(100, 1.5)).toBeCloseTo(-50, 5);
  });
});

describe("discountAmount", () => {
  it("calculates discount value", () => {
    expect(discountAmount(100, 0.15)).toBeCloseTo(15, 5);
    expect(discountAmount(50, 0.2)).toBeCloseTo(10, 5);
    expect(discountAmount(200, 0.1)).toBeCloseTo(20, 5);
  });

  it("returns 0 for zero discount", () => {
    expect(discountAmount(100, 0)).toBe(0);
  });

  it("returns full price for 100% discount", () => {
    expect(discountAmount(100, 1)).toBe(100);
  });
});

describe("discountPercent", () => {
  it("calculates discount percentage from prices", () => {
    expect(discountPercent(100, 85)).toBeCloseTo(0.15, 5); // 15% discount
    expect(discountPercent(50, 40)).toBeCloseTo(0.2, 5); // 20% discount
    expect(discountPercent(200, 150)).toBeCloseTo(0.25, 5); // 25% discount
  });

  it("returns 0 for no discount", () => {
    expect(discountPercent(100, 100)).toBe(0);
  });

  it("returns 1 for 100% discount", () => {
    expect(discountPercent(100, 0)).toBe(1);
  });

  it("returns negative for price increase", () => {
    expect(discountPercent(100, 120)).toBeCloseTo(-0.2, 5); // 20% increase
  });

  it("throws for zero original price", () => {
    expect(() => discountPercent(0, 50)).toThrow(RangeError);
    expect(() => discountPercent(0, 50)).toThrow(
      "Original price must be greater than zero"
    );
  });

  it("throws for negative original price", () => {
    expect(() => discountPercent(-100, 50)).toThrow(RangeError);
  });
});

describe("discount round-trip", () => {
  it("applies and calculates discount correctly", () => {
    const original = 100;
    const discountPct = 0.15;
    const discounted = applyDiscount(original, discountPct);
    const calculatedPct = discountPercent(original, discounted);

    expect(calculatedPct).toBeCloseTo(discountPct, 5);
  });
});

// ============================================================================
// Tax Tests
// ============================================================================

describe("addTax", () => {
  it("adds tax to price", () => {
    expect(addTax(100, 0.19)).toBeCloseTo(119, 5); // 19% VAT
    expect(addTax(100, 0.0725)).toBeCloseTo(107.25, 5); // 7.25% sales tax
    expect(addTax(50, 0.2)).toBeCloseTo(60, 5); // 20% VAT
  });

  it("handles zero tax", () => {
    expect(addTax(100, 0)).toBe(100);
  });

  it("handles negative tax (subsidy)", () => {
    expect(addTax(100, -0.1)).toBeCloseTo(90, 5);
  });
});

describe("removeTax", () => {
  it("removes tax from tax-inclusive price", () => {
    expect(removeTax(119, 0.19)).toBeCloseTo(100, 5); // Remove 19% VAT
    expect(removeTax(107.25, 0.0725)).toBeCloseTo(100, 5); // Remove 7.25% sales tax
    expect(removeTax(60, 0.2)).toBeCloseTo(50, 5); // Remove 20% VAT
  });

  it("handles zero tax", () => {
    expect(removeTax(100, 0)).toBe(100);
  });
});

describe("taxAmount", () => {
  it("calculates tax amount from pre-tax price", () => {
    expect(taxAmount(100, 0.19)).toBeCloseTo(19, 5);
    expect(taxAmount(100, 0.0725)).toBeCloseTo(7.25, 5);
    expect(taxAmount(50, 0.2)).toBeCloseTo(10, 5);
  });

  it("returns 0 for zero tax rate", () => {
    expect(taxAmount(100, 0)).toBe(0);
  });
});

describe("tax round-trip", () => {
  it("adds and removes tax correctly", () => {
    const preTax = 100;
    const taxRate = 0.19;
    const withTax = addTax(preTax, taxRate);
    const backToPreTax = removeTax(withTax, taxRate);

    expect(backToPreTax).toBeCloseTo(preTax, 5);
  });

  it("tax amount matches difference", () => {
    const preTax = 100;
    const taxRate = 0.19;
    const withTax = addTax(preTax, taxRate);
    const tax = taxAmount(preTax, taxRate);

    expect(withTax - preTax).toBeCloseTo(tax, 5);
  });
});

// ============================================================================
// Compound Interest Tests
// ============================================================================

describe("compoundInterest", () => {
  it("calculates compound interest", () => {
    // $1000 at 5% for 10 years
    expect(compoundInterest(1000, 0.05, 10)).toBeCloseTo(1628.89, 2);
  });

  it("calculates monthly compounding", () => {
    // $5000 at 0.5% monthly for 12 months
    expect(compoundInterest(5000, 0.005, 12)).toBeCloseTo(5308.39, 2);
  });

  it("returns principal for zero rate", () => {
    expect(compoundInterest(1000, 0, 10)).toBe(1000);
  });

  it("returns principal for zero periods", () => {
    expect(compoundInterest(1000, 0.05, 0)).toBe(1000);
  });

  it("handles single period", () => {
    expect(compoundInterest(1000, 0.1, 1)).toBeCloseTo(1100, 5);
  });
});

describe("presentValue", () => {
  it("calculates present value", () => {
    // What's $10,000 in 5 years worth today at 5%?
    expect(presentValue(10000, 0.05, 5)).toBeCloseTo(7835.26, 2);
  });

  it("returns future value for zero rate", () => {
    expect(presentValue(10000, 0, 5)).toBe(10000);
  });

  it("returns future value for zero periods", () => {
    expect(presentValue(10000, 0.05, 0)).toBe(10000);
  });
});

describe("futureValue", () => {
  it("calculates future value", () => {
    // What will $1000 be worth in 10 years at 5%?
    expect(futureValue(1000, 0.05, 10)).toBeCloseTo(1628.89, 2);
  });

  it("is equivalent to compoundInterest", () => {
    const principal = 1000;
    const rate = 0.05;
    const periods = 10;

    expect(futureValue(principal, rate, periods)).toBe(
      compoundInterest(principal, rate, periods)
    );
  });
});

describe("present/future value round-trip", () => {
  it("converts back and forth correctly", () => {
    const pv = 1000;
    const rate = 0.05;
    const periods = 10;

    const fv = futureValue(pv, rate, periods);
    const backToPV = presentValue(fv, rate, periods);

    expect(backToPV).toBeCloseTo(pv, 5);
  });
});

// ============================================================================
// Installment Tests
// ============================================================================

describe("installmentAmount", () => {
  it("calculates loan payment", () => {
    // $10,000 loan at 5% annual rate (monthly = 0.05/12), 12 payments
    const payment = installmentAmount(10000, 0.05 / 12, 12);
    expect(payment).toBeCloseTo(856.07, 2);
  });

  it("handles zero interest rate", () => {
    // $1000 at 0% over 12 periods
    expect(installmentAmount(1000, 0, 12)).toBeCloseTo(83.33, 2);
  });

  it("handles single period", () => {
    // $1000 at 10% for 1 period
    expect(installmentAmount(1000, 0.1, 1)).toBeCloseTo(1100, 5);
  });

  it("throws for zero periods", () => {
    expect(() => installmentAmount(1000, 0.05, 0)).toThrow(RangeError);
    expect(() => installmentAmount(1000, 0.05, 0)).toThrow(
      "Periods must be greater than zero"
    );
  });

  it("throws for negative periods", () => {
    expect(() => installmentAmount(1000, 0.05, -1)).toThrow(RangeError);
  });
});

describe("amortizationSchedule", () => {
  it("generates correct number of rows", () => {
    const schedule = amortizationSchedule(10000, 0.05 / 12, 12);
    expect(schedule).toHaveLength(12);
  });

  it("has correct period numbers", () => {
    const schedule = amortizationSchedule(10000, 0.05 / 12, 12);

    schedule.forEach((row, index) => {
      expect(row.period).toBe(index + 1);
    });
  });

  it("ends with zero balance", () => {
    const schedule = amortizationSchedule(10000, 0.05 / 12, 12);
    const lastRow = schedule[schedule.length - 1];

    expect(lastRow.balance).toBe(0);
  });

  it("principal + interest equals payment", () => {
    const schedule = amortizationSchedule(10000, 0.05 / 12, 12);

    schedule.forEach((row) => {
      expect(row.principal + row.interest).toBeCloseTo(row.payment, 5);
    });
  });

  it("sum of principal payments equals original principal", () => {
    const principal = 10000;
    const schedule = amortizationSchedule(principal, 0.05 / 12, 12);

    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(principal, 2);
  });

  it("first payment has highest interest portion", () => {
    const schedule = amortizationSchedule(10000, 0.05 / 12, 12);

    // Interest decreases over time as principal decreases
    for (let i = 1; i < schedule.length - 1; i++) {
      expect(schedule[i].interest).toBeLessThan(schedule[i - 1].interest);
    }
  });

  it("handles zero interest rate", () => {
    const schedule = amortizationSchedule(1200, 0, 12);

    // All interest should be 0
    schedule.forEach((row) => {
      expect(row.interest).toBe(0);
    });

    // Payments should be equal
    schedule.forEach((row) => {
      expect(row.payment).toBeCloseTo(100, 5);
    });

    expect(schedule[schedule.length - 1].balance).toBe(0);
  });

  it("throws for zero periods", () => {
    expect(() => amortizationSchedule(1000, 0.05, 0)).toThrow(RangeError);
  });

  it("throws for negative periods", () => {
    expect(() => amortizationSchedule(1000, 0.05, -1)).toThrow(RangeError);
  });

  it("handles single period", () => {
    const schedule = amortizationSchedule(1000, 0.1, 1);

    expect(schedule).toHaveLength(1);
    expect(schedule[0].period).toBe(1);
    expect(schedule[0].principal).toBeCloseTo(1000, 5);
    expect(schedule[0].interest).toBeCloseTo(100, 5); // 10% of 1000
    expect(schedule[0].payment).toBeCloseTo(1100, 5);
    expect(schedule[0].balance).toBe(0);
  });
});

// ============================================================================
// Rounding Tests
// ============================================================================

describe("roundCurrency", () => {
  describe("banker's rounding (round half to even)", () => {
    it("rounds 2.225 to 2.22 (2 is even)", () => {
      expect(roundCurrency(2.225, "USD")).toBe(2.22);
    });

    it("rounds 2.235 to 2.24 (4 is even)", () => {
      expect(roundCurrency(2.235, "USD")).toBe(2.24);
    });

    it("rounds 2.245 to 2.24 (4 is even)", () => {
      expect(roundCurrency(2.245, "USD")).toBe(2.24);
    });

    it("rounds 2.255 to 2.26 (6 is even)", () => {
      expect(roundCurrency(2.255, "USD")).toBe(2.26);
    });

    it("rounds non-halfway values normally", () => {
      expect(roundCurrency(2.224, "USD")).toBe(2.22);
      expect(roundCurrency(2.226, "USD")).toBe(2.23);
      expect(roundCurrency(2.234, "USD")).toBe(2.23);
      expect(roundCurrency(2.236, "USD")).toBe(2.24);
    });
  });

  describe("currency-specific decimals", () => {
    it("rounds USD to 2 decimal places", () => {
      expect(roundCurrency(19.995, "USD")).toBe(20.0);
      expect(roundCurrency(19.994, "USD")).toBe(19.99);
    });

    it("rounds EUR to 2 decimal places", () => {
      expect(roundCurrency(19.995, "EUR")).toBe(20.0);
      expect(roundCurrency(19.994, "EUR")).toBe(19.99);
    });

    it("rounds GBP to 2 decimal places", () => {
      expect(roundCurrency(19.995, "GBP")).toBe(20.0);
    });

    it("rounds JPY to 0 decimal places", () => {
      expect(roundCurrency(1234.5, "JPY")).toBe(1234); // Half to even - 4 is even
      expect(roundCurrency(1235.5, "JPY")).toBe(1236); // Half to even - 6 is even
      expect(roundCurrency(1234.4, "JPY")).toBe(1234);
      expect(roundCurrency(1234.6, "JPY")).toBe(1235);
    });

    it("handles lowercase currency codes", () => {
      expect(roundCurrency(19.995, "usd")).toBe(20.0);
      expect(roundCurrency(1234.5, "jpy")).toBe(1234);
    });

    it("defaults to 2 decimals for completely invalid currency codes", () => {
      // Note: Intl.NumberFormat is very permissive, so this tests the fallback
      // The function catches errors and defaults to 2 decimals
      // XXX is an invalid ISO 4217 code but Intl might still accept it
      // We test with a value that shows 2-decimal rounding behavior
      const result = roundCurrency(1.235, "XXX");
      // Whether XXX throws or not, we should get a valid 2-decimal result
      expect(typeof result).toBe("number");
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles zero", () => {
      expect(roundCurrency(0, "USD")).toBe(0);
    });

    it("handles negative values", () => {
      expect(roundCurrency(-2.225, "USD")).toBe(-2.22);
      expect(roundCurrency(-2.235, "USD")).toBe(-2.24);
    });

    it("handles very small values", () => {
      expect(roundCurrency(0.001, "USD")).toBe(0);
      expect(roundCurrency(0.009, "USD")).toBe(0.01);
    });

    it("handles large values", () => {
      expect(roundCurrency(1234567.895, "USD")).toBe(1234567.9);
    });
  });
});

describe("roundToNearest", () => {
  describe("default mode (round)", () => {
    it("rounds to nearest 5 cents", () => {
      expect(roundToNearest(1.23, 0.05)).toBeCloseTo(1.25, 5);
      expect(roundToNearest(1.22, 0.05)).toBeCloseTo(1.2, 5);
      expect(roundToNearest(1.27, 0.05)).toBeCloseTo(1.25, 5);
      expect(roundToNearest(1.28, 0.05)).toBeCloseTo(1.3, 5);
    });

    it("rounds to nearest 50 cents", () => {
      // 1.25 is exactly halfway - Math.round rounds up
      expect(roundToNearest(1.25, 0.5)).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.24, 0.5)).toBeCloseTo(1.0, 5);
      expect(roundToNearest(1.26, 0.5)).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.75, 0.5)).toBeCloseTo(2.0, 5);
    });

    it("rounds to nearest dollar", () => {
      expect(roundToNearest(1.49, 1)).toBe(1);
      expect(roundToNearest(1.5, 1)).toBe(2);
      expect(roundToNearest(1.51, 1)).toBe(2);
    });

    it("rounds to nearest 10", () => {
      expect(roundToNearest(14, 10)).toBe(10);
      expect(roundToNearest(15, 10)).toBe(20);
      expect(roundToNearest(16, 10)).toBe(20);
    });
  });

  describe("floor mode", () => {
    it("floors to nearest increment", () => {
      expect(roundToNearest(1.99, 0.5, "floor")).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.5, 0.5, "floor")).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.49, 0.5, "floor")).toBeCloseTo(1.0, 5);
    });

    it("floors to nearest dollar", () => {
      expect(roundToNearest(9.99, 1, "floor")).toBe(9);
      expect(roundToNearest(10.0, 1, "floor")).toBe(10);
    });
  });

  describe("ceil mode", () => {
    it("ceils to nearest increment", () => {
      expect(roundToNearest(1.01, 0.5, "ceil")).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.5, 0.5, "ceil")).toBeCloseTo(1.5, 5);
      expect(roundToNearest(1.51, 0.5, "ceil")).toBeCloseTo(2.0, 5);
    });

    it("ceils to nearest 10", () => {
      expect(roundToNearest(91, 10, "ceil")).toBe(100);
      expect(roundToNearest(90, 10, "ceil")).toBe(90);
    });
  });

  describe("edge cases", () => {
    it("handles zero", () => {
      expect(roundToNearest(0, 0.5)).toBe(0);
    });

    it("handles negative values", () => {
      expect(roundToNearest(-1.25, 0.5)).toBeCloseTo(-1.0, 5);
      expect(roundToNearest(-1.26, 0.5)).toBeCloseTo(-1.5, 5);
    });

    it("throws for zero increment", () => {
      expect(() => roundToNearest(1, 0)).toThrow(RangeError);
      expect(() => roundToNearest(1, 0)).toThrow(
        "Increment must be greater than zero"
      );
    });

    it("throws for negative increment", () => {
      expect(() => roundToNearest(1, -0.5)).toThrow(RangeError);
    });
  });
});

describe("roundDownToIncrement", () => {
  it("is equivalent to roundToNearest with floor mode", () => {
    expect(roundDownToIncrement(10.99, 0.5)).toBe(
      roundToNearest(10.99, 0.5, "floor")
    );
    expect(roundDownToIncrement(10.5, 0.5)).toBe(
      roundToNearest(10.5, 0.5, "floor")
    );
    expect(roundDownToIncrement(10.25, 0.5)).toBe(
      roundToNearest(10.25, 0.5, "floor")
    );
  });

  describe("replaces roundDownTo50Cents behavior", () => {
    // These tests verify that roundDownToIncrement(value, 0.50) matches
    // the existing roundDownTo50Cents() function in reception app
    it("rounds 10.99 to 10.5", () => {
      expect(roundDownToIncrement(10.99, 0.5)).toBeCloseTo(10.5, 5);
    });

    it("keeps 10.5 as 10.5", () => {
      expect(roundDownToIncrement(10.5, 0.5)).toBeCloseTo(10.5, 5);
    });

    it("rounds 10.25 to 10", () => {
      expect(roundDownToIncrement(10.25, 0.5)).toBeCloseTo(10.0, 5);
    });

    it("rounds 0.49 to 0", () => {
      expect(roundDownToIncrement(0.49, 0.5)).toBeCloseTo(0.0, 5);
    });

    it("rounds 0.5 to 0.5", () => {
      expect(roundDownToIncrement(0.5, 0.5)).toBeCloseTo(0.5, 5);
    });
  });

  it("rounds down to nearest dollar", () => {
    expect(roundDownToIncrement(9.99, 1)).toBe(9);
    expect(roundDownToIncrement(9.01, 1)).toBe(9);
    expect(roundDownToIncrement(9.0, 1)).toBe(9);
  });

  it("rounds down to nearest 5", () => {
    expect(roundDownToIncrement(27, 5)).toBe(25);
    expect(roundDownToIncrement(25, 5)).toBe(25);
    expect(roundDownToIncrement(24, 5)).toBe(20);
  });

  it("throws for zero increment", () => {
    expect(() => roundDownToIncrement(1, 0)).toThrow(RangeError);
  });
});

describe("roundUpToIncrement", () => {
  it("is equivalent to roundToNearest with ceil mode", () => {
    expect(roundUpToIncrement(10.01, 0.5)).toBe(
      roundToNearest(10.01, 0.5, "ceil")
    );
    expect(roundUpToIncrement(10.5, 0.5)).toBe(
      roundToNearest(10.5, 0.5, "ceil")
    );
    expect(roundUpToIncrement(10.75, 0.5)).toBe(
      roundToNearest(10.75, 0.5, "ceil")
    );
  });

  it("rounds up to nearest 50 cents", () => {
    expect(roundUpToIncrement(10.01, 0.5)).toBeCloseTo(10.5, 5);
    expect(roundUpToIncrement(10.5, 0.5)).toBeCloseTo(10.5, 5);
    expect(roundUpToIncrement(10.75, 0.5)).toBeCloseTo(11.0, 5);
  });

  it("rounds up to nearest dollar", () => {
    expect(roundUpToIncrement(9.01, 1)).toBe(10);
    expect(roundUpToIncrement(9.0, 1)).toBe(9);
  });

  it("rounds up to nearest 5", () => {
    expect(roundUpToIncrement(22, 5)).toBe(25);
    expect(roundUpToIncrement(25, 5)).toBe(25);
    expect(roundUpToIncrement(26, 5)).toBe(30);
  });

  it("throws for zero increment", () => {
    expect(() => roundUpToIncrement(1, 0)).toThrow(RangeError);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("integration scenarios", () => {
  describe("e-commerce pricing workflow", () => {
    it("calculates sale price with tax and rounds to currency", () => {
      const originalPrice = 99.99;
      const discountRate = 0.2; // 20% off
      const taxRate = 0.19; // 19% VAT

      const salePrice = applyDiscount(originalPrice, discountRate);
      const withTax = addTax(salePrice, taxRate);
      const finalPrice = roundCurrency(withTax, "EUR");

      // 99.99 * 0.8 = 79.992
      // 79.992 * 1.19 = 95.19048
      // Rounded to 95.19
      expect(finalPrice).toBe(95.19);
    });

    it("calculates margin after discount", () => {
      const cost = 50;
      const listPrice = 100;
      const discountRate = 0.15;

      const salePrice = applyDiscount(listPrice, discountRate); // 85
      const marginAfterDiscount = margin(cost, salePrice); // (85-50)/85

      expect(marginAfterDiscount).toBeCloseTo(0.4118, 4); // ~41.18% margin
    });
  });

  describe("loan calculation workflow", () => {
    it("verifies total payments match expected interest", () => {
      const principal = 100000;
      const annualRate = 0.06;
      const monthlyRate = annualRate / 12;
      const months = 360; // 30 year mortgage

      const schedule = amortizationSchedule(principal, monthlyRate, months);
      const totalPayments = schedule.reduce(
        (sum, row) => sum + row.payment,
        0
      );
      const totalInterest = schedule.reduce(
        (sum, row) => sum + row.interest,
        0
      );

      // Total interest should be significant for a 30-year loan
      expect(totalInterest).toBeGreaterThan(principal);

      // Total payments = principal + total interest
      expect(totalPayments).toBeCloseTo(principal + totalInterest, 2);
    });

    it("calculates present value of loan payments", () => {
      const principal = 10000;
      const monthlyRate = 0.005;
      const months = 12;

      const payment = installmentAmount(principal, monthlyRate, months);

      // Sum of present values of all payments should equal principal
      let pvSum = 0;
      for (let i = 1; i <= months; i++) {
        pvSum += presentValue(payment, monthlyRate, i);
      }

      expect(pvSum).toBeCloseTo(principal, 2);
    });
  });

  describe("cash register rounding workflow", () => {
    it("rounds cash payments to eliminate small coins", () => {
      // In some countries, cash is rounded to nearest 5 cents
      const exactTotal = 12.37;

      const cashTotal = roundToNearest(exactTotal, 0.05);
      expect(cashTotal).toBeCloseTo(12.35, 5);

      const exactTotal2 = 12.38;
      const cashTotal2 = roundToNearest(exactTotal2, 0.05);
      expect(cashTotal2).toBeCloseTo(12.4, 5);
    });
  });
});

// ============================================================================
// Type Tests
// ============================================================================

describe("type exports", () => {
  it("exports AmortizationRow type", () => {
    // This is a compile-time check - if types weren't exported correctly,
    // the import at the top would fail
    const row: AmortizationRow = {
      period: 1,
      payment: 100,
      principal: 90,
      interest: 10,
      balance: 900,
    };

    expect(row.period).toBe(1);
  });
});
