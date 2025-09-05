import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("payments env provider", () => {
  it("loads stripe config when provider set and keys present", async () => {
    const { paymentsEnv } = await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_PROVIDER).toBe("stripe");
    expect(paymentsEnv.STRIPE_SECRET_KEY).toBe("sk_live_123");
  });

  it("throws when stripe keys are missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "stripe" }, () => import("../payments")),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
    );
  });
});

describe("payments env sandbox flag", () => {
  it("parses sandbox flag", async () => {
    const { paymentsEnv: sandbox } = await withEnv(
      { PAYMENTS_SANDBOX: "true" },
      () => import("../payments"),
    );
    expect(sandbox.PAYMENTS_SANDBOX).toBe(true);

    const { paymentsEnv: live } = await withEnv(
      { PAYMENTS_SANDBOX: "false" },
      () => import("../payments"),
    );
    expect(live.PAYMENTS_SANDBOX).toBe(false);
  });
});

describe("payments env currency", () => {
  it("defaults to USD when unset", async () => {
    const { paymentsEnv } = await withEnv({}, () => import("../payments"));
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
  });

  it("uses provided currency when set", async () => {
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_CURRENCY: "eur" },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("EUR");
  });

  it("falls back to default currency with warning on invalid code", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_CURRENCY: "EU" },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});
