import "@acme/zod-utils/initZod";
import { z } from "zod";

export const reverseLogisticsEnvSchema = z
  .object({
    REVERSE_LOGISTICS_ENABLED: z
      .string()
      .refine((v) => v === "true" || v === "false", {
        message: "must be true or false",
      })
      .transform((v) => v === "true")
      .optional(),
    REVERSE_LOGISTICS_INTERVAL_MS: z
      .string()
      .refine((v) => !Number.isNaN(Number(v)), {
        message: "must be a number",
      })
      .transform((v) => Number(v))
      .optional(),
  })
  .passthrough();

export const REVERSE_LOGISTICS_PREFIX = "REVERSE_LOGISTICS_";
const ENABLED_SUFFIX = "ENABLED";
const INTERVAL_SUFFIX = "INTERVAL_MS";

export function reverseLogisticsEnvRefinement(
  env: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(REVERSE_LOGISTICS_PREFIX)) continue;
    if (key.endsWith(ENABLED_SUFFIX)) {
      if (
        value !== "true" &&
        value !== "false" &&
        value !== true &&
        value !== false
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be true or false",
        });
      }
    } else if (key.endsWith(INTERVAL_SUFFIX)) {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "must be a number",
        });
      }
    }
  }
}
