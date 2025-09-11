import { ProviderError } from "../types";

describe("ProviderError", () => {
  it("defaults retryable to true and exposes message", () => {
    const err = new ProviderError("oops");
    expect(err.retryable).toBe(true);
    expect(Object.keys(err)).toContain("message");
  });

  it("respects retryable flag", () => {
    const err = new ProviderError("fail", false);
    expect(err.retryable).toBe(false);
  });
});
