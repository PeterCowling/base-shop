import { promises as fs } from "node:fs";
import { resolveAbandonedCartDelay } from "../abandonedCart";

afterEach(() => {
  jest.restoreAllMocks();
});

it("handles shop names with hyphens", async () => {
  const hyphenShop = "my-shop";
  const hyphenKey = "ABANDONED_CART_DELAY_MS_MY_SHOP";
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
    );
  process.env[hyphenKey] = "77777";
  const delay = await resolveAbandonedCartDelay(hyphenShop, "/tmp");
  expect(delay).toBe(77777);
  delete process.env[hyphenKey];
});

