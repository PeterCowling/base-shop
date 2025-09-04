import { afterEach, describe, expect, it } from "@jest/globals";

let warnSpy: jest.SpyInstance;

afterEach(() => {
  warnSpy?.mockRestore();
});

async function withEnv<T>(
  env: Record<string, string | undefined>,
  fn: () => Promise<T> | T,
): Promise<T> {
  const previous = process.env;
  process.env = { ...previous, ...env } as NodeJS.ProcessEnv;
  for (const key of Object.keys(env)) {
    if (env[key] === undefined) {
      delete process.env[key];
    }
  }
  jest.resetModules();
  try {
    return await fn();
  } finally {
    process.env = previous;
    jest.resetModules();
  }
}

describe("payments env schema", () => {
  it("uses defaults when gateway disabled without warnings", async () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await withEnv(
      {
        PAYMENTS_GATEWAY: "disabled",
        STRIPE_SECRET_KEY: "sk_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      },
      async () => {
        const { paymentsEnv, paymentsEnvSchema } = await import("../payments.js");
        expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
        expect(warnSpy).not.toHaveBeenCalled();
      },
    );
  });

  it.each(["sk_test_abc", "sk_live_abc"])(
    "parses %s secret key",
    async (key) => {
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      await withEnv(
        {
          PAYMENTS_GATEWAY: "stripe",
          STRIPE_SECRET_KEY: key,
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
          STRIPE_WEBHOOK_SECRET: "whsec_live_abc",
        },
        async () => {
          const { paymentsEnv } = await import("../payments.js");
          expect(paymentsEnv.STRIPE_SECRET_KEY).toBe(key);
          expect(warnSpy).not.toHaveBeenCalled();
        },
      );
    },
  );

  it("warns when STRIPE_WEBHOOK_SECRET is missing", async () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await withEnv(
      {
        PAYMENTS_GATEWAY: "stripe",
        STRIPE_SECRET_KEY: "sk_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "",
      },
      async () => {
        const { paymentsEnv, paymentsEnvSchema } = await import("../payments.js");
        expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
        expect(warnSpy).toHaveBeenCalledWith(
          "⚠️ Invalid payments environment variables:",
          expect.any(Object),
        );
      },
    );
  });
});

