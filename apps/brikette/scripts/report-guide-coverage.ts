#!/usr/bin/env node
/**
 * Coverage reporting for guide cross-references and inline links
 *
 * Reports:
 * - Guides with 0 or low relatedGuides (by status)
 * - Guides below minimum threshold (live: <2, review: <1)
 * - Orphan guides (no inbound links from other guides)
 * - Missing reciprocal links (A→B but not B→A) - informational only
 * - Inline %LINK: usage statistics
 * - Google Maps URL usage count
 *
 * Usage:
 *   pnpm report-coverage               # Report on EN guides (default)
 *   pnpm report-coverage --locale=de   # Report on DE guides
 *   pnpm report-coverage --csv          # Output CSV format
 *   pnpm report-coverage --verbose      # Show detailed breakdown
 *
 * Sample Output:
 *   ## Cross-Reference Coverage Report
 *
 *   ### Guides by Status
 *   - Live: 45 guides (42 with relatedGuides, 3 without)
 *   - Review: 18 guides (15 with relatedGuides, 3 without)
 *   - Draft: 103 guides (50 with relatedGuides, 53 without)
 *
 *   ### Guides Below Minimum Threshold
 *   Live guides with <2 relatedGuides: 8
 *   - guideA (0 relatedGuides)
 *   - guideB (1 relatedGuides)
 *
 *   ### Orphan Guides (No Inbound Links)
 *   12 guides have no inbound links:
 *   - orphanGuide1 (status: live)
 *   - orphanGuide2 (status: review)
 *
 *   ### Inline Link Usage
 *   30 guides use %LINK: tokens (average: 2.3 links per guide)
 *
 *   ### Google Maps URLs
 *   4 guides contain Google Maps links
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listGuideManifestEntries } from "../src/routes/guides/guide-manifest";
import type { GuideManifestEntry, GuideStatus } from "../src/routes/guides/guide-manifest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

// Parse CLI arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const csvOutput = args.includes("--csv");
const localeFilter = args.find(arg => arg.startsWith("--locale="))?.slice("--locale=".length) || "en";

// Token pattern from _linkTokens.tsx
const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;

type GuideStats = {
  key: string;
  status: GuideStatus;
  draftOnly: boolean;
  relatedGuidesCount: number;
  inboundLinksCount: number;
  inlineLinkCount: number;
  hasMapsUrl: boolean;
};

type CoverageReport = {
  totalGuides: number;
  guidesByStatus: Record<GuideStatus, number>;
  guidesWithRelatedGuides: Record<GuideStatus, number>;
  guidesWithoutRelatedGuides: Record<GuideStatus, number>;
  guidesBelowThreshold: Array<{ key: string; status: GuideStatus; count: number }>;
  orphanGuides: Array<{ key: string; status: GuideStatus }>;
  missingReciprocals: Array<{ from: string; to: string; fromStatus: GuideStatus; toStatus: GuideStatus }>;
  guidesWithInlineLinks: number;
  totalInlineLinks: number;
  guidesWithMapsUrls: number;
  guideStats: GuideStats[];
};

/**
 * Extract all link tokens from content string
 */
function extractLinkTokens(content: string): Array<{ type: string; target: string }> {
  const tokens: Array<{ type: string; target: string }> = [];
  const regex = new RegExp(TOKEN_PATTERN, "g");
  let match;

  while ((match = regex.exec(content)) !== null) {
    const [, type, target] = match;
    if (type && target) {
      tokens.push({ type, target: target.trim() });
    }
  }

  return tokens;
}

/**
 * Check if content contains Google Maps URLs
 */
function containsGoogleMapsUrl(content: string): boolean {
  return /google\.com\/maps\/(dir|search)/i.test(content);
}

/**
 * List all JSON files in a directory recursively
 */
const listJsonFiles = async (rootDir: string, relativeDir = ""): Promise<string[]> => {
  const entries = await readdir(path.join(rootDir, relativeDir), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextRelative);
    }
  }

  return files.sort();
};

/**
 * Read and parse JSON file
 */
const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
};

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
 * Scan guide content files and collect link usage statistics
 */
