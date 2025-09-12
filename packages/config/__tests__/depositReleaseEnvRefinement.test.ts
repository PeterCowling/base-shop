import { describe, it, expect, jest } from "@jest/globals";

describe("depositReleaseEnvRefinement", () => {
  it("reports non-boolean ENABLED and non-numeric INTERVAL_MS values", async () => {
    const { depositReleaseEnvRefinement } = await import("../src/env/core");
    const ctx = { addIssue: jest.fn() } as any;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
  });
});
