#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(__dirname, "../../../../..");
const appRoot = path.join(repoRoot, "apps", "caryina");
const nextBuildDir = path.join(appRoot, ".next");

const reportPath = path.join(__dirname, "bundle-budget-report.json");
const baselinePath = path.join(__dirname, "bundle-budget-baseline.json");
const BUDGET_BYTES = 5120;

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectJsEntries() {
  const entrySet = new Set();

  const buildManifest = readJson(path.join(nextBuildDir, "build-manifest.json"));
  if (buildManifest?.pages) {
    for (const key of ["/", "/_app", "/_error"]) {
      const files = buildManifest.pages[key] || [];
      for (const file of files) {
        if (typeof file === "string" && file.endsWith(".js")) {
          entrySet.add(file);
        }
      }
    }
  }

  const appBuildManifest = readJson(path.join(nextBuildDir, "app-build-manifest.json"));
  if (appBuildManifest?.pages) {
    for (const key of ["/layout", "/page"]) {
      const files = appBuildManifest.pages[key] || [];
      for (const file of files) {
        if (typeof file === "string" && file.endsWith(".js")) {
          entrySet.add(file);
        }
      }
    }
  }

  if (entrySet.size > 0) {
    return [...entrySet];
  }

  const chunkDir = path.join(nextBuildDir, "static", "chunks");
  if (!fs.existsSync(chunkDir)) {
    return [];
  }

  return fs
    .readdirSync(chunkDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join("static", "chunks", file));
}

function gzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content, { level: 9 }).length;
}

function main() {
  if (!fs.existsSync(nextBuildDir)) {
    throw new Error(`Missing Next build output at ${nextBuildDir}. Run: pnpm --filter @apps/caryina build`);
  }

  const entries = collectJsEntries();
  if (entries.length === 0) {
    throw new Error(`No JS chunk entries found in ${nextBuildDir}`);
  }

  const chunks = [];
  for (const entry of entries) {
    const absolutePath = path.join(nextBuildDir, entry);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const gzipBytes = gzipSize(absolutePath);
    chunks.push({
      chunk: entry,
      gzipBytes,
    });
  }

  if (chunks.length === 0) {
    throw new Error("No measurable JS chunks found for bundle budget calculation.");
  }

  const currentTotalGzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
  const baseline = readJson(baselinePath);

  let baselineTotalGzipBytes = currentTotalGzipBytes;
  let baselineMode = "initialized";

  if (baseline?.totalGzipBytes && Number.isFinite(baseline.totalGzipBytes)) {
    baselineTotalGzipBytes = baseline.totalGzipBytes;
    baselineMode = "existing";
  } else {
    const baselinePayload = {
      generatedAt: new Date().toISOString(),
      totalGzipBytes: currentTotalGzipBytes,
      chunks,
      note: "Initialized from first measured caryina build output.",
    };
    fs.writeFileSync(baselinePath, `${JSON.stringify(baselinePayload, null, 2)}\n`);
  }

  const featureDeltaGzipBytes = currentTotalGzipBytes - baselineTotalGzipBytes;
  const withinBudget = featureDeltaGzipBytes <= BUDGET_BYTES;

  const report = {
    generatedAt: new Date().toISOString(),
    buildDir: nextBuildDir,
    baselineMode,
    baselinePath,
    budgetBytes: BUDGET_BYTES,
    measuredChunkCount: chunks.length,
    currentTotalGzipBytes,
    baselineTotalGzipBytes,
    featureDeltaGzipBytes,
    withinBudget,
    chunks,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        reportPath,
        baselinePath,
        currentTotalGzipBytes,
        baselineTotalGzipBytes,
        featureDeltaGzipBytes,
        withinBudget,
      },
      null,
      2
    )
  );

  if (!withinBudget) {
    process.exit(1);
  }
}

main();
