#!/usr/bin/env node

const { spawnSync } = require("child_process");

const allowBroadTests = process.env.BASESHOP_ALLOW_BROAD_TESTS === "1";

if (!allowBroadTests) {
  console.error("BLOCKED: Root `pnpm test` is disabled by default in Base-Shop.");
  console.error("Reason: it fans out across the monorepo and can overwhelm local machines.");
  console.error("");
  console.error("Use one of these instead:");
  console.error("  - pnpm test:affected");
  console.error("  - pnpm --filter <pkg> test -- path/to/file.test.ts");
  console.error("  - BASESHOP_ALLOW_BROAD_TESTS=1 pnpm test:all");
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "turbo", "run", "test"], {
  stdio: "inherit",
  env: {
    ...process.env,
    CI: process.env.CI ?? "true",
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
