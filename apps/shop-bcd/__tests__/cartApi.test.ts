// apps/shop-bcd/__tests__/cartApi.test.ts
import { encodeCartCookie } from "@/lib/cartCookie";
import { PRODUCTS } from "@acme/products";
import { PATCH, POST } from "../src/api/cart/route";

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
      get: () => (cookie ? { name: "", value: cookie } : undefined),
    },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
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
  const cookie = encodeCartCookie(cart);
  let res = await PATCH(createRequest({ id, qty: -2 }, cookie));
  expect(res.status).toBe(400);
  res = await PATCH(createRequest({ id, qty: 1.5 }, cookie));
  expect(res.status).toBe(400);
});

