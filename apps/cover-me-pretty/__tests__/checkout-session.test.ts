// apps/cover-me-pretty/__tests__/checkout-session.test.ts
import { decodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { calculateRentalDays } from "@acme/date-utils";
import { POST } from "../src/api/checkout-session/route";
import { asNextJson } from "@acme/test-utils";
import { CART_COOKIE } from "@platform-core/cartCookie";
import { validateInventoryAvailability } from "@platform-core/inventoryValidation";
import { variantKey } from "@platform-core/types/inventory";

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
  getPricing: jest.fn(async () => ({
    coverage: {
      basic: { fee: 5, waiver: 1 },
    },
  })),
}));
jest.mock("@platform-core/tax", () => ({
  getTaxRate: jest.fn(async () => 0.2),
}));
jest.mock("@platform-core/inventoryValidation", () => {
  const actual = jest.requireActual("@platform-core/inventoryValidation");
  return {
    ...actual,
    validateInventoryAvailability: jest.fn(async () => ({ ok: true })),
  };
});

import { stripe } from "@acme/stripe";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const validateInventoryAvailabilityMock =
  validateInventoryAvailability as jest.Mock;

jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@auth", () => ({ getCustomerSession: jest.fn(async () => null) }));
jest.mock("@platform-core/customerProfiles", () => ({ getCustomerProfile: jest.fn(async () => null) }));
jest.mock("@platform-core/identity", () => ({
  getOrCreateStripeCustomerId: jest.fn(async () => "stripe-customer"),
}));

// In tests we treat the cart cookie as carrying a simple cart ID string.
jest.mock("@platform-core/cartCookie", () => ({
  CART_COOKIE: "__Host-CART_ID",
  decodeCartCookie: jest.fn((raw: string | null) => raw ?? null),
}));

let mockCart: Record<string, unknown> = {};
jest.mock("@platform-core/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

afterEach(() => {
  (decodeCartCookie as jest.Mock).mockImplementation(
    (raw: string | null) => raw ?? null,
  );
  mockCart = {};
  jest.clearAllMocks();
});

const createRequest = <T extends object>(
  body: T,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {},
) =>
  asNextJson(body, { cookies: { [CART_COOKIE]: cookie }, url, headers });

test("builds Stripe session with correct items and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "cs_test",
    client_secret: "cs_test",
    payment_intent: "pi_test",
  });

  const [sku1, sku2] = PRODUCTS;
  const size1 = "40";
  const size2 = "41";
  const cart = {
    [`${sku1.id}:${size1}`]: { sku: sku1, qty: 2, size: size1 },
    [`${sku2.id}:${size2}`]: { sku: sku2, qty: 1, size: size2 },
  };
  mockCart = cart;
  const cookie = "cart-1";
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
    {
      returnDate,
      currency: "EUR",
      taxRegion: "EU",
      shipping,
      billing_details: billing,
    },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.1" },
  );

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(5);
  expect(args.payment_intent_data.shipping.name).toBe("Jane Doe");
  expect(args.payment_intent_data.billing_details.email).toBe(
    "jane@example.com",
  );
  expect(
    args.payment_intent_data.payment_method_options.card.request_three_d_secure,
  ).toBe("automatic");
  expect(args.payment_intent_data.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.client_ip).toBe("203.0.113.1");
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(
    JSON.stringify({ [sku1.id]: size1, [sku2.id]: size2 }),
  );
  expect(args.metadata.subtotal).toBe("30");
  expect(body.clientSecret).toBe("cs_test");
});

test("responds with 400 on invalid returnDate", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = "cart-1";
  const req = createRequest(
    { returnDate: "not-a-date", currency: "EUR", taxRegion: "EU" },
    cookie,
  );
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

test("responds with 409 when cart exceeds available stock", async () => {
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
  const req = createRequest(
    { returnDate: "2025-01-02", currency: "EUR", taxRegion: "EU" },
    "cart-1",
  );
  const res = await POST(req);
  expect(res.status).toBe(409);
  const body = await res.json();
  expect(body.error).toBe("Insufficient stock");
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

test("responds with 400 on invalid request body", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = "cart-1";
  const req = createRequest({ shipping: "invalid" as unknown }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
});

test("responds with 502 when session creation fails", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  mockCart = cart;
  const cookie = "cart-1";
  const spy = jest
    .spyOn(
      await import("@platform-core/checkout/session"),
      "createCheckoutSession",
    )
    .mockRejectedValueOnce(new Error("boom"));
  const req = createRequest({}, cookie);
  const res = await POST(req);
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Checkout failed");
  spy.mockRestore();
});

test("adds coverage line item and metadata when coverage codes are provided", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "cs_cov",
    client_secret: "cs_cov",
    payment_intent: "pi_cov",
  });

  const [sku] = PRODUCTS;
  const size = "40";
  const cart = {
    [`${sku.id}:${size}`]: { sku, qty: 1, size },
  };
  mockCart = cart;
  const cookie = "cart-coverage";

  const req = createRequest(
    {
      returnDate: "2025-01-02",
      currency: "EUR",
      taxRegion: "EU",
      coverage: ["basic"],
    },
    cookie,
    undefined,
    { "x-forwarded-for": "203.0.113.2" },
  );

  const res = await POST(req);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.clientSecret).toBe("cs_cov");

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];
  const lineItems = Array.isArray(args.line_items) ? args.line_items : [];

  const coverageItem = lineItems.find(
    (item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      (item as { price_data?: { product_data?: { name?: string } } }).price_data
        ?.product_data?.name === "Coverage",
  );
  expect(coverageItem).toBeDefined();
  expect(coverageItem.price_data.currency).toBe("eur");

  expect(args.metadata.coverage).toBe("basic");
  expect(args.metadata.coverageFee).toBe("5");
  expect(args.metadata.coverageWaiver).toBe("1");
});
