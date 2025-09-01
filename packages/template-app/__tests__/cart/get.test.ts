import { GET } from "../../src/api/cart/route";
import {
  createCartWithItem,
  createRequest,
  encodeCartCookie,
} from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("returns cart", async () => {
  const { cart, cartId } = await createCartWithItem(3);
  const res = await GET(createRequest({}, encodeCartCookie(cartId)));
  const body = await res.json();
  expect(body.cart).toEqual(cart);
});
