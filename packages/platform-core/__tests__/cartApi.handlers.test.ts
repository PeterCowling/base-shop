import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";

const CART_COOKIE = "__Host-CART_ID";
function mockCartCookie() {
  jest.doMock("../src/cartCookie", () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
  }));
}

function mockCartStore(overrides: Record<string, unknown> = {}) {
  jest.doMock("../src/cartStore", () => ({
    __esModule: true,
    createCart: jest.fn(),
    getCart: jest.fn(),
    setCart: jest.fn(),
    incrementQty: jest.fn(),
    setQty: jest.fn(),
    removeItem: jest.fn(),
    ...overrides,
  }));
}

// Helper to build request mocks
function buildRequest(body: any, cookie?: string): NextRequest {
  return {
    json: async () => body,
    cookies: {
      get: () => (cookie ? { value: cookie } : undefined),
    },
  } as unknown as NextRequest;
}

describe("cart API handlers", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: jest.fn(),
        PRODUCTS: [],
      }));
      const { POST } = await import("../src/cartApi");
      const res = await POST(buildRequest({}));
      expect(res.status).toBe(400);
    });

    it("returns 404 for missing SKU", async () => {
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => undefined,
        PRODUCTS: [],
      }));
      const { POST } = await import("../src/cartApi");
      const res = await POST(
        buildRequest({ sku: { id: "nope" }, qty: 1 })
      );
      expect(res.status).toBe(404);
    });

    it("returns 409 when SKU exists but out of stock", async () => {
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => undefined,
        PRODUCTS: [{ id: "foo" }],
      }));
      const { POST } = await import("../src/cartApi");
      const res = await POST(buildRequest({ sku: { id: "foo" }, qty: 1 }));
      expect(res.status).toBe(409);
    });

    it("returns 400 when size required", async () => {
      const sku = { id: "s1", stock: 5, sizes: ["M"] };
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      const { POST } = await import("../src/cartApi");
      const res = await POST(buildRequest({ sku, qty: 1 }));
      expect(res.status).toBe(400);
    });

    it("returns 409 on stock overflow", async () => {
      const sku = { id: "s1", stock: 1, sizes: [] };
      mockCartCookie();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      mockCartStore({
        createCart: jest.fn(async () => "c1"),
        getCart: jest.fn(async () => ({ [sku.id]: { sku, qty: 1 } })),
        incrementQty: jest.fn(),
      });
      const { POST } = await import("../src/cartApi");
      const res = await POST(buildRequest({ sku: { id: "s1" }, qty: 1 }));
      expect(res.status).toBe(409);
    });

    it("creates cart when cookie missing", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const updated = { [sku.id]: { sku, qty: 1 } };
      const create = jest.fn(async () => "new" );
      const inc = jest.fn(async () => updated);
      mockCartCookie();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      mockCartStore({
        createCart: create,
        getCart: jest.fn(async () => ({})),
        incrementQty: inc,
      });
      const { POST } = await import("../src/cartApi");
      const res = await POST(buildRequest({ sku: { id: "s1" }, qty: 1 }));
      expect(create).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });

    it("uses existing cart cookie", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const updated = { [sku.id]: { sku, qty: 2 } };
      const inc = jest.fn(async () => updated);
      mockCartCookie();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      mockCartStore({
        createCart: jest.fn(),
        getCart: jest.fn(async () => ({ [sku.id]: { sku, qty: 1 } })),
        incrementQty: inc,
      });
      const { POST } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await POST(
        buildRequest({ sku: { id: "s1" }, qty: 1 }, cookie)
      );
      expect(inc).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });
  });

  describe("PUT", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: jest.fn(),
        PRODUCTS: [],
      }));
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(buildRequest({}));
      expect(res.status).toBe(400);
    });

    it("returns 404 for missing SKU", async () => {
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => undefined,
        PRODUCTS: [],
      }));
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(
        buildRequest({ lines: [{ sku: { id: "x" }, qty: 1 }] })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when size required", async () => {
      const sku = { id: "s1", stock: 5, sizes: ["M"] };
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(
        buildRequest({ lines: [{ sku: { id: "s1" }, qty: 1 }] })
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when cart cookie not found", async () => {
      mockCartCookie();
      mockCartStore({ getCart: jest.fn(async () => ({})) });
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: jest.fn(),
        PRODUCTS: [],
      }));
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(buildRequest({ lines: [] }, "cart1"));
      expect(res.status).toBe(404);
    });

    it("returns 409 when line exceeds stock", async () => {
      const sku = { id: "s1", stock: 1, sizes: [] };
      mockCartCookie();
      mockCartStore();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(
        buildRequest({ lines: [{ sku: { id: "s1" }, qty: 2 }] })
      );
      expect(res.status).toBe(409);
    });

    it("creates cart when cookie missing", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const updated = { [sku.id]: { sku, qty: 1 } };
      const set = jest.fn(async () => undefined);
      const create = jest.fn(async () => "new" );
      mockCartCookie();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      mockCartStore({
        createCart: create,
        setCart: set,
      });
      const { PUT } = await import("../src/cartApi");
      const res = await PUT(
        buildRequest({ lines: [{ sku: { id: "s1" }, qty: 1 }] })
      );
      expect(create).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith("new", updated);
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
    });

    it("uses existing cart cookie", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const updated = { [sku.id]: { sku, qty: 1 } };
      const set = jest.fn(async () => undefined);
      mockCartCookie();
      jest.doMock("../src/products", () => ({
        __esModule: true,
        getProductById: () => sku,
        PRODUCTS: [sku],
      }));
      mockCartStore({
        createCart: jest.fn(),
        setCart: set,
        getCart: jest.fn(async () => ({ existing: {} })),
      });
      const { PUT } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await PUT(
        buildRequest(
          { lines: [{ sku: { id: "s1" }, qty: 1 }] },
          cookie
        )
      );
      expect(set).toHaveBeenCalledWith("cart1", updated);
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
    });
  });

  describe("PATCH", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      const { PATCH } = await import("../src/cartApi");
      const res = await PATCH(buildRequest({}));
      expect(res.status).toBe(400);
    });

    it("returns 404 when cart cookie missing", async () => {
      mockCartCookie();
      const { PATCH } = await import("../src/cartApi");
      const res = await PATCH(
        buildRequest({ id: "foo", qty: 1 })
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 when item not in cart", async () => {
      mockCartCookie();
      mockCartStore({ setQty: jest.fn(async () => null) });
      const { PATCH } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await PATCH(
        buildRequest({ id: "foo", qty: 1 }, cookie)
      );
      expect(res.status).toBe(404);
    });

    it("updates quantity and sets cookie", async () => {
      const updated = { foo: { sku: { id: "foo", stock: 5, sizes: [] }, qty: 2 } };
      const setQty = jest.fn(async () => updated);
      mockCartCookie();
      mockCartStore({ setQty });
      const { PATCH } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await PATCH(
        buildRequest({ id: "foo", qty: 2 }, cookie)
      );
      expect(setQty).toHaveBeenCalledWith("cart1", "foo", 2);
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      const { DELETE } = await import("../src/cartApi");
      const res = await DELETE(buildRequest({}));
      expect(res.status).toBe(400);
    });

    it("returns 404 when cart cookie missing", async () => {
      mockCartCookie();
      const { DELETE } = await import("../src/cartApi");
      const res = await DELETE(buildRequest({ id: "foo" }));
      expect(res.status).toBe(404);
    });

    it("returns 404 when item not in cart", async () => {
      mockCartCookie();
      mockCartStore({ removeItem: jest.fn(async () => null) });
      const { DELETE } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await DELETE(
        buildRequest({ id: "foo" }, cookie)
      );
      expect(res.status).toBe(404);
    });

    it("removes item and sets cookie", async () => {
      const updated = {};
      const removeItem = jest.fn(async () => updated);
      mockCartCookie();
      mockCartStore({ removeItem });
      const { DELETE } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await DELETE(
        buildRequest({ id: "foo" }, cookie)
      );
      expect(removeItem).toHaveBeenCalledWith("cart1", "foo");
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });
  });

  describe("GET", () => {
    it("creates cart when cookie missing", async () => {
      const cart = {};
      const create = jest.fn(async () => "new");
      const get = jest.fn(async () => cart);
      mockCartCookie();
      mockCartStore({ createCart: create, getCart: get });
      const { GET } = await import("../src/cartApi");
      const res = await GET(buildRequest(undefined));
      expect(create).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(cart);
    });

    it("uses existing cookie", async () => {
      const cart = { foo: { sku: { id: "foo", stock: 5, sizes: [] }, qty: 1 } };
      const get = jest.fn(async () => cart);
      mockCartCookie();
      mockCartStore({ createCart: jest.fn(), getCart: get });
      const { GET } = await import("../src/cartApi");
      const cookie = "cart1";
      const res = await GET(buildRequest(undefined, cookie));
      expect(get).toHaveBeenCalledWith("cart1");
      expect(res.headers.get("Set-Cookie"))
        .toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(cart);
    });
  });
});
