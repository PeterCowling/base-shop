import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { envSchema } from "@config/src/env";

const shopId = process.argv[2];
if (!shopId) {
    console.error("Usage: pnpm ts-node scripts/setup-ci.ts <shopId>"); // i18n-exempt -- ENG-2001 developer-facing usage hint for CLI script [ttl=2026-12-31]
    process.exit(1);
}

// Map well-known shop IDs to their app slugs. For example, the legacy BCD
// storefront lives under `apps/cover-me-pretty` rather than `apps/shop-bcd`.
const appSlug = shopId === "bcd" ? "cover-me-pretty" : `shop-${shopId}`;
const appPackage = `@apps/${appSlug}`;

const envPath = join("apps", appSlug, ".env");
// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: envPath is workspace-relative and derived from a trusted app slug, not HTTP input
if (!existsSync(envPath)) {
    console.error(`Missing ${envPath}`); // i18n-exempt -- ENG-2001 developer-facing missing env file message [ttl=2026-12-31]
    process.exit(1);
}
// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: envPath is workspace-relative and derived from a trusted app slug, not HTTP input
const envRaw = readFileSync(envPath, "utf8");
const env = {};
for (const line of envRaw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#"))
        continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=");
}
try {
    Object.keys(env).forEach((k) => {
        if (env[k] === "")
            delete env[k];
    });
    envSchema.parse(env);
}
catch (err) {
    console.error("Invalid environment variables:\n", err); // i18n-exempt -- ENG-2001 developer-facing env validation error label [ttl=2026-12-31]
    process.exit(1);
}
const shopConfigPath = join("data", "shops", shopId, "shop.json");
const domainVars = {};
// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: shopConfigPath is workspace-relative; script is CLI-only and not exposed to HTTP input
if (existsSync(shopConfigPath)) {
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: shopConfigPath is workspace-relative; script is CLI-only and not exposed to HTTP input
        const shop = JSON.parse(readFileSync(shopConfigPath, "utf8"));
        if (shop.domain && shop.domain.name) {
            domainVars.SHOP_DOMAIN = shop.domain.name;
        }
    }
    catch { }
}
const settingsPath = join("data", "shops", shopId, "settings.json");
const workerVars = {};
// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: settingsPath is workspace-relative; script is CLI-only and not exposed to HTTP input
if (existsSync(settingsPath)) {
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: settingsPath is workspace-relative; script is CLI-only and not exposed to HTTP input
        const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
        if (typeof (settings === null || settings === void 0 ? void 0 : settings.reverseLogisticsService) === "object" &&
            typeof (settings === null || settings === void 0 ? void 0 : settings.reverseLogisticsService.enabled) === "boolean") {
            workerVars.REVERSE_LOGISTICS_ENABLED = String(settings.reverseLogisticsService.enabled);
        }
    }
    catch { }
}
const allEnv = Object.assign(Object.assign(Object.assign({}, env), domainVars), workerVars);
const envLines = Object.entries(allEnv)
    .map(([k, v]) => `      ${k}: ${v}`)
    .join("\n");
const wfPath = join(".github", "workflows", `${appSlug}.yml`);
const branchRef = "${{ github.ref_name }}";
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
      - run: pnpm --filter ${appPackage} build
      - run: npx @cloudflare/next-on-pages deploy \\
               --project-name=${appSlug} \\
               --branch=${branchRef}
`;
// eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2001: wfPath is workspace-relative under .github/workflows; script is CLI-only
writeFileSync(wfPath, workflow);
console.log(`Created workflow ${wfPath}`);
