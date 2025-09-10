// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";
import { coreEnvSchema } from "./core.js";

export const envSchema = coreEnvSchema;

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
