/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import {
  reverseLogisticsEnvSchema,
  reverseLogisticsEnvRefinement,
  REVERSE_LOGISTICS_PREFIX,
} from "../reverseLogistics.ts";
import {
  lateFeeEnvSchema,
  lateFeeEnvRefinement,
  LATE_FEE_PREFIX,
} from "../lateFee.ts";

const features = [
  {
    name: "reverse logistics",
    prefix: REVERSE_LOGISTICS_PREFIX,
    schema: reverseLogisticsEnvSchema,
    refine: reverseLogisticsEnvRefinement,
    enabled: "REVERSE_LOGISTICS_ENABLED",
    interval: "REVERSE_LOGISTICS_INTERVAL_MS",
  },
  {
    name: "late fee",
    prefix: LATE_FEE_PREFIX,
    schema: lateFeeEnvSchema,
    refine: lateFeeEnvRefinement,
    enabled: "LATE_FEE_ENABLED",
    interval: "LATE_FEE_INTERVAL_MS",
  },
];

describe.each(features)("$name env", ({ schema, refine, enabled, interval, prefix }) => {
  const testSchema = schema.superRefine(refine);

  it("parses built-in variables", () => {
    const parsed = testSchema.safeParse({
      [enabled]: "true",
      [interval]: "1000",
    });
    expect(parsed.success).toBe(true);
  });

  it("reports issues for invalid built-in variables", () => {
    const parsed = testSchema.safeParse({
      [enabled]: "maybe",
      [interval]: "soon",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: [enabled], message: "must be true or false" }),
          expect.objectContaining({ path: [interval], message: "must be a number" }),
        ]),
      );
    }
  });

  it("reports issues for invalid prefixed vars", () => {
    const parsed = testSchema.safeParse({
      [`${prefix}OOPS_ENABLED`]: "nope",
      [`${prefix}OOPS_INTERVAL_MS`]: "later",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [`${prefix}OOPS_ENABLED`],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: [`${prefix}OOPS_INTERVAL_MS`],
            message: "must be a number",
          }),
        ]),
      );
    }
  });

  it("parses valid prefixed vars", () => {
    const parsed = testSchema.safeParse({
      [`${prefix}GOOD_ENABLED`]: "true",
      [`${prefix}GOOD_INTERVAL_MS`]: "1000",
    });
    expect(parsed.success).toBe(true);
  });

  it("validates prefixed custom variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    refine(
      {
        [`${prefix}FOO_ENABLED`]: "nope",
        [`${prefix}BAR_INTERVAL_MS`]: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${prefix}FOO_ENABLED`],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${prefix}BAR_INTERVAL_MS`],
      message: "must be a number",
    });
  });

  it("accepts valid prefixed variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    refine(
      {
        [`${prefix}GOOD_ENABLED`]: "true",
        [`${prefix}GOOD_INTERVAL_MS`]: "1000",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("flags non-boolean ENABLED and accepts numeric INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    refine(
      {
        [`${prefix}COUNT_ENABLED`]: 1 as any,
        [`${prefix}COUNT_INTERVAL_MS`]: 5000,
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${prefix}COUNT_ENABLED`],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledTimes(1);
  });

  it("ignores unrelated keys", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    refine({ OTHER_FEATURE_ENABLED: "yes" }, ctx);
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });
});
