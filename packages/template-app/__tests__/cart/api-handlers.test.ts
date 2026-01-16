import { jest } from "@jest/globals";
import { NextRequest } from "next/server";

const CART_COOKIE = "__Host-CART_ID";

function mockCartCookie(overrides: Record<string, unknown> = {}) {
  jest.doMock("@acme/platform-core/cartCookie", () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
    ...overrides,
  }));
}

function mockCartStore(overrides: Record<string, unknown> = {}) {
  jest.doMock("@acme/platform-core/cartStore", () => ({
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

function mockProducts(overrides: Record<string, unknown> = {}) {
  jest.doMock("@acme/platform-core/products", () => ({
    __esModule: true,
    getProductById: jest.fn(),
    PRODUCTS: [],
    ...overrides,
  }));
}

function buildRequest(
  method: string,
  body?: any,
  cookie?: string,
): NextRequest {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = `${CART_COOKIE}=${cookie}`;
  return new NextRequest("http://localhost/api/cart", {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

describe("cart API handlers", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("returns empty cart and sets cookie when no cookie", async () => {
      const create = jest.fn(async () => "new");
      const get = jest.fn(async () => ({}));
      mockCartCookie();
      mockCartStore({ createCart: create, getCart: get });
      const { GET } = await import("@acme/platform-core/cartApi");
      const res = await GET(buildRequest("GET"));
      expect(create).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual({});
    });

    it("returns empty cart on invalid cookie signature", async () => {
      const create = jest.fn(async () => "new");
      const get = jest.fn(async () => ({}));
      mockCartCookie({ decodeCartCookie: () => null });
      mockCartStore({ createCart: create, getCart: get });
      const { GET } = await import("@acme/platform-core/cartApi");
      const res = await GET(buildRequest("GET", undefined, "bad"));
      expect(create).toHaveBeenCalled();
      const data = await res.json();
      expect(data.cart).toEqual({});
    });
  });

  describe("POST", () => {
    it("returns 400 for bad JSON", async () => {
      mockCartCookie();
      mockCartStore();
      mockProducts();
      const { POST } = await import("@acme/platform-core/cartApi");
      const res = await POST(buildRequest("POST", "not json"));
      expect(res.status).toBe(400);
    });

    it("adds item and sets cookie", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const updated = { [sku.id]: { sku, qty: 1 } };
      const increment = jest.fn(async () => updated);
      mockCartCookie();
      mockCartStore({
        createCart: jest.fn(async () => "c1"),
        getCart: jest.fn(async () => ({})),
        incrementQty: increment,
      });
      mockProducts({ getProductById: () => sku, PRODUCTS: [sku] });
      const { POST } = await import("@acme/platform-core/cartApi");
      const res = await POST(
        buildRequest("POST", { sku: { id: sku.id }, qty: 1 }),
      );
      expect(increment).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });
  });

  describe("PUT", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      mockCartStore();
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(buildRequest("PUT", "not json"));
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown SKU", async () => {
      mockCartCookie();
      mockCartStore();
      mockProducts();
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(
        buildRequest("PUT", { lines: [{ sku: { id: "nope" }, qty: 1 }] }),
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when size required", async () => {
      const sku = { id: "s1", stock: 5, sizes: ["M"] };
      mockCartCookie();
      mockCartStore();
      mockProducts({ getProductById: () => sku });
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(
        buildRequest("PUT", { lines: [{ sku: { id: sku.id }, qty: 1 }] }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 409 when quantity exceeds stock", async () => {
      const sku = { id: "s1", stock: 1, sizes: [] };
      mockCartCookie();
      mockCartStore();
      mockProducts({ getProductById: () => sku });
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(
        buildRequest("PUT", { lines: [{ sku: { id: sku.id }, qty: 2 }] }),
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 when cart not found", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      mockCartCookie({ decodeCartCookie: () => "c1" });
      mockCartStore({ getCart: jest.fn(async () => ({})) });
      mockProducts({ getProductById: () => sku });
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(
        buildRequest("PUT", { lines: [{ sku: { id: sku.id }, qty: 1 }] }, "c1"),
      );
      expect(res.status).toBe(404);
    });

    it("sets cart and cookie on success", async () => {
      const sku = { id: "s1", stock: 5, sizes: [] };
      const set = jest.fn(async () => undefined);
      mockCartCookie();
      mockCartStore({
        createCart: jest.fn(async () => "c1"),
        setCart: set,
      });
      mockProducts({ getProductById: () => sku });
      const { PUT } = await import("@acme/platform-core/cartApi");
      const res = await PUT(
        buildRequest("PUT", {
          lines: [{ sku: { id: sku.id }, qty: 2 }],
        }),
      );
      expect(set).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual({ [sku.id]: { sku, qty: 2 } });
    });
  });

  describe("PATCH", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      mockCartStore();
      const { PATCH } = await import("@acme/platform-core/cartApi");
      const res = await PATCH(buildRequest("PATCH", "not json"));
      expect(res.status).toBe(400);
    });

    it("returns 404 when item missing", async () => {
      mockCartCookie();
      mockCartStore({ setQty: jest.fn(async () => null) });
      const { PATCH } = await import("@acme/platform-core/cartApi");
      const res = await PATCH(
        buildRequest("PATCH", { id: "foo", qty: 1 }, "c1"),
      );
      expect(res.status).toBe(404);
    });

    it("qty 0 removes line, otherwise updates", async () => {
      const updated = { bar: { sku: { id: "bar", stock: 5, sizes: [] }, qty: 2 } };
      const setQty = jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(updated);
      mockCartCookie();
      mockCartStore({ setQty });
      const { PATCH } = await import("@acme/platform-core/cartApi");
      const cookie = "c1";
      let res = await PATCH(
        buildRequest("PATCH", { id: "foo", qty: 0 }, cookie),
      );
      expect(res.status).toBe(200);
      let data = await res.json();
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      expect(data.cart).toEqual({});
      res = await PATCH(
        buildRequest("PATCH", { id: "bar", qty: 2 }, cookie),
      );
      data = await res.json();
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      expect(data.cart).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns 400 for malformed body", async () => {
      mockCartCookie();
      mockCartStore();
      const { DELETE } = await import("@acme/platform-core/cartApi");
      const res = await DELETE(buildRequest("DELETE", "not json"));
      expect(res.status).toBe(400);
    });

    it("returns 404 when cart missing", async () => {
      mockCartCookie({ decodeCartCookie: () => null });
      mockCartStore();
      const { DELETE } = await import("@acme/platform-core/cartApi");
      const res = await DELETE(
        buildRequest("DELETE", { id: "foo" }, "bad"),
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 for unknown item", async () => {
      mockCartCookie();
      mockCartStore({ removeItem: jest.fn(async () => null) });
      const { DELETE } = await import("@acme/platform-core/cartApi");
      const res = await DELETE(
        buildRequest("DELETE", { id: "foo" }, "c1"),
      );
      expect(res.status).toBe(404);
    });

    it("removes item and sets cookie", async () => {
      const updated = {};
      const remove = jest.fn(async () => updated);
      mockCartCookie();
      mockCartStore({ removeItem: remove });
      const { DELETE } = await import("@acme/platform-core/cartApi");
      const res = await DELETE(
        buildRequest("DELETE", { id: "foo" }, "c1"),
      );
      expect(remove).toHaveBeenCalled();
      expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
      const data = await res.json();
      expect(data.cart).toEqual(updated);
    });
  });
});

