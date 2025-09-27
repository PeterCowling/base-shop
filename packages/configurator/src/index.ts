import { envSchema } from "@acme/config/env";
import { spawnSync } from "node:child_process";

const REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "CART_COOKIE_SECRET",
] as const;

try {
  envSchema.parse(process.env);

  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missing.length > 0) {
    // i18n-exempt: CLI error message for developers; not user-facing UI
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
} catch (err) {
  // i18n-exempt: CLI error message for developers; not user-facing UI
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

const [, , cmd] = process.argv;

function run(bin: string, args: string[]) {
  const result = spawnSync(bin, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

switch (cmd) {
  case "dev":
    run("vite", ["dev"]);
    break;
  case "build":
    run("vite", ["build"]);
    break;
  case "deploy":
    run("wrangler", ["pages", "deploy", ".vercel/output/static"]);
    break;
  default:
    // i18n-exempt: CLI usage text for developers; not user-facing UI
    console.log("Usage: pnpm configurator <dev|build|deploy>");
    process.exit(1);
}
