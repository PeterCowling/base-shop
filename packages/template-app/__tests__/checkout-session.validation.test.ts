// packages/template-app/__tests__/checkout-session.validation.test.ts
import { coreEnv } from "@acme/config/env/core";
import { decodeCartCookie,encodeCartCookie } from "@acme/platform-core/cartCookie";
import { getCart } from "@acme/platform-core/cartStore";
import { createCheckoutSession } from "@acme/platform-core/checkout/session";
import { validateInventoryAvailability } from "@acme/platform-core/inventoryValidation";
import { convertCurrency, getPricing } from "@acme/platform-core/pricing";
import { PRODUCTS } from "@acme/platform-core/products";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { variantKey } from "@acme/platform-core/types/inventory";
import { stripe } from "@acme/stripe";

import { POST } from "../src/api/checkout-session/route";

import { createRequest } from "./checkout-session.helpers";

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

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;
const readShopMock = readShop as jest.Mock;
const getCartMock = getCart as jest.Mock;
const decodeCartCookieMock = decodeCartCookie as jest.Mock;
const validateInventoryAvailabilityMock =
  validateInventoryAvailability as jest.Mock;

test("returns 400 when returnDate is invalid", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "invalid" }, cookie);
  const res = await POST(req as any);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("returns 400 when cart is empty", async () => {
  mockCart = {};
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({}, cookie) as any);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("Cart is empty");
});

test("handles invalid JSON body and returns 400 for missing returnDate", async () => {
  createCheckoutSessionMock.mockClear();
  createCheckoutSessionMock.mockImplementationOnce(() => {
    throw new Error("Invalid returnDate");
  });
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie("test");
  const req = createRequest({}, cookie) as any;
  req.json = async () => {
    throw new Error("invalid json");
  };
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid returnDate/i);
  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.returnDate).toBeUndefined();
});

test("returns 409 when cart exceeds available stock", async () => {
  const sku = { ...PRODUCTS[0], stock: 1 };
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  validateInventoryAvailabilityMock.mockResolvedValueOnce({
    ok: false,
    insufficient: [
      {
        sku: sku.id,
        variantAttributes: { size },
        variantKey: variantKey(sku.id, { size }),
        requested: 2,
        available: 1,
      },
    ],
  });
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({ returnDate: "2025-01-02" }, cookie) as any);
  expect(res.status).toBe(409);
  const body = await res.json();
  expect(body.error).toBe("Insufficient stock");
});
