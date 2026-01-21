/** @jest-environment node */

import { buildRequest, CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

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

