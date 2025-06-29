"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var env_1 = require("@acme/config/env");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var shopId = process.argv[2];
if (!shopId) {
    console.error("Usage: pnpm ts-node scripts/setup-ci.ts <shopId>");
    process.exit(1);
}
var envPath = (0, node_path_1.join)("apps", "shop-".concat(shopId), ".env");
if (!(0, node_fs_1.existsSync)(envPath)) {
    console.error("Missing ".concat(envPath));
    process.exit(1);
}
var envRaw = (0, node_fs_1.readFileSync)(envPath, "utf8");
var env = {};
for (var _i = 0, _a = envRaw.split(/\n+/); _i < _a.length; _i++) {
    var line = _a[_i];
    var trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#"))
        continue;
    var _b = trimmed.split("="), key = _b[0], rest = _b.slice(1);
    env[key] = rest.join("=");
}
try {
    env_1.envSchema.parse(env);
}
catch (err) {
    console.error("Invalid environment variables:\n", err);
    process.exit(1);
}
var wfPath = (0, node_path_1.join)(".github", "workflows", "shop-".concat(shopId, ".yml"));
var workflow = "on: [push]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pnpm/action-setup@v3\n      - run: pnpm install\n      - run: pnpm lint && pnpm test\n      - run: pnpm --filter @apps/shop-".concat(shopId, " build\n      - run: npx @cloudflare/next-on-pages deploy                --project-name=shop-").concat(shopId, "                --branch=${{ github.ref_name }}\n");
(0, node_fs_1.writeFileSync)(wfPath, workflow);
console.log("Created workflow ".concat(wfPath));
