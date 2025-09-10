import { jest } from "@jest/globals";
import type { CartState } from "../src/cart";

const cart: CartState = {
  a: { sku: { id: "a", deposit: 10 } as any, qty: 2 },
  b: { sku: { id: "b", deposit: 5 } as any, qty: 1 },
};

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

async function setupMocks() {
  const priceForDays = jest.fn(async (sku: any, _days: number) =>
    sku.id === "a" ? 100 : 200
  );
  const convertCurrency = jest.fn(async (amount: number) => amount);

  jest.doMock("../src/pricing", () => ({
    __esModule: true,
    priceForDays,
    convertCurrency,
  }));

  const { computeTotals } = await import("../src/checkout/totals");

  return { computeTotals, priceForDays, convertCurrency };
}

describe("computeTotals", () => {
  it("returns totals without discount", async () => {
    const { computeTotals, convertCurrency } = await setupMocks();

    const totals = await computeTotals(cart, 3, 0, "USD");

    expect(totals).toEqual({ subtotal: 400, depositTotal: 25, discount: 0 });
    expect(convertCurrency).toHaveBeenCalledTimes(3);
    expect(convertCurrency).toHaveBeenNthCalledWith(1, 400, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(2, 25, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(3, 0, "USD");
  });

  it("applies discount rates", async () => {
    const { computeTotals, convertCurrency } = await setupMocks();

    const totals = await computeTotals(cart, 3, 0.25, "USD");

    expect(totals).toEqual({ subtotal: 300, depositTotal: 25, discount: 100 });
    expect(convertCurrency).toHaveBeenCalledTimes(3);
    expect(convertCurrency).toHaveBeenNthCalledWith(1, 300, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(2, 25, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(3, 100, "USD");
  });

  it("handles an empty cart", async () => {
    const { computeTotals, priceForDays, convertCurrency } = await setupMocks();

    const emptyCart: CartState = {};
    const totals = await computeTotals(emptyCart, 3, 0, "USD");

    expect(totals).toEqual({ subtotal: 0, depositTotal: 0, discount: 0 });
    expect(priceForDays).not.toHaveBeenCalled();
    expect(convertCurrency).toHaveBeenCalledTimes(3);
    expect(convertCurrency).toHaveBeenNthCalledWith(1, 0, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(2, 0, "USD");
    expect(convertCurrency).toHaveBeenNthCalledWith(3, 0, "USD");
  });
});

