// apps/shop-bcd/__tests__/cart-api.test.ts
import {
  asSetCookieHeader,
  decodeCartCookie,
  encodeCartCookie,
} from "@platform-core/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { DELETE, GET, PATCH, POST } from "../src/api/cart/route";

const TEST_SKU = PRODUCTS[0];

declare function expectType<T>(value: T): void;

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
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const req = createRequest({ sku: { id: sku.id }, qty: 2, size });
  const res = await POST(req);
  const body = (await res.json()) as any;

  expect(body.cart[id].qty).toBe(2);
  const expected = asSetCookieHeader(
    encodeCartCookie({ [id]: { sku, qty: 2, size } })
  );
  expect(res.headers.get("Set-Cookie")).toBe(expected);
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 1, size } };
  const req = createRequest({ id, qty: 5 }, encodeCartCookie(cart));
  const res = await PATCH(req);
  const body = (await res.json()) as any;
  expect(body.cart[id].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toEqual(body.cart);
});

test("PATCH removes item when qty is 0", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 1, size } };
  const req = createRequest({ id, qty: 0 }, encodeCartCookie(cart));
  const res = await PATCH(req);
  const body = (await res.json()) as any;
  expect(body.cart[id]).toBeUndefined();
});

test("PATCH returns 404 for missing item", async () => {
  const res = await PATCH(
    createRequest(
      { id: "01ARZ3NDEKTSV4RRFFQ69G5FAA", qty: 1 },
      encodeCartCookie({})
    )
  );
  expect(res.status).toBe(404);
});

test("DELETE removes item", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 2, size } };
  const req = createRequest({ id }, encodeCartCookie(cart));
  const res = await DELETE(req);
  const body = (await res.json()) as any;
  expect(body.cart[id]).toBeUndefined();
});

test("GET returns cart", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const id = `${sku.id}:${size}`;
  const cart = { [id]: { sku, qty: 3, size } };
  const res = await GET(createRequest({}, encodeCartCookie(cart)));
  const body = (await res.json()) as any;
  expect(body.cart).toEqual(cart);
});
