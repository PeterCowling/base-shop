import { envSchema } from "@config/src/env";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readShopDomainSync } from "@platform-core/src/shops";

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
  Object.keys(env).forEach((k) => {
    if (env[k] === "") delete env[k];
  });
  envSchema.parse(env);
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

const domain = readShopDomainSync(shopId)?.domain;

const wfPath = join(".github", "workflows", `shop-${shopId}.yml`);
const workflow = `on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    env:${domain ? `\n      SHOP_DOMAIN: ${domain}` : ""}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm lint && pnpm test
      - run: pnpm --filter @apps/shop-${shopId} build
      - run: npx @cloudflare/next-on-pages deploy \\
               --project-name=shop-${shopId} \\
               --branch=\\${{ github.ref_name }}
`;

writeFileSync(wfPath, workflow);
console.log(`Created workflow ${wfPath}`);

