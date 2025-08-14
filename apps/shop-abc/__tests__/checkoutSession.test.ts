// apps/shop-abc/__tests__/checkoutSession.test.ts
import { encodeCartCookie } from "@platform-core/src/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import * as dateUtils from "@acme/date-utils";
const { calculateRentalDays } = dateUtils;
import { POST } from "../src/app/api/checkout-session/route";
import { findCoupon } from "@platform-core/coupons";
import { getTaxRate } from "@platform-core/tax";
import { ReadableStream } from "node:stream/web";

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
  convertCurrency: jest.fn(async (n: number) => n),
}));

jest.mock("@platform-core/coupons", () => ({ findCoupon: jest.fn() }));
jest.mock("@platform-core/tax", () => ({ getTaxRate: jest.fn() }));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@auth", () => ({ requirePermission: jest.fn(async () => ({ customerId: "c1" })) }));
let mockCart: any;
jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

import { stripe } from "@acme/stripe";
import { convertCurrency } from "@platform-core/pricing";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const findCouponMock = findCoupon as jest.Mock;
const getTaxRateMock = getTaxRate as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;

function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {}
): Parameters<typeof POST>[0] {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(body)));
      controller.close();
    },
  });
  return {
    json: async () => body,
    body: stream,
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as any;
}

test("builds Stripe session with correct items and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);

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
    { returnDate, shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" }
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(2);
  expect(args.payment_intent_data.shipping.name).toBe("Jane Doe");
  expect(args.payment_intent_data.billing_details.email).toBe(
    "jane@example.com"
  );
  expect(
    args.payment_intent_data.payment_method_options.card.request_three_d_secure
  ).toBe("automatic");
  expect(args.payment_intent_data.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku.id]: size }));
  expect(args.metadata.subtotal).toBe("20");
  expect(body.clientSecret).toBe("cs_test");
});

test("omits deposit line when deposit is zero", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);

  const sku = { ...PRODUCTS[0], deposit: 0 };
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(1);
  expect(args.metadata.depositTotal).toBe("0");
  expect(args.payment_intent_data.metadata.depositTotal).toBe("0");
});

test("responds with 400 on invalid returnDate", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "not-a-date" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("responds with 400 on past or same-day returnDate", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const spy = jest.spyOn(dateUtils, "calculateRentalDays").mockReturnValue(0);
  const req = createRequest({ returnDate: "2025-01-01" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
  spy.mockRestore();
});

test("applies coupon discount and sets metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue({ code: "SAVE10", discountPercent: 10 });
  getTaxRateMock.mockResolvedValue(0);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02", coupon: "SAVE10" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.metadata.subtotal).toBe("9");
  expect(args.metadata.discount).toBe("1");
  expect(args.payment_intent_data.metadata.subtotal).toBe("9");
  expect(args.payment_intent_data.metadata.discount).toBe("1");
});

test("adds tax line item and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0.2);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", taxRegion: "EU" },
    cookie,
  );

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(3);
  const taxItem = args.line_items[2];
  expect(taxItem.price_data.unit_amount).toBe(200);
  expect(args.metadata.taxAmount).toBe("2");
  expect(args.metadata.taxRate).toBe("0.2");
  expect(args.payment_intent_data.metadata.taxAmount).toBe("2");
});

test("returns 400 for unsupported currency", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", currency: "JPY" },
    cookie,
  );
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.currency[0]).toMatch(/invalid/i);
});

test("returns 400 for unsupported tax region", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest(
    { returnDate: "2025-01-02", taxRegion: "DE" },
    cookie,
  );
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.taxRegion[0]).toMatch(/invalid/i);
});

test("rounds unit amounts before sending to Stripe", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  getTaxRateMock.mockReset();
  convertCurrencyMock.mockReset();
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockResolvedValue(0);
  convertCurrencyMock
    .mockImplementationOnce(async () => 10.345)
    .mockImplementationOnce(async () => 20.265)
    .mockImplementation(async (n: number) => n);

  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items[0].price_data.unit_amount).toBe(
    Math.round(10.345 * 100),
  );
  expect(args.line_items[1].price_data.unit_amount).toBe(
    Math.round(20.265 * 100),
  );
  expect(Number.isInteger(args.line_items[0].price_data.unit_amount)).toBe(
    true,
  );
  expect(Number.isInteger(args.line_items[1].price_data.unit_amount)).toBe(
    true,
  );
});

test("responds with 502 when Stripe session creation fails", async () => {
  stripeCreate.mockReset();
  stripeCreate.mockRejectedValue(new Error("Stripe error"));
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = encodeCartCookie("test");
  const req = createRequest({ returnDate: "2025-01-02" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout session failed");
});
