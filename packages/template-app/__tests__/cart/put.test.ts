import { PRODUCTS } from "@acme/platform-core/products";

import { PUT } from "../../src/api/cart/route";

import {
  createRequest,
  decodeCartCookie,
  encodeCartCookie,
  getCart,
  TEST_SKU,
} from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("replaces entire cart", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const idKey = `${sku.id}:${size}`;
  const req = createRequest({
    lines: [{ sku: { id: sku.id }, qty: 2, size }],
  });
  const res = await PUT(req);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.cart[idKey].qty).toBe(2);
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  const stored = await getCart(id);
  expect(stored[idKey].qty).toBe(2);
});

test("requires size when SKU has sizes", async () => {
  const sku = { ...TEST_SKU };
  const req = createRequest({
    lines: [{ sku: { id: sku.id }, qty: 1 }],
  });
  const res = await PUT(req);
  expect(res.status).toBe(400);
});

test("rejects quantity over stock", async () => {
  const sku = PRODUCTS[1];
  const size = sku.sizes[0];
  const req = createRequest({
    lines: [{ sku: { id: sku.id }, qty: 3, size }],
  });
  const res = await PUT(req);
  expect(res.status).toBe(409);
});

test("returns 404 for unknown cart id", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const cookie = encodeCartCookie("missing");
  const req = createRequest(
    { lines: [{ sku: { id: sku.id }, qty: 1, size }] },
    cookie,
  );
  const res = await PUT(req);
  expect(res.status).toBe(404);
});
