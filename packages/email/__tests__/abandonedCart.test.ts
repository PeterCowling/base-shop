import { promises as fs } from "fs";
import os from "os";
import path from "path";

const DAY_MS = 24 * 60 * 60 * 1000;

const SHOP = "shop1";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
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
    await expect(resolveAbandonedCartDelay(SHOP, root)).resolves.toBe(DAY_MS);
  });
});

describe("recoverAbandonedCarts", () => {
  it("sends reminders only for eligible carts and marks them reminded", async () => {
    jest.resetModules();
    const sendCampaignEmail = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../src/send", () => ({ sendCampaignEmail }));
    const { recoverAbandonedCarts } = await import("../src/abandonedCart");

    const now = 1000;
    const delay = 100;
    const carts = [
      { email: "old1@example.com", cart: {}, updatedAt: now - delay - 1 },
      { email: "old2@example.com", cart: {}, updatedAt: now - delay - 2, reminded: true },
      { email: "recent@example.com", cart: {}, updatedAt: now - delay + 5 },
      { email: "old3@example.com", cart: {}, updatedAt: now - delay - 3 },
    ];

    await recoverAbandonedCarts(carts, now, delay);

    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(sendCampaignEmail).toHaveBeenNthCalledWith(1, {
      to: "old1@example.com",
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    });
    expect(sendCampaignEmail).toHaveBeenNthCalledWith(2, {
      to: "old3@example.com",
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    });

    expect(carts[0].reminded).toBe(true);
    expect(carts[1].reminded).toBe(true);
    expect(carts[2].reminded).toBeUndefined();
    expect(carts[3].reminded).toBe(true);
  });
});

