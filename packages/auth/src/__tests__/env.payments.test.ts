import { describe, expect, it, jest } from "@jest/globals";

async function withEnv<T>(
  vars: Record<string, string | number | undefined>,
  loader: () => Promise<T> | T,
): Promise<T> {
  const snapshot = { ...process.env };
  const nextEnv: NodeJS.ProcessEnv = Object.assign(Object.create(null), snapshot);

  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
    } else {
      nextEnv[key] = value as any;
    }
  }

  jest.resetModules();
  process.env = nextEnv;

  try {
    return await loader();
  } finally {
    const restore: NodeJS.ProcessEnv = Object.assign(
      Object.create(null),
      snapshot,
    );
    process.env = restore;
  }
}

describe("payments env provider", () => {
  it("loads stripe config when provider set and keys present", async () => {
    const { paymentsEnv } = await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
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
