import { describe, expect, it } from "@jest/globals";
import { z } from "zod";
import { depositReleaseEnvRefinement } from "../core.js";

describe("depositReleaseEnvRefinement", () => {
  it("records an issue for invalid ENABLED values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_FOO_ENABLED: "maybe" },
      ctx
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
      message: "must be true or false",
    });
  });

  it("records an issue for invalid INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_BAR_INTERVAL_MS: "soon" },
      ctx
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_BAR_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});
