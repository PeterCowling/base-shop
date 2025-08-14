import {
  buildLineItemsForItem,
  computeTotals,
  buildCheckoutMetadata,
  type CartState,
} from "../../src/services/checkout";
import { PRODUCTS } from "@platform-core/products";

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(),
  convertCurrency: jest.fn(),
}));

const { priceForDays, convertCurrency } = require("@platform-core/pricing");

describe("buildLineItemsForItem", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("builds rental and deposit line items", async () => {
    const sku = PRODUCTS[0];
    (priceForDays as jest.Mock).mockResolvedValue(10);
    (convertCurrency as jest.Mock).mockImplementation(async (n: number) => n);
    const item = { sku, qty: 2, size: "40" };
    const result = await buildLineItemsForItem(item, 3, 0, "EUR");
    expect(result).toHaveLength(2);
    expect(result[0].price_data?.unit_amount).toBe(1000);
    expect(result[0].quantity).toBe(2);
    expect(result[1].price_data?.unit_amount).toBe(5000);
    expect(result[1].quantity).toBe(2);
  });

  it("omits deposit line when deposit is zero", async () => {
    const sku = { ...PRODUCTS[0], deposit: 0 };
    (priceForDays as jest.Mock).mockResolvedValue(10);
    (convertCurrency as jest.Mock).mockImplementation(async (n: number) => n);
    const item = { sku, qty: 1 } as any;
    const result = await buildLineItemsForItem(item, 3, 0, "EUR");
    expect(result).toHaveLength(1);
    expect(result[0].price_data?.product_data?.name).toBe(sku.title);
  });

  it("propagates pricing errors", async () => {
    const sku = PRODUCTS[0];
    (priceForDays as jest.Mock).mockRejectedValue(new Error("pricing failed"));
    await expect(
      buildLineItemsForItem({ sku, qty: 1 }, 3, 0, "EUR" as any)
    ).rejects.toThrow("pricing failed");
  });
});

describe("computeTotals", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("aggregates subtotal and deposit totals", async () => {
    const sku = PRODUCTS[0];
    const cart: CartState = { [sku.id]: { sku, qty: 2 } };
    (priceForDays as jest.Mock).mockResolvedValue(10);
    (convertCurrency as jest.Mock).mockImplementation(async (n: number) => n);
    const totals = await computeTotals(cart, 3, 0, "EUR");
    expect(totals).toEqual({ subtotal: 20, depositTotal: 100, discount: 0 });
  });

  it("fails when price lookup throws", async () => {
    const sku = PRODUCTS[0];
    const cart: CartState = { [sku.id]: { sku, qty: 1 } };
    (priceForDays as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(computeTotals(cart, 3, 0, "EUR")).rejects.toThrow("boom");
  });
});

describe("buildCheckoutMetadata", () => {
  it("serializes metadata and extras", () => {
    const meta = buildCheckoutMetadata({
      subtotal: 20,
      depositTotal: 100,
      returnDate: "2025-01-02",
      rentalDays: 1,
      customerId: "c1",
      discount: 0,
      coupon: "SAVE",
      currency: "EUR",
      taxRate: 0.2,
      taxAmount: 4,
      clientIp: "203.0.113.1",
      sizes: JSON.stringify({ a: "b" }),
      extra: { foo: "bar" },
    });
    expect(meta.subtotal).toBe("20");
    expect(meta.depositTotal).toBe("100");
    expect(meta.client_ip).toBe("203.0.113.1");
    expect(meta.sizes).toBe(JSON.stringify({ a: "b" }));
    expect((meta as any).foo).toBe("bar");
  });

  it("handles optional fields", () => {
    const meta = buildCheckoutMetadata({
      subtotal: 5,
      depositTotal: 0,
      rentalDays: 2,
      discount: 0,
      currency: "USD",
      taxRate: 0,
      taxAmount: 0,
    } as any);
    expect(meta.returnDate).toBe("");
    expect(meta.customerId).toBe("");
    expect(meta.sizes).toBeUndefined();
    expect(meta.client_ip).toBeUndefined();
  });
});
