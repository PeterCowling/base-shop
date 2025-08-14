import { buildLineItemsForItem } from "../line-items";
import { PRODUCTS } from "@platform-core/products";
import { priceForDays, convertCurrency } from "@platform-core/pricing";
import type { CartLine } from "@platform-core/src/cartCookie";

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(),
  convertCurrency: jest.fn(),
}));

const priceForDaysMock = priceForDays as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;

describe("buildLineItemsForItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds rental and deposit line items", async () => {
    priceForDaysMock.mockResolvedValue(10);
    convertCurrencyMock.mockImplementation(async (n: number) => n);
    const item: CartLine = { sku: { ...PRODUCTS[0] }, qty: 2, size: "40" } as any;

    const result = await buildLineItemsForItem(item, 5, 0.2, "EUR");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      price_data: {
        currency: "eur",
        unit_amount: 800,
        product_data: { name: `${PRODUCTS[0].title} (40)` },
      },
      quantity: 2,
    });
    expect(result[1]).toMatchObject({
      price_data: {
        currency: "eur",
        unit_amount: 5000,
        product_data: { name: `${PRODUCTS[0].title} (40) deposit` },
      },
      quantity: 2,
    });
  });

  it("omits deposit when zero", async () => {
    priceForDaysMock.mockResolvedValue(10);
    convertCurrencyMock.mockImplementation(async (n: number) => n);
    const sku = { ...PRODUCTS[0], deposit: 0 };
    const item: CartLine = { sku, qty: 1 } as any;

    const result = await buildLineItemsForItem(item, 5, 0, "EUR");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      price_data: { unit_amount: 1000 },
      quantity: 1,
    });
  });
});
