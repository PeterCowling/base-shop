import { jest } from "@jest/globals";
import { variantKey } from "../../repositories/inventory.server";

const sendEmail = jest.fn();
const getShopSettings = jest.fn();
const loadCoreEnv = jest.fn();
const readFile = jest.fn().mockRejectedValue(new Error("no log"));
const writeFile = jest.fn();
const mkdir = jest.fn();
const fetchMock = jest.fn().mockResolvedValue({ ok: true } as Response);

global.fetch = fetchMock as any;

jest.mock("../emailService", () => ({
  getEmailService: () => ({ sendEmail }),
}));

jest.mock("../repositories/settings.server", () => ({
  getShopSettings,
}));

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv,
}));

jest.mock("fs", () => ({
  promises: { readFile, writeFile, mkdir },
}));

describe("checkAndAlert", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (global.fetch as any) = fetchMock;
  });

  it("sends emails, writes log, and dispatches webhook", async () => {
    loadCoreEnv.mockReturnValue({});
    getShopSettings.mockResolvedValue({
      stockAlert: {
        recipients: ["shop@example.com"],
        webhook: "https://example.com/webhook",
        threshold: 2,
      },
    });

    const now = 1111;
    jest.spyOn(Date, "now").mockReturnValue(now);
    const { checkAndAlert } = await import("../stockAlert.server");
    const item = {
      sku: "sku1",
      productId: "p1",
      variantAttributes: { size: "m" },
      quantity: 1,
      lowStockThreshold: 2,
    };
    await checkAndAlert("shop", [item]);

    expect(sendEmail).toHaveBeenCalledWith(
      "shop@example.com",
      expect.any(String),
      expect.stringContaining("sku1"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({ method: "POST" }),
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("shop/stock-alert-log.json"),
      expect.any(String),
      "utf8",
    );
    const logged = JSON.parse(writeFile.mock.calls[0][1]);
    const key = variantKey("sku1", { size: "m" });
    expect(logged[key]).toBe(now);
  });

  it("falls back to env recipients and respects threshold", async () => {
    loadCoreEnv.mockReturnValue({
      STOCK_ALERT_RECIPIENTS: "env1@example.com, env2@example.com",
      STOCK_ALERT_DEFAULT_THRESHOLD: 5,
    });
    getShopSettings.mockResolvedValue({ stockAlert: {} });

    const { checkAndAlert } = await import("../stockAlert.server");
    const items = [
      {
        sku: "skuA",
        productId: "p1",
        variantAttributes: { size: "m" },
        quantity: 4,
      },
      {
        sku: "skuB",
        productId: "p2",
        variantAttributes: { size: "l" },
        quantity: 6,
      },
    ];
    await checkAndAlert("shop", items);

    expect(sendEmail).toHaveBeenCalledTimes(2);
    const recipients = sendEmail.mock.calls.map((c) => c[0]);
    expect(recipients).toEqual([
      "env1@example.com",
      "env2@example.com",
    ]);
    const body = sendEmail.mock.calls[0][2] as string;
    expect(body).toContain("skuA");
    expect(body).not.toContain("skuB");
  });
});

