// apps/shop-abc/__tests__/checkoutSession.test.ts
import { encodeCartCookie } from "@platform-core/src/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { calculateRentalDays } from "@acme/date-utils";
import { POST } from "../src/app/api/checkout-session/route";
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

jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@auth", () => ({
  getCustomerSession: jest.fn(async () => ({
    role: "customer",
    customerId: "cust_123",
  })),
  hasPermission: jest.fn(() => true),
}));
jest.mock("@platform-core/coupons", () => ({ findCoupon: jest.fn() }));
jest.mock("@platform-core/tax", () => ({ getTaxRate: jest.fn() }));
let mockCart: any;
jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

import { stripe } from "@acme/stripe";
import { findCoupon } from "@platform-core/coupons";
import { getTaxRate } from "@platform-core/tax";

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const findCouponMock = findCoupon as jest.Mock;
const getTaxRateMock = getTaxRate as jest.Mock;

beforeEach(() => {
  stripeCreate.mockReset();
  findCouponMock.mockReset();
  findCouponMock.mockResolvedValue(null);
  getTaxRateMock.mockReset();
  getTaxRateMock.mockResolvedValue(0);
});

afterEach(() => {
  jest.useRealTimers();
});

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
    body: stream,
    json: async () => body,
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as any;
}

test("builds Stripe session with correct items and metadata", async () => {
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

test("applies coupon discount and sets metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  findCouponMock.mockResolvedValue({ code: "SAVE20", discountPercent: 20 });

  const sku = PRODUCTS[0];
  const size = "40";
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  const cookie = encodeCartCookie("test");
  const returnDate = "2025-01-02";
  const req = createRequest({ returnDate, coupon: "SAVE20" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];
  expect(args.metadata.subtotal).toBe("16");
  expect(args.metadata.discount).toBe("4");
  expect(args.metadata.coupon).toBe("SAVE20");
});

test("adds tax line item and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });
  getTaxRateMock.mockResolvedValue(0.1);

  const sku = PRODUCTS[0];
  const size = "40";
  mockCart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  const cookie = encodeCartCookie("test");
  const returnDate = "2025-01-02";
  const req = createRequest({ returnDate, taxRegion: "DE" }, cookie);

  await POST(req);
  const args = stripeCreate.mock.calls[0][0];
  expect(args.line_items).toHaveLength(3);
  expect(args.metadata.taxAmount).toBe("2");
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
