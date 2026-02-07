import { promises as fs } from "node:fs";

import { resolveAbandonedCartDelay } from "../abandonedCart";

afterEach(() => {
  jest.restoreAllMocks();
});

it("handles shop names with mixed casing", async () => {
  const mixedShop = "MyShop";
  const mixedKey = "ABANDONED_CART_DELAY_MS_MYSHOP";
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
    );
  process.env[mixedKey] = "88888";
  const delay = await resolveAbandonedCartDelay(mixedShop, "/tmp");
  expect(delay).toBe(88888);
  delete process.env[mixedKey];
});

