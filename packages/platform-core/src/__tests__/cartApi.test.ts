/** @jest-environment node */

import type { NextRequest } from "next/server";
import { asNextJson } from "@acme/test-utils";

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

const buildRequest = (body: any, cookie?: string): NextRequest =>
  asNextJson(body, { cookies: cookie ? { [CART_COOKIE]: cookie } : undefined });

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

  it("returns 404 when SKU not found", async () => {
    mockCartCookie();
    mockCartStore();
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => undefined,
      PRODUCTS: [],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(buildRequest({ sku: { id: "missing" }, qty: 1 }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Item not found" });
  });

  it("returns 409 when SKU exists but out of stock", async () => {
    const id = "s1";
    mockCartCookie();
    mockCartStore();
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => undefined,
      PRODUCTS: [{ id }],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(buildRequest({ sku: { id }, qty: 1 }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data).toEqual({ error: "Out of stock" });
  });

  it("returns 400 when size is required", async () => {
    const sku = { id: "s1", stock: 5, sizes: ["M"] };
    mockCartCookie();
    mockCartStore();
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(buildRequest({ sku: { id: sku.id }, qty: 1 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Size required" });
  });

  it("creates a cart when cookie is missing", async () => {
    const sku = { id: "s1", stock: 5, sizes: [] };
    mockCartCookie();
    const create = jest.fn(async () => "new");
    const getCart = jest.fn(async () => ({}));
    const increment = jest.fn(async () => ({ [sku.id]: { sku, qty: 1 } }));
    mockCartStore({ createCart: create, getCart, incrementQty: increment });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { POST } = await import("../cartApi");
    const res = await POST(buildRequest({ sku: { id: sku.id }, qty: 1 }));
    expect(create).toHaveBeenCalled();
    expect(res.headers.get("Set-Cookie")).toBe(`${CART_COOKIE}=new`);
    const data = await res.json();
    expect(data.cart).toEqual({ [sku.id]: { sku, qty: 1 } });
  });
});

describe("cart API PUT", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses sku id as key when line has no size", async () => {
    const sku = { id: "s1", stock: 5, sizes: [] };
    mockCartCookie();
    const set = jest.fn();
    mockCartStore({ setCart: set });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(
      buildRequest({ lines: [{ sku: { id: sku.id }, qty: 2 }] })
    );
    expect(set).toHaveBeenCalledWith("new", {
      [sku.id]: { sku, size: undefined, qty: 2 },
    });
    const data = await res.json();
    expect(Object.keys(data.cart)).toEqual([sku.id]);
  });

  it("uses size in key when line has size", async () => {
    const sku = { id: "s1", stock: 5, sizes: ["M"] };
    mockCartCookie();
    const set = jest.fn();
    mockCartStore({ setCart: set });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(
      buildRequest({
        lines: [{ sku: { id: sku.id }, qty: 1, size: "M" }],
      })
    );
    expect(set).toHaveBeenCalledWith("new", {
      [`${sku.id}:M`]: { sku, size: "M", qty: 1 },
    });
    const data = await res.json();
    expect(Object.keys(data.cart)).toEqual([`${sku.id}:M`]);
  });

  it("returns 404 when existing cart is empty", async () => {
    mockCartCookie();
    const getCart = jest.fn(async () => ({}));
    mockCartStore({ getCart });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: jest.fn(),
      PRODUCTS: [],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(buildRequest({ lines: [] }, "old"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Cart not found" });
  });

  it("returns 400 when size is required", async () => {
    const sku = { id: "s1", stock: 5, sizes: ["M"] };
    mockCartCookie();
    const getCart = jest.fn(async () => ({ existing: {} }));
    mockCartStore({ getCart });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(
      buildRequest({ lines: [{ sku: { id: sku.id }, qty: 1 }] }, "cart")
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Size required" });
  });

  it("returns 404 when item not found", async () => {
    mockCartCookie();
    const getCart = jest.fn(async () => ({ existing: {} }));
    mockCartStore({ getCart });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => undefined,
      PRODUCTS: [],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(
      buildRequest({ lines: [{ sku: { id: "missing" }, qty: 1 }] }, "cart")
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Item not found" });
  });

  it("returns 409 when quantity exceeds stock", async () => {
    const sku = { id: "s1", stock: 1, sizes: [] };
    mockCartCookie();
    const getCart = jest.fn(async () => ({ existing: {} }));
    mockCartStore({ getCart });
    jest.doMock("../products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));

    const { PUT } = await import("../cartApi");
    const res = await PUT(
      buildRequest({ lines: [{ sku: { id: sku.id }, qty: 2 }] }, "cart")
    );
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data).toEqual({ error: "Insufficient stock" });
  });
});

describe("cart API PATCH", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 404 when cart cookie is missing", async () => {
    mockCartCookie();
    mockCartStore();
    const { PATCH } = await import("../cartApi");
    const res = await PATCH(buildRequest({ id: "1", qty: 1 }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Cart not found" });
  });

  it("returns 404 when item not in cart", async () => {
    mockCartCookie();
    const setQty = jest.fn(async () => null);
    mockCartStore({ setQty });
    const { PATCH } = await import("../cartApi");
    const res = await PATCH(buildRequest({ id: "1", qty: 1 }, "cart"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Item not in cart" });
  });
});

describe("cart API DELETE", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 404 when cart cookie is missing", async () => {
    mockCartCookie();
    mockCartStore();
    const { DELETE } = await import("../cartApi");
    const res = await DELETE(buildRequest({ id: "1" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Cart not found" });
  });

  it("returns 404 when item not in cart", async () => {
    mockCartCookie();
    const removeItem = jest.fn(async () => null);
    mockCartStore({ removeItem });
    const { DELETE } = await import("../cartApi");
    const res = await DELETE(buildRequest({ id: "1" }, "cart"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Item not in cart" });
  });
});

describe("cart API GET", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("creates a new cart when cookie is absent", async () => {
    mockCartCookie();
    const create = jest.fn(async () => "new");
    const getCart = jest.fn(async () => ({}));
    mockCartStore({ createCart: create, getCart });
    const { GET } = await import("../cartApi");
    const res = await GET(buildRequest({}, undefined));
    expect(create).toHaveBeenCalled();
    expect(res.headers.get("Set-Cookie")).toBe(`${CART_COOKIE}=new`);
    const data = await res.json();
    expect(data.cart).toEqual({});
  });
});

