// scripts/src/validate-env.ts
/* i18n-exempt file -- ENG-2003 CLI-only env validation messages, not user-facing UI [ttl=2026-12-31] */
/* eslint-disable @typescript-eslint/no-require-imports -- ENG-2005: dist-scripts are CommonJS entrypoints used by Node and tests [ttl=2026-12-31] */
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

// Map well-known shop IDs onto their app slugs so that the validate-env
// script aligns with the runtime apps (for example, "bcd" maps to the
// `apps/cover-me-pretty` app).
const appSlug = shopId === "bcd" ? "cover-me-pretty" : `shop-${shopId}`;
const envPath = join("apps", appSlug, ".env");

// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2003: envPath is workspace-relative and derived from a trusted app slug, not HTTP input
if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2003: envPath is workspace-relative and derived from a trusted app slug, not HTTP input
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
