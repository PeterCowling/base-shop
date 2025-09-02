// packages/platform-core/__tests__/checkout-session.test.ts
import { PRODUCTS } from "../src/products/index";
import { createCheckoutSession } from "../src/checkout/session";
import * as dateUtils from "@acme/date-utils";
import { getTaxRate } from "../src/tax";

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
  stripeCreate.mockReset();
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
