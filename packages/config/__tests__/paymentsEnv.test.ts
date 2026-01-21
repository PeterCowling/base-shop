import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

describe("paymentsEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses valid Stripe keys without warnings", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { paymentsEnv } = await withEnv(
      {
        STRIPE_SECRET_KEY: "sk_test_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
        STRIPE_WEBHOOK_SECRET: "whsec_789",
      },
      () => import("../src/env/payments")
    );

    expect(spy).not.toHaveBeenCalled();
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
      STRIPE_WEBHOOK_SECRET: "whsec_789",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
  });

  it("warns and uses defaults on invalid env", async () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { paymentsEnv } = await withEnv(
      {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
        STRIPE_WEBHOOK_SECRET: "whsec_789",
      },
      () => import("../src/env/payments")
    );

    expect(spy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object)
    );
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
  });
});
