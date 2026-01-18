import { describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "./envTestUtils";

describe("payments gateway flag", () => {
  it("uses defaults without warnings when gateway disabled", async () => {
    await withEnv(
      {
        PAYMENTS_GATEWAY: "disabled",
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
      async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const { paymentsEnv } = await import("@acme/config/env/payments");
        expect(paymentsEnv).toMatchObject({
          STRIPE_SECRET_KEY: "sk_test",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
          STRIPE_WEBHOOK_SECRET: "whsec_test",
        });
        expect(warnSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
      },
    );
  });

  it("returns provided values when gateway enabled", async () => {
    await withEnv(
      {
        STRIPE_SECRET_KEY: "secret",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pub",
        STRIPE_WEBHOOK_SECRET: "hook",
      },
      async () => {
        const { paymentsEnv } = await import("@acme/config/env/payments");
        expect(paymentsEnv).toMatchObject({
          STRIPE_SECRET_KEY: "secret",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pub",
          STRIPE_WEBHOOK_SECRET: "hook",
        });
      },
    );
  });

  it("warns and falls back to defaults when key invalid", async () => {
    await withEnv(
      {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pub",
        STRIPE_WEBHOOK_SECRET: "hook",
      },
      async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const { paymentsEnv } = await import("@acme/config/env/payments");
        expect(paymentsEnv).toMatchObject({
          STRIPE_SECRET_KEY: "sk_test",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
          STRIPE_WEBHOOK_SECRET: "whsec_test",
        });
        expect(warnSpy).toHaveBeenCalledWith(
          "⚠️ Invalid payments environment variables:",
          expect.any(Object),
        );
        warnSpy.mockRestore();
      },
    );
  });
});
