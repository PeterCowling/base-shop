/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";

import {
  coreEnvBaseSchema,
  depositReleaseEnvRefinement,
} from "../core.js";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

describe("depositReleaseEnvRefinement", () => {
  it("adds issues for invalid deposit vars", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
      message: "must be a number",
    });
  });
  it.each([
    {
      env: {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      },
    },
    {
      env: {
        REVERSE_LOGISTICS_ENABLED: "false",
        REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      },
    },
    {
      env: {
        LATE_FEE_ENABLED: "true",
        LATE_FEE_INTERVAL_MS: "3000",
      },
    },
  ])("parses built-in %o vars", ({ env }) => {
    const parsed = schema.safeParse({ ...baseEnv, ...env });
    expect(parsed.success).toBe(true);
  });

  it.each([
    [
      { DEPOSIT_RELEASE_ENABLED: "yes" },
      "DEPOSIT_RELEASE_ENABLED",
      "must be true or false",
    ],
    [
      { DEPOSIT_RELEASE_INTERVAL_MS: "soon" },
      "DEPOSIT_RELEASE_INTERVAL_MS",
      "must be a number",
    ],
    [
      { REVERSE_LOGISTICS_ENABLED: "maybe" },
      "REVERSE_LOGISTICS_ENABLED",
      "must be true or false",
    ],
    [
      { REVERSE_LOGISTICS_INTERVAL_MS: "later" },
      "REVERSE_LOGISTICS_INTERVAL_MS",
      "must be a number",
    ],
    [
      { LATE_FEE_ENABLED: "nah" },
      "LATE_FEE_ENABLED",
      "must be true or false",
    ],
    [
      { LATE_FEE_INTERVAL_MS: "whenever" },
      "LATE_FEE_INTERVAL_MS",
      "must be a number",
    ],
  ])(
    "reports issues for invalid built-in %s vars",
    (env, key, message) => {
      const parsed = schema.safeParse({ ...baseEnv, ...env });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: [key], message }),
          ]),
        );
      }
    },
  );

  it("reports issues for invalid prefixed vars", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_OOPS_ENABLED: "nope",
      DEPOSIT_RELEASE_OOPS_INTERVAL_MS: "soon",
      REVERSE_LOGISTICS_OOPS_ENABLED: "nah",
      REVERSE_LOGISTICS_OOPS_INTERVAL_MS: "later",
      LATE_FEE_OOPS_ENABLED: "maybe",
      LATE_FEE_OOPS_INTERVAL_MS: "whenever",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_OOPS_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_OOPS_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_OOPS_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_OOPS_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_OOPS_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_OOPS_INTERVAL_MS"],
            message: "must be a number",
          }),
        ]),
      );
    }
  });
  it("flags non-boolean ENABLED and accepts numeric INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_COUNT_ENABLED: 1 as any,
        DEPOSIT_RELEASE_COUNT_INTERVAL_MS: 5000,
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_COUNT_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledTimes(1);
  });
  it("accepts valid ENABLED and INTERVAL_MS values for all prefixes", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "true",
        DEPOSIT_RELEASE_FOO_INTERVAL_MS: "1000",
        REVERSE_LOGISTICS_BAR_ENABLED: "false",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "2000",
        LATE_FEE_BAZ_ENABLED: "true",
        LATE_FEE_BAZ_INTERVAL_MS: "3000",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("records issues for invalid ENABLED and INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_BAD_ENABLED: "maybe",
        DEPOSIT_RELEASE_BAD_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_BAD_ENABLED: "nope",
        REVERSE_LOGISTICS_BAD_INTERVAL_MS: "later",
        LATE_FEE_BAD_ENABLED: "nah",
        LATE_FEE_BAD_INTERVAL_MS: "whenever",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledTimes(6);
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_BAD_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_BAD_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_BAD_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_BAD_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_BAD_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_BAD_INTERVAL_MS"],
      message: "must be a number",
    });
  });

  it.each([
    [
      { DEPOSIT_RELEASE_OOPS_ENABLED: "nope" },
      "DEPOSIT_RELEASE_OOPS_ENABLED",
      "must be true or false",
    ],
    [
      { DEPOSIT_RELEASE_OOPS_INTERVAL_MS: "soon" },
      "DEPOSIT_RELEASE_OOPS_INTERVAL_MS",
      "must be a number",
    ],
    [
      { REVERSE_LOGISTICS_OOPS_ENABLED: "perhaps" },
      "REVERSE_LOGISTICS_OOPS_ENABLED",
      "must be true or false",
    ],
    [
      { REVERSE_LOGISTICS_OOPS_INTERVAL_MS: "later" },
      "REVERSE_LOGISTICS_OOPS_INTERVAL_MS",
      "must be a number",
    ],
    [
      { LATE_FEE_OOPS_ENABLED: "nah" },
      "LATE_FEE_OOPS_ENABLED",
      "must be true or false",
    ],
    [
      { LATE_FEE_OOPS_INTERVAL_MS: "whenever" },
      "LATE_FEE_OOPS_INTERVAL_MS",
      "must be a number",
    ],
  ])("adds custom issue for malformed %s", (env, key, message) => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(env, ctx);
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [key],
      message,
    });
  });

  it("adds issue for non-boolean *_ENABLED values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_FOO_ENABLED: "yes" },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
      message: "must be true or false",
    });
  });

  it("adds issue for non-numeric *_INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_FOO_INTERVAL_MS: "soon" },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_FOO_INTERVAL_MS"],
      message: "must be a number",
    });
  });

  it("ignores unrelated environment keys", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        SOME_OTHER_KEY: "value",
        RANDOM_PREFIX_ENABLED: "true",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("ignores DEPOSIT_RELEASE keys without a recognized suffix", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement({ DEPOSIT_RELEASE_MISC: "foo" }, ctx);
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });
});
