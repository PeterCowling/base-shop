import { z } from "zod";
import { shouldUseTestDefaults } from "./constants.js";
import { coreEnvSchema } from "./schema.core.js";

export function parseCoreEnv(raw: NodeJS.ProcessEnv = process.env) {
  const useTestDefaults = shouldUseTestDefaults(raw);
  const env = useTestDefaults
    ? { EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "smtp", ...raw }
    : {
        ...raw,
        ...(!raw.EMAIL_PROVIDER
          ? { EMAIL_PROVIDER: raw.EMAIL_FROM ? "smtp" : "noop" }
          : {}),
      };
  const parsed = coreEnvSchema.safeParse(env);
  if (!parsed.success) {
    if (useTestDefaults) {
      const onlyMissing = parsed.error.issues.every(
        (issue: z.ZodIssue) =>
          issue.code === z.ZodIssueCode.invalid_type &&
          issue.received === "undefined",
      );
      if (onlyMissing) {
        return coreEnvSchema.parse({
          EMAIL_FROM: "test@example.com",
          EMAIL_PROVIDER: "smtp",
        });
      }
    }
    console.error("❌ Invalid core environment variables:");
    parsed.error.issues.forEach((issue: z.ZodIssue) => {
      const pathArr = (issue.path ?? []) as Array<string | number>;
      const path = pathArr.length ? pathArr.join(".") : "(root)";
      console.error(`  • ${path}: ${issue.message}`);
    });
    throw new Error("Invalid core environment variables");
  }
  return parsed.data;
}

export function loadCoreEnv(raw: NodeJS.ProcessEnv = process.env) {
  return parseCoreEnv(raw);
}
