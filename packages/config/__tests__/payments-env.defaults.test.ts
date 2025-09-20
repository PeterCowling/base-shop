import { describe, expect, it, jest } from "@jest/globals";
import { loadPaymentsEnv, paymentsEnvSchema } from "../src/env/payments";

describe("payments env – defaults & schema", () => {
  it("parses defaults when gateway disabled", () => {
    const env = loadPaymentsEnv({ PAYMENTS_GATEWAY: "disabled" } as any);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
  });

  it("returns defaults on invalid schema", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({ PAYMENTS_CURRENCY: "usd" } as any);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warn.mockRestore();
  });
});

