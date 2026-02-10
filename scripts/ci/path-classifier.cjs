#!/usr/bin/env node
// Standalone CI path classifier — zero external dependencies.
// Source of truth: scripts/src/ci/filter-config.ts + path-classifier.ts
// Tests: scripts/__tests__/ci/path-classifier.test.ts
"use strict";

const { readFileSync } = require("node:fs");

// --- Filter configs (mirror of scripts/src/ci/filter-config.ts) ---

const CI_FILTER = {
  shop: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/cms/**",
      "packages/platform-core/**",
      "packages/ui/**",
      "packages/config/**",
      "packages/i18n/**",
      "packages/shared-utils/**",
    ],
    exclude: [],
  },
};

const CI_BOS_FILTER = {
  bos_guarded: {
    include: ["docs/business-os/**"],
    exclude: [
      "docs/business-os/README.md",
      "docs/business-os/business-os-charter.md",
      "docs/business-os/MANUAL_EDITS.md",
      "docs/business-os/scans/**",
      "docs/business-os/strategy/**",
      "docs/business-os/people/**",
    ],
  },
};

const MERGE_GATE_FILTER = {
  github_config: {
    include: [
      ".github/workflows/**",
      ".github/actions/**",
      ".github/dependabot.yml",
      ".github/CODEOWNERS",
    ],
    exclude: [],
  },
  core: {
    include: ["**/*"],
    exclude: [
      "apps/cms/**",
      "apps/skylar/**",
      ".github/workflows/cms.yml",
      ".github/workflows/skylar.yml",
    ],
  },
  cms_deploy: {
    include: [
      "apps/cms/**",
      "packages/config/**",
      "packages/configurator/**",
      "packages/date-utils/**",
      "packages/email/**",
      "packages/email-templates/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/plugins/sanity/**",
      "packages/shared-utils/**",
      "packages/theme/**",
      "packages/telemetry/**",
      "packages/zod-utils/**",
      "packages/themes/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/lib/**",
      "packages/types/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      ".github/workflows/cms.yml",
    ],
    exclude: [],
  },
  cms_e2e: {
    include: [
      "apps/cms/**",
      "packages/config/**",
      "packages/configurator/**",
      "packages/date-utils/**",
      "packages/email/**",
      "packages/email-templates/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/plugins/sanity/**",
      "packages/shared-utils/**",
      "packages/theme/**",
      "packages/telemetry/**",
      "packages/zod-utils/**",
      "packages/themes/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/lib/**",
      "packages/types/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      ".github/workflows/cypress.yml",
    ],
    exclude: [],
  },
  skylar: {
    include: [
      "apps/skylar/**",
      "packages/config/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/shared-utils/**",
      "packages/themes/**",
      "packages/design-tokens/**",
      ".github/workflows/skylar.yml",
    ],
    exclude: [],
  },
  brikette: {
    include: [
      "apps/brikette/**",
      "packages/design-system/**",
      "packages/design-tokens/**",
      "packages/guides-core/**",
      "packages/next-config/**",
      "packages/platform-core/**",
      "packages/telemetry/**",
      "packages/ui/**",
      ".github/workflows/brikette.yml",
      ".github/workflows/reusable-app.yml",
    ],
    exclude: [],
  },
  prime: {
    include: [
      "apps/prime/**",
      "packages/design-system/**",
      "packages/design-tokens/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/themes/**",
      "packages/ui/**",
      ".github/workflows/prime.yml",
    ],
    exclude: [],
  },
  product_pipeline: {
    include: [
      "apps/product-pipeline/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      "packages/themes/**",
      "packages/pipeline-engine/**",
      "packages/ui/**",
      ".github/workflows/product-pipeline.yml",
    ],
    exclude: [],
  },
  storybook: {
    include: [
      "apps/storybook/**",
      "apps/cms/**",
      "apps/cover-me-pretty/**",
      "packages/ui/**",
      "packages/design-tokens/**",
      "packages/tailwind-config/**",
      "packages/themes/**",
      "packages/theme/**",
      "packages/i18n/**",
      "packages/shared-utils/**",
      "packages/config/**",
      "packages/types/**",
      "docs/storybook.md",
      ".github/workflows/storybook.yml",
    ],
    exclude: [],
  },
  consent_analytics: {
    include: [
      "apps/cover-me-pretty/src/app/api/analytics/**",
      "apps/cover-me-pretty/src/app/api/leads/**",
      "packages/platform-core/src/analytics/**",
      "packages/platform-core/src/contexts/CartContext.tsx",
      ".github/workflows/consent-analytics.yml",
    ],
    exclude: [],
  },
  lhci: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/skylar/**",
      ".lighthouseci/**",
      "lighthouserc*.json",
      ".github/workflows/ci-lighthouse.yml",
    ],
    exclude: [],
  },
};

const LIGHTHOUSE_FILTER = {
  shop_skylar: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/skylar/**",
      ".lighthouseci/**",
      "lighthouserc*.json",
      ".github/workflows/ci-lighthouse.yml",
    ],
    exclude: [],
  },
};

const FILTER_CONFIGS = {
  ci_filter: CI_FILTER,
  ci_bos_filter: CI_BOS_FILTER,
  merge_gate: MERGE_GATE_FILTER,
  lighthouse: LIGHTHOUSE_FILTER,
};

// --- Glob matcher ---

function matchGlob(file, pattern) {
  if (pattern === "**/*") return true;

  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return file === prefix || file.startsWith(prefix + "/");
  }

  if (!pattern.includes("*")) return file === pattern;

  // Simple wildcard: "lighthouserc*.json"
  const starIdx = pattern.indexOf("*");
  const prefix = pattern.slice(0, starIdx);
  const suffix = pattern.slice(starIdx + 1);
  return (
    file.startsWith(prefix) &&
    file.endsWith(suffix) &&
    file.length >= prefix.length + suffix.length
  );
}

