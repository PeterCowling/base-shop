import { NextRequest } from "next/server";

const mockProduct = { id: "sku1", stock: 5, sizes: ["s"] };
const productNoSize = { id: "sku2", stock: 5, sizes: [] };
const productMissingSizes = { id: "sku3", stock: 5 };

const carts: Record<string, any> = {};
let cartCounter = 0;

const cartStore = {
  createCart: jest.fn(async () => {
    const id = `cart${++cartCounter}`;
    carts[id] = {};
    return id;
  }),
  getCart: jest.fn(async (id: string) => carts[id] || {}),
  setCart: jest.fn(async (id: string, cart: any) => {
    carts[id] = cart;
  }),
  incrementQty: jest.fn(async (id: string, sku: any, qty: number, size?: string) => {
    const cart = carts[id] || {};
    const key = size ? `${sku.id}:${size}` : sku.id;
    const line = cart[key] || { sku, size, qty: 0 };
    line.qty += qty;
    cart[key] = line;
    carts[id] = cart;
    return cart;
  }),
  setQty: jest.fn(async (id: string, skuId: string, qty: number) => {
    const cart = carts[id];
    if (!cart || !cart[skuId]) return null;
    cart[skuId].qty = qty;
    return cart;
  }),
  removeItem: jest.fn(async (id: string, skuId: string) => {
    const cart = carts[id];
    if (!cart || !cart[skuId]) return null;
    delete cart[skuId];
    return cart;
  }),
};

jest.mock("@acme/platform-core/cartStore", () => ({
  createCartStore: () => cartStore,
}));

const getProductById = jest.fn((id: string) => {
  if (id === "sku1") return mockProduct;
  if (id === "sku2") return productNoSize;
  if (id === "sku3") return productMissingSizes;
  return null;
});
const PRODUCTS = [mockProduct, productNoSize, productMissingSizes];

jest.mock("@acme/platform-core/products", () => ({
  getProductById: (id: string) => getProductById(id),
  PRODUCTS,
}));

const encodeCartCookie = jest.fn((id: string) => `enc-${id}`);
const decodeCartCookie = jest.fn((value?: string) =>
  value ? value.replace("enc-", "") : null,
);
const asSetCookieHeader = jest.fn((value: string) => `cart=${value}`);
const CART_COOKIE = "cart";

jest.mock("@acme/platform-core/cartCookie", () => ({
  encodeCartCookie,
  decodeCartCookie,
  asSetCookieHeader,
  CART_COOKIE,
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let PATCH: typeof import("../route").PATCH;
let PUT: typeof import("../route").PUT;
let DELETE: typeof import("../route").DELETE;

beforeAll(async () => {
  ({ GET, POST, PATCH, PUT, DELETE } = await import("../route"));
});

beforeEach(() => {
  for (const id of Object.keys(carts)) delete carts[id];
  cartCounter = 0;
  jest.clearAllMocks();
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

describe("GET", () => {
  it("returns existing cart and sets cookie", async () => {
    carts.cart1 = { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } };
    const response = await GET(req("GET", undefined, "cart=enc-cart1"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, cart: carts.cart1 });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("creates cart when cookie missing", async () => {
    const response = await GET(req("GET"));
    const body = await response.json();
    expect(cartStore.createCart).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, cart: {} });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });
});

describe("POST", () => {
  it("adds item to cart", async () => {
    carts.cart1 = {};
    const response = await POST(
      req(
        "POST",
        { sku: { id: "sku1" }, qty: 1, size: "s" },
        "cart=enc-cart1",
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      cart: { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } },
    });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("returns 404 for unknown sku", async () => {
    const response = await POST(
      req("POST", { sku: { id: "bad" }, qty: 1, size: "s" }),
    );
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Item not found" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 when size required", async () => {
    const response = await POST(
      req("POST", { sku: { id: "sku1" }, qty: 1 }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Size required" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("adds item when product lacks sizes array", async () => {
    carts.cart1 = {};
    const response = await POST(
      req("POST", { sku: { id: "sku3" }, qty: 1 }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      cart: { sku3: { sku: productMissingSizes, size: undefined, qty: 1 } },
    });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("returns 409 when stock insufficient", async () => {
    const response = await POST(
      req(
        "POST",
        { sku: { id: "sku1" }, qty: 10, size: "s" },
        "cart=enc-cart1",
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Insufficient stock" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for invalid body", async () => {
    const response = await POST(req("POST", { foo: "bar" }, "cart=enc-cart1"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toHaveProperty("sku");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("creates cart when cookie missing", async () => {
    const response = await POST(
      req("POST", { sku: { id: "sku1" }, qty: 1, size: "s" }),
    );
    const body = await response.json();
    expect(cartStore.createCart).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      cart: { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } },
    });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });
});

describe("PUT", () => {
  it("replaces cart", async () => {
    carts.cart1 = { "old": { sku: mockProduct, size: "s", qty: 1 } };
    const response = await PUT(
      req(
        "PUT",
        { lines: [{ sku: { id: "sku1" }, qty: 2, size: "s" }] },
        "cart=enc-cart1",
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      cart: { "sku1:s": { sku: mockProduct, size: "s", qty: 2 } },
    });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("returns 404 for unknown sku", async () => {
    const response = await PUT(
      req("PUT", { lines: [{ sku: { id: "bad" }, qty: 1 }] }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Item not found" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 when size missing", async () => {
    const response = await PUT(
      req("PUT", { lines: [{ sku: { id: "sku1" }, qty: 1 }] }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Size required" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for invalid body", async () => {
    const response = await PUT(req("PUT", {}, "cart=enc-cart1"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toHaveProperty("lines");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});

describe("PATCH", () => {
  it("updates quantity", async () => {
    carts.cart1 = { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } };
    const response = await PATCH(
      req("PATCH", { id: "sku1:s", qty: 2 }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      cart: { "sku1:s": { sku: mockProduct, size: "s", qty: 2 } },
    });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("returns 404 when cart cookie missing", async () => {
    const response = await PATCH(req("PATCH", { id: "sku1:s", qty: 1 }));
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Cart not found" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 404 when item not in cart", async () => {
    carts.cart1 = { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } };
    const response = await PATCH(
      req("PATCH", { id: "bad", qty: 1 }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Item not in cart" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for invalid body", async () => {
    const response = await PATCH(req("PATCH", {}, "cart=enc-cart1"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toHaveProperty("id");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});

describe("DELETE", () => {
  it("removes item", async () => {
    carts.cart1 = { "sku1:s": { sku: mockProduct, size: "s", qty: 1 } };
    const response = await DELETE(
      req("DELETE", { id: "sku1:s" }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, cart: {} });
    expect(response.headers.get("Set-Cookie")).toBe("cart=enc-cart1");
  });

  it("returns 404 when cart cookie missing", async () => {
    const response = await DELETE(req("DELETE", { id: "sku1:s" }));
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Cart not found" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 404 when item not in cart", async () => {
    carts.cart1 = {};
    const response = await DELETE(
      req("DELETE", { id: "bad" }, "cart=enc-cart1"),
    );
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Item not in cart" });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for invalid body", async () => {
    const response = await DELETE(req("DELETE", {}, "cart=enc-cart1"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toHaveProperty("id");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
});
