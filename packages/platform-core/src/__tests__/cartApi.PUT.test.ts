/** @jest-environment node */

import { buildRequest, mockCartCookie, mockCartStore } from "./cartApi.test.utils";

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

