import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

async function withEnv(
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
  for (const key of Object.keys(env)) {
    if (env[key] === undefined) delete process.env[key];
  }
  jest.resetModules();
  try {
    await fn();
  } finally {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  }
}

describe("payments env", () => {
  it("loads stripe provider when keys present", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      },
      async () => {
        const { loadPaymentsEnv } = await import("../payments.ts");
        const env = loadPaymentsEnv();
        expect(env.PAYMENTS_PROVIDER).toBe("stripe");
        expect(env.STRIPE_SECRET_KEY).toBe("sk_live_123");
        expect(env.STRIPE_WEBHOOK_SECRET).toBe("whsec_live_123");
        expect(env.PAYMENTS_SANDBOX).toBe(true);
      },
    );
  });

  it("throws when stripe provider missing secret key", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      },
      async () => {
        await expect(import("../payments.ts")).rejects.toThrow(
          "Invalid payments environment variables",
        );
      },
    );
  });

  it("toggles sandbox mode", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
        PAYMENTS_SANDBOX: "false",
      },
      async () => {
        const { loadPaymentsEnv } = await import("../payments.ts");
        const env = loadPaymentsEnv();
        expect(env.PAYMENTS_SANDBOX).toBe(false);
      },
    );

    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
        PAYMENTS_SANDBOX: "true",
      },
      async () => {
        const { loadPaymentsEnv } = await import("../payments.ts");
        const env = loadPaymentsEnv();
        expect(env.PAYMENTS_SANDBOX).toBe(true);
      },
    );
  });

  it("uses default currency and allows override", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
      },
      async () => {
        const { loadPaymentsEnv } = await import("../payments.ts");
        const env = loadPaymentsEnv();
        expect(env.NEXT_PUBLIC_CURRENCY).toBe("USD");
      },
    );

    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXT_PUBLIC_CURRENCY: "EUR",
      },
      async () => {
        const { loadPaymentsEnv } = await import("../payments.ts");
        const env = loadPaymentsEnv();
        expect(env.NEXT_PUBLIC_CURRENCY).toBe("EUR");
      },
    );
  });

  it("errors on invalid currency code", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
        NEXT_PUBLIC_CURRENCY: "EU",
      },
      async () => {
        await expect(import("../payments.ts")).rejects.toThrow(
          "Invalid payments environment variables",
        );
      },
    );
  });
});

