// packages/platform-core/__tests__/checkout-session.test.ts
import * as dateUtils from "@acme/date-utils";
import { stripe } from "@acme/stripe";

import { trackEvent } from "../src/analytics";
import { createCheckoutSession } from "../src/checkout/session";
import { findCoupon } from "../src/coupons";
import { PRODUCTS } from "../src/products/index";
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
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

beforeEach(() => {
  stripeCreate.mockReset();
  (trackEvent as jest.Mock).mockReset();
  (findCoupon as jest.Mock).mockReset();
});

const sku1 = PRODUCTS[0];
const size1 = sku1.sizes[0];
const sku2 = PRODUCTS[1];
const size2 = sku2.sizes[1];
const cart = {
  [`${sku1.id}:${size1}`]: { sku: sku1, qty: 2, size: size1 },
  [`${sku2.id}:${size2}`]: { sku: sku2, qty: 1, size: size2 },
} as any;

test("creates Stripe session with correct metadata", async () => {
  stripeCreate.mockReset();
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    client_secret: "cs_test",
    payment_intent: "pi_test",
    metadata: { order_id: "ord_123" },
  });

  const returnDate = "2025-01-02";
  const expectedDays = dateUtils.calculateRentalDays(returnDate);

  const result = await createCheckoutSession(cart, {
    returnDate,
    currency: "EUR",
    taxRegion: "EU",
    returnUrl: "http://test/success",
    stripeCustomerId: "cus_123",
    clientIp: "203.0.113.1",
    shopId: "shop",
  });

  expect(stripeCreate).toHaveBeenCalled();
  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.line_items).toHaveLength(5); // two items + tax
  expect(
    args.line_items.some(
      (li: any) => li.price_data?.product_data?.name === "Tax"
    )
  ).toBe(true);
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.shop_id).toBe("shop");
  expect(args.metadata.sizes).toBe(
    JSON.stringify({ [sku1.id]: size1, [sku2.id]: size2 })
  );
  expect(args.customer).toBe("cus_123");
  expect(args.ui_mode).toBe("custom");
  expect(args.return_url).toBe("http://test/success");
  expect(options.headers["Stripe-Client-IP"]).toBe("203.0.113.1");
  expect(typeof options.idempotencyKey).toBe("string");
  expect(result.clientSecret).toBe("cs_test");
  expect(result.orderId).toBe("ord_123");
});

test("includes cart id for client_reference_id and metadata", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_cart",
    client_secret: "cs_cart",
    payment_intent: "pi_cart",
  });

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    returnUrl: "http://test/success",
    cartId: "cart_123",
    shopId: "shop",
  });

  const [args] = stripeCreate.mock.calls[0];
  expect(args.client_reference_id).toBe("cart_123");
  expect(args.metadata.cart_id).toBe("cart_123");
});

test("throws on invalid returnDate", async () => {
  await expect(
    createCheckoutSession(cart, {
      returnDate: "not-a-date",
      currency: "EUR",
      taxRegion: "EU",
      returnUrl: "x",
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
      returnUrl: "x",
      shopId: "shop",
    })
  ).rejects.toThrow(/Invalid returnDate/);
});

test("applies extra values and billing details without tax", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_extra",
    client_secret: "cs_extra",
    payment_intent: "pi_extra",
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
    returnUrl: "http://test/success",
    shopId: "shop",
    lineItemsExtra,
    metadataExtra: { foo: "bar" },
    subtotalExtra: 5,
    depositAdjustment: 10,
    billing_details: billingDetails,
  });

  const [args] = stripeCreate.mock.calls[0];
  expect(args.line_items).toHaveLength(5); // rentals, deposits, extra
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
  expect(args.metadata.subtotal).toBe("35");
  expect(args.metadata.depositTotal).toBe("160");
});

test("tracks coupon usage when present and not when absent", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_coupon",
    client_secret: "cs_coupon",
    payment_intent: "pi_coupon",
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
    returnUrl: "x",
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
    returnUrl: "x",
    shopId: "shop",
  });

  expect(trackEvent).toHaveBeenCalledTimes(1);
});

test("includes shipping, billing details and client IP when provided", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_ship",
    client_secret: "cs_ship",
    payment_intent: "pi_ship",
  });

  const shipping = { name: "John" } as any;
  const billing = { name: "Jane" } as any;

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    returnUrl: "x",
    shopId: "shop",
    shipping,
    billing_details: billing,
    clientIp: "1.2.3.4",
  });

  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.payment_intent_data.shipping).toBe(shipping);
  expect(args.payment_intent_data.billing_details).toBe(billing);
  expect(options.headers["Stripe-Client-IP"]).toBe("1.2.3.4");
  expect(typeof options.idempotencyKey).toBe("string");
});

test("omits optional fields when not provided", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_noopts",
    client_secret: "cs_noopts",
    payment_intent: "pi_noopts",
  });

  await createCheckoutSession(cart, {
    returnDate: "2025-01-02",
    currency: "EUR",
    taxRegion: "EU",
    returnUrl: "x",
    shopId: "shop",
  });

  const [args, options] = stripeCreate.mock.calls[0];
  expect(args.payment_intent_data.shipping).toBeUndefined();
  expect(args.payment_intent_data.billing_details).toBeUndefined();
  expect(options.headers).toBeUndefined();
  expect(typeof options.idempotencyKey).toBe("string");
});

test("throws when inventory is insufficient", async () => {
  const sku = { ...PRODUCTS[0], stock: 1 };
  const size = sku.sizes[0];
  const lowStockCart = {
    [`${sku.id}:${size}`]: { sku, qty: 2, size },
  } as any;

  await expect(
    createCheckoutSession(lowStockCart, {
      returnDate: "2025-01-02",
      currency: "EUR",
      taxRegion: "EU",
      returnUrl: "x",
      shopId: "shop",
    }),
  ).rejects.toThrow(/Insufficient stock/);
});

test("throws when Stripe session is missing client_secret", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_str",
    client_secret: null,
    payment_intent: "pi_123",
  });

  await expect(
    createCheckoutSession(cart, {
      returnDate: "2025-01-02",
      currency: "EUR",
      taxRegion: "EU",
      returnUrl: "x",
      shopId: "shop",
    }),
  ).rejects.toThrow(/client_secret is missing/i);
});

test("sale mode skips rental-specific fields and deposits", async () => {
  stripeCreate.mockResolvedValue({
    id: "sess_sale",
    client_secret: "cs_sale",
    payment_intent: "pi_sale",
  });

  const rentalSpy = jest.spyOn(dateUtils, "calculateRentalDays");
  rentalSpy.mockClear();

  const result = await createCheckoutSession(cart, {
    mode: "sale",
    currency: "EUR",
    taxRegion: "EU",
    returnUrl: "x",
    shopId: "shop",
  });

  expect(rentalSpy).not.toHaveBeenCalled();
  expect(stripeCreate).toHaveBeenCalled();

  const [args] = stripeCreate.mock.calls[0];
  // Two items (no deposit lines) plus tax.
  expect(args.line_items).toHaveLength(3);
  expect(
    args.line_items.some(
      (li: any) =>
        typeof li.price_data?.product_data?.name === "string" &&
        li.price_data.product_data.name.includes("deposit"),
    ),
  ).toBe(false);
  expect(args.metadata.rentalDays).toBe("0");
  expect(args.metadata.depositTotal).toBe("0");
  expect(result.clientSecret).toBe("cs_sale");
});
