import { createCartWithItem,incrementQty } from "./helpers";

afterEach(() => {
  jest.resetAllMocks();
});

test("handles concurrent updates", async () => {
  const { cartId, idKey, sku, size } = await createCartWithItem(0);
  await Promise.all(
    Array.from({ length: 20 }, () => incrementQty(cartId, sku, 1, size))
  );
  const { getCart } = await import("./helpers");
  const cart = await getCart(cartId);
  expect(cart[idKey].qty).toBe(20);
});
