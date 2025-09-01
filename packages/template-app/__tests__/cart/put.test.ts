import { PUT } from "../../src/api/cart/route";
import {
  TEST_SKU,
  createRequest,
  decodeCartCookie,
  getCart,
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
