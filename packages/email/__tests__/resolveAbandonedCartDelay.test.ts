import { promises as fs } from "fs";
import os from "os";
import path from "path";

const DAY_MS = 24 * 60 * 60 * 1000;

const SHOP = "shop1";
const SHOP_DELAY_KEY = "ABANDONED_CART_DELAY_MS_SHOP1";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env[SHOP_DELAY_KEY];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

afterEach(() => {
  delete process.env[SHOP_DELAY_KEY];
  delete process.env.ABANDONED_CART_DELAY_MS;
  process.env = ORIGINAL_ENV;
  delete process.env[SHOP_DELAY_KEY];
  delete process.env.ABANDONED_CART_DELAY_MS;
});

describe("resolveAbandonedCartDelay", () => {
  it("reads delay from shop settings", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "data-"));
    await fs.mkdir(path.join(root, SHOP));
    await fs.writeFile(
      path.join(root, SHOP, "settings.json"),
      JSON.stringify({ abandonedCart: { delayMs: 1234 } }),
    );
    const { resolveAbandonedCartDelay } = await import("../src/abandonedCart");
    await expect(resolveAbandonedCartDelay(SHOP, root)).resolves.toBe(1234);
  });

  it("overrides via shop-specific env var", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "data-"));
    await fs.mkdir(path.join(root, SHOP));
    await fs.writeFile(
      path.join(root, SHOP, "settings.json"),
      JSON.stringify({ abandonedCart: { delayMs: 1234 } }),
    );
    process.env.ABANDONED_CART_DELAY_MS_SHOP1 = "5678";
    const { resolveAbandonedCartDelay } = await import("../src/abandonedCart");
    await expect(resolveAbandonedCartDelay(SHOP, root)).resolves.toBe(5678);
  });

  it("overrides via global env var", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "data-"));
    await fs.mkdir(path.join(root, SHOP));
    await fs.writeFile(
      path.join(root, SHOP, "settings.json"),
      JSON.stringify({ abandonedCart: { delayMs: 1234 } }),
    );
    process.env.ABANDONED_CART_DELAY_MS = "4321";
    const { resolveAbandonedCartDelay } = await import("../src/abandonedCart");
    await expect(resolveAbandonedCartDelay(SHOP, root)).resolves.toBe(4321);
  });

  it("falls back to default and ignores non-numeric env vars", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "data-"));
    process.env.ABANDONED_CART_DELAY_MS_SHOP1 = "abc";
    process.env.ABANDONED_CART_DELAY_MS = "def";
    const { resolveAbandonedCartDelay } = await import("../src/abandonedCart");
    await expect(resolveAbandonedCartDelay(SHOP, root)).resolves.toBe(24 * 60 * 60 * 1000);
  });
});

