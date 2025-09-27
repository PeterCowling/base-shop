/** @jest-environment node */

import { buildRequest, mockCartCookie, mockCartStore } from "./cartApi.test.utils";

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

