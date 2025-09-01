import { DELETE } from "../../src/api/cart/route";
import {
  createCartWithItem,
  createRequest,
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
});
