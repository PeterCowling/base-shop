// packages/template-app/__tests__/cart.test.ts
import { decodeCartCookie, encodeCartCookie } from "@platform-core/src/cartCookie";
import {
  createCart,
  getCart,
  setCart,
  lineKey,
} from "@platform-core/src/cartStore";
import { PRODUCTS } from "@platform-core/src/products";
import { DELETE, GET, PATCH, POST } from "../src/api/cart/route";

const TEST_SKU = { ...PRODUCTS[0], id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" };

// Minimal NextResponse mock using the native Response class
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

function createRequest(
  body: any,
  cookie?: string,
  url = "http://localhost/api/cart"
): Parameters<typeof POST>[0] {
  return {
    json: async () => body,
    cookies: {
      get: (name: string) => (cookie ? { name, value: cookie } : undefined),
    },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
}

afterEach(() => {
  jest.resetAllMocks();
});

test("POST adds items and sets cookie", async () => {
  const sku = { ...TEST_SKU };
  const req = createRequest({ sku, qty: 2, size: "M" });
  const res = await POST(req);
  const body = await res.json();
  const key = lineKey(sku.id, "M");

  expect(body.cart[key].qty).toBe(2);
  expect(body.cart[key].sku).toEqual(sku);
  expect(body.cart[key].size).toBe("M");
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  expect(getCart(id)[key].qty).toBe(2);
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = { ...TEST_SKU };
  const key = lineKey(sku.id);
  const cart = { [key]: { sku, qty: 1 } };
  const cartId = createCart();
  setCart(cartId, cart);
  const req = createRequest({ id: key, qty: 5 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[key].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toBe(cartId);
});

test("PATCH removes item when qty is 0", async () => {
  const sku = { ...TEST_SKU };
  const key = lineKey(sku.id);
  const cart = { [key]: { sku, qty: 1 } };
  const cartId = createCart();
  setCart(cartId, cart);
  const req = createRequest({ id: key, qty: 0 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[key]).toBeUndefined();
});

test("PATCH returns 404 for missing item", async () => {
  const cartId = createCart();
  const res = await PATCH(
    createRequest({ id: lineKey("01ARZ3NDEKTSV4RRFFQ69G5FAA") , qty: 1 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(404);
});

test("POST returns 404 for unknown SKU", async () => {
  const res = await POST(
    createRequest({ sku: { id: "01ARZ3NDEKTSV4RRFFQ69G5FAA" } })
  );
  expect(res.status).toBe(404);
});

test("POST rejects negative or non-integer quantity", async () => {
  const sku = PRODUCTS[0];
  let res = await POST(createRequest({ sku: { id: sku.id }, qty: -1 }));
  expect(res.status).toBe(400);
  res = await POST(createRequest({ sku: { id: sku.id }, qty: 1.5 }));
  expect(res.status).toBe(400);
});

test("PATCH rejects negative or non-integer quantity", async () => {
  const sku = { ...TEST_SKU };
  const key = lineKey(sku.id);
  const cart = { [key]: { sku, qty: 1 } };
  const cartId = createCart();
  setCart(cartId, cart);
  let res = await PATCH(
    createRequest({ id: key, qty: -2 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
  res = await PATCH(
    createRequest({ id: key, qty: 1.5 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
});

test("DELETE removes item", async () => {
  const sku = { ...TEST_SKU };
  const key = lineKey(sku.id);
  const cart = { [key]: { sku, qty: 2 } };
  const cartId = createCart();
  setCart(cartId, cart);
  const req = createRequest({ id: key }, encodeCartCookie(cartId));
  const res = await DELETE(req);
  const body = await res.json();
  expect(body.cart[key]).toBeUndefined();
});

test("GET returns cart", async () => {
  const sku = { ...TEST_SKU };
  const key = lineKey(sku.id);
  const cart = { [key]: { sku, qty: 3 } };
  const cartId = createCart();
  setCart(cartId, cart);
  const res = await GET(createRequest({}, encodeCartCookie(cartId)));
  const body = await res.json();
  expect(body.cart).toEqual(cart);
});
