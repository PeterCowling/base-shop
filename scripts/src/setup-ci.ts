import { envSchema } from "@config/src/env";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

try {
  const shopRaw = readFileSync(
    join("data", "shops", shopId, "shop.json"),
    "utf8"
  );
  const shopJson = JSON.parse(shopRaw) as {
    domain?: { name: string; status?: string };
  };
  if (shopJson.domain?.name) {
    env.SHOP_DOMAIN = shopJson.domain.name;
    if (shopJson.domain.status) {
      env.SHOP_DOMAIN_STATUS = shopJson.domain.status;
    }
  }
} catch {
  // ignore missing shop.json
}

const wfPath = join(".github", "workflows", `shop-${shopId}.yml`);
const envLines = Object.entries(env)
  .map(([k, v]) => `      ${k}: ${v}`)
  .join("\n");
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
      - run: npx @cloudflare/next-on-pages deploy \\
               --project-name=shop-${shopId} \\
               --branch=\${{ github.ref_name }}
`;

writeFileSync(wfPath, workflow);
console.log(`Created workflow ${wfPath}`);
