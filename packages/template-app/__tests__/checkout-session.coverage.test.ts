// packages/template-app/__tests__/checkout-session.coverage.test.ts
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

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;
const readShopMock = readShop as jest.Mock;
const getCartMock = getCart as jest.Mock;

test("applies coverage fee and waiver", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  getPricingMock.mockResolvedValue({ coverage: { damage: { fee: 5, waiver: 2 } } });
  convertCurrencyMock.mockImplementation(async (v: number) => v);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  stripeCreate.mockResolvedValue({ id: "sess_cov", payment_intent: { client_secret: "cs_cov" } });
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({ returnDate: "2025-01-02", coverage: ["damage"] }, cookie) as any);
  await res.json();

  expect(getPricingMock).toHaveBeenCalled();
  expect(convertCurrencyMock).toHaveBeenCalledWith(5, "EUR");
  expect(convertCurrencyMock).toHaveBeenCalledWith(2, "EUR");

  const [stripeArgs] = stripeCreate.mock.calls[0];
  const coverageItem = stripeArgs.line_items.find((li: any) => li.price_data?.product_data?.name === "Coverage");
  expect(coverageItem.price_data.unit_amount).toBe(500);
  expect(stripeArgs.payment_intent_data.metadata.coverage).toBe("damage");
  expect(stripeArgs.payment_intent_data.metadata.coverageFee).toBe("5");
  expect(stripeArgs.payment_intent_data.metadata.coverageWaiver).toBe("2");

  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.subtotalExtra).toBe(5);
  expect(opts.depositAdjustment).toBe(-2);
});

test("skips coverage when shop coverageIncluded is false", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  readShopMock.mockResolvedValueOnce({ coverageIncluded: false });
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  stripeCreate.mockResolvedValue({ id: "sess_skip", payment_intent: { client_secret: "cs_skip" } });
  const cookie = encodeCartCookie("test");
  await POST(createRequest({ returnDate: "2025-01-02", coverage: ["damage"] }, cookie) as any);
  expect(getPricingMock).not.toHaveBeenCalled();
  const [stripeArgs] = stripeCreate.mock.calls[0];
  const coverageItem = stripeArgs.line_items.find((li: any) => li.price_data?.product_data?.name === "Coverage");
  expect(coverageItem).toBeUndefined();
  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.subtotalExtra).toBe(0);
  expect(opts.depositAdjustment).toBe(0);
  expect(opts.metadataExtra).toEqual({});
});

test("handles coverage codes with no matching rules", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  getPricingMock.mockResolvedValue({ coverage: {} });
  convertCurrencyMock.mockImplementation(async (v: number) => v);
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  stripeCreate.mockResolvedValue({ id: "sess_none", payment_intent: { client_secret: "cs_none" } });
  const cookie = encodeCartCookie("test");
  await POST(createRequest({ returnDate: "2025-01-02", coverage: ["unknown"] }, cookie) as any);
  expect(getPricingMock).toHaveBeenCalled();
  expect(convertCurrencyMock).toHaveBeenCalledWith(0, "EUR");
  const [stripeArgs] = stripeCreate.mock.calls[0];
  const coverageItem = stripeArgs.line_items.find((li: any) => li.price_data?.product_data?.name === "Coverage");
  expect(coverageItem).toBeUndefined();
  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.metadataExtra.coverage).toBe("unknown");
  expect(opts.metadataExtra.coverageFee).toBe("0");
  expect(opts.metadataExtra.coverageWaiver).toBe("0");
  expect(opts.subtotalExtra).toBe(0);
  expect(opts.depositAdjustment).toBe(0);
});

test("skips adjustments when currency conversion yields zero", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  getPricingMock.mockResolvedValue({ coverage: { damage: { fee: 5, waiver: 2 } } });
  convertCurrencyMock.mockResolvedValue(0);
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  stripeCreate.mockResolvedValue({ id: "sess_zero", payment_intent: { client_secret: "cs_zero" } });
  const cookie = encodeCartCookie("test");
  await POST(createRequest({ returnDate: "2025-01-02", coverage: ["damage"] }, cookie) as any);
  expect(convertCurrencyMock).toHaveBeenCalledWith(5, "EUR");
  expect(convertCurrencyMock).toHaveBeenCalledWith(2, "EUR");
  const [stripeArgs] = stripeCreate.mock.calls[0];
  const coverageItem = stripeArgs.line_items.find((li: any) => li.price_data?.product_data?.name === "Coverage");
  expect(coverageItem).toBeUndefined();
  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.subtotalExtra).toBe(0);
  expect(opts.depositAdjustment).toBe(0);
  expect(opts.metadataExtra.coverageFee).toBe("0");
  expect(opts.metadataExtra.coverageWaiver).toBe("0");
});

test("ignores non-array coverage input", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  stripeCreate.mockResolvedValue({ id: "sess_str", payment_intent: { client_secret: "cs_str" } });
  const cookie = encodeCartCookie("test");
  await POST(createRequest({ returnDate: "2025-01-02", coverage: "damage" as any }, cookie) as any);
  expect(getPricingMock).not.toHaveBeenCalled();
  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.metadataExtra).toEqual({});
});
