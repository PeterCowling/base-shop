import { promises as fs } from "node:fs";
import { resolveAbandonedCartDelay } from "../abandonedCart";

const shop = "abandonedtest";
const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;
const DEFAULT_DELAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env[key];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

it("ignores non-numeric env values and returns default", async () => {
  jest.spyOn(fs, "readFile").mockRejectedValue(new Error("missing"));
  process.env.ABANDONED_CART_DELAY_MS = "not-a-number";
  const delay = await resolveAbandonedCartDelay(shop, "/tmp");
  expect(delay).toBe(DEFAULT_DELAY);
});

