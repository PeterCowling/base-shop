import { jest } from "@jest/globals";

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

describe("cart API handlers - DELETE", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 400 for malformed body", async () => {
    mockCartCookie();
    const { DELETE } = await import("../src/cartApi");
    const res = await DELETE(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when cart cookie missing", async () => {
    mockCartCookie();
    const { DELETE } = await import("../src/cartApi");
    const res = await DELETE(buildRequest({ id: "foo" }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when item not in cart", async () => {
    mockCartCookie();
    mockCartStore({ removeItem: jest.fn(async () => null) });
    const { DELETE } = await import("../src/cartApi");
    const cookie = "cart1";
    const res = await DELETE(
      buildRequest({ id: "foo" }, cookie)
    );
    expect(res.status).toBe(404);
  });

  it("removes item and sets cookie", async () => {
    const updated = {} as const;
    const removeItem = jest.fn(async () => updated);
    mockCartCookie();
    mockCartStore({ removeItem });
    const { DELETE } = await import("../src/cartApi");
    const cookie = "cart1";
    const res = await DELETE(
      buildRequest({ id: "foo" }, cookie)
    );
    expect(removeItem).toHaveBeenCalledWith("cart1", "foo");
    expect(res.headers.get("Set-Cookie")).toContain(CART_COOKIE);
    const data = await res.json();
    expect(data.cart).toEqual(updated);
  });
});

