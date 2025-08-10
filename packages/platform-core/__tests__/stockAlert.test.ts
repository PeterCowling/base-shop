import { jest } from "@jest/globals";

const REQUIRED_ENV = {
  STRIPE_SECRET_KEY: "sk",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
};

describe("stock alerts", () => {
  beforeEach(() => {
    jest.resetModules();
    Object.assign(process.env, REQUIRED_ENV, {
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    });
  });

  it("sends an email when quantity is at or below threshold", async () => {
    const sendEmail = jest.fn();
    jest.doMock("@lib/email", () => ({ sendEmail }));

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
    ]);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "alert@example.com",
      expect.stringContaining("shop"),
      expect.stringContaining("sku-1"),
    );
  });

  it("handles items with multiple variant attributes", async () => {
    const sendEmail = jest.fn();
    jest.doMock("@lib/email", () => ({ sendEmail }));

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
    ]);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "alert@example.com",
      expect.any(String),
      expect.stringContaining("sku-1"),
    );
  });

  it("does not send when above threshold", async () => {
    const sendEmail = jest.fn();
    jest.doMock("@lib/email", () => ({ sendEmail }));

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
    ]);

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
