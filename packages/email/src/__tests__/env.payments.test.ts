import { afterEach,describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../config/test/utils/withEnv";

describe("payments env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns defaults when gateway disabled", async () => {
    const env = await withEnv(
      { PAYMENTS_GATEWAY: "disabled" },
      async () => {
        const mod = await import("@acme/config/env/payments");
        return mod.loadPaymentsEnv();
      },
    );
    expect(env.PAYMENTS_CURRENCY).toBe("USD");
  });

  it("loads stripe with valid keys", async () => {
    const env = await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "wh",
      },
      async () => {
        const mod = await import("@acme/config/env/payments");
        return mod.loadPaymentsEnv();
      },
    );
    expect(env.STRIPE_SECRET_KEY).toBe("sk");
  });

  it("throws when stripe keys are missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk",
          STRIPE_WEBHOOK_SECRET: undefined,
        },
        async () => {
          const mod = await import("@acme/config/env/payments");
          return mod.loadPaymentsEnv();
        },
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(errorSpy).toHaveBeenCalled();
  });
});

