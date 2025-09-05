import { describe, expect, it, jest } from "@jest/globals";

async function withEnv<T>(vars: NodeJS.ProcessEnv, loader: () => Promise<T>): Promise<T> {
  const OLD = process.env;
  jest.resetModules();
  process.env = { ...OLD, ...vars };
  try {
    return await loader();
  } finally {
    process.env = OLD;
  }
}

describe("payments env provider", () => {
  it("loads stripe config when provider set and keys present", async () => {
    const { paymentsEnv } = await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      },
      () => import("@acme/config/env/payments"),
    );
    expect(paymentsEnv.PAYMENTS_PROVIDER).toBe("stripe");
    expect(paymentsEnv.STRIPE_SECRET_KEY).toBe("sk_live_123");
  });

  it("throws when stripe provider missing key", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { PAYMENTS_PROVIDER: "stripe" },
        () => import("@acme/config/env/payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalled();
  });
});

describe("payments env sandbox flag", () => {
  it("parses sandbox flag", async () => {
    const { paymentsEnv: sandbox } = await withEnv(
      { PAYMENTS_SANDBOX: "true" },
      () => import("@acme/config/env/payments"),
    );
    expect(sandbox.PAYMENTS_SANDBOX).toBe(true);

    const { paymentsEnv: live } = await withEnv(
      { PAYMENTS_SANDBOX: "false" },
      () => import("@acme/config/env/payments"),
    );
    expect(live.PAYMENTS_SANDBOX).toBe(false);
  });
});

describe("payments env currency", () => {
  it("defaults to USD when unset", async () => {
    const { paymentsEnv } = await withEnv({}, () => import("@acme/config/env/payments"));
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
  });

  it("uses provided currency when set", async () => {
    const { paymentsEnv } = await withEnv(
      { PAYMENTS_CURRENCY: "EUR" },
      () => import("@acme/config/env/payments"),
    );
    expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("EUR");
  });

  it("warns and falls back to default currency on invalid code", async () => {
    await withEnv(
      { PAYMENTS_CURRENCY: "EU" },
      async () => {
        const warnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        const { paymentsEnv } = await import("@acme/config/env/payments");
        expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("USD");
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      },
    );
  });
});
