import { promises as fs } from "node:fs";
import {
  recoverAbandonedCarts,
  resolveAbandonedCartDelay,
} from "../abandonedCart";
import type { AbandonedCart } from "../abandonedCart";
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

  it("uses supplied now value", async () => {
    const delay = 60 * 60 * 1000; // 1 hour
    const customNow = 10_000;
    const carts: AbandonedCart[] = [
      {
        email: "old@example.com",
        cart: {},
        updatedAt: customNow - delay - 1,
      },
      {
        email: "fresh@example.com",
        cart: {},
        updatedAt: customNow - delay + 1,
      },
    ];

    await recoverAbandonedCarts(carts, customNow, delay);

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
  const key = `ABANDONED_CART_DELAY_MS_${shop.toUpperCase()}`;
  const DEFAULT_DELAY = 24 * 60 * 60 * 1000;

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env[key];
    delete process.env.ABANDONED_CART_DELAY_MS;
  });

  it("reads delay from settings abandonedCart.delayMs", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify({ abandonedCart: { delayMs: 12345 } }, null, 2),
      );
    const delay = await resolveAbandonedCartDelay(shop, "/tmp");
    expect(delay).toBe(12345);
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

  it("environment variables override file and default delay", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
      );
    process.env.ABANDONED_CART_DELAY_MS = "22222";
    process.env[key] = "33333";
    const delay = await resolveAbandonedCartDelay(shop, "/tmp");
    expect(delay).toBe(33333);
  });

  it("uses global env override when shop-specific is absent", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify({ abandonedCart: { delayMs: 11111 } }, null, 2),
      );
    process.env.ABANDONED_CART_DELAY_MS = "22222";
    const delay = await resolveAbandonedCartDelay(shop, "/tmp");
    expect(delay).toBe(22222);
  });

  it("ignores non-numeric env values and returns default", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValue(new Error("missing"));
    process.env.ABANDONED_CART_DELAY_MS = "not-a-number";
    const delay = await resolveAbandonedCartDelay(shop, "/tmp");
    expect(delay).toBe(DEFAULT_DELAY);
  });
});
