/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { z } from "zod";

import { depositReleaseEnvRefinement } from "../../core.ts";

import { createRefinementCtx } from "./core.test-helpers.ts";

describe("depositReleaseEnvRefinement direct usage", () => {
  it("rejects non-boolean *_ENABLED and non-numeric *_INTERVAL_MS values", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "yes",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "later",
        LATE_FEE_BAZ_ENABLED: "maybe",
        SOME_FEATURE_ENABLED: "nope",
        OTHER_FEATURE_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_BAR_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_BAZ_ENABLED"],
      message: "must be true or false",
    });
  });

  it("records issues for invalid base deposit, reverse logistics and late fee vars", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "nah",
        LATE_FEE_INTERVAL_MS: "whenever",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledTimes(6);
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
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_INTERVAL_MS"],
      message: "must be a number",
    });
  });

  it("skips base keys and accepts valid custom deposit values", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "1000",
        REVERSE_LOGISTICS_ENABLED: "false",
        REVERSE_LOGISTICS_INTERVAL_MS: "2000",
        LATE_FEE_ENABLED: "true",
        LATE_FEE_INTERVAL_MS: "3000",
        DEPOSIT_RELEASE_FOO_ENABLED: "true",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "4000",
        LATE_FEE_BAZ_ENABLED: "false",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("ignores unrelated *_ENABLED and *_INTERVAL_MS variables", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        SOME_FEATURE_ENABLED: "nope",
        OTHER_FEATURE_INTERVAL_MS: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("ignores DEPOSIT_RELEASE keys without ENABLED or INTERVAL_MS", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_SOMETHING_ELSE: "foo" },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("adds issues for malformed built-in variables", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "maybe",
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
      path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_ENABLED"],
      message: "must be true or false",
    });
  });

  it("adds issues for malformed custom variables", () => {
    const ctx = createRefinementCtx();
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_TEST_ENABLED: "notbool",
        DEPOSIT_RELEASE_TEST_INTERVAL_MS: "soon",
        LATE_FEE_BAR_INTERVAL_MS: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_TEST_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_TEST_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_BAR_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});
