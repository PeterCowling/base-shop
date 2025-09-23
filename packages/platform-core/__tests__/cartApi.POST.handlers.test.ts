import { jest } from "@jest/globals";
import { buildRequest, mockCartCookie, mockCartStore, CART_COOKIE } from "./cartApi.test.utils";

describe("cart API handlers - POST", () => {
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
    const sku = { id: "s1", stock: 5, sizes: ["M"] } as const;
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
    const sku = { id: "s1", stock: 1, sizes: [] } as const;
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
    const sku = { id: "s1", stock: 5, sizes: [] } as const;
    const updated = { [sku.id]: { sku, qty: 1 } };
    const create = jest.fn(async () => "new");
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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
    const data = await res.json();
    expect(data.cart).toEqual(updated);
  });

  it("uses existing cart cookie", async () => {
    const sku = { id: "s1", stock: 5, sizes: [] } as const;
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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
    const data = await res.json();
    expect(data.cart).toEqual(updated);
  });
});

