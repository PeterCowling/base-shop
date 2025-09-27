import { promises as fs } from "node:fs";
import { resolveAbandonedCartDelay } from "../abandonedCart";

const shop = "abandonedtest";
const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env[key];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

it("reads delay from deprecated abandonedCartDelayMs", async () => {
  jest
    .spyOn(fs, "readFile")
    .mockResolvedValue(
      JSON.stringify({ abandonedCartDelayMs: 54321 }, null, 2),
    );
  const delay = await resolveAbandonedCartDelay(shop, "/tmp");
  expect(delay).toBe(54321);
});

