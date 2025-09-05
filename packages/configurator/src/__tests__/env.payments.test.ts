import { describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "./envTestUtils";

describe("payments env schema", () => {
  it("defaults to disabled configuration when gateway disabled", async () => {
    const { paymentsEnv } = await withEnv(
      {
        PAYMENTS_GATEWAY: "disabled",
        STRIPE_SECRET_KEY: "bogus",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "bogus",
        STRIPE_WEBHOOK_SECRET: "bogus",
      },
      () => import("@acme/config/src/env/payments.ts"),
    );
    expect(paymentsEnv.STRIPE_SECRET_KEY).toBe("sk_test");
    expect(paymentsEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBe("pk_test");
    expect(paymentsEnv.STRIPE_WEBHOOK_SECRET).toBe("whsec_test");
  });

  it("returns provided stripe keys when gateway enabled", async () => {
    const keys = {
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    } as const;
    const { paymentsEnv } = await withEnv(keys, () =>
      import("@acme/config/src/env/payments.ts"),
    );
    expect(paymentsEnv).toEqual(expect.objectContaining(keys));
  });

  it("falls back to defaults when stripe secret missing", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv } = await withEnv(
      { STRIPE_SECRET_KEY: "" },
      () => import("@acme/config/src/env/payments.ts"),
    );
    expect(warn).toHaveBeenCalled();
    expect(paymentsEnv.STRIPE_SECRET_KEY).toBe("sk_test");
    expect(paymentsEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBe("pk_test");
    expect(paymentsEnv.STRIPE_WEBHOOK_SECRET).toBe("whsec_test");
    warn.mockRestore();
  });
});

