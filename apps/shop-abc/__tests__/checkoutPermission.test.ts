// apps/shop-abc/__tests__/checkoutPermission.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@platform-core/src/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: jest.fn(() => "cart1"),
}));

jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => ({
    "1": { sku: { id: "1", title: "Item", deposit: 1 }, qty: 1 },
  })),
}));

jest.mock("@acme/date-utils", () => ({
  calculateRentalDays: jest.fn(() => 1),
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn(async () => ({ id: "sess", payment_intent: { client_secret: "sec" } })) } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 1),
  convertCurrency: jest.fn(async (v) => v),
}));

jest.mock("@platform-core/coupons", () => ({ findCoupon: jest.fn() }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@platform-core/tax", () => ({ getTaxRate: jest.fn(async () => 0) }));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../src/app/api/checkout-session/route";
import { getCustomerSession, hasPermission } from "@auth";
import { stripe } from "@acme/stripe";

function createRequest(body: any = {}) {
  return {
    cookies: { get: () => ({ value: "cookie" }) },
    json: async () => body,
    nextUrl: Object.assign(new URL("http://store.example/api/checkout-session"), {
      clone: () => new URL("http://store.example/api/checkout-session"),
    }),
  } as any;
}

describe("checkout-session route permissions", () => {
  beforeEach(() => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ role: "customer" });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (stripe.checkout.sessions.create as jest.Mock).mockClear();
  });

  it("allows access when permission granted", async () => {
    const res = await POST(createRequest({ returnDate: "2025-01-01" }));
    expect(res.status).toBe(200);
    expect(stripe.checkout.sessions.create).toHaveBeenCalled();
  });

  it("returns 403 when permission denied", async () => {
    (hasPermission as jest.Mock).mockReturnValue(false);
    const res = await POST(createRequest({}));
    expect(res.status).toBe(403);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
