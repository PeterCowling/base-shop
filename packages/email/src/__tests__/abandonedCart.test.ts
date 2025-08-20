import path from "node:path";
import { promises as fs } from "node:fs";
import {
  recoverAbandonedCarts,
  resolveAbandonedCartDelay,
} from "../abandonedCart";
import type { AbandonedCart } from "../abandonedCart";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
import { sendCampaignEmail } from "../send";

jest.mock("../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

describe("recoverAbandonedCarts", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("sends emails for carts older than a day and marks them as reminded", async () => {
    const now = Date.now();
    const carts: AbandonedCart[] = [
      {
        email: "old@example.com",
        cart: {},
        updatedAt: now - 25 * 60 * 60 * 1000,
      },
      {
        email: "fresh@example.com",
        cart: {},
        updatedAt: now - 2 * 60 * 60 * 1000,
      },
      {
        email: "already@example.com",
        cart: {},
        updatedAt: now - 26 * 60 * 60 * 1000,
        reminded: true,
      },
    ];

    await recoverAbandonedCarts(carts, now);

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmailMock).toHaveBeenCalledWith({
      to: "old@example.com",
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    });
    expect(carts[0].reminded).toBe(true);
    expect(carts[1].reminded).toBeUndefined();
    expect(carts[2].reminded).toBe(true);
  });

  it("honors a custom delay", async () => {
    const delay = 6 * 60 * 60 * 1000; // 6 hours
    const now = Date.now();
    const carts: AbandonedCart[] = [
      {
        email: "old@example.com",
        cart: {},
        updatedAt: now - delay - 1000,
      },
      {
        email: "fresh@example.com",
        cart: {},
        updatedAt: now - delay + 1000,
      },
    ];

    await recoverAbandonedCarts(carts, now, delay);

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmailMock).toHaveBeenCalledWith({
      to: "old@example.com",
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    });
    expect(carts[0].reminded).toBe(true);
    expect(carts[1].reminded).toBeUndefined();
  });
});

describe("resolveAbandonedCartDelay", () => {
  const shop = "abandonedtest";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
    delete process.env[`ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`];
    delete process.env.ABANDONED_CART_DELAY_MS;
  });

  it("reads delay from settings file", async () => {
    await fs.writeFile(
      path.join(shopDir, "settings.json"),
      JSON.stringify({ abandonedCart: { delayMs: 12345 } }, null, 2),
      "utf8",
    );
    const delay = await resolveAbandonedCartDelay(shop);
    expect(delay).toBe(12345);
  });

  it("uses per-shop env override", async () => {
    const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;
    process.env[key] = "54321";
    const delay = await resolveAbandonedCartDelay(shop);
    expect(delay).toBe(54321);
  });
});
