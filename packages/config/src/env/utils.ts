import { z } from "zod";
import { applyFriendlyZodMessages } from "@acme/lib";

export function mergeEnvSchemas(
  ...schemas: z.ZodObject<Record<string, unknown>>[]
) {
  return schemas.reduce((acc, schema) => acc.merge(schema));
}

export function parseEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  applyFriendlyZodMessages();
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
}
