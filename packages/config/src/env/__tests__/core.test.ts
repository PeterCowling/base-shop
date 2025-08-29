import { describe, expect, it } from "@jest/globals";
import { coreEnvBaseSchema, depositReleaseEnvRefinement } from "../core";

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("core env refinement", () => {
  it("reports invalid DEPOSIT_RELEASE_ENABLED", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "yes",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      });
    }
  });

  it("reports non-numeric LATE_FEE_INTERVAL_MS", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      LATE_FEE_INTERVAL_MS: "fast",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["LATE_FEE_INTERVAL_MS"],
        message: "must be a number",
      });
    }
  });
});

