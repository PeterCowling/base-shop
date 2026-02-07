import { promises as fs } from "node:fs";

import { resolveAbandonedCartDelay } from "../abandonedCart";

afterEach(() => {
  jest.restoreAllMocks();
});

it("handles shop names with spaces", async () => {
  const spacedShop = "my shop";
  const spacedKey = "ABANDONED_CART_DELAY_MS_MY_SHOP";
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
    );
  process.env[spacedKey] = "66666";
  const delay = await resolveAbandonedCartDelay(spacedShop, "/tmp");
  expect(delay).toBe(66666);
  delete process.env[spacedKey];
});

