// apps/shop-abc/__tests__/cartApi.test.ts
import {
  decodeCartCookie,
  encodeCartCookie,
} from "@platform-core/src/cartCookie";
import { createCart, getCart, setCart } from "@platform-core/src/cartStore";
import { PRODUCTS } from "@platform-core/products";
import { DELETE, GET, PATCH, POST, PUT } from "../src/app/api/cart/route";
import * as productLib from "@/lib/products";

const TEST_SKU = PRODUCTS[0];


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
  const sku = { ...TEST_SKU, id: "01ARZ3NDEKTSV4RRFFQ69G5FAA" };
  jest.spyOn(productLib, "getProductById").mockReturnValue(sku as any);
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const req = createRequest({ sku: { id: sku.id }, qty: 2, size });
  const res = await POST(req);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.cart[lineId].qty).toBe(2);
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  const stored = await getCart(id);
  expect(stored[lineId].qty).toBe(2);
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const cart = { [lineId]: { sku, qty: 1, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: lineId, qty: 5 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[lineId].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toBe(cartId);
});

test("PATCH removes item when qty is 0", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const cart = { [lineId]: { sku, qty: 1, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: lineId, qty: 0 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[lineId]).toBeUndefined();
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
  const size = sku.sizes[0];
  let res = await POST(
    createRequest({ sku: { id: sku.id }, qty: -1, size })
  );
  expect(res.status).toBe(400);
  res = await POST(createRequest({ sku: { id: sku.id }, qty: 1.5, size }));
  expect(res.status).toBe(400);
});

test("POST rejects out-of-stock items", async () => {
  const sku = { ...TEST_SKU, id: "01ARZ3NDEKTSV4RRFFQ69G5FAA", stock: 0 };
  jest.spyOn(productLib, "getProductById").mockReturnValue(undefined as any);
  const size = sku.sizes[0];
  const res = await POST(
    createRequest({ sku: { id: sku.id }, qty: 1, size })
  );
  expect(res.status).toBe(404);
});

test("POST rejects when requested quantity exceeds stock", async () => {
  const sku = { ...TEST_SKU, id: "01ARZ3NDEKTSV4RRFFQ69G5FAB", stock: 2 };
  jest.spyOn(productLib, "getProductById").mockReturnValue(sku as any);
  const size = sku.sizes[0];
  const res = await POST(
    createRequest({ sku: { id: sku.id }, qty: sku.stock + 1, size })
  );
  expect(res.status).toBe(409);
});

test("PATCH rejects negative or non-integer quantity", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const cart = { [lineId]: { sku, qty: 1, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  let res = await PATCH(
    createRequest({ id: lineId, qty: -2 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
  res = await PATCH(
    createRequest({ id: lineId, qty: 1.5 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
});

test("PUT replaces entire cart", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const req = createRequest({
    lines: [{ sku: { id: sku.id }, qty: 2, size }],
  });
  const res = await PUT(req);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.cart[lineId].qty).toBe(2);
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  const stored = await getCart(id);
  expect(stored[lineId].qty).toBe(2);
});

test("DELETE removes item", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const cart = { [lineId]: { sku, qty: 2, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const req = createRequest({ id: lineId }, encodeCartCookie(cartId));
  const res = await DELETE(req);
  const body = await res.json();
  expect(body.cart[lineId]).toBeUndefined();
});

test("GET returns cart", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const lineId = `${sku.id}:${size}`;
  const cart = { [lineId]: { sku, qty: 3, size } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const res = await GET(createRequest({}, encodeCartCookie(cartId)));
  const body = await res.json();
  expect(body.cart).toEqual(cart);
});
