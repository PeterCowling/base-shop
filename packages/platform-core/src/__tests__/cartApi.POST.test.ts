/** @jest-environment node */

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

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

