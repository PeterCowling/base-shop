// apps/shop-bcd/__tests__/checkout-session.test.ts
import { decodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { calculateRentalDays } from "@acme/date-utils";
import { POST } from "../src/api/checkout-session/route";
import { asNextJson } from "@acme/test-utils";
import { CART_COOKIE } from "@platform-core/cartCookie";

jest.mock("next/server", () => ({
  NextResponse: {
    json: <T>(data: T, init?: ResponseInit) =>
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
jest.mock("@platform-core/tax", () => ({
  getTaxRate: jest.fn(async () => 0.2),
}));

import { stripe } from "@acme/stripe";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@auth", () => ({ getCustomerSession: jest.fn(async () => null) }));
jest.mock("@platform-core/cartCookie", () => ({
  CART_COOKIE: "__Host-CART_ID",
  // The real decodeCartCookie returns the raw string value of the cookie
  // (after signature verification). Our tests only need to simulate a
  // valid cookie, so the mocked implementation simply echoes back the
  // provided raw string. Using a jest.fn here lets individual tests
  // override the behavior to exercise error paths.
  decodeCartCookie: jest.fn((raw: string | null) => raw ?? null),
}));

afterEach(() => {
  (decodeCartCookie as jest.Mock).mockImplementation((raw: string | null) => raw ?? null);
  jest.clearAllMocks();
});

const createRequest = <T extends object>(
  body: T,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {}
) => asNextJson(body, { cookies: { [CART_COOKIE]: cookie }, url, headers });

test("builds Stripe session with correct items and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });

  const [sku1, sku2] = PRODUCTS;
  const size1 = "40";
  const size2 = "41";
  const cart = {
    [`${sku1.id}:${size1}`]: { sku: sku1, qty: 2, size: size1 },
    [`${sku2.id}:${size2}`]: { sku: sku2, qty: 1, size: size2 },
  };
  const cookie = JSON.stringify(cart);
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
    { returnDate, currency: "EUR", taxRegion: "EU", shipping, billing_details: billing },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" }
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(5);
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
  expect(args.metadata.sizes).toBe(
    JSON.stringify({ [sku1.id]: size1, [sku2.id]: size2 })
  );
  expect(args.metadata.subtotal).toBe("30");
  expect(body.clientSecret).toBe("cs_test");
});

test("responds with 400 on invalid returnDate", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = JSON.stringify(cart);
  const req = createRequest({ returnDate: "not-a-date", currency: "EUR", taxRegion: "EU" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("responds with 400 when cart is empty", async () => {
  (decodeCartCookie as jest.Mock).mockReturnValueOnce(null);
  const req = createRequest({}, "");
  const res = await POST(req);
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: "Cart is empty" });
});

test("handles decodeCartCookie throwing", async () => {
  (decodeCartCookie as jest.Mock).mockImplementationOnce(() => {
    throw new Error("bad cookie");
  });
  const req = createRequest({}, "broken");
  const res = await POST(req);
  expect(res.status).toBe(400);
});

test("accepts cart object from decodeCartCookie", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  (decodeCartCookie as jest.Mock).mockReturnValueOnce({
    [`${sku.id}:${size}`]: { sku, qty: 1, size },
  });
  const sessionModule = await import("@platform-core/checkout/session");
  const spy = jest
    .spyOn(sessionModule, "createCheckoutSession")
    .mockResolvedValueOnce({ sessionId: "sess" });
  const req = createRequest({}, "ignored");
  const res = await POST(req);
  expect(res.status).toBe(200);
  spy.mockRestore();
});

test("responds with 400 on invalid request body", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = JSON.stringify(cart);
  const req = createRequest({ shipping: "invalid" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
});

test("responds with 502 when session creation fails", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = JSON.stringify(cart);
  const spy = jest
    .spyOn(await import("@platform-core/checkout/session"), "createCheckoutSession")
    .mockRejectedValueOnce(new Error("boom"));
  const req = createRequest({}, cookie);
  const res = await POST(req);
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout failed");
  spy.mockRestore();
});
