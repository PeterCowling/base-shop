import { POST } from "../../src/api/cart/route";
import {
  TEST_SKU,
  createRequest,
  decodeCartCookie,
  getCart,
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
