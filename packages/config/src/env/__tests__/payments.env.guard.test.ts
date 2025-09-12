import { describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

const load = (env: NodeJS.ProcessEnv) =>
  withEnv(env, async () => {
    const { loadPaymentsEnv } = await import("../payments");
    return loadPaymentsEnv();
  });

describe("payments env guard", () => {
  it("returns defaults when PAYMENTS_GATEWAY disabled", async () => {
    const env = await load({ PAYMENTS_GATEWAY: "disabled" });
    expect(env).toMatchObject({
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
    });
  });

  describe("PAYMENTS_SANDBOX", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (value, expected) => {
      const env = await load({ PAYMENTS_SANDBOX: value });
      expect(env.PAYMENTS_SANDBOX).toBe(expected);
    });

    it("warns and defaults on invalid value", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const env = await load({ PAYMENTS_SANDBOX: "maybe" });
      expect(env.PAYMENTS_SANDBOX).toBe(true);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  it("throws on unsupported PAYMENTS_PROVIDER", async () => {
    await expect(
      load({ PAYMENTS_PROVIDER: "paypal" as any }),
    ).rejects.toThrow("Invalid payments environment variables");
  });

  describe("stripe provider", () => {
    const base: NodeJS.ProcessEnv = {
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk",
      STRIPE_WEBHOOK_SECRET: "whsec",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    };

    it("loads when all keys present", async () => {
      const env = await load(base);
      expect(env.PAYMENTS_PROVIDER).toBe("stripe");
    });

    it("throws when STRIPE_SECRET_KEY missing", async () => {
      const { STRIPE_SECRET_KEY, ...rest } = base;
      await expect(
        load({ ...rest, STRIPE_SECRET_KEY: undefined }),
      ).rejects.toThrow("Invalid payments environment variables");
    });

    it("throws when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing", async () => {
      const { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, ...rest } = base;
      await expect(
        load({ ...rest, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined }),
      ).rejects.toThrow("Invalid payments environment variables");
    });

    it("throws when STRIPE_WEBHOOK_SECRET missing", async () => {
      const { STRIPE_WEBHOOK_SECRET, ...rest } = base;
      await expect(
        load({ ...rest, STRIPE_WEBHOOK_SECRET: undefined }),
      ).rejects.toThrow("Invalid payments environment variables");
    });
  });
});

