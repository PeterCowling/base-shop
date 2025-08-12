// packages/template-app/__tests__/checkout-session.test.ts
import { encodeCartCookie } from "../../platform-core/src/cartCookie";
import { PRODUCTS } from "../../platform-core/src/products";
import { calculateRentalDays } from "@acme/date-utils";
import { POST } from "../src/api/checkout-session/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("../../platform-core/src/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (v: number) => v),
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/src/analytics", () => ({ trackEvent: jest.fn() }));
let mockCart: any;
jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

import { stripe } from "@acme/stripe";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

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
    { returnDate, customer: "cus_123", shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" }
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

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
  expect(args.payment_intent_data.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.client_ip).toBe("203.0.113.1");
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
