/** @jest-environment node */

import { buildRequest, mockCartCookie, mockCartStore } from "./cartApi.test.utils";

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

