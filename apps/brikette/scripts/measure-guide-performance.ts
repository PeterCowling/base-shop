#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001: CLI script reads guide content from known safe paths */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { GuideManifestEntry } from "@acme/guide-system";
import {
  listGuideManifestEntries,
  registerManifestEntries,
  SUPPORTED_LANGUAGES as _SUPPORTED_LANGUAGES,
} from "@acme/guide-system";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

// Token pattern from validate-guide-links.ts
const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;

type PerformanceReport = {
  timestamp: string;
  operations: {
    manifestParse: {
      durationMs: number;
      entryCount: number;
    };
    contentBundleLoad: {
      durationMs: number;
      guideKey: string;
      locale: string;
      sizeBytes: number;
    };
    linkValidation: {
      durationMs: number;
      localesProcessed: number;
      filesScanned: number;
      tokensExtracted: number;
    };
  };
};

/**
 * Load guide manifest from the JSON snapshot
 */
function loadManifestFromSnapshot(): GuideManifestEntry[] {
  const snapshotPath = path.join(APP_ROOT, "src", "data", "guides", "guide-manifest-snapshot.json");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- GS-001
  const snapshot = require(snapshotPath) as { entries: GuideManifestEntry[] };
  return snapshot.entries;
}

/**
 * Extract all link tokens from content string
 */
function extractTokens(content: string): number {
  const regex = new RegExp(TOKEN_PATTERN);
  let count = 0;
  let _match;
  while ((_match = regex.exec(content)) !== null) {
    count++;
  }
  return count;
}

/**
 * Recursively extract all string values from content JSON
 */
function extractStringsFromContent(obj: unknown): string[] {
  const strings: string[] = [];

  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings.push(...extractStringsFromContent(item));
    }
  } else if (obj && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      strings.push(...extractStringsFromContent(value));
    }
  }

  return strings;
}

/**
 * Measure manifest parse time
 */
function measureManifestParse(): PerformanceReport["operations"]["manifestParse"] {
  const start = performance.now();
  const entries = loadManifestFromSnapshot();
  registerManifestEntries(entries);
  const end = performance.now();

  return {
    durationMs: end - start,
    entryCount: entries.length,
  };
}

/**
 * Measure content bundle load time for a single guide
 */
async function measureContentBundleLoad(
  locale: string,
  guideKey: string,
): Promise<PerformanceReport["operations"]["contentBundleLoad"]> {
  const contentPath = path.join(LOCALES_ROOT, locale, "guides", "content", `${guideKey}.json`);

  const start = performance.now();
  const rawContent = await readFile(contentPath, "utf8");
  const _content = JSON.parse(rawContent) as unknown;
  const end = performance.now();

  return {
    durationMs: end - start,
    guideKey,
    locale,
    sizeBytes: Buffer.byteLength(rawContent, "utf8"),
  };
}

/**
 * Measure link validation runtime across all EN content
 */
async function measureLinkValidation(): Promise<PerformanceReport["operations"]["linkValidation"]> {
  const locale = "en";
  const guidesContentDir = path.join(LOCALES_ROOT, locale, "guides", "content");

  let filesScanned = 0;
  let tokensExtracted = 0;

  const start = performance.now();

  // Get all manifest entries to iterate over guide keys
  const entries = listGuideManifestEntries();

  for (const entry of entries) {
    const contentPath = path.join(guidesContentDir, `${entry.key}.json`);

    try {
      const rawContent = await readFile(contentPath, "utf8");
      const content = JSON.parse(rawContent) as unknown;
      const strings = extractStringsFromContent(content);
      const contentText = strings.join("\n");
      const tokenCount = extractTokens(contentText);

      filesScanned++;
      tokensExtracted += tokenCount;
    } catch {
      // Skip files that don't exist or can't be parsed
      continue;
    }
  }

  const end = performance.now();

  return {
    durationMs: end - start,
    localesProcessed: 1,
    filesScanned,
    tokensExtracted,
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    operations: {
      manifestParse: { durationMs: 0, entryCount: 0 },
      contentBundleLoad: { durationMs: 0, guideKey: "", locale: "", sizeBytes: 0 },
      linkValidation: { durationMs: 0, localesProcessed: 0, filesScanned: 0, tokensExtracted: 0 },
    },
  };

  // 1. Measure manifest parse time
  console.error("Measuring manifest parse time...");
  report.operations.manifestParse = measureManifestParse();

  // 2. Measure content bundle load time (pick first available guide)
  console.error("Measuring content bundle load time...");
  const entries = listGuideManifestEntries();
  if (entries.length > 0) {
    const firstGuide = entries[0];
    report.operations.contentBundleLoad = await measureContentBundleLoad("en", firstGuide.key);
  }

  // 3. Measure link validation runtime
  console.error("Measuring link validation runtime...");
  report.operations.linkValidation = await measureLinkValidation();

  // Output JSON report to stdout
  console.info(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Fatal error during performance measurement:");
  console.error(error);
  process.exitCode = 1;
});
