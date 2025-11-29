// apps/shop-bcd/__tests__/cartApi.test.ts
import { encodeCartCookie } from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { PATCH, POST } from "../src/api/cart/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

function createRequest(
  body: unknown,
  cookie?: string,
  url = "http://localhost/api/cart",
): Parameters<typeof POST>[0] {
  return {
    json: async () => body,
    cookies: {
      get: () => (cookie ? { name: "", value: cookie } : undefined),
    },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as Parameters<typeof POST>[0];
}

afterEach(() => {
  jest.resetAllMocks();
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

test("PATCH rejects negative or non-integer quantity", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie(JSON.stringify(cart));
  let res = await PATCH(createRequest({ id, qty: -2 }, cookie));
  expect(res.status).toBe(400);
  res = await PATCH(createRequest({ id, qty: 1.5 }, cookie));
  expect(res.status).toBe(400);
});

test("POST adds item to cart and sets cookie", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const res = await POST(
    createRequest({ sku: { id: sku.id }, qty: 1, size })
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.cart[id]).toMatchObject({ qty: 1, size });
  expect(res.headers.get("Set-Cookie")).toBeTruthy();
});

test("PATCH updates item quantity", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie(JSON.stringify(cart));
  const res = await PATCH(createRequest({ id, qty: 2 }, cookie));
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.cart[id].qty).toBe(2);
  expect(res.headers.get("Set-Cookie")).toBeTruthy();
});

test("POST rejects missing required fields", async () => {
  const res = await POST(createRequest({ qty: 1 }));
  expect(res.status).toBe(400);
});

test("PATCH rejects missing required fields", async () => {
  const res = await PATCH(createRequest({ id: "foo" }));
  expect(res.status).toBe(400);
});

test("POST rejects unknown SKU", async () => {
  const res = await POST(
    createRequest({ sku: { id: "does-not-exist" }, qty: 1 })
  );
  expect(res.status).toBe(404);
});

test("PATCH rejects unknown cart item", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cookie = encodeCartCookie(JSON.stringify({}));
  const res = await PATCH(createRequest({ id, qty: 1 }, cookie));
  expect(res.status).toBe(404);
});
