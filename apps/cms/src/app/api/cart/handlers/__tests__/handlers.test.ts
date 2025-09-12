import { NextRequest } from "next/server";

const mockProduct = { id: "sku1", stock: 5, sizes: [] };

jest.mock("@platform-core/products", () => ({
  getProductById: (id: string) => (id === "sku1" ? mockProduct : null),
  PRODUCTS: [mockProduct],
}));

const encodeCartCookie = jest.fn((id: string) => `enc-${id}`);
const decodeCartCookie = jest.fn((v?: string) =>
  v ? v.replace("enc-", "") : null,
);
const asSetCookieHeader = jest.fn((v: string) => `cart=${v}`);
const CART_COOKIE = "cart";

jest.mock("@platform-core/cartCookie", () => ({
  encodeCartCookie,
  decodeCartCookie,
  asSetCookieHeader,
  CART_COOKIE,
}));

let GET: typeof import("../get").GET;
let POST: typeof import("../post").POST;
let PUT: typeof import("../put").PUT;
let PATCH: typeof import("../patch").PATCH;
let DELETE: typeof import("../delete").DELETE;

beforeAll(async () => {
  ({ GET } = await import("../get"));
  ({ POST } = await import("../post"));
  ({ PUT } = await import("../put"));
  ({ PATCH } = await import("../patch"));
  ({ DELETE } = await import("../delete"));
});

function req(method: string, body?: any, cookie?: string) {
  return new NextRequest("http://test.local", {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("cart handlers", () => {
  test("GET creates cart and sets cookie", async () => {
    const store = {
      createCart: jest.fn(async () => "cart1"),
      getCart: jest.fn(async () => ({})),
    };
    const res = await GET(req("GET"), store as any);
    expect(store.createCart).toHaveBeenCalled();
    const body = await res.json();
    expect(body).toEqual({ ok: true, cart: {} });
    expect(res.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  test("POST adds item", async () => {
    const cart = { sku1: { sku: mockProduct, qty: 1 } };
    const store = {
      createCart: jest.fn(async () => "cart1"),
      getCart: jest.fn(async () => ({})),
      incrementQty: jest.fn(async () => cart),
    };
    const res = await POST(
      req("POST", { sku: { id: "sku1" }, qty: 1 }),
      store as any,
    );
    expect(store.incrementQty).toHaveBeenCalledWith(
      "cart1",
      mockProduct,
      1,
      undefined,
    );
    const body = await res.json();
    expect(body).toEqual({ ok: true, cart });
    expect(res.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  test("PUT sets cart", async () => {
    const store = {
      createCart: jest.fn(async () => "cart1"),
      setCart: jest.fn(async () => {}),
    };
    const res = await PUT(
      req("PUT", { lines: [{ sku: { id: "sku1" }, qty: 2 }] }),
      store as any,
    );
    expect(store.setCart).toHaveBeenCalledWith("cart1", {
      sku1: { sku: mockProduct, size: undefined, qty: 2 },
    });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  test("PATCH updates quantity", async () => {
    const cart = { sku1: { sku: mockProduct, qty: 2 } };
    const store = {
      setQty: jest.fn(async () => cart),
    };
    const res = await PATCH(
      req("PATCH", { id: "sku1", qty: 2 }, "cart=enc-cart1"),
      store as any,
    );
    expect(store.setQty).toHaveBeenCalledWith("cart1", "sku1", 2);
    const body = await res.json();
    expect(body).toEqual({ ok: true, cart });
    expect(res.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  test("DELETE removes item", async () => {
    const cart = {};
    const store = {
      removeItem: jest.fn(async () => cart),
    };
    const res = await DELETE(
      req("DELETE", { id: "sku1" }, "cart=enc-cart1"),
      store as any,
    );
    expect(store.removeItem).toHaveBeenCalledWith("cart1", "sku1");
    const body = await res.json();
    expect(body).toEqual({ ok: true, cart });
    expect(res.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });
});
