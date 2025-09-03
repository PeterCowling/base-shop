/** @jest-environment node */

import type { NextRequest } from "next/server";

const CART_COOKIE = "__Host-CART_ID";

function mockCartCookie() {
  jest.doMock("../cartCookie", () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
  }));
}

function mockCartStore(overrides: Record<string, unknown> = {}) {
  jest.doMock("../cartStore", () => ({
    __esModule: true,
    createCart: jest.fn(async () => "new"),
    getCart: jest.fn(async () => ({})),
    setCart: jest.fn(),
    incrementQty: jest.fn(),
    setQty: jest.fn(),
    removeItem: jest.fn(),
    ...overrides,
  }));
}

function buildRequest(body: any, cookie?: string): NextRequest {
  return {
    json: async () => body,
    cookies: {
      get: () => (cookie ? { value: cookie } : undefined),
    },
  } as unknown as NextRequest;
}

describe("cart API POST", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 409 with Insufficient stock when quantity exceeds stock", async () => {
    const sku = { id: "s1", stock: 1, sizes: [] };
    mockCartCookie();
    const getCart = jest.fn(async () => ({ [sku.id]: { sku, qty: 1 } }));
    const increment = jest.fn();
    mockCartStore({ getCart, incrementQty: increment });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(buildRequest({ sku: { id: sku.id }, qty: 1 }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data).toEqual({ error: "Insufficient stock" });
    expect(increment).not.toHaveBeenCalled();
  });

  it("uses size in cart key when adding item with size", async () => {
    const sku = { id: "s1", stock: 5, sizes: ["M"] };
    mockCartCookie();
    const updated = { [`${sku.id}:M`]: { sku, size: "M", qty: 1 } };
    const getCart = jest.fn(async () => ({}));
    const increment = jest.fn(async () => updated);
    mockCartStore({ getCart, incrementQty: increment });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(
      buildRequest({ sku: { id: sku.id }, qty: 1, size: "M" })
    );
    expect(getCart).toHaveBeenCalled();
    expect(increment).toHaveBeenCalledWith("new", sku, 1, "M");
    const data = await res.json();
    expect(data.cart).toEqual(updated);
    expect(Object.keys(data.cart)).toContain(`${sku.id}:M`);
  });
});

