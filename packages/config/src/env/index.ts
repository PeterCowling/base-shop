// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";

import type { AnyZodObject, ZodRawShape } from "zod";
import { z } from "zod";

import { coreEnvSchema } from "./core.js";

export const envSchema = coreEnvSchema;

export function mergeEnvSchemas(
  ...schemas: Array<AnyZodObject>
): AnyZodObject {
  const shape: ZodRawShape = Object.assign({}, ...schemas.map((s) => s.shape));
  return z.object(shape);
}

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:", // i18n-exempt: developer log
    parsed.error.format(),
  ); // i18n-exempt: developer log
  throw new Error("Invalid environment variables"); // i18n-exempt: developer error
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export * from "./auth.js";
export * from "./cms.js";
export * from "./core.js";
export * from "./email.js";
export * from "./payments.js";
export * from "./shipping.js";
