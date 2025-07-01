// apps/shop-abc/__tests__/cartApi.test.ts
import {
  asSetCookieHeader,
  decodeCartCookie,
  encodeCartCookie,
} from "@/lib/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { PATCH, POST } from "../src/app/api/cart/route";

declare function expectType<T>(value: T): void;

// Minimal NextResponse mock using the native Response class
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

// Helper to build a minimal NextRequest-like object
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
  const req = createRequest({ sku, qty: 2 });
  const res = await POST(req);
  const body = (await res.json()) as any;

  expect(body.cart[sku.id].qty).toBe(2);
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
  const body = (await res.json()) as any;
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
