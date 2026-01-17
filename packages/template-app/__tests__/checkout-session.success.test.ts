// packages/template-app/__tests__/checkout-session.success.test.ts
jest.mock("next/server", () => ({
  NextResponse: { json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init) },
}));
jest.mock("@acme/stripe", () => ({ stripe: { checkout: { sessions: { create: jest.fn() } } } }));
jest.mock("@acme/platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (v: number) => v),
  getPricing: jest.fn(async () => ({})),
}));
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@acme/platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(async () => ({ coverageIncluded: true, type: "rental" })),
}));
jest.mock("@acme/config/env/core", () => ({ coreEnv: { NEXT_PUBLIC_DEFAULT_SHOP: "shop" }, loadCoreEnv: () => ({ CART_COOKIE_SECRET: "secret" }) }));
jest.mock("@acme/platform-core/cartCookie", () => {
  const actual = jest.requireActual("@acme/platform-core/cartCookie");
  return { ...actual, decodeCartCookie: jest.fn(actual.decodeCartCookie) };
});
let mockCart: any;
jest.mock("@acme/platform-core/cartStore", () => ({ getCart: jest.fn(async () => mockCart) }));
jest.mock("@acme/platform-core/checkout/session", () => {
  const actual = jest.requireActual("@acme/platform-core/checkout/session");
  return { ...actual, createCheckoutSession: jest.fn(actual.createCheckoutSession) };
});
jest.mock("@acme/platform-core/inventoryValidation", () => {
  const actual = jest.requireActual("@acme/platform-core/inventoryValidation");
  return {
    ...actual,
    validateInventoryAvailability: jest.fn(async () => ({ ok: true })),
  };
});
jest.mock("@auth", () => ({ getCustomerSession: jest.fn(async () => null) }));
jest.mock("@acme/platform-core/customerProfiles", () => ({ getCustomerProfile: jest.fn(async () => null) }));
jest.mock("@acme/platform-core/identity", () => ({
  getOrCreateStripeCustomerId: jest.fn(async () => "stripe-customer"),
}));

import { createRequest } from "./checkout-session.helpers";
import { stripe } from "@acme/stripe";
import { createCheckoutSession } from "@acme/platform-core/checkout/session";
import { convertCurrency, getPricing } from "@acme/platform-core/pricing";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getCart } from "@acme/platform-core/cartStore";
import { coreEnv } from "@acme/config/env/core";
import { encodeCartCookie } from "@acme/platform-core/cartCookie";
import { PRODUCTS } from "@acme/platform-core/products";
import { calculateRentalDays } from "@acme/date-utils";
import { POST } from "../src/api/checkout-session/route";

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;
const readShopMock = readShop as jest.Mock;
const getCartMock = getCart as jest.Mock;

test("builds Stripe session with correct items and metadata and forwards IP", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    client_secret: "cs_test",
  });

  const [sku1, sku2] = PRODUCTS;
  const size1 = "40";
  const size2 = "41";
  const cart = {
    [`${sku1.id}:${size1}`]: { sku: sku1, qty: 2, size: size1 },
    [`${sku2.id}:${size2}`]: { sku: sku2, qty: 1, size: size2 },
  };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const returnDate = "2025-01-02";
  const expectedDays = calculateRentalDays(returnDate);
  const shipping = {
    name: "Jane Doe",
    address: { line1: "123 St", city: "Test", postal_code: "12345", country: "US" },
  } as const;
  const billing = { name: "Jane Doe", email: "jane@example.com", address: shipping.address } as const;

  const req = createRequest(
    { returnDate, customer: "cus_123", shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" },
  );

  const res = await POST(req as any);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const [args, options] = stripeCreate.mock.calls[0];

  expect(args.line_items).toHaveLength(4);
  expect(args.customer).toBe("cus_123");
  expect(args.payment_intent_data.shipping.name).toBe("Jane Doe");
  expect(args.payment_intent_data.billing_details.email).toBe("jane@example.com");
  expect(args.payment_intent_data.payment_method_options.card.request_three_d_secure).toBe("automatic");
  expect(options.headers["Stripe-Client-IP"]).toBe("203.0.113.1");
  expect(typeof options.idempotencyKey).toBe("string");
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku1.id]: size1, [sku2.id]: size2 }));
  expect(args.metadata.subtotal).toBe("30");
  expect(body.clientSecret).toBe("cs_test");
});
