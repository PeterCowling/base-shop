import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("payments env provider", () => {
  it("returns defaults when PAYMENTS_GATEWAY disabled", async () => {
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_GATEWAY: "disabled" },
      () => import("../payments"),
    );
    expect(paymentsEnv).toMatchObject({
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
    });
  });

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

  it.each<[
    missing: string,
    overrides: Record<string, string>,
  ]>([
    ["STRIPE_SECRET_KEY", { STRIPE_SECRET_KEY: "" }],
    ["STRIPE_WEBHOOK_SECRET", { STRIPE_WEBHOOK_SECRET: "" }],
    [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "" },
    ],
  ])("logs and throws when %s missing", async (missing, overrides) => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk_live_123",
          STRIPE_WEBHOOK_SECRET: "whsec_live_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
          ...overrides,
        },
        () => import("../payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      `❌ Missing ${missing} when PAYMENTS_PROVIDER=stripe`,
    );
    errSpy.mockRestore();
  });

  it("logs and rejects unknown PAYMENTS_PROVIDER", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "bogus" as any }, () => import("../payments")),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "bogus",
    );
    errSpy.mockRestore();
  });
});

describe("payments env sandbox flag", () => {
  it.each([
    ["true", true],
    ["1", true],
    ["false", false],
    ["0", false],
  ])("parses %s", async (value, expected) => {
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_SANDBOX: value },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(expected);
  });

  it("warns and defaults to true on invalid sandbox", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_SANDBOX: "maybe" },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("payments env currency", () => {
  it("defaults to USD when unset", async () => {
    const { paymentsEnv } = await withEnv({}, () => import("../payments"));
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
  });

  it("uses provided currency when set", async () => {
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_CURRENCY: "EUR" },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("EUR");
  });

  it.each(["EU", "usd"]) (
    "warns and defaults on invalid currency %s",
    async (currency) => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const { paymentsEnv } = await withEnv(
        { PAYMENTS_CURRENCY: currency },
        () => import("../payments"),
      );
      expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
      expect(warnSpy).toHaveBeenCalled();
    },
  );
});
