// scripts/src/validate-env.ts
/**
 * Validate environment variables for a given shop.  The original script
 * depends on a schema from the `@config` package and sets up friendly error
 * messages via `@acme/lib/initZod`.  This lightweight version uses a
 * permissive Zod schema that accepts any string values and reports errors
 * when the `.env` file is missing or cannot be read.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z, ZodError } from "zod";

// Accept any string key/value pairs.  In the full codebase, this schema would
// include specific keys with constraints.
const envSchema = z.record(z.string(), z.string());

const shopId = process.argv[2];

if (!shopId) {
  console.error("Usage: pnpm validate-env <shopId>");
  process.exit(1);
}

const envPath = join("apps", `shop-${shopId}`, ".env");

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

const envRaw = readFileSync(envPath, "utf8");
const env: Record<string, string> = {};
for (const line of envRaw.split(/\n+/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  env[key] = rest.join("=");
}

Object.keys(env).forEach((k) => {
  if (env[k] === "") delete env[k];
});

try {
  envSchema.parse(env);
  console.log("Environment variables look valid.");
} catch (err) {
  if (err instanceof ZodError) {
    for (const issue of err.issues) {
      const name = issue.path.join(".");
      console.error(`${name} ${issue.message}`);
    }
  } else {
    console.error(err);
  }
  process.exit(1);
}
