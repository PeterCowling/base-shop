// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import type { AnyZodObject, ZodRawShape } from "zod";
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
    "❌ Invalid CMS environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid CMS environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export * from "./auth.js";
export * from "./cms.js";
export * from "./core.js";
export * from "./email.js";
export * from "./payments.js";
export * from "./shipping.js";
