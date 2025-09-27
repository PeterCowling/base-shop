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

it("returns the default delay when settings file is invalid", async () => {
  jest.spyOn(fs, "readFile").mockResolvedValue("oops{not json}");
  const delay = await resolveAbandonedCartDelay(shop, "/tmp");
  expect(delay).toBe(DEFAULT_DELAY);
});

