import { POST } from "../../src/api/cart/route";

import {
  createRequest,
  decodeCartCookie,
  getCart,
  invalidSize,
  TEST_SKU,
  withOutOfStockSku,
} from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("adds items and sets cookie", async () => {
  const sku = { ...TEST_SKU };
  const size = sku.sizes[0];
  const idKey = `${sku.id}:${size}`;
  const req = createRequest({ sku: { id: sku.id }, qty: 2, size });
  const res = await POST(req);
  const body = await res.json();

  expect(body.cart[idKey].qty).toBe(2);
  expect(body.cart[idKey].sku).toEqual(sku);
  const header = res.headers.get("Set-Cookie")!;
  const encoded = header.split(";")[0].split("=")[1];
  const id = decodeCartCookie(encoded)!;
  const stored = await getCart(id);
  expect(stored[idKey].qty).toBe(2);
});

test("validates body", async () => {
  const res = await POST(createRequest({ wrong: true }));
  expect(res.status).toBe(400);
});

test("returns 404 for unknown SKU", async () => {
  const res = await POST(
    createRequest({ sku: { id: "01ARZ3NDEKTSV4RRFFQ69G5FAA" } })
  );
  expect(res.status).toBe(404);
});

test("rejects negative or non-integer quantity", async () => {
  const sku = TEST_SKU;
  const size = sku.sizes[0];
  let res = await POST(
    createRequest({ sku: { id: sku.id }, qty: -1, size })
  );
  expect(res.status).toBe(400);
  res = await POST(createRequest({ sku: { id: sku.id }, qty: 1.5, size }));
  expect(res.status).toBe(400);
});

test("returns 409 when SKU out of stock", async () => {
  const reset = withOutOfStockSku();
  const size = TEST_SKU.sizes[0];
  const res = await POST(
    createRequest({ sku: { id: TEST_SKU.id }, qty: 1, size })
  );
  expect(res.status).toBe(409);
  reset();
});

test("returns 400 when size missing", async () => {
  const sku = TEST_SKU;
  const res = await POST(createRequest({ sku: { id: sku.id }, qty: 1 }));
  expect(res.status).toBe(400);
});

test("accepts unknown size values", async () => {
  const sku = TEST_SKU;
  const size = invalidSize();
  const res = await POST(
    createRequest({ sku: { id: sku.id }, qty: 1, size })
  );
  expect(res.status).toBe(200);
});
