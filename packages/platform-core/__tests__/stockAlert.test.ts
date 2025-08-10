import { sendEmail } from "@lib/email";

jest.mock("@lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

async function loadService() {
  jest.resetModules();
   process.env.STRIPE_SECRET_KEY = "test";
   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
  const mod = await import("../src/services/stockAlert.server");
  return { ...mod, sendEmail: (await import("@lib/email")).sendEmail as jest.Mock };
}

describe("stock alert service", () => {
  it("sends emails when quantities fall below threshold", async () => {
    process.env.STOCK_ALERT_RECIPIENT = "alerts@example.com";
    const { checkAndAlert, sendEmail } = await loadService();
    await checkAndAlert("shop", [
      { sku: "a", quantity: 1, lowStockThreshold: 2 },
      { sku: "b", quantity: 5, lowStockThreshold: 2 },
    ]);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "alerts@example.com",
      "[shop] Low stock for a",
      expect.any(String)
    );
  });

  it("skips when recipient missing", async () => {
    delete process.env.STOCK_ALERT_RECIPIENT;
    const { checkAndAlert, sendEmail } = await loadService();
    await checkAndAlert("shop", [
      { sku: "a", quantity: 0, lowStockThreshold: 1 },
    ]);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
