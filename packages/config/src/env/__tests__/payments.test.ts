/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

afterEach(() => {
  warnSpy?.mockRestore();
  errorSpy?.mockRestore();
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
    let result!: T;
    await jest.isolateModulesAsync(async () => {
      result = await fn();
    });
    return result;
  } finally {
    process.env = previous;
    jest.resetModules();
  }
}

describe("payments env", () => {
  it("uses defaults when provider is unset without warnings", async () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await withEnv(
      {
        PAYMENTS_PROVIDER: undefined,
        STRIPE_SECRET_KEY: undefined,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
      },
      async () => {
        const { paymentsEnv, paymentsEnvSchema } = await import(
          "../payments.js"
        );
        expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
        expect(warnSpy).not.toHaveBeenCalled();
      },
    );
  });

  it("returns defaults when gateway is disabled", async () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await withEnv(
      {
        PAYMENTS_GATEWAY: "disabled",
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: undefined,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
      },
      async () => {
        const { paymentsEnv, paymentsEnvSchema } = await import(
          "../payments.js"
        );
        expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
        expect(warnSpy).not.toHaveBeenCalled();
      },
    );
  });

  it("throws for unsupported provider", async () => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { loadPaymentsEnv } = await import("../payments.ts");
    expect(() => loadPaymentsEnv({ PAYMENTS_PROVIDER: "paypal" } as any)).toThrow(
      "Invalid payments environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
    );
  });

  describe("stripe provider", () => {
    const baseEnv = {
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    };

    it.each(["sk_test_abc", "sk_live_abc"])('parses %s secret key', async (key) => {
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const { loadPaymentsEnv } = await import("../payments.ts");
      const env = loadPaymentsEnv({ ...baseEnv, STRIPE_SECRET_KEY: key } as any);
      expect(env.STRIPE_SECRET_KEY).toBe(key);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it.each([
      [
        "STRIPE_SECRET_KEY",
        "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
      ],
      [
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
      ],
      [
        "STRIPE_WEBHOOK_SECRET",
        "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
      ],
    ])("throws when %s is missing", async (missing, message) => {
      errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const overrides = { ...baseEnv, [missing]: undefined } as Record<string, string | undefined>;
      const { loadPaymentsEnv } = await import("../payments.ts");
      expect(() => loadPaymentsEnv(overrides as any)).toThrow(
        "Invalid payments environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(message);
    });
  });
});
