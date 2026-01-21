import { promises as fs } from "node:fs";
import * as path from "node:path";

import { jest } from "@jest/globals";

import { DATA_ROOT } from "../src/dataRoot";

const REQUIRED_ENV = {
  STRIPE_SECRET_KEY: "sk",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
};

describe("stock alerts", () => {
  beforeEach(async () => {
    jest.resetModules();
    Object.assign(process.env, REQUIRED_ENV, {
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    });
    await fs.rm(path.join(DATA_ROOT, "shop", "stock-alert-log.json"), {
      force: true,
    });
  });

  it("sends an email when quantity is at or below threshold", async () => {
    const sendEmail = jest.fn();

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );
    await checkAndAlert("shop", [
      {
        sku: "sku-1",
        productId: "p1",
        variantAttributes: { size: "m" },
        quantity: 1,
        lowStockThreshold: 2,
      },
    ], { sendEmail });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, body] = sendEmail.mock.calls[0];
    expect(to).toBe("alert@example.com");
    expect(subject).toContain("shop");
    expect(body).toContain("sku-1");
    expect(body).toContain("size: m");
    expect(body).toContain("threshold 2");
  });

  it("handles items with multiple variant attributes", async () => {
    const sendEmail = jest.fn();

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );
    await checkAndAlert("shop", [
      {
        sku: "sku-1",
        productId: "p1",
        variantAttributes: { size: "m", color: "red" },
        quantity: 1,
        lowStockThreshold: 2,
      },
      {
        sku: "sku-2",
        productId: "p2",
        variantAttributes: { size: "l", color: "blue" },
        quantity: 5,
        lowStockThreshold: 2,
      },
    ], { sendEmail });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "alert@example.com",
      expect.any(String),
      expect.stringContaining("sku-1"),
    );
  });

  it("does not send when above threshold", async () => {
    const sendEmail = jest.fn();

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );
    await checkAndAlert("shop", [
      {
        sku: "sku-1",
        productId: "p1",
        variantAttributes: { size: "m" },
        quantity: 3,
        lowStockThreshold: 2,
      },
    ], { sendEmail });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not send when recipient env var is missing", async () => {
    const sendEmail = jest.fn();
    delete process.env.STOCK_ALERT_RECIPIENT;

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );
    await checkAndAlert("shop", [
      {
        sku: "sku-1",
        productId: "p1",
        variantAttributes: { size: "m" },
        quantity: 1,
        lowStockThreshold: 2,
      },
    ], { sendEmail });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("suppresses alerts only for the same variant", async () => {
    const sendEmail = jest.fn();

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );

    const item = {
      sku: "sku-1",
      productId: "p1",
      variantAttributes: { size: "m" },
      quantity: 1,
      lowStockThreshold: 2,
    };

    await checkAndAlert("shop", [item], { sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    sendEmail.mockClear();

    // Same variant again should be suppressed
    await checkAndAlert("shop", [item], { sendEmail });
    expect(sendEmail).not.toHaveBeenCalled();

    // Different variant of same SKU should trigger
    const otherVariant = { ...item, variantAttributes: { size: "l" } };
    await checkAndAlert("shop", [otherVariant], { sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("logs an error when sendEmail rejects", async () => {
    const sendEmail = jest.fn().mockRejectedValue(new Error("fail"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { checkAndAlert } = await import(
      "../src/services/stockAlert.server"
    );
    await checkAndAlert("shop", [
      {
        sku: "sku-1",
        productId: "p1",
        variantAttributes: { size: "m" },
        quantity: 1,
        lowStockThreshold: 2,
      },
    ], { sendEmail });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to send stock alert",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
