import { promises as fs } from "node:fs";

import { resolveAbandonedCartDelay } from "../abandonedCart";

afterEach(() => {
  jest.restoreAllMocks();
});

it("sanitizes shop name when reading env override", async () => {
  const specialShop = "aband.oned";
  const specialKey = "ABANDONED_CART_DELAY_MS_ABAND_ONED";
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
    );
  process.env[specialKey] = "55555";
  const delay = await resolveAbandonedCartDelay(specialShop, "/tmp");
  expect(delay).toBe(55555);
  delete process.env[specialKey];
});

