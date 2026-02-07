import { describe, expect, it, jest } from "@jest/globals";

import { loadPaymentsEnv } from "../src/env/payments";

describe("payments env – unsupported provider", () => {
  it("throws for unsupported provider", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({ PAYMENTS_PROVIDER: "foo" } as any),
    ).toThrow("Invalid payments environment variables");
    expect(err).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "foo",
    );
    err.mockRestore();
  });
});

