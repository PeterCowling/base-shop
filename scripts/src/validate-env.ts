// scripts/src/validate-env.ts
/**
 * Validate environment variables for a given shop.  The original script
 * depends on a schema from the `@config` package and sets up friendly error
 * messages via `@acme/zod-utils/initZod`.  This lightweight version uses a
 * permissive Zod schema that accepts any string values and reports errors
 * when the `.env` file is missing or cannot be read.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z, ZodError } from "zod";

// Define the required environment variables with friendly error messages.
const envSchema = z
  .object({
    STRIPE_SECRET_KEY: z.string({
      required_error: "STRIPE_SECRET_KEY Required",
    }),
    STRIPE_WEBHOOK_SECRET: z.string({
      required_error: "STRIPE_WEBHOOK_SECRET Required",
    }),
    CART_COOKIE_SECRET: z.string({
      required_error: "CART_COOKIE_SECRET Required",
    }),
    CMS_SPACE_URL: z.string({ required_error: "CMS_SPACE_URL Required" }),
    CMS_ACCESS_TOKEN: z.string({
      required_error: "CMS_ACCESS_TOKEN Required",
    }),
    SANITY_API_VERSION: z.string({
      required_error: "SANITY_API_VERSION Required",
    }),
    DEPOSIT_RELEASE_ENABLED: z
      .string()
      .optional()
      .refine((v) => v === undefined || v === "true" || v === "false", {
        message: "DEPOSIT_RELEASE_ENABLED must be true or false",
      }),
    DEPOSIT_RELEASE_INTERVAL_MS: z
      .string()
      .optional()
      .refine((v) => v === undefined || !Number.isNaN(Number(v)), {
        message: "DEPOSIT_RELEASE_INTERVAL_MS must be a number",
      }),
  })
  .passthrough();

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
      console.error(issue.message);
    }
  } else {
    console.error(err);
  }
  process.exit(1);
}
