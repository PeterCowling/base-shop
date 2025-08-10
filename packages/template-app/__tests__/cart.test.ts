// packages/template-app/__tests__/cart.test.ts
import {
  asSetCookieHeader,
  createCartId,
  decodeCartCookie,
  encodeCartCookie,
} from "@platform-core/src/cartCookie";
import { getCart, setCart } from "@platform-core/src/cartStore";
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
  cartId?: string,
  url = "http://localhost/api/cart"
): Parameters<typeof POST>[0] {
  const cookie = cartId ? encodeCartCookie(cartId) : undefined;
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
  const res = await POST(createRequest({ sku, qty: 2 }));
  const body = await res.json();
  expect(body.cart[sku.id].qty).toBe(2);
  const cookie = res.headers.get("Set-Cookie")!;
  const encoded = cookie.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  expect(getCart(id)[sku.id].qty).toBe(2);
  expect(res.headers.get("Set-Cookie")).toBe(
    asSetCookieHeader(encoded)
  );
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = { ...TEST_SKU };
  const cartId = createCartId();
  setCart(cartId, { [sku.id]: { sku, qty: 1 } });
  const req = createRequest({ id: sku.id, qty: 5 }, cartId);
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[sku.id].qty).toBe(5);
  expect(getCart(cartId)[sku.id].qty).toBe(5);
});

test("PATCH removes item when qty is 0", async () => {
  const sku = { ...TEST_SKU };
  const cartId = createCartId();
  setCart(cartId, { [sku.id]: { sku, qty: 1 } });
  const req = createRequest({ id: sku.id, qty: 0 }, cartId);
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[sku.id]).toBeUndefined();
  expect(getCart(cartId)[sku.id]).toBeUndefined();
});

test("PATCH returns 404 for missing item", async () => {
  const cartId = createCartId();
  setCart(cartId, {});
  const res = await PATCH(
    createRequest({ id: "01ARZ3NDEKTSV4RRFFQ69G5FAA", qty: 1 }, cartId)
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
  const cartId = createCartId();
  setCart(cartId, { [sku.id]: { sku, qty: 1 } });
  let res = await PATCH(
    createRequest({ id: sku.id, qty: -2 }, cartId)
  );
  expect(res.status).toBe(400);
  res = await PATCH(
    createRequest({ id: sku.id, qty: 1.5 }, cartId)
  );
  expect(res.status).toBe(400);
});

test("DELETE removes item", async () => {
  const sku = { ...TEST_SKU };
  const cartId = createCartId();
  setCart(cartId, { [sku.id]: { sku, qty: 2 } });
  const req = createRequest({ id: sku.id }, cartId);
  const res = await DELETE(req);
  const body = await res.json();
  expect(body.cart[sku.id]).toBeUndefined();
  expect(getCart(cartId)[sku.id]).toBeUndefined();
});

test("GET returns cart", async () => {
  const sku = { ...TEST_SKU };
  const cartId = createCartId();
  const cart = { [sku.id]: { sku, qty: 3 } };
  setCart(cartId, cart);
  const res = await GET(createRequest({}, cartId));
  const body = await res.json();
  expect(body.cart).toEqual(cart);
});
