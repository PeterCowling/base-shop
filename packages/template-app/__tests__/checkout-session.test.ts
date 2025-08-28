// packages/template-app/__tests__/checkout-session.test.ts
import { encodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { calculateRentalDays } from "@acme/date-utils";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (v: number) => v),
  getPricing: jest.fn(async () => ({})),
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(async () => ({ coverageIncluded: true })),
}));
let mockCart: any;
jest.mock("@platform-core/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

jest.mock("@platform-core/checkout/session", () => {
  const actual = jest.requireActual("@platform-core/checkout/session");
  return {
    ...actual,
    createCheckoutSession: jest.fn(actual.createCheckoutSession),
  };
});

import { stripe } from "@acme/stripe";
import { createCheckoutSession } from "@platform-core/checkout/session";
import { convertCurrency, getPricing } from "@platform-core/pricing";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const createCheckoutSessionMock = createCheckoutSession as jest.Mock;
const getPricingMock = getPricing as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;

import { POST } from "../src/api/checkout-session/route";

function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {}
): Parameters<typeof POST>[0] {
  return {
    json: async () => body,
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as any;
}

test(
  "builds Stripe session with correct items and metadata and forwards IP",
  async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });

  const sku = PRODUCTS[0];
  const size = "40";
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const returnDate = "2025-01-02";
  const expectedDays = calculateRentalDays(returnDate);
  const shipping = {
    name: "Jane Doe",
    address: {
      line1: "123 St",
      city: "Test",
      postal_code: "12345",
      country: "US",
    },
  };
  const billing = {
    name: "Jane Doe",
    email: "jane@example.com",
    address: shipping.address,
  };
  const req = createRequest(
    { returnDate, customer: "cus_123", shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" }
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const [args, options] = stripeCreate.mock.calls[0];

  expect(args.line_items).toHaveLength(2);
  expect(args.line_items).toHaveLength(2);
  expect(args.customer).toBe("cus_123");
  expect(args.payment_intent_data.shipping.name).toBe("Jane Doe");
  expect(args.payment_intent_data.billing_details.email).toBe(
    "jane@example.com"
  );
  expect(
    args.payment_intent_data.payment_method_options.card.request_three_d_secure
  ).toBe("automatic");
  expect(options.headers["Stripe-Client-IP"]).toBe("203.0.113.1");
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku.id]: size }));
  expect(args.metadata.subtotal).toBe("20");
  expect(body.clientSecret).toBe("cs_test");
});

test("returns 400 when returnDate is invalid", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "invalid" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("returns 400 when cart is empty", async () => {
  mockCart = {};
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({}, cookie));
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("Cart is empty");
});

test("applies coverage fee and waiver", async () => {
  createCheckoutSessionMock.mockClear();
  stripeCreate.mockClear();
  getPricingMock.mockClear();
  convertCurrencyMock.mockClear();
  getPricingMock.mockResolvedValue({
    coverage: {
      damage: { fee: 5, waiver: 2 },
    },
  });
  convertCurrencyMock.mockImplementation(async (v: number) => v);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  stripeCreate.mockResolvedValue({
    id: "sess_cov",
    payment_intent: { client_secret: "cs_cov" },
  });
  const cookie = encodeCartCookie("test");
  const res = await POST(
    createRequest({ returnDate: "2025-01-02", coverage: ["damage"] }, cookie),
  );
  await res.json();

  expect(getPricingMock).toHaveBeenCalled();
  expect(convertCurrencyMock).toHaveBeenCalledWith(5, "EUR");
  expect(convertCurrencyMock).toHaveBeenCalledWith(2, "EUR");

  const [stripeArgs] = stripeCreate.mock.calls[0];
  const coverageItem = stripeArgs.line_items.find(
    (li: any) => li.price_data?.product_data?.name === "Coverage",
  );
  expect(coverageItem.price_data.unit_amount).toBe(500);
  expect(stripeArgs.payment_intent_data.metadata.coverage).toBe("damage");
  expect(stripeArgs.payment_intent_data.metadata.coverageFee).toBe("5");
  expect(stripeArgs.payment_intent_data.metadata.coverageWaiver).toBe("2");

  const [, opts] = createCheckoutSessionMock.mock.calls[0];
  expect(opts.subtotalExtra).toBe(5);
  expect(opts.depositAdjustment).toBe(-2);
});

test("returns 502 when checkout session creation fails", async () => {
  createCheckoutSessionMock.mockRejectedValueOnce(new Error("boom"));
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const res = await POST(createRequest({ returnDate: "2025-01-02" }, cookie));
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout failed");
});
