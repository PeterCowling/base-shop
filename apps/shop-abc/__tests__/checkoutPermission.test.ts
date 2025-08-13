// apps/shop-abc/__tests__/checkoutPermission.test.ts
import { PRODUCTS } from "@platform-core/products";
import { POST } from "../src/app/api/checkout-session/route";

jest.mock("@platform-core/src/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: () => "test",
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn(async () => ({ id: "s", payment_intent: { client_secret: "cs" } })) } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 1),
  convertCurrency: jest.fn(async (n: number) => n),
}));

jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
let mockCart: any;
jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

jest.mock("@auth", () => {
  const { hasPermission } = require("../../../packages/auth/src/permissions");
  return { getCustomerSession: jest.fn(), hasPermission };
});
import { getCustomerSession } from "@auth";

function createRequest(cookie: string): Parameters<typeof POST>[0] {
  const url = "http://localhost/api/checkout-session";
  return {
    json: async () => ({}),
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
    headers: { get: () => null },
  } as any;
}

afterEach(() => {
  jest.clearAllMocks();
});

test("denies checkout without permission", async () => {
  const sku = PRODUCTS[0];
  mockCart = { [sku.id]: { sku, qty: 1 } };
  (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1", role: "viewer" });
  const res = await POST(createRequest("cookie"));
  expect(res.status).toBe(403);
});

test("allows checkout with permission", async () => {
  const sku = PRODUCTS[0];
  mockCart = { [sku.id]: { sku, qty: 1 } };
  (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1", role: "customer" });
  const res = await POST(createRequest("cookie"));
  expect(res.status).toBe(200);
});

test("allows checkout for admin role", async () => {
  const sku = PRODUCTS[0];
  mockCart = { [sku.id]: { sku, qty: 1 } };
  (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1", role: "admin" });
  const res = await POST(createRequest("cookie"));
  expect(res.status).toBe(200);
});
