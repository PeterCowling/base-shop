import { jest } from "@jest/globals";

const create = jest.fn(async () => ({
  id: "cs_123",
  payment_intent: { client_secret: "pi_secret" },
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create } } },
}));

const priceForDays = jest.fn(async () => 100);
const convertCurrency = jest.fn(async (v: number) => v);
jest.mock("../src/pricing", () => ({ priceForDays, convertCurrency }));

const findCoupon = jest.fn(async () => ({ code: "SAVE", discountPercent: 20 }));
jest.mock("../src/coupons", () => ({ findCoupon }));

const trackEvent = jest.fn();
jest.mock("../src/analytics", () => ({ trackEvent }));

const getTaxRate = jest.fn(async () => 0.2);
jest.mock("../src/tax", () => ({ getTaxRate }));

const calculateRentalDays = jest.fn(() => 5);
jest.mock("@acme/date-utils", () => ({ calculateRentalDays }));

describe("createCheckoutSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a checkout session and returns credentials", async () => {
    const { createCheckoutSession } = await import("../src/checkout/session");
    const cart = {
      line1: {
        sku: { id: "sku_1", title: "Test", deposit: 50 },
        qty: 2,
        size: "M",
      },
    } as any;

    const result = await createCheckoutSession({
      shopId: "shop",
      cart,
      returnDate: "2024-01-01",
      coupon: "SAVE",
      currency: "EUR",
      taxRegion: "EU",
      customerId: "cust_1",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancelled",
      clientIp: "1.2.3.4",
    });

    expect(findCoupon).toHaveBeenCalledWith("shop", "SAVE");
    expect(trackEvent).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    const args = create.mock.calls[0][0];
    expect(args.line_items).toHaveLength(3);
    expect(args.metadata.discount).toBe("40");
    expect(result).toEqual({ clientSecret: "pi_secret", sessionId: "cs_123" });
  });

  it("throws on invalid return date", async () => {
    calculateRentalDays.mockImplementationOnce(() => {
      throw new Error("bad");
    });
    const { createCheckoutSession } = await import("../src/checkout/session");
    await expect(
      createCheckoutSession({
        shopId: "shop",
        cart: {},
        currency: "EUR",
        successUrl: "a",
        cancelUrl: "b",
      } as any)
    ).rejects.toThrow("Invalid returnDate");
  });
});
