/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

afterEach(() => {
  jest.restoreAllMocks();
});

async function load(overrides: NodeJS.ProcessEnv = {}) {
  return withEnv(overrides, () => import("../payments"));
}

function spyWarn() {
  return jest.spyOn(console, "warn").mockImplementation(() => {});
}

describe("payments env", () => {
  it("returns provided values without warnings", async () => {
    const warn = spyWarn();
    const { paymentsEnv } = await load({
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: "true",
    });
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("js stub re-export resolves (payments.js)", async () => {
    const warn = spyWarn();
    const { paymentsEnv: fromTs } = await load({
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: "true",
    });
    jest.resetModules();
    const { paymentsEnv: fromJs } = require("../payments.js");
    expect(fromJs).toEqual(fromTs);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("payments env defaults", () => {
  const invalidSets: Array<{ name: string; env: NodeJS.ProcessEnv }> = [
    {
      name: "empty strings",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
  ];

  it.each(invalidSets)(
    "warns and falls back to schema defaults when variables are $name",
    async ({ env }) => {
      const warn = spyWarn();
      const { paymentsEnv, paymentsEnvSchema } = await load(env);
      expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
      expect(warn).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it.each([
    {
      name: "only STRIPE_SECRET_KEY valid",
      env: {
        STRIPE_SECRET_KEY: "sk_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
    {
      name: "only NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY valid",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
    {
      name: "only STRIPE_WEBHOOK_SECRET valid",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      },
    },
    {
      name: "all empty",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
    {
      name: "missing STRIPE_SECRET_KEY",
      env: {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      } as unknown as NodeJS.ProcessEnv,
    },
  ])("warns and uses defaults when %s", async ({ env }) => {
    const warn = spyWarn();
    const { paymentsEnv, paymentsEnvSchema } = await load(env);
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});

describe("payment gateway flag", () => {
  it("uses defaults without warnings when gateway disabled", async () => {
    const warn = spyWarn();
    const { paymentsEnv, paymentsEnvSchema } = await load({
      PAYMENTS_GATEWAY: "disabled",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    });
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns provided test keys when stripe gateway active", async () => {
    const warn = spyWarn();
    const { paymentsEnv } = await load({
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "sk_test_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_test_abc",
    });
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_test_abc",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns provided live keys when stripe gateway active", async () => {
    const warn = spyWarn();
    const { paymentsEnv } = await load({
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "sk_live_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_live_abc",
    });
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_live_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_live_abc",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns and falls back to defaults when stripe gateway active but keys missing", async () => {
    const warn = spyWarn();
    const { paymentsEnv, paymentsEnvSchema } = await load({
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    });
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});
