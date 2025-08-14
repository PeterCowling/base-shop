import { computeTotals } from "../totals";
import { PRODUCTS } from "@platform-core/products";
import { priceForDays, convertCurrency } from "@platform-core/pricing";
import type { CartState } from "@platform-core/src/cartCookie";

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(),
  convertCurrency: jest.fn(),
}));

const priceForDaysMock = priceForDays as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;

describe("computeTotals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates subtotal, deposit total and discount", async () => {
    priceForDaysMock
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(200);
    convertCurrencyMock.mockImplementation(async (n: number) => n);

    const cart: CartState = {
      item1: { sku: { ...PRODUCTS[0] }, qty: 2 } as any,
      item2: { sku: { ...PRODUCTS[1], deposit: 0 }, qty: 1 } as any,
    };

    const result = await computeTotals(cart, 5, 0.1, "EUR");

    expect(result).toEqual({
      subtotal: 360,
      depositTotal: 100,
      discount: 40,
    });
  });

  it("returns zeros for empty cart", async () => {
    priceForDaysMock.mockResolvedValue(0);
    convertCurrencyMock.mockImplementation(async (n: number) => n);

    const result = await computeTotals({}, 5, 0, "EUR");

    expect(result).toEqual({
      subtotal: 0,
      depositTotal: 0,
      discount: 0,
    });
  });
});
