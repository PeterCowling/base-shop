#!/usr/bin/env tsx
/**
 * GSC Search Analytics pull script for Brikette.
 *
 * Purpose: Pull clicks/impressions/CTR/position by page (and optionally by query)
 * from the Google Search Console Search Analytics API. Used for the monitoring
 * cadence alongside gsc-url-inspection-batch.ts.
 *
 * Usage (run from repo root):
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts --start 2026-01-01 --end 2026-01-31
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts --start 2026-01-01 --end 2026-01-31 --query
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts --output path/to/analytics.json
 *
 * Output:
 *   docs/plans/brikette-seo-api-optimization-loop/monitoring/analytics-<YYYY-MM-DD>.json
 *   (or --output path)
 *
 * Auth: .secrets/ga4/brikette-web-2b73459e229a.json (service account)
 * Scope: webmasters.readonly
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
const GSC_SITE_ENCODED = "sc-domain%3Ahostel-positano.com";
const GSC_ANALYTICS_URL = `https://www.googleapis.com/webmasters/v3/sites/${GSC_SITE_ENCODED}/searchAnalytics/query`;

// GSC retains data for 16 months
const MAX_RETENTION_MONTHS = 16;

type SearchAnalyticsRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type AnalyticsResult = {
  page: string;
  query?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
};

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 3); // GSC has ~3 day lag
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // 7 day window ending 3 days ago
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function validateDateRange(start: string, end: string): void {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start date: "${start}". Expected YYYY-MM-DD format.`);
  }
  if (isNaN(endDate.getTime())) {
    throw new Error(`Invalid end date: "${end}". Expected YYYY-MM-DD format.`);
  }
  if (endDate < startDate) {
    throw new Error(`End date "${end}" is before start date "${start}".`);
  }

  // Warn about data retention limit
  const retentionLimit = new Date();
  retentionLimit.setMonth(retentionLimit.getMonth() - MAX_RETENTION_MONTHS);
  if (startDate < retentionLimit) {
    process.stderr.write(
      `Warning: start date "${start}" is older than ${MAX_RETENTION_MONTHS} months. ` +
      `GSC data retention limit may apply.\n`,
    );
  }
}

function getOutputPath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  const today = new Date().toISOString().slice(0, 10);
  const monitoringDir = path.resolve(
    __dirname,
    "../../../docs/plans/brikette-seo-api-optimization-loop/monitoring",
  );
  return path.join(monitoringDir, `analytics-${today}.json`);
}

async function fetchSearchAnalytics(
  token: string,
  startDate: string,
  endDate: string,
  includeQuery: boolean,
): Promise<AnalyticsResult[]> {
  const dimensions = includeQuery ? ["page", "query"] : ["page"];

  const body = {
    startDate,
    endDate,
    dimensions,
    rowLimit: 1000,
    startRow: 0,
  };

  const resp = await fetch(GSC_ANALYTICS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    throw new Error(`Search Analytics API rate limit hit: ${resp.status} ${await resp.text()}`);
  }

  if (!resp.ok) {
    throw new Error(`Search Analytics API error: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as SearchAnalyticsResponse;

  if (!data.rows || data.rows.length === 0) {
    return [];
  }

  return data.rows
    .map((row): AnalyticsResult => {
      const page = row.keys[0] ?? "";
      const query = includeQuery ? row.keys[1] : undefined;
      return {
        page,
        ...(query !== undefined ? { query } : {}),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      };
    })
    .sort((a, b) => b.impressions - a.impressions); // sort by impressions desc
}

async function main(): Promise<void> {
  const defaults = getDefaultDateRange();
  const startDate = parseArg("--start") ?? defaults.start;
  const endDate = parseArg("--end") ?? defaults.end;
  const includeQuery = hasFlag("--query");
  const customOutput = parseArg("--output");
  const saKeyPath = parseArg("--sa-key") ?? DEFAULT_SA_KEY_PATH;

  // Validate date range
  try {
    validateDateRange(startDate, endDate);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Date range error: ${msg}\n`);
    process.exit(1);
  }

  const outputPath = getOutputPath(customOutput);

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

  // Fetch analytics
  let rows: AnalyticsResult[];
  try {
    rows = await fetchSearchAnalytics(token, startDate, endDate, includeQuery);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Search Analytics API error: ${msg}\n`);
    process.exit(1);
  }

  // Build output
  const timestamp = new Date().toISOString();
  const output = {
    generatedAt: timestamp,
    siteUrl: GSC_SITE_URL,
    dateRange: { start: startDate, end: endDate },
    dimensions: includeQuery ? ["page", "query"] : ["page"],
    totalRows: rows.length,
    rows,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
  process.stdout.write(`Written: ${outputPath}\n`);
  process.stdout.write(`Results: ${rows.length} rows for ${startDate}..${endDate}\n`);

  if (rows.length === 0) {
    process.stdout.write(
      `Note: 0 rows returned — guide pages may not yet have any Search Console impressions ` +
      `(expected at T+0 baseline).\n`,
    );
  }
}

void main();