async function scanGuideContent(
  locale: string,
  manifest: GuideManifestEntry[]
): Promise<Map<string, { inlineLinks: Array<{ type: string; target: string }>; hasMapsUrl: boolean }>> {
  const contentStats = new Map<string, { inlineLinks: Array<{ type: string; target: string }>; hasMapsUrl: boolean }>();
  const localeDir = path.join(LOCALES_ROOT, locale);
  const guidesContentDir = path.join(localeDir, "guides", "content");

  let contentFiles: string[];
  try {
    contentFiles = await listJsonFiles(guidesContentDir);
  } catch (error) {
    console.warn(`Warning: Could not read guides content directory for locale "${locale}"`);
    return contentStats;
  }

  for (const relativeFile of contentFiles) {
    const guideKey = path.basename(relativeFile, ".json");
    const contentPath = path.join(guidesContentDir, relativeFile);

    try {
      const content = await readJson(contentPath);
      const strings = extractStringsFromContent(content);
      const contentText = strings.join("\n");

      const tokens = extractLinkTokens(contentText);
      const linkTokens = tokens.filter(t => t.type === "LINK");
      const hasMapsUrl = containsGoogleMapsUrl(contentText);

      contentStats.set(guideKey, {
        inlineLinks: linkTokens,
        hasMapsUrl,
      });
    } catch (error) {
      if (verbose) {
        console.warn(`Warning: Could not parse ${locale}/${relativeFile}`);
      }
    }
  }

  return contentStats;
}

/**
 * Build inbound links map (which guides are linked TO)
 */
function buildInboundLinksMap(
  manifest: GuideManifestEntry[],
  contentStats: Map<string, { inlineLinks: Array<{ type: string; target: string }>; hasMapsUrl: boolean }>
): Map<string, Set<string>> {
  const inboundLinks = new Map<string, Set<string>>();

  // Initialize map with all guide keys
  for (const entry of manifest) {
    inboundLinks.set(entry.key, new Set<string>());
  }

  // Add links from manifest relatedGuides
  for (const entry of manifest) {
    for (const relatedKey of entry.relatedGuides) {
      if (!inboundLinks.has(relatedKey)) {
        inboundLinks.set(relatedKey, new Set<string>());
      }
      inboundLinks.get(relatedKey)!.add(entry.key);
    }
  }

  // Add links from inline %LINK: tokens
  for (const [sourceKey, stats] of contentStats) {
    for (const link of stats.inlineLinks) {
      const targetKey = link.target;
      if (!inboundLinks.has(targetKey)) {
        inboundLinks.set(targetKey, new Set<string>());
      }
      inboundLinks.get(targetKey)!.add(sourceKey);
    }
  }

  return inboundLinks;
}

/**
 * Detect missing reciprocal links (A→B but not B→A)
 * Only checks manifest relatedGuides, not inline links
 */
function detectMissingReciprocals(
  manifest: GuideManifestEntry[]
): Array<{ from: string; to: string; fromStatus: GuideStatus; toStatus: GuideStatus }> {
  const missingReciprocals: Array<{ from: string; to: string; fromStatus: GuideStatus; toStatus: GuideStatus }> = [];

  // Build a map of guide → relatedGuides for fast lookup
  const relatedGuidesMap = new Map<string, Set<string>>();
  const statusMap = new Map<string, GuideStatus>();

  for (const entry of manifest) {
    relatedGuidesMap.set(entry.key, new Set(entry.relatedGuides));
    statusMap.set(entry.key, entry.status ?? "draft");
  }

  // For each A → B relationship, check if B → A exists
  for (const entry of manifest) {
    const fromKey = entry.key;
    const fromStatus = entry.status ?? "draft";

    for (const toKey of entry.relatedGuides) {
      // Check if the reciprocal exists
      const reciprocalRelated = relatedGuidesMap.get(toKey);
      if (!reciprocalRelated || !reciprocalRelated.has(fromKey)) {
        const toStatus = statusMap.get(toKey) ?? "draft";
        missingReciprocals.push({
          from: fromKey,
          to: toKey,
          fromStatus,
          toStatus,
        });
      }
    }
  }

  return missingReciprocals.sort((a, b) =>
    a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  );
}

/**
 * Generate coverage report
 */
