import { envSchema } from "@config/src/env";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const shopId = process.argv[2];

if (!shopId) {
  console.error("Usage: pnpm validate-env <shopId>");
  process.exit(1);
}

const envPath = join("apps", `shop-${shopId}", ".env");

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

try {
  envSchema.parse(env);
  console.log("Environment variables look valid.");
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}
