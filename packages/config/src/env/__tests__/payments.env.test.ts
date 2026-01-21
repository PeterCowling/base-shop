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

  it("logs and throws when stripe secret key missing", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "",
          STRIPE_WEBHOOK_SECRET: "whsec_live_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        },
        () => import("../payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
    );
    errSpy.mockRestore();
  });

  it("logs and throws when stripe publishable key missing", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk_live_123",
          STRIPE_WEBHOOK_SECRET: "whsec_live_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        },
        () => import("../payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
    );
    errSpy.mockRestore();
  });

  it("logs and throws when stripe webhook secret missing", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk_live_123",
          STRIPE_WEBHOOK_SECRET: "",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        },
        () => import("../payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
    );
    errSpy.mockRestore();
  });

  it("throws when PAYMENTS_PROVIDER is unknown", async () => {
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "braintree" as any }, () => import("../payments")),
    ).rejects.toThrow("Invalid payments environment variables");
  });

  it("logs and rejects unknown PAYMENTS_PROVIDER", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "paypal" as any }, () => import("../payments")),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
    );
    errSpy.mockRestore();
  });

  it("logs and throws for unsupported provider even with stripe keys", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "paypal" as any,
          STRIPE_SECRET_KEY: "sk_live_123",
          STRIPE_WEBHOOK_SECRET: "whsec_live_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        },
        () => import("../payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
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

  it("defaults to true when PAYMENTS_SANDBOX undefined", async () => {
    const { paymentsEnv } = await withEnv({}, () => import("../payments"));
    expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
  });

  it("warns and defaults to true on invalid sandbox", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_SANDBOX: "maybe" },
      () => import("../payments"),
    );
    expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
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
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );
});

describe("payments env defaults on invalid config", () => {
  it("warns and returns defaults when sandbox or currency invalid", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv, paymentsEnvSchema } = await withEnv(
      { PAYMENTS_SANDBOX: "maybe", PAYMENTS_CURRENCY: "usd" },
      () => import("../payments"),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});
