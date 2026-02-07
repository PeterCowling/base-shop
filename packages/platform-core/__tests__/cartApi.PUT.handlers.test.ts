import { jest } from "@jest/globals";

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

describe("cart API handlers - PUT", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

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
    const sku = { id: "s1", stock: 5, sizes: ["M"] } as const;
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
    const sku = { id: "s1", stock: 1, sizes: [] } as const;
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
    const sku = { id: "s1", stock: 5, sizes: [] } as const;
    const updated = { [sku.id]: { sku, qty: 1 } };
    const set = jest.fn(async () => undefined);
    const create = jest.fn(async () => "new");
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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
  });

  it("uses existing cart cookie", async () => {
    const sku = { id: "s1", stock: 5, sizes: [] } as const;
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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
  });
});

