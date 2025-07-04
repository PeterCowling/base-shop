// packages/template-app/__tests__/cart.test.ts
import {
  asSetCookieHeader,
  decodeCartCookie,
  encodeCartCookie,
} from "../../platform-core/cartCookie";
import { PRODUCTS } from "../../platform-core/products";
import { PATCH, POST } from "../src/api/cart/route";

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
  const sku = PRODUCTS[0];
  const req = createRequest({ sku: { id: sku.id }, qty: 2 });
  const res = await POST(req);
  const body = await res.json();

  expect(body.cart[sku.id].qty).toBe(2);
  expect(body.cart[sku.id].sku).toEqual(sku);
  const expected = asSetCookieHeader(
    encodeCartCookie({ [sku.id]: { sku, qty: 2 } })
  );
  expect(res.headers.get("Set-Cookie")).toBe(expected);
});

test("POST validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("PATCH updates quantity", async () => {
  const sku = PRODUCTS[0];
  const cart = { [sku.id]: { sku, qty: 1 } };
  const req = createRequest({ id: sku.id, qty: 5 }, encodeCartCookie(cart));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[sku.id].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toEqual(body.cart);
});

test("PATCH returns 404 for missing item", async () => {
  const res = await PATCH(
    createRequest({ id: "missing", qty: 1 }, encodeCartCookie({}))
  );
  expect(res.status).toBe(404);
});

test("POST returns 404 for unknown SKU", async () => {
  const res = await POST(createRequest({ sku: { id: "nope" } }));
  expect(res.status).toBe(404);
});
