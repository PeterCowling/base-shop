#!/usr/bin/env tsx
/**
 * Test Related Files
 *
 * Runs Jest's --findRelatedTests to test files affected by given source files.
 * This is useful when you've modified a file and want to run only the tests
 * that could be affected by that change.
 *
 * Usage:
 *   pnpm test:related packages/ui/src/Button.tsx
 *   pnpm test:related src/utils/helpers.ts src/hooks/useAuth.ts
 *
 * Options:
 *   --coverage    Include coverage report
 *   --watch       Run in watch mode
 *   --verbose     Verbose output
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);

// Separate flags from file paths
const flags: string[] = [];
const files: string[] = [];

for (const arg of args) {
  if (arg.startsWith("--")) {
    flags.push(arg);
  } else {
    // Resolve to absolute path
    const resolved = path.resolve(arg);
    if (fs.existsSync(resolved)) {
      files.push(resolved);
    } else {
      console.error(`File not found: ${arg}`);
      process.exit(1);
    }
  }
}

if (files.length === 0) {
  console.error("Usage: pnpm test:related <file1> [file2] [...] [--coverage] [--watch]");
  console.error("");
  console.error("Examples:");
  console.error("  pnpm test:related packages/ui/src/Button.tsx");
  console.error("  pnpm test:related src/utils/helpers.ts --coverage");
  process.exit(1);
}

// Determine which workspace package the files belong to
// This helps us run tests in the right context
function findPackageRoot(filePath: string): string | null {
  let dir = path.dirname(filePath);
  while (dir !== "/") {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

// Group files by their package root
const filesByPackage = new Map<string, string[]>();
for (const file of files) {
  const pkgRoot = findPackageRoot(file);
  const key = pkgRoot || process.cwd();
  if (!filesByPackage.has(key)) {
    filesByPackage.set(key, []);
  }
  filesByPackage.get(key)!.push(file);
}

// Build Jest command
const hasWatch = flags.some((flag) =>
  flag === "-w" || flag === "--watch" || flag.startsWith("--watch")
);
const sanitizedFlags = flags.filter((flag) => {
  if (flag === "--runInBand") return false;
  if (flag === "--maxWorkers") return false;
  if (flag.startsWith("--maxWorkers=")) return false;
  return true;
});
const concurrencyArgs = hasWatch ? ["--maxWorkers=2"] : ["--runInBand"];
const jestArgs = [
  "jest",
  "--findRelatedTests",
  ...files,
  "--passWithNoTests",
  ...concurrencyArgs,
  // Relax coverage thresholds for targeted runs
  ...sanitizedFlags,
];

// Set environment to relax coverage for partial runs
const env = {
  ...process.env,
  CI: "true",
  JEST_ALLOW_PARTIAL_COVERAGE: "1",
};

console.log(`\nRunning tests related to ${files.length} file(s):\n`);
files.forEach((f) => console.log(`  - ${path.relative(process.cwd(), f)}`));
console.log("");

const child = spawn("pnpm", jestArgs, {
  stdio: "inherit",
  env,
  cwd: process.cwd(),
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
