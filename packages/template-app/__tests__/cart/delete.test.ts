import { DELETE } from "../../src/api/cart/route";

import {
  createCartWithItem,
  createRequest,
  decodeCartCookie,
  encodeCartCookie,
  } from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("removes item", async () => {
  const { cartId, idKey } = await createCartWithItem(2);
  const req = createRequest({ id: idKey }, encodeCartCookie(cartId));
  const res = await DELETE(req);
  const body = await res.json();
  expect(body.cart[idKey]).toBeUndefined();
  const encoded = res.headers.get("Set-Cookie")!.split(";")[0].split("=")[1];
  expect(decodeCartCookie(encoded)).toBe(cartId);
});

test("returns 404 for missing line", async () => {
  const { cartId } = await createCartWithItem(1);
  const req = createRequest({ id: "nope" }, encodeCartCookie(cartId));
  const res = await DELETE(req);
  expect(res.status).toBe(404);
});
