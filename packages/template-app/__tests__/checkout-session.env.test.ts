// packages/template-app/__tests__/checkout-session.env.test.ts
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
jest.mock("@platform-core/repositories/shops.server", () => ({ readShop: jest.fn(async () => ({ coverageIncluded: true })) }));
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

import { createRequest } from "./checkout-session.helpers";
import { stripe } from "@acme/stripe";
import { createCheckoutSession } from "@platform-core/checkout/session";
import { convertCurrency, getPricing } from "@platform-core/pricing";
import { readShop } from "@platform-core/repositories/shops.server";
import { getCart } from "@platform-core/cartStore";
import { coreEnv } from "@acme/config/env/core";
import { encodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { POST } from "../src/api/checkout-session/route";

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;
const readShopMock = readShop as jest.Mock;
const getCartMock = getCart as jest.Mock;

test("uses fallback shop ID when env default is missing", async () => {
  const original = coreEnv.NEXT_PUBLIC_DEFAULT_SHOP;
  // Remove default shop so route should fall back to "shop"
  delete (coreEnv as any).NEXT_PUBLIC_DEFAULT_SHOP;
  readShopMock.mockClear();
  stripeCreate.mockResolvedValue({ id: "sess_env", payment_intent: { client_secret: "cs_env" } });
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie("test");
  await POST(createRequest({ returnDate: "2025-01-02" }, cookie) as any);
  expect(readShopMock).toHaveBeenCalledWith("shop");
  coreEnv.NEXT_PUBLIC_DEFAULT_SHOP = original;
});
