#!/usr/bin/env tsx
/**
 * GSC URL Inspection batch script for Brikette.
 *
 * Purpose: Batch-inspect a list of URLs against the Google Search Console
 * URL Inspection API and write results to a monitoring JSON file. Used for
 * the every-other-day indexation monitoring cadence (Phase A → B transition).
 *
 * Usage (run from repo root):
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts urls.json
 *   cat urls.json | tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts urls.json --dry-run
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts urls.json --output path/to/run.json
 *
 * Input formats accepted:
 *   - JSON array of strings: ["https://...", "https://..."]
 *   - JSON array of objects with "url" field: [{"url": "...", "bucket": "..."}]
 *
 * Output:
 *   docs/plans/brikette-seo-api-optimization-loop/monitoring/run-<YYYY-MM-DD>.json
 *   (or --output path)
 *
 * Auth: .secrets/ga4/brikette-web-2b73459e229a.json (service account)
 * Rate limit: 2,000 URL inspections/day; warns when input > 1,800
 * GSC property: sc-domain:hostel-positano.com
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
  DEFAULT_SA_KEY_PATH,
  getAccessToken,
  GSC_SCOPE_READONLY,
  loadServiceAccount,
} from "./gsc-auth";

const GSC_SITE_URL = "sc-domain:hostel-positano.com";
const QUOTA_WARN_THRESHOLD = 1800;

type IndexStatusResult = {
  verdict?: string;
  coverageState?: string;
  robotsTxtState?: string;
  indexingState?: string;
  lastCrawlTime?: string | null;
  pageFetchState?: string;
  googleCanonical?: string | null;
  userCanonical?: string | null;
  sitemap?: string[];
  referringUrls?: string[];
  crawledAs?: string;
};

type RichResultsDetectedItem = {
  richResultType?: string;
  items?: Array<{ name?: string; value?: string }>;
};

type RichResultsResult = {
  verdict?: string;
  detectedItems?: RichResultsDetectedItem[];
};

type InspectUrlResponse = {
  inspectionResult?: {
    indexStatusResult?: IndexStatusResult;
    richResultsResult?: RichResultsResult;
    inspectionResultLink?: string;
  };
};

type UrlEntry = {
  url: string;
  bucket?: string;
};

type InspectionResult = {
  url: string;
  bucket?: string;
  coverageState: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  verdict: string | null;
  indexingState: string | null;
  robotsTxtState: string | null;
  pageFetchState: string | null;
  sitemap: string[];
  richResultsVerdict: string | null;
  richResultsDetectedTypes: string[];
  articleStructuredDataValid: boolean | null;
  timestamp: string;
  error?: string;
};

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseUrlInput(raw: string): UrlEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Input is not valid JSON. Expected a JSON array of strings or objects with 'url' field.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Input must be a JSON array.");
  }

  return parsed.map((item: unknown, i: number): UrlEntry => {
    if (typeof item === "string") {
      const url = item.trim();
      if (!url) throw new Error(`Empty URL at index ${i}`);
      return { url };
    }
    if (typeof item === "object" && item !== null && "url" in item) {
      const obj = item as Record<string, unknown>;
      const url = typeof obj["url"] === "string" ? obj["url"].trim() : "";
      if (!url) throw new Error(`Empty or missing 'url' field at index ${i}`);
      return {
        url,
        ...(typeof obj["bucket"] === "string" ? { bucket: obj["bucket"] } : {}),
      };
    }
    throw new Error(`Invalid entry at index ${i}: expected string or object with 'url' field`);
  });
}

async function inspectUrl(
  token: string,
  siteUrl: string,
  inspectionUrl: string,
): Promise<{ indexStatus: IndexStatusResult | null; richResults: RichResultsResult | null }> {
  const endpoint = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
  const body = {
    inspectionUrl,
    siteUrl,
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    throw new RateLimitError(`Rate limit hit inspecting ${inspectionUrl}: ${resp.status} ${await resp.text()}`);
  }

  if (!resp.ok) {
    throw new Error(`URL Inspection API error for ${inspectionUrl}: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as InspectUrlResponse;
  return {
    indexStatus: data?.inspectionResult?.indexStatusResult ?? null,
    richResults: data?.inspectionResult?.richResultsResult ?? null,
  };
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function getOutputPath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  const today = new Date().toISOString().slice(0, 10);
  const monitoringDir = path.resolve(
    __dirname,
    "../../../docs/plans/brikette-seo-api-optimization-loop/monitoring",
  );
  return path.join(monitoringDir, `run-${today}.json`);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  const inputFilePath = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined;
  const customOutput = parseArg("--output");
  const isDryRun = hasFlag("--dry-run");
  const saKeyPath = parseArg("--sa-key") ?? DEFAULT_SA_KEY_PATH;

  // Read URL input
  let rawInput: string;
  if (inputFilePath) {
    try {
      rawInput = fs.readFileSync(inputFilePath, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error reading input file "${inputFilePath}": ${msg}\n`);
      process.exit(1);
    }
  } else {
    // Check if stdin is a TTY (no data piped)
    if (process.stdin.isTTY) {
      process.stderr.write("Usage: gsc-url-inspection-batch.ts <urls.json> [--dry-run] [--output path]\n");
      process.stderr.write("       cat urls.json | gsc-url-inspection-batch.ts [--dry-run]\n");
      process.exit(1);
    }
    rawInput = await readStdin();
  }

  // Parse URLs
  let entries: UrlEntry[];
  try {
    entries = parseUrlInput(rawInput);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Input parse error: ${msg}\n`);
    process.exit(1);
  }

  if (entries.length === 0) {
    process.stderr.write("No URLs to inspect.\n");
    process.exit(1);
  }

  // Quota warning
  if (entries.length > QUOTA_WARN_THRESHOLD) {
    process.stderr.write(
      `Warning: ${entries.length} URLs exceeds advisory threshold of ${QUOTA_WARN_THRESHOLD}/day ` +
      `(GSC quota: 2,000/day). Proceeding but monitor daily usage.\n`,
    );
  }

  const outputPath = getOutputPath(customOutput);

  if (isDryRun) {
    process.stdout.write(`Dry run mode: would inspect ${entries.length} URLs\n`);
    process.stdout.write(`Output would be written to: ${outputPath}\n`);
    process.stdout.write(`Site: ${GSC_SITE_URL}\n`);
    process.stdout.write(`URLs:\n`);
    for (const entry of entries) {
      process.stdout.write(`  ${entry.bucket ? `[${entry.bucket}] ` : ""}${entry.url}\n`);
    }
    process.exit(0);
  }

  // Load SA and get token
  let token: string;
  try {
    const sa = loadServiceAccount(saKeyPath);
    token = await getAccessToken(sa, GSC_SCOPE_READONLY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Auth failure: ${msg}\n`);
    process.exit(1);
  }

  // Inspect each URL
  const timestamp = new Date().toISOString();
  const results: InspectionResult[] = [];
  let errorCount = 0;
  let rateLimitHit = false;

  for (const entry of entries) {
    if (rateLimitHit) {
      // After rate limit, mark remaining as skipped
      results.push({
        url: entry.url,
        ...(entry.bucket ? { bucket: entry.bucket } : {}),
        coverageState: null,
        lastCrawlTime: null,
        googleCanonical: null,
        userCanonical: null,
        verdict: null,
        indexingState: null,
        robotsTxtState: null,
        pageFetchState: null,
        sitemap: [],
        richResultsVerdict: null,
        richResultsDetectedTypes: [],
        articleStructuredDataValid: null,
        timestamp,
        error: "Skipped: rate limit hit earlier in batch",
      });
      continue;
    }

    try {
      const { indexStatus, richResults } = await inspectUrl(token, GSC_SITE_URL, entry.url);
      results.push({
        url: entry.url,
        ...(entry.bucket ? { bucket: entry.bucket } : {}),
        coverageState: indexStatus?.coverageState ?? "URL_IS_UNKNOWN",
        lastCrawlTime: indexStatus?.lastCrawlTime ?? null,
        googleCanonical: indexStatus?.googleCanonical ?? null,
        userCanonical: indexStatus?.userCanonical ?? null,
        verdict: indexStatus?.verdict ?? null,
        indexingState: indexStatus?.indexingState ?? null,
        robotsTxtState: indexStatus?.robotsTxtState ?? null,
        pageFetchState: indexStatus?.pageFetchState ?? null,
        sitemap: indexStatus?.sitemap ?? [],
        richResultsVerdict: richResults?.verdict ?? null,
        richResultsDetectedTypes: richResults?.detectedItems?.map(d => d.richResultType ?? "").filter(Boolean) ?? [],
        articleStructuredDataValid: richResults?.verdict === "PASS" ? true : richResults?.verdict === "FAIL" ? false : null,
        timestamp,
      });
    } catch (err) {
      if (err instanceof RateLimitError) {
        rateLimitHit = true;
        process.stderr.write(`Rate limit hit at URL ${entry.url}. Marking remaining as skipped.\n`);
        results.push({
          url: entry.url,
          ...(entry.bucket ? { bucket: entry.bucket } : {}),
          coverageState: null,
          lastCrawlTime: null,
          googleCanonical: null,
          userCanonical: null,
          verdict: null,
          indexingState: null,
          robotsTxtState: null,
          pageFetchState: null,
          sitemap: [],
          richResultsVerdict: null,
          richResultsDetectedTypes: [],
          articleStructuredDataValid: null,
          timestamp,
          error: err.message,
        });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error inspecting ${entry.url}: ${msg}\n`);
        errorCount++;
        results.push({
          url: entry.url,
          ...(entry.bucket ? { bucket: entry.bucket } : {}),
          coverageState: null,
          lastCrawlTime: null,
          googleCanonical: null,
          userCanonical: null,
          verdict: null,
          indexingState: null,
          robotsTxtState: null,
          pageFetchState: null,
          sitemap: [],
          richResultsVerdict: null,
          richResultsDetectedTypes: [],
          articleStructuredDataValid: null,
          timestamp,
          error: msg,
        });
      }
    }
  }

  // Build output
  const output = {
    generatedAt: timestamp,
    siteUrl: GSC_SITE_URL,
    totalUrls: entries.length,
    successCount: results.filter((r) => !r.error).length,
    errorCount: results.filter((r) => !!r.error).length,
    rateLimitHit,
    results,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
  process.stdout.write(`Written: ${outputPath}\n`);
  process.stdout.write(`Results: ${output.successCount} OK, ${output.errorCount} errors, ${entries.length} total\n`);

  if (rateLimitHit) {
    process.stderr.write("Rate limit hit during batch. Run again tomorrow with remaining URLs.\n");
    process.exit(2);
  }

  if (errorCount > 0) {
    // Partial success: non-zero exit to signal errors, but output was written
    process.exit(1);
  }
}

void main();