// --- Classifier ---

function normalizePath(rawPath) {
  return rawPath.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function classifyPaths(changedFiles, config) {
  const normalized = changedFiles.map(normalizePath).filter(Boolean);
  const result = {};

  for (const [filterName, rule] of Object.entries(config)) {
    result[filterName] = normalized.some((file) => {
      const included = rule.include.some((pattern) => matchGlob(file, pattern));
      if (!included) return false;

      if (rule.exclude.length === 0) return true;

      const excluded = rule.exclude.some((pattern) => matchGlob(file, pattern));
      return !excluded;
    });
  }

  return result;
}

// --- CLI ---

function parseArgs(argv) {
  const paths = [];
  let configName = "";
  let format = "json";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;

    if (arg === "--path") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --path");
      paths.push(next);
      i++;
      continue;
    }

    if (arg === "--paths-file") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --paths-file");
      const filePaths = readFileSync(next, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      paths.push(...filePaths);
      i++;
      continue;
    }

    if (arg === "--config") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --config");
      configName = next;
      i++;
      continue;
    }

    if (arg === "--format") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--"))
        throw new Error("Missing value for --format");
      if (next !== "json" && next !== "outputs")
        throw new Error("Invalid --format: " + next);
      format = next;
      i++;
      continue;
    }

    paths.push(arg);
  }

  if (!configName) throw new Error("Missing --config argument");

  return { paths, configName, format };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = FILTER_CONFIGS[args.configName];

  if (!config) {
    throw new Error(
      "Unknown config: " +
        args.configName +
        ". Available: " +
        Object.keys(FILTER_CONFIGS).join(", "),
    );
  }

  const results = classifyPaths(args.paths, config);

  if (args.format === "outputs") {
    for (const [key, value] of Object.entries(results)) {
      console.log(key + "=" + value);
    }
    return;
  }

  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[path-classifier] " + message);
    process.exitCode = 1;
  }
}

module.exports = { classifyPaths, FILTER_CONFIGS, matchGlob };
