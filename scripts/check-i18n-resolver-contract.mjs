#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const USAGE = `Usage:
  node scripts/check-i18n-resolver-contract.mjs [options]

Options:
  --repo-root <path>       Repo root (default: current working directory)
  --webpack-apps <list>    Comma-separated: template-app,business-os
  --skip-webpack           Skip webpack build checks (template-app, business-os)
  --skip-brikette          Skip Brikette build-lifecycle check
  --skip-node              Skip Node import probes from template-app
  --dry-run                List surfaces without running them (for testing)
  -h, --help               Show this help

Surfaces:
  webpack:template-app          pnpm build via @acme/template-app (webpack)
  webpack:business-os           pnpm build via @apps/business-os (webpack)
  build-lifecycle:brikette      pnpm build via @apps/brikette (Turbopack lifecycle: pre+build+post)
  node:template-app-root-import Node ESM import probe for @acme/i18n
  node:template-app-locales-import Node ESM import probe for @acme/i18n/locales

Examples:
  node scripts/check-i18n-resolver-contract.mjs
  node scripts/check-i18n-resolver-contract.mjs --webpack-apps template-app,business-os
  node scripts/check-i18n-resolver-contract.mjs --skip-webpack --skip-node
  node scripts/check-i18n-resolver-contract.mjs --dry-run
`;

const WEBPACK_APP_FILTERS = Object.freeze({
  "template-app": "@acme/template-app",
  "business-os": "@apps/business-os",
});

const TEMPLATE_APP_WEBPACK_PREREQS = Object.freeze(["@acme/ui"]);

function dieUsage(message) {
  process.stderr.write(`ERROR: ${message}\n\n${USAGE}`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = {
    repoRoot: process.cwd(),
    webpackApps: ["template-app", "business-os"],
    skipWebpack: false,
    skipBrikette: false,
    skipNode: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    }
    if (arg === "--repo-root") {
      const value = argv[i + 1];
      if (!value) dieUsage("missing value for --repo-root");
      out.repoRoot = path.resolve(value);
      i += 1;
      continue;
    }
    if (arg === "--webpack-apps") {
      const value = argv[i + 1];
      if (!value) dieUsage("missing value for --webpack-apps");
      const selected = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (selected.length === 0) {
        dieUsage("no webpack apps selected");
      }
      // brikette has migrated from webpack to build-lifecycle surface
      const migrated = selected.filter((item) => item === "brikette");
      if (migrated.length > 0) {
        process.stderr.write(
          `WARN: 'brikette' has migrated from webpack to build-lifecycle surface and is ignored in --webpack-apps\n`,
        );
      }
      const remaining = selected.filter((item) => item !== "brikette");
      const invalid = remaining.filter((item) => !(item in WEBPACK_APP_FILTERS));
      if (invalid.length > 0) {
        dieUsage(
          `invalid app(s) in --webpack-apps: ${invalid.join(", ")} (valid: ${Object.keys(WEBPACK_APP_FILTERS).join(", ")})`,
        );
      }
      out.webpackApps = remaining;
      i += 1;
      continue;
    }
    if (arg === "--skip-webpack") {
      out.skipWebpack = true;
      continue;
    }
    if (arg === "--skip-brikette") {
      out.skipBrikette = true;
      continue;
    }
    if (arg === "--skip-node") {
      out.skipNode = true;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    dieUsage(`unknown argument: ${arg}`);
  }

  return out;
}

function runStep({ label, command, args, cwd, dryRun }) {
  if (dryRun) {
    process.stdout.write(`[resolver-contract] DRY-RUN ${label}\n`);
    return true;
  }
  process.stdout.write(`\n[resolver-contract] RUN ${label}\n`);
  process.stdout.write(`[resolver-contract] CMD ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(`\n[resolver-contract] FAIL ${label} (exit ${result.status ?? "unknown"})\n`);
    return false;
  }
  process.stdout.write(`[resolver-contract] PASS ${label}\n`);
  return true;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const templateAppDir = path.join(options.repoRoot, "packages/template-app");

  if (!options.skipWebpack) {
    if (options.webpackApps.includes("template-app")) {
      for (const filter of TEMPLATE_APP_WEBPACK_PREREQS) {
        const ok = runStep({
          label: `webpack-prereq:${filter}`,
          command: "pnpm",
          args: ["--filter", filter, "build"],
          cwd: options.repoRoot,
          dryRun: options.dryRun,
        });
        if (!ok) process.exit(1);
      }
    }

    for (const appId of options.webpackApps) {
      const filter = WEBPACK_APP_FILTERS[appId];
      const ok = runStep({
        label: `webpack:${appId}`,
        command: "pnpm",
        args: ["--filter", filter, "build"],
        cwd: options.repoRoot,
        dryRun: options.dryRun,
      });
      if (!ok) process.exit(1);
    }
  } else {
    process.stdout.write("[resolver-contract] SKIP webpack surface\n");
  }

  if (!options.skipBrikette) {
    const ok = runStep({
      label: "build-lifecycle:brikette",
      command: "pnpm",
      args: ["--filter", "@apps/brikette", "build"],
      cwd: options.repoRoot,
      dryRun: options.dryRun,
    });
    if (!ok) process.exit(1);
  } else {
    process.stdout.write("[resolver-contract] SKIP brikette surface\n");
  }

  if (!options.skipNode) {
    const rootImportOk = runStep({
      label: "node:template-app-root-import",
      command: process.execPath,
      args: [
        "-e",
        "import('@acme/i18n').then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); })",
      ],
      cwd: templateAppDir,
      dryRun: options.dryRun,
    });
    if (!rootImportOk) process.exit(1);

    const subpathImportOk = runStep({
      label: "node:template-app-locales-import",
      command: process.execPath,
      args: [
        "-e",
        "import('@acme/i18n/locales').then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); })",
      ],
      cwd: templateAppDir,
      dryRun: options.dryRun,
    });
    if (!subpathImportOk) process.exit(1);
  } else {
    process.stdout.write("[resolver-contract] SKIP node surface\n");
  }

  process.stdout.write("\n[resolver-contract] PASS all configured surfaces\n");
}

main();
