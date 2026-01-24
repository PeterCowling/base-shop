#!/usr/bin/env node

/**
 * CI enforcement script for dependency version alignment.
 *
 * Ensures workspace packages declare the same version of core dependencies
 * as the root package.json. Peer dependencies are intentionally skipped
 * (packages use ranges like ">=19 <20" to express compatibility).
 *
 * Exit codes:
 *   0 — all core deps aligned
 *   1 — at least one core dep mismatch found
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

/** Core deps — CI fails on mismatch */
const CORE_DEPS = ["react", "react-dom", "zod", "next", "prisma", "@prisma/client"];

/** Warn-only deps — CI warns but does not fail */
const WARN_DEPS = ["eslint", "prettier", "typescript", "@types/react", "@types/react-dom"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function findWorkspacePackageJsons(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
    const full = join(dir, entry);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      const pkgPath = join(full, "package.json");
      const pkgStat = statSync(pkgPath, { throwIfNoEntry: false });
      if (pkgStat?.isFile()) {
        results.push(pkgPath);
      }
      // Only recurse one level into apps/ and packages/
    }
  }
  return results;
}

function getCanonicalVersions(rootPkg) {
  const versions = {};
  const allDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
  for (const dep of [...CORE_DEPS, ...WARN_DEPS]) {
    if (allDeps[dep]) {
      versions[dep] = allDeps[dep];
    }
  }
  return versions;
}

/**
 * Strip semver range prefixes (^, ~, >=, >, =) to get the base version.
 * e.g., "^15.3.8" → "15.3.8", ">=10.27.0" → "10.27.0"
 */
function baseVersion(version) {
  return version.replace(/^[~^>=]+/, "");
}

/**
 * Two version declarations are "aligned" if they resolve to the same
 * base version (ignoring ^ / ~ / >= prefixes).
 */
function versionsAligned(declared, canonical) {
  return baseVersion(declared) === baseVersion(canonical);
}

function checkPackage(pkgPath, canonical, errors, warnings) {
  const pkg = readJson(pkgPath);
  const rel = relative(ROOT, pkgPath);
  const sections = ["dependencies", "devDependencies"];

  for (const section of sections) {
    const deps = pkg[section];
    if (!deps) continue;

    for (const dep of CORE_DEPS) {
      if (!deps[dep] || !canonical[dep]) continue;
      if (!versionsAligned(deps[dep], canonical[dep])) {
        errors.push({
          file: rel,
          dep,
          declared: deps[dep],
          expected: canonical[dep],
        });
      }
    }

    for (const dep of WARN_DEPS) {
      if (!deps[dep] || !canonical[dep]) continue;
      if (!versionsAligned(deps[dep], canonical[dep])) {
        warnings.push({
          file: rel,
          dep,
          declared: deps[dep],
          expected: canonical[dep],
        });
      }
    }
  }
}

// Main
const rootPkg = readJson(join(ROOT, "package.json"));
const canonical = getCanonicalVersions(rootPkg);

const errors = [];
const warnings = [];

// Scan apps/ and packages/
for (const dir of ["apps", "packages"]) {
  const dirPath = join(ROOT, dir);
  const stat = statSync(dirPath, { throwIfNoEntry: false });
  if (!stat?.isDirectory()) continue;
  const pkgPaths = findWorkspacePackageJsons(dirPath);
  for (const pkgPath of pkgPaths) {
    checkPackage(pkgPath, canonical, errors, warnings);
  }
}

// Report
if (warnings.length > 0) {
  console.warn("\n⚠️  Dependency version warnings (non-blocking):\n");
  for (const w of warnings) {
    console.warn(`  ${w.file}: ${w.dep} declares "${w.declared}" (expected "${w.expected}")`);
  }
}

if (errors.length > 0) {
  console.error("\n❌ Core dependency version mismatches (blocking):\n");
  for (const e of errors) {
    console.error(`  ${e.file}: ${e.dep} declares "${e.declared}" (expected "${e.expected}")`);
  }
  console.error(`\n${errors.length} core dep mismatch(es) found. Update package.json files to match root.\n`);
  process.exit(1);
} else {
  console.log("\n✅ All core dependency versions are aligned.\n");
}
