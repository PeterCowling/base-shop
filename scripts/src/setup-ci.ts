// scripts/src/setup-ci.ts
/**
 * Generate a GitHub Actions workflow for a specific shop.  The workflow reads
 * environment variables from the shop's `.env` file and embeds them into the
 * CI configuration used by the CMS. The environment schema is imported from
 * `@config` to validate the variables before generating the workflow.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { envSchema } from "@config/src/env";

const shopId = process.argv[2];
if (!shopId) {
  console.error("Usage: pnpm ts-node scripts/setup-ci.ts <shopId>");
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

try {
  // Remove empty string values before validation.
  Object.keys(env).forEach((k) => {
    if (env[k] === "") delete env[k];
  });
  envSchema.parse(env);
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

const shopConfigPath = join("data", "shops", shopId, "shop.json");
const domainVars: Record<string, string> = {};
if (existsSync(shopConfigPath)) {
  try {
    const shop = JSON.parse(readFileSync(shopConfigPath, "utf8")) as {
      domain?: { name?: string };
    };
    if (shop.domain?.name) {
      domainVars.SHOP_DOMAIN = shop.domain.name;
    }
  } catch {
    // ignore errors reading shop config
  }
}

const settingsPath = join("data", "shops", shopId, "settings.json");
const workerVars: Record<string, string> = {};
if (existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
      reverseLogisticsService?: { enabled?: boolean };
    };
    if (typeof settings.reverseLogisticsService?.enabled === "boolean") {
      workerVars.REVERSE_LOGISTICS_ENABLED = String(
        settings.reverseLogisticsService.enabled
      );
    }
  } catch {
    // ignore errors reading settings
  }
}
const allEnv = { ...env, ...domainVars, ...workerVars };
const envLines = Object.entries(allEnv)
  .map(([k, v]) => `      ${k}: ${v}`)
  .join("\n");

const wfPath = join(".github", "workflows", `shop-${shopId}.yml`);
const workflow = `on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
${envLines}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm lint && pnpm test
      - run: pnpm --filter @apps/shop-${shopId} build
      - run: npx @cloudflare/next-on-pages deploy \
               --project-name=shop-${shopId} \
               --branch=\${{ github.ref_name }}
`;

writeFileSync(wfPath, workflow);
console.log(`Created workflow ${wfPath}`);
