import { createRequire } from "module";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export function requireEnv(
  key: string,
  type: "boolean" | "number" | "string" = "string",
) {
  const raw = process.env[key];
  if (raw == null) throw new Error(`${key} is required`);
  const val = raw.trim();
  if (val === "") throw new Error(`${key} is required`);
  if (type === "boolean") {
    if (/^(true|1)$/i.test(val)) return true;
    if (/^(false|0)$/i.test(val)) return false;
    throw new Error(`${key} must be a boolean`);
  }
  if (type === "number") {
    const num = Number(val);
    if (!Number.isNaN(num)) return num;
    throw new Error(`${key} must be a number`);
  }
  return val;
}

export function parseCoreEnv<T extends z.ZodTypeAny>(
  schema: T,
  raw: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const env = isTest
    ? { EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "noop", ...raw }
    : raw;
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    if (isTest) {
      return schema.parse({
        EMAIL_FROM: "test@example.com",
        EMAIL_PROVIDER: "noop",
      });
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

let __cachedCoreEnv: unknown | null = null;
const nodeRequire =
  typeof require !== "undefined" ? require : createRequire(eval("import.meta.url"));
const envMode = process.env.NODE_ENV;

export function getCoreEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  if (!__cachedCoreEnv) {
    if (envMode === "production" || envMode == null) {
      const mod = nodeRequire("./core.js") as { loadCoreEnv(): z.infer<T> };
      __cachedCoreEnv = mod.loadCoreEnv();
    } else {
      __cachedCoreEnv = parseCoreEnv(schema);
    }
  }
  return __cachedCoreEnv as z.infer<T>;
}

export { isProd, isTest };
