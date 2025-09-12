// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { coreEnvSchema } from "./core.js";

export const envSchema = coreEnvSchema;

export function mergeEnvSchemas(
  ...schemas: Array<z.ZodObject<any>>
): z.ZodObject<any> {
  const shape = Object.assign({}, ...schemas.map((s) => s.shape));
  return z.object(shape);
}

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export * from "./auth.js";
export * from "./cms.js";
export * from "./core.js";
export * from "./email.js";
export * from "./payments.js";
export * from "./shipping.js";
export * from "./depositRelease.js";
export * from "./reverseLogistics.js";
export * from "./lateFee.js";
export * from "./utils.js";
