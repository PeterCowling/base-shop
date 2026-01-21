import { PATCH } from "../../src/api/cart/route";

import {
  createCartWithItem,
  createRequest,
  decodeCartCookie,
  encodeCartCookie,
} from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("updates quantity", async () => {
  const { cartId, idKey } = await createCartWithItem(1);
  const req = createRequest({ id: idKey, qty: 5 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[idKey].qty).toBe(5);
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toBe(cartId);
});

test("removes item when qty is 0", async () => {
  const { cartId, idKey } = await createCartWithItem(1);
  const req = createRequest({ id: idKey, qty: 0 }, encodeCartCookie(cartId));
  const res = await PATCH(req);
  const body = await res.json();
  expect(body.cart[idKey]).toBeUndefined();
});

test("returns 404 for missing item", async () => {
  const { cartId } = await createCartWithItem();
  const res = await PATCH(
    createRequest(
      { id: "01ARZ3NDEKTSV4RRFFQ69G5FAA", qty: 1 },
      encodeCartCookie(cartId)
    )
  );
  expect(res.status).toBe(404);
});

test("returns 404 when cart id missing", async () => {
  const { idKey } = await createCartWithItem(1);
  const res = await PATCH(createRequest({ id: idKey, qty: 1 }));
  expect(res.status).toBe(404);
});

test("rejects negative or non-integer quantity", async () => {
  const { cartId, idKey } = await createCartWithItem(1);
  let res = await PATCH(
    createRequest({ id: idKey, qty: -2 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
  res = await PATCH(
    createRequest({ id: idKey, qty: 1.5 }, encodeCartCookie(cartId))
  );
  expect(res.status).toBe(400);
});
