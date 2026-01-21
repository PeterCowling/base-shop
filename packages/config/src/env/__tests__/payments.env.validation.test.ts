/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./test-helpers";

describe("payments env validation", () => {
  it("returns defaults without error when gateway disabled", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await withEnv({ PAYMENTS_GATEWAY: "disabled" }, async () => {
      const { paymentsEnv, paymentsEnvSchema } = await import("../payments");
      expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs error and throws on unsupported provider", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ PAYMENTS_PROVIDER: "paypal" }, () => import("../payments")),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
    );
    errorSpy.mockRestore();
  });

  describe("stripe provider requirements", () => {
    const base = {
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      STRIPE_WEBHOOK_SECRET: "whsec",
    } as const;

    it.each([
      [
        "STRIPE_SECRET_KEY",
        { ...base, STRIPE_SECRET_KEY: undefined },
        "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
      ],
      [
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        { ...base, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined },
        "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
      ],
      [
        "STRIPE_WEBHOOK_SECRET",
        { ...base, STRIPE_WEBHOOK_SECRET: undefined },
        "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
      ],
    ])("fails when %s is missing", async (_label, env, message) => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { PAYMENTS_PROVIDER: "stripe", ...env } as Record<
            string,
            string | undefined
          >,
          () => import("../payments"),
        ),
      ).rejects.toThrow("Invalid payments environment variables");
      expect(spy).toHaveBeenCalledWith(message);
      spy.mockRestore();
    });
  });

  describe("PAYMENTS_SANDBOX coercion", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      await withEnv({ PAYMENTS_SANDBOX: input }, async () => {
        const { paymentsEnv } = await import("../payments");
        expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(expected);
      });
    });

    it("defaults to true when unset", async () => {
      await withEnv({}, async () => {
        const { paymentsEnv } = await import("../payments");
        expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
      });
    });
  });

  it("warns and returns defaults on safeParse failure", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await withEnv({ PAYMENTS_CURRENCY: "usd" }, async () => {
      const { paymentsEnv, paymentsEnvSchema } = await import("../payments");
      expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });
});

