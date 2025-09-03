// packages/platform-core/__tests__/checkout-session.test.ts
import { PRODUCTS } from "../src/products/index";
import { createCheckoutSession } from "../src/checkout/session";
import * as dateUtils from "@acme/date-utils";
import { getTaxRate } from "../src/tax";
import { findCoupon } from "../src/coupons";
import { trackEvent } from "../src/analytics";

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("../src/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (n: number) => n),
}));

jest.mock("../src/tax", () => ({
  getTaxRate: jest.fn(async () => 0.2),
}));

jest.mock("../src/coupons", () => ({
  findCoupon: jest.fn(async () => null),
}));

jest.mock("../src/analytics", () => ({ trackEvent: jest.fn() }));

import { stripe } from "@acme/stripe";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

beforeEach(() => {
  stripeCreate.mockReset();
  (trackEvent as jest.Mock).mockReset();
  (findCoupon as jest.Mock).mockReset();
});

const cart = (() => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  return { [`${sku.id}:${size}`]: { sku, qty: 2, size } } as any;
})();

test("creates Stripe session with correct metadata", async () => {
  stripeCreate.mockReset();
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });

  const returnDate = "2025-01-02";
  const expectedDays = dateUtils.calculateRentalDays(returnDate);

  const result = await createCheckoutSession(cart, {
    returnDate,
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "http://test/success",
    cancelUrl: "http://test/cancelled",
    customerId: "cus_123",
    clientIp: "203.0.113.1",
    shopId: "shop",
  });

  expect(stripeCreate).toHaveBeenCalled();
  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.line_items).toHaveLength(3); // rental, deposit, tax
  expect(
    args.line_items.some(
      (li: any) => li.price_data?.product_data?.name === "Tax"
    )
  ).toBe(true);
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.client_ip).toBe("203.0.113.1");
  expect(options.headers["Stripe-Client-IP"]).toBe("203.0.113.1");
  expect(result.clientSecret).toBe("cs_test");
});

test("throws on invalid returnDate", async () => {
  await expect(
    createCheckoutSession(cart, {
      returnDate: "not-a-date",
      currency: "EUR",
      taxRegion: "EU",
      successUrl: "x",
      cancelUrl: "y",
      shopId: "shop",
    })
  ).rejects.toThrow(/Invalid returnDate/);
});

test("throws when rentalDays are non-positive", async () => {
  jest.spyOn(dateUtils, "calculateRentalDays").mockReturnValueOnce(0);
  await expect(
    createCheckoutSession(cart, {
      returnDate: "2025-01-02",
      currency: "EUR",
      taxRegion: "EU",
      successUrl: "x",
      cancelUrl: "y",
      shopId: "shop",
    })
  ).rejects.toThrow(/Invalid returnDate/);
});

test("applies extra values and billing details without tax", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_extra",
    payment_intent: { client_secret: "cs_extra" },
  });

  (getTaxRate as jest.Mock).mockResolvedValueOnce(0);

  const lineItemsExtra = [
    {
      price_data: {
        currency: "eur",
        unit_amount: 500,
        product_data: { name: "Extra" },
      },
      quantity: 1,
    },
  ];

  const billingDetails = { name: "Jane" } as any;

  await createCheckoutSession(cart, {
    returnDate: "2025-01-03",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "http://test/success",
    cancelUrl: "http://test/cancelled",
    shopId: "shop",
    lineItemsExtra,
    metadataExtra: { foo: "bar" },
    subtotalExtra: 5,
    depositAdjustment: 10,
    billing_details: billingDetails,
  });

  const [args] = stripeCreate.mock.calls[0];
  expect(args.line_items).toHaveLength(3); // rental, deposit, extra
  expect(
    args.line_items.some(
      (li: any) => li.price_data?.product_data?.name === "Extra"
    )
  ).toBe(true);
  expect(
    args.line_items.some(
      (li: any) => li.price_data?.product_data?.name === "Tax"
    )
  ).toBe(false);
  expect(args.payment_intent_data.billing_details).toEqual(billingDetails);
  expect(args.metadata.foo).toBe("bar");
  expect(args.metadata.subtotal).toBe("25");
  expect(args.metadata.depositTotal).toBe("110");
});

test("tracks coupon usage when present and not when absent", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_coupon",
    payment_intent: { client_secret: "cs_coupon" },
  });

  (findCoupon as jest.Mock).mockResolvedValueOnce({
    code: "SAVE10",
    discountPercent: 10,
  });

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    coupon: "SAVE10",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "x",
    cancelUrl: "y",
    shopId: "shop",
  });

  expect(trackEvent).toHaveBeenCalledWith("shop", {
    type: "discount_redeemed",
    code: "SAVE10",
  });

  (findCoupon as jest.Mock).mockResolvedValueOnce(null);

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    coupon: "SAVE10",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "x",
    cancelUrl: "y",
    shopId: "shop",
  });

  expect(trackEvent).toHaveBeenCalledTimes(1);
});

test("includes shipping, billing details and client IP when provided", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_ship",
    payment_intent: { client_secret: "cs_ship" },
  });

  const shipping = { name: "John" } as any;
  const billing = { name: "Jane" } as any;

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "x",
    cancelUrl: "y",
    shopId: "shop",
    shipping,
    billing_details: billing,
    clientIp: "1.2.3.4",
  });

  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.payment_intent_data.shipping).toBe(shipping);
  expect(args.payment_intent_data.billing_details).toBe(billing);
  expect(options.headers["Stripe-Client-IP"]).toBe("1.2.3.4");
});

test("omits optional fields when not provided", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_noopts",
    payment_intent: { client_secret: "cs_noopts" },
  });

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "x",
    cancelUrl: "y",
    shopId: "shop",
  });

  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.payment_intent_data.shipping).toBeUndefined();
  expect(args.payment_intent_data.billing_details).toBeUndefined();
  expect(options).toBeUndefined();
});

test("returns undefined clientSecret when payment_intent is string", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_str",
    payment_intent: "pi_123",
  });

  const result = await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    successUrl: "x",
    cancelUrl: "y",
    shopId: "shop",
  });

  expect(result.clientSecret).toBeUndefined();
});
