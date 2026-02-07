import { jest } from "@jest/globals";

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

describe("cart API handlers - PATCH", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

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
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
    const data = await res.json();
    expect(data.cart).toEqual(updated);
  });
});

