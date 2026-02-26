import { NextRequest } from "next/server";

import { POST } from "@/app/api/checkout-session/route";

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "__Host-CART_ID",
  decodeCartCookie: jest.fn(),
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  getCart: jest.fn(),
}));

const { stripe } = jest.requireMock("@acme/stripe") as {
  stripe: { checkout: { sessions: { create: jest.Mock } } };
};

const { decodeCartCookie } = jest.requireMock("@acme/platform-core/cartCookie") as {
  decodeCartCookie: jest.Mock;
};

const { getCart } = jest.requireMock("@acme/platform-core/cartStore") as {
  getCart: jest.Mock;
};

const makeReq = (body?: unknown) =>
  new NextRequest("http://localhost/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

const mockCartItem = {
  sku: {
    id: "sku-1",
    title: "Silver Ring",
    price: 4500,
    stock: 5,
    sizes: [],
    slug: "silver-ring",
    description: "",
    deposit: 0,
    media: [],
    status: "active",
  },
  qty: 1,
};

describe("POST /api/checkout-session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: populated cart returns 200 with sessionId and url", async () => {
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    stripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    const res = await POST(makeReq({ lang: "en" }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessionId: string; url: string };
    expect(body.sessionId).toBe("cs_test_123");
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
  });

  it("TC-04: empty cart returns 400", async () => {
    decodeCartCookie.mockReturnValue(null);

    const res = await POST(makeReq() as never);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Cart is empty");
  });
});
