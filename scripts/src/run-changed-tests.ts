import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import fastGlob from "fast-glob";

interface TestMetadataEntry {
  hash: string;
  lastRun: string;
}

interface TestMetadata {
  [file: string]: TestMetadataEntry;
}

interface RunOptions {
  dir: string;
  filter: string;
  pattern: string;
  cachePath: string;
  force: boolean;
}

const USAGE = `
Usage: pnpm run test:changed -- --dir <package-relative-path> --filter <pnpm-filter> [options]

Options:
  --pattern <glob>     Override the test file glob (defaults to "**/*.{test,spec}.{ts,tsx,js,jsx}")
  --cache <path>       Metadata file to store hashes (default: ".cache/test-status.json")
  --force              Treat every discovered test as changed (useful when rebuilding the cache)
  --seed               Populate the cache without running tests (explicitly skips execution)
`;

async function main() {
  const parsedArgs = parseArgs(process.argv.slice(2));
  if (!parsedArgs.dir || !parsedArgs.filter) {
    console.error("[test-changed] Missing required --dir/--filter arguments.", USAGE);
    process.exit(1);
  }

  const options: RunOptions = {
    dir: parsedArgs.dir,
    filter: parsedArgs.filter,
    pattern: parsedArgs.pattern ?? "**/*.{test,spec}.{ts,tsx,js,jsx}",
    cachePath: parsedArgs.cache ?? ".cache/test-status.json",
    force: parsedArgs.force === "true",
  };
  const seedOnly = parsedArgs.seed === "true";

  const repoRoot = process.cwd();
  const targetDir = path.resolve(repoRoot, options.dir);
  const metadataPath = path.resolve(repoRoot, options.cachePath);

  console.log(`[test-changed] Scanning ${targetDir} for tests (${options.pattern})`);

  const files = await fastGlob(options.pattern, { cwd: targetDir, absolute: true });
  if (files.length === 0) {
    console.log("[test-changed] No test files found, exiting.");
    process.exit(0);
  }

  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  const metadata = await loadMetadata(metadataPath);

  const changedFiles: string[] = [];
  const fileHashes = new Map<string, string>();

  for (const absolutePath of files) {
    const repoRelative = path.relative(repoRoot, absolutePath);
    const fileHash = await hashFile(absolutePath);
    fileHashes.set(absolutePath, fileHash);
    const existing = metadata[repoRelative];
    if (options.force || !existing || existing.hash !== fileHash) {
      changedFiles.push(absolutePath);
    }
  }

  if (changedFiles.length === 0) {
    console.log("[test-changed] No changed tests detected. Cache is up to date.");
    process.exit(0);
  }

  if (seedOnly) {
    console.log(`[test-changed] Seeding cache for ${changedFiles.length} test(s) without running them`);
    for (const absolutePath of changedFiles) {
      const repoRelative = path.relative(repoRoot, absolutePath);
      metadata[repoRelative] = {
        hash: fileHashes.get(absolutePath)!,
        lastRun: new Date().toISOString(),
      };
    }
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log("[test-changed] Cache seeded.");
    process.exit(0);
  }

  console.log(`[test-changed] ${changedFiles.length} changed test(s) detected; running sequentially`);

  for (const absolutePath of changedFiles) {
    const repoRelative = path.relative(repoRoot, absolutePath);
    await runTest(absolutePath, options);
    metadata[repoRelative] = {
      hash: fileHashes.get(absolutePath)!,
      lastRun: new Date().toISOString(),
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  console.log("[test-changed] All changed tests completed.");
}

async function runTest(absolutePath: string, options: RunOptions) {
  const repoRoot = process.cwd();
  const targetDir = path.resolve(repoRoot, options.dir);
  const relativeToDir = path.relative(targetDir, absolutePath).replaceAll(path.sep, "/");

  const args = ["--filter", options.filter, "test", "--", relativeToDir, "--runInBand", "--coverage=false"];

  console.log(`[test-changed] Running: pnpm ${args.join(" ")}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      stdio: "inherit",
      cwd: repoRoot,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed for ${relativeToDir} (exit ${code})`));
      }
    });
  });
}

function parseArgs(raw: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  let currentKey: string | null = null;
  for (const chunk of raw) {
    if (chunk.startsWith("--")) {
      currentKey = chunk.slice(2);
      parsed[currentKey] = "true";
      continue;
    }
    if (!currentKey) continue;
    parsed[currentKey] = chunk;
    currentKey = null;
  }
  return parsed;
}

async function loadMetadata(cachePath: string): Promise<TestMetadata> {
  try {
    const file = await fs.readFile(cachePath, "utf8");
    return JSON.parse(file);
  } catch {
    return {};
  }
}

async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

main().catch((error) => {
  console.error("[test-changed] Error:", error);
  process.exit(1);
});
