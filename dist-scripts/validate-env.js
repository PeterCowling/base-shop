// scripts/src/validate-env.ts
/**
 * Validate environment variables for a given shop. This CommonJS build
 * mirrors the TypeScript source used in production, but avoids importing the
 * full `@config` package so that unit tests can run in isolation.
 */
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { z, ZodError } = require("zod");

// Schema describing the required environment variables. Each key includes a
// helpful error message that mirrors the behaviour of the real validation
// logic.
const envSchema = z
  .object({
    STRIPE_SECRET_KEY: z.string({ required_error: "STRIPE_SECRET_KEY Required" }),
    STRIPE_WEBHOOK_SECRET: z.string({
      required_error: "STRIPE_WEBHOOK_SECRET Required",
    }),
    CART_COOKIE_SECRET: z.string({ required_error: "CART_COOKIE_SECRET Required" }),
    CMS_SPACE_URL: z.string({ required_error: "CMS_SPACE_URL Required" }),
    CMS_ACCESS_TOKEN: z.string({ required_error: "CMS_ACCESS_TOKEN Required" }),
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
const env = {};
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

