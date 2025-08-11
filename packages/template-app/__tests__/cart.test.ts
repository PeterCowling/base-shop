// packages/template-app/__tests__/cart.test.ts
import { decodeCartCookie, encodeCartCookie } from "@platform-core/src/cartCookie";
import {
  createCart,
  getCart,
  setCart,
  incrementQty,
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

jest.mock("@upstash/redis", () => ({ Redis: class {} }));

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
  const req = createRequest({ sku, qty: 2 });
  const res = await POST(req);
  const body = await res.json();

  expect(body.cart[sku.id].qty).toBe(2);
  expect(body.cart[sku.id].sku).toEqual(sku);
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  const stored = await getCart(id);
  expect(stored[sku.id].qty).toBe(2);
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = { ...TEST_SKU };
  const cart = { [sku.id]: { sku, qty: 1 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: sku.id, qty: 5 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[sku.id].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toBe(cartId);
});

test("PATCH removes item when qty is 0", async () => {
  const sku = { ...TEST_SKU };
  const cart = { [sku.id]: { sku, qty: 1 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: sku.id, qty: 0 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[sku.id]).toBeUndefined();
});

test("PATCH returns 404 for missing item", async () => {
  const cartId = await createCart();
  const res = await PATCH(
    createRequest(
      { id: "01ARZ3NDEKTSV4RRFFQ69G5FAA", qty: 1 },
      encodeCartCookie(cartId)
    )
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
  const cart = { [sku.id]: { sku, qty: 1 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  let res = await PATCH(
    createRequest({ id: sku.id, qty: -2 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
  res = await PATCH(
    createRequest({ id: sku.id, qty: 1.5 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
});

test("DELETE removes item", async () => {
  const sku = { ...TEST_SKU };
  const cart = { [sku.id]: { sku, qty: 2 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: sku.id }, encodeCartCookie(cartId));
  const res = await DELETE(req);
  const body = await res.json();
  expect(body.cart[sku.id]).toBeUndefined();
});

test("GET returns cart", async () => {
  const sku = { ...TEST_SKU };
  const cart = { [sku.id]: { sku, qty: 3 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const res = await GET(createRequest({}, encodeCartCookie(cartId)));
  const body = await res.json();
  expect(body.cart).toEqual(cart);
});

test("incrementQty handles concurrent updates", async () => {
  const sku = { ...TEST_SKU };
  const cartId = await createCart();
  await Promise.all(
    Array.from({ length: 20 }, () => incrementQty(cartId, sku, 1))
  );
  const cart = await getCart(cartId);
  expect(cart[sku.id].qty).toBe(20);
});
