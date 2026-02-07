import { promises as fs } from "node:fs";

import { resolveAbandonedCartDelay } from "../abandonedCart";

const shop = "abandonedtest";
const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env[key];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

it("uses file delay when env overrides are non-numeric", async () => {
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 12345 } }, null, 2),
    );
  process.env[key] = "not-a-number";
  process.env.ABANDONED_CART_DELAY_MS = "also-not-a-number";
  const delay = await resolveAbandonedCartDelay(shop, "/tmp");
  expect(delay).toBe(12345);
});

