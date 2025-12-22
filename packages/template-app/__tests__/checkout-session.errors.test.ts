// packages/template-app/__tests__/checkout-session.errors.test.ts
jest.mock("next/server", () => ({
  NextResponse: { json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init) },
}));
jest.mock("@acme/stripe", () => ({ stripe: { checkout: { sessions: { create: jest.fn() } } } }));
jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (v: number) => v),
  getPricing: jest.fn(async () => ({})),
}));
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(async () => ({ coverageIncluded: true, type: "rental" })),
}));
jest.mock("@acme/config/env/core", () => ({ coreEnv: { NEXT_PUBLIC_DEFAULT_SHOP: "shop" }, loadCoreEnv: () => ({ CART_COOKIE_SECRET: "secret" }) }));
jest.mock("@platform-core/cartCookie", () => {
  const actual = jest.requireActual("@platform-core/cartCookie");
  return { ...actual, decodeCartCookie: jest.fn(actual.decodeCartCookie) };
});
let mockCart: any;
jest.mock("@platform-core/cartStore", () => ({ getCart: jest.fn(async () => mockCart) }));
jest.mock("@platform-core/checkout/session", () => {
  const actual = jest.requireActual("@platform-core/checkout/session");
  return { ...actual, createCheckoutSession: jest.fn(actual.createCheckoutSession) };
});
jest.mock("@platform-core/inventoryValidation", () => {
  const actual = jest.requireActual("@platform-core/inventoryValidation");
  return {
    ...actual,
    validateInventoryAvailability: jest.fn(async () => ({ ok: true })),
  };
});
jest.mock("@auth", () => ({ getCustomerSession: jest.fn(async () => null) }));
jest.mock("@platform-core/customerProfiles", () => ({ getCustomerProfile: jest.fn(async () => null) }));
jest.mock("@platform-core/identity", () => ({
  getOrCreateStripeCustomerId: jest.fn(async () => "stripe-customer"),
}));

import { createRequest } from "./checkout-session.helpers";
import { stripe } from "@acme/stripe";
import { createCheckoutSession } from "@platform-core/checkout/session";
import { convertCurrency, getPricing } from "@platform-core/pricing";
import { readShop } from "@platform-core/repositories/shops.server";
import { getCart } from "@platform-core/cartStore";
import { coreEnv } from "@acme/config/env/core";
import { encodeCartCookie, decodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { POST } from "../src/api/checkout-session/route";

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;
const readShopMock = readShop as jest.Mock;
const getCartMock = getCart as jest.Mock;
const decodeCartCookieMock = decodeCartCookie as jest.Mock;

test("returns 502 when checkout session creation fails", async () => {
  createCheckoutSessionMock.mockRejectedValueOnce(new Error("boom"));
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({ returnDate: "2025-01-02" }, cookie) as any);
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout failed");
});

test("returns 400 and skips cart lookup when cart cookie is invalid", async () => {
  decodeCartCookieMock.mockReturnValueOnce(undefined);
  getCartMock.mockClear();
  const res = await POST(createRequest({ returnDate: "2025-01-02" }, encodeCartCookie("bad")) as any);
  expect(res.status).toBe(400);
  expect(getCartMock).not.toHaveBeenCalled();
});
