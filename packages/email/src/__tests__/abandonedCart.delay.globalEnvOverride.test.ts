import { promises as fs } from "node:fs";

import { resolveAbandonedCartDelay } from "../abandonedCart";

const shop = "abandonedtest";
const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env[key];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

it("uses global env override when shop-specific is absent", async () => {
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
    );
  process.env.ABANDONED_CART_DELAY_MS = "22222";
  const delay = await resolveAbandonedCartDelay(shop, "/tmp");
  expect(delay).toBe(22222);
});

