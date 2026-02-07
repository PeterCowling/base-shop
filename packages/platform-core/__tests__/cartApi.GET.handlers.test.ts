import { jest } from "@jest/globals";

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

describe("cart API handlers - GET", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("creates cart when cookie missing", async () => {
    const cart = {} as const;
    const create = jest.fn(async () => "new");
    const get = jest.fn(async () => cart);
    mockCartCookie();
    mockCartStore({ createCart: create, getCart: get });
    const { GET } = await import("../src/cartApi");
    const res = await GET(buildRequest(undefined));
    expect(create).toHaveBeenCalled();
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
    const data = await res.json();
    expect(data.cart).toEqual(cart);
  });
});