function generateReport(
  manifest: GuideManifestEntry[],
  contentStats: Map<string, { inlineLinks: Array<{ type: string; target: string }>; hasMapsUrl: boolean }>,
  inboundLinks: Map<string, Set<string>>
): CoverageReport {
  const guideStats: GuideStats[] = [];
  const guidesByStatus: Record<GuideStatus, number> = { draft: 0, review: 0, live: 0 };
  const guidesWithRelatedGuides: Record<GuideStatus, number> = { draft: 0, review: 0, live: 0 };
  const guidesWithoutRelatedGuides: Record<GuideStatus, number> = { draft: 0, review: 0, live: 0 };

  for (const entry of manifest) {
    const status = entry.status ?? "draft";
    const stats = contentStats.get(entry.key);
    const inboundCount = inboundLinks.get(entry.key)?.size ?? 0;

    guideStats.push({
      key: entry.key,
      status,
      draftOnly: entry.draftOnly ?? false,
      relatedGuidesCount: entry.relatedGuides.length,
      inboundLinksCount: inboundCount,
      inlineLinkCount: stats?.inlineLinks.length ?? 0,
      hasMapsUrl: stats?.hasMapsUrl ?? false,
    });

    guidesByStatus[status]++;
    if (entry.relatedGuides.length > 0) {
      guidesWithRelatedGuides[status]++;
    } else {
      guidesWithoutRelatedGuides[status]++;
    }
  }

  // Minimum thresholds by status
  const thresholds: Record<GuideStatus, number> = {
    live: 2,
    review: 1,
    draft: 0,
  };

  const guidesBelowThreshold = guideStats
    .filter(g => {
      const threshold = thresholds[g.status];
      return g.relatedGuidesCount < threshold && g.relatedGuidesCount > 0;
    })
    .map(g => ({ key: g.key, status: g.status, count: g.relatedGuidesCount }))
    .sort((a, b) => a.count - b.count || a.key.localeCompare(b.key));

  const orphanGuides = guideStats
    .filter(g => g.inboundLinksCount === 0)
    .map(g => ({ key: g.key, status: g.status }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const guidesWithInlineLinks = guideStats.filter(g => g.inlineLinkCount > 0).length;
  const totalInlineLinks = guideStats.reduce((sum, g) => sum + g.inlineLinkCount, 0);
  const guidesWithMapsUrls = guideStats.filter(g => g.hasMapsUrl).length;

  // Detect missing reciprocal links
  const missingReciprocals = detectMissingReciprocals(manifest);

  return {
    totalGuides: manifest.length,
    guidesByStatus,
    guidesWithRelatedGuides,
    guidesWithoutRelatedGuides,
    guidesBelowThreshold,
    orphanGuides,
    missingReciprocals,
    guidesWithInlineLinks,
    totalInlineLinks,
    guidesWithMapsUrls,
    guideStats,
  };
}

/**
 * Output report in Markdown format
 */
function outputMarkdownReport(report: CoverageReport, locale: string): void {
  console.log(`# Cross-Reference Coverage Report (${locale.toUpperCase()})`);
  console.log("");
  console.log(`**Total guides:** ${report.totalGuides}`);
  console.log("");

  console.log("## Guides by Status");
  console.log("");
  for (const status of ["live", "review", "draft"] as GuideStatus[]) {
    const total = report.guidesByStatus[status];
    const withRelated = report.guidesWithRelatedGuides[status];
    const withoutRelated = report.guidesWithoutRelatedGuides[status];
    console.log(`- **${status}**: ${total} guides (${withRelated} with relatedGuides, ${withoutRelated} without)`);
  }
  console.log("");

  console.log("## Guides Below Minimum Threshold");
  console.log("");
  if (report.guidesBelowThreshold.length === 0) {
    console.log("✅ All guides meet minimum relatedGuides thresholds (live: ≥2, review: ≥1)");
  } else {
    console.log(`⚠️  ${report.guidesBelowThreshold.length} guides below threshold:`);
    console.log("");
    for (const guide of report.guidesBelowThreshold.slice(0, verbose ? 999 : 10)) {
      console.log(`- \`${guide.key}\` (status: ${guide.status}, ${guide.count} relatedGuides)`);
    }
    if (!verbose && report.guidesBelowThreshold.length > 10) {
      console.log(`- ...and ${report.guidesBelowThreshold.length - 10} more (use --verbose to see all)`);
    }
  }
  console.log("");

  console.log("## Orphan Guides (No Inbound Links)");
  console.log("");
  if (report.orphanGuides.length === 0) {
    console.log("✅ No orphan guides (all guides have at least one inbound link)");
  } else {
    console.log(`⚠️  ${report.orphanGuides.length} guides have no inbound links:`);
    console.log("");
    for (const guide of report.orphanGuides.slice(0, verbose ? 999 : 10)) {
      console.log(`- \`${guide.key}\` (status: ${guide.status})`);
    }
    if (!verbose && report.orphanGuides.length > 10) {
      console.log(`- ...and ${report.orphanGuides.length - 10} more (use --verbose to see all)`);
    }
  }
  console.log("");

  console.log("## Missing Reciprocal Links");
  console.log("");
  if (report.missingReciprocals.length === 0) {
    console.log("✅ All relatedGuides relationships are reciprocal");
  } else {
    console.log(`ℹ️  ${report.missingReciprocals.length} missing reciprocal links found:`);
    console.log("");
    console.log("**Note:** Not all relationships need to be symmetric (e.g., overview guides linking to specifics).");
    console.log("These are informational warnings to help identify potential editorial improvements.");
    console.log("");

    const displayLimit = verbose ? 999 : 20;
    for (const reciprocal of report.missingReciprocals.slice(0, displayLimit)) {
      console.log(`- \`${reciprocal.from}\` → \`${reciprocal.to}\` (missing: \`${reciprocal.to}\` → \`${reciprocal.from}\`)`);
    }
    if (!verbose && report.missingReciprocals.length > displayLimit) {
      console.log(`- ...and ${report.missingReciprocals.length - displayLimit} more (use --verbose to see all)`);
    }
  }
  console.log("");

  console.log("## Inline Link Usage");
  console.log("");
  const avgInlineLinks = report.guidesWithInlineLinks > 0
    ? (report.totalInlineLinks / report.guidesWithInlineLinks).toFixed(1)
    : "0";
  console.log(`- ${report.guidesWithInlineLinks} guides use \`%LINK:\` tokens`);
  console.log(`- ${report.totalInlineLinks} total inline links`);
  console.log(`- Average: ${avgInlineLinks} links per guide (for guides with links)`);
  console.log("");

  console.log("## Google Maps URLs");
  console.log("");
  console.log(`- ${report.guidesWithMapsUrls} guides contain Google Maps links`);
  console.log("");

  if (verbose) {
    console.log("## Detailed Guide Stats");
    console.log("");
    console.log("| Guide Key | Status | Related | Inbound | Inline | Maps |");
    console.log("|-----------|--------|---------|---------|--------|------|");
    for (const guide of report.guideStats.sort((a, b) => a.key.localeCompare(b.key))) {
      console.log(
        `| ${guide.key} | ${guide.status} | ${guide.relatedGuidesCount} | ${guide.inboundLinksCount} | ${guide.inlineLinkCount} | ${guide.hasMapsUrl ? "✓" : ""} |`
      );
    }
  }
}

/**
 * Output report in CSV format
 */
function outputCsvReport(report: CoverageReport): void {
  console.log("guide_key,status,draft_only,related_guides,inbound_links,inline_links,has_maps");
  for (const guide of report.guideStats) {
    console.log(
      `${guide.key},${guide.status},${guide.draftOnly},${guide.relatedGuidesCount},${guide.inboundLinksCount},${guide.inlineLinkCount},${guide.hasMapsUrl}`
    );
  }
}

/**
 * Main function
 */
const main = async (): Promise<void> => {
  console.log(`Loading guide manifest and scanning ${localeFilter.toUpperCase()} content...`);
  console.log("");

  const manifest = listGuideManifestEntries();
  const contentStats = await scanGuideContent(localeFilter, manifest);
  const inboundLinks = buildInboundLinksMap(manifest, contentStats);

  const report = generateReport(manifest, contentStats, inboundLinks);

  if (csvOutput) {
    outputCsvReport(report);
  } else {
    outputMarkdownReport(report, localeFilter);
  }
};

main().catch((error) => {
  console.error("Fatal error during coverage reporting:");
  console.error(error);
  process.exitCode = 1;
});
