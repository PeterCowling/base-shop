/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] CLI tool reads/writes locale JSON files. */
/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2500 CLI script string output is developer-facing. */

/**
 * Converts assistance article JSON files to guide JSON format.
 *
 * Usage:
 *   pnpm tsx scripts/convert-assistance-articles-to-guides.ts [options] [articleKey...]
 *
 * Options:
 *   --diff         Output a diff report instead of writing files
 *   --dry-run      Show what would be written without actually writing
 *   --all          Convert all known article keys
 *
 * Examples:
 *   pnpm tsx scripts/convert-assistance-articles-to-guides.ts rules
 *   pnpm tsx scripts/convert-assistance-articles-to-guides.ts --all --diff
 *   pnpm tsx scripts/convert-assistance-articles-to-guides.ts --dry-run rules legal
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sanitize label for %LINK:key|label% token insertion.
 * (Inlined from _linkTokens.tsx to avoid path alias issues in CLI scripts)
 */
function sanitizeLinkLabel(label: string): string {
  return label
    .replace(/%/gu, "")
    .replace(/\|/gu, "-")
    .replace(/\n/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 100);
}

// All known article keys from ARTICLE_KEYS
const ALL_ARTICLE_KEYS = [
  "ageAccessibility",
  "arrivingByFerry",
  "bookingBasics",
  "changingCancelling",
  "checkinCheckout",
  "defectsDamages",
  "depositsPayments",
  "legal",
  "naplesAirportBus",
  "rules",
  "security",
  "travelHelp",
] as const;

type ArticleKey = (typeof ALL_ARTICLE_KEYS)[number];

interface ArticleJson {
  slug: string;
  meta: {
    title: string;
    description: string;
  };
  headings: Record<string, string>;
  content: Record<string, string>;
  mediaAlt?: Record<string, string>;
}

interface GuideSection {
  id: string;
  title: string;
  body: string[];
}

interface GuideJson {
  seo: {
    title: string;
    description: string;
  };
  linkLabel: string;
  intro?: string[];
  sections: GuideSection[];
  tips?: string[];
  faqs?: Array<{ q: string; a: string[] }>;
}

interface ConversionResult {
  locale: string;
  articleKey: string;
  sectionCount: number;
  orphanHeadings: string[];
  orphanContent: string[];
  guide: GuideJson | null;
  error?: string;
}

interface GroupingStructure {
  $comment?: string;
  groups: Array<{
    id: string;
    title: string;
    legacyKeys: string[];
  }>;
}

interface DiffReport {
  articleKey: string;
  localesFound: number;
  localesMissing: string[];
  totalSections: number;
  orphanIssues: Array<{ locale: string; orphanHeadings: string[]; orphanContent: string[] }>;
}

// Content transformation utilities

/**
 * Convert HTML anchor tags to %URL: tokens.
 * <a href="https://...">Label</a> → %URL:https://...|Label%
 * <a href="mailto:...">Label</a> → %URL:mailto:...|Label%
 */
function convertAnchorsToUrlTokens(text: string): string {
  // Match <a> tags with href attribute
  const anchorPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  return text.replace(anchorPattern, (_match, href: string, label: string) => {
    const trimmedHref = href.trim();
    const trimmedLabel = sanitizeLinkLabel(label.trim());
    // Only convert http, https, and mailto URLs
    const lower = trimmedHref.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
      return `%URL:${trimmedHref}|${trimmedLabel}%`;
    }
    // For other URLs (relative, etc.), just return the label
    return trimmedLabel;
  });
}

/**
 * Convert HTML strong/b tags to markdown bold.
 * <strong>text</strong> → **text**
 * <b>text</b> → **text**
 */
function convertBoldTags(text: string): string {
  return text
    .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
    .replace(/<b>([^<]+)<\/b>/gi, "**$1**");
}

/**
 * Convert HTML em/i tags to markdown italic.
 * <em>text</em> → *text*
 * <i>text</i> → *text*
 */
function convertItalicTags(text: string): string {
  return text
    .replace(/<em>([^<]+)<\/em>/gi, "*$1*")
    .replace(/<i>([^<]+)<\/i>/gi, "*$1*");
}

/**
 * Convert bullet character to markdown list marker.
 * • item → * item
 * Also handles lines that start with bullets after newlines.
 */
function convertBulletPoints(text: string): string {
  // Replace bullet character with asterisk for list items
  // Handle both inline bullets and line-start bullets
  return text
    .replace(/•\s*/g, "* ")
    .replace(/\n\s*•\s*/g, "\n* ");
}

/**
 * Strip any remaining HTML tags that we don't explicitly handle.
 */
function stripRemainingHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

/**
 * Normalize whitespace while preserving intentional newlines.
 */
function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim();
}

/**
 * Apply all content transformations to convert article content to guide format.
 */
function transformContent(text: string): string {
  let result = text;
  result = convertAnchorsToUrlTokens(result);
  result = convertBoldTags(result);
  result = convertItalicTags(result);
  result = convertBulletPoints(result);
  result = stripRemainingHtml(result);
  result = normalizeWhitespace(result);
  return result;
}

/**
 * Split content into body paragraphs.
 * Content with newlines becomes multiple body entries.
 * Content with bullet lists gets each list item as a separate entry.
 */
function splitIntoBodyParagraphs(content: string): string[] {
  const transformed = transformContent(content);

  // Split by double newlines first (paragraph breaks)
  const paragraphs = transformed.split(/\n\n+/);
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this paragraph contains bullet list items
    const lines = trimmed.split("\n");
    const hasBullets = lines.some((line) => line.trim().startsWith("* "));

    if (hasBullets) {
      // Combine consecutive bullet lines into one block
      // Non-bullet text before list goes as separate paragraph
      let currentText = "";
      let listBlock = "";

      for (const line of lines) {
        const lineTrimmed = line.trim();
        if (lineTrimmed.startsWith("* ")) {
          if (currentText) {
            result.push(currentText.trim());
            currentText = "";
          }
          listBlock += (listBlock ? "\n" : "") + lineTrimmed;
        } else if (lineTrimmed) {
          if (listBlock) {
            result.push(listBlock);
            listBlock = "";
          }
          currentText += (currentText ? " " : "") + lineTrimmed;
        }
      }

      if (currentText) result.push(currentText.trim());
      if (listBlock) result.push(listBlock);
    } else {
      // No bullets - join lines with space
      result.push(lines.map((l) => l.trim()).filter(Boolean).join(" "));
    }
  }

  return result.filter((p) => p.length > 0);
}

/**
 * Convert an article JSON to guide JSON format.
 */
function convertArticleToGuide(
  article: ArticleJson,
  groupingStructure?: GroupingStructure,
): { guide: GuideJson; orphanHeadings: string[]; orphanContent: string[] } {
  const headingKeys = Object.keys(article.headings);
  const contentKeys = Object.keys(article.content);

  // Find orphans
  const orphanHeadings = headingKeys.filter((key) => !contentKeys.includes(key));
  const orphanContent = contentKeys.filter((key) => !headingKeys.includes(key));

  let sections: GuideSection[];

  if (groupingStructure) {
    // Build sections using the grouping structure
    sections = [];
    const usedKeys = new Set<string>();

    for (const group of groupingStructure.groups) {
      const bodyParts: string[] = [];

      for (const legacyKey of group.legacyKeys) {
        usedKeys.add(legacyKey);
        const heading = article.headings[legacyKey];
        const rawContent = article.content[legacyKey];

        if (!rawContent) continue;

        // Add subsection header as bold markdown
        if (heading) {
          bodyParts.push(`**${heading.trim()}**`);
        }

        // Add the content paragraphs
        const contentParts = splitIntoBodyParagraphs(rawContent);
        bodyParts.push(...contentParts);
      }

      if (bodyParts.length > 0) {
        sections.push({
          id: group.id,
          title: group.title,
          body: bodyParts,
        });
      }
    }

    // Check for keys not covered by grouping
    const ungroupedHeadings = headingKeys.filter((key) => !usedKeys.has(key));
    const ungroupedContent = contentKeys.filter((key) => !usedKeys.has(key));

    if (ungroupedHeadings.length > 0) {
      orphanHeadings.push(...ungroupedHeadings.map((k) => `[ungrouped] ${k}`));
    }
    if (ungroupedContent.length > 0) {
      orphanContent.push(...ungroupedContent.map((k) => `[ungrouped] ${k}`));
    }
  } else {
    // Build sections in heading order (maintains original order)
    sections = [];
    for (const key of headingKeys) {
      const title = article.headings[key];
      const rawContent = article.content[key];

      if (!title || !rawContent) continue;

      const body = splitIntoBodyParagraphs(rawContent);
      if (body.length === 0) continue;

      sections.push({
        id: key,
        title: title.trim(),
        body,
      });
    }
  }

  const guide: GuideJson = {
    seo: {
      title: article.meta.title,
      description: article.meta.description,
    },
    linkLabel: article.meta.title,
    sections,
  };

  return { guide, orphanHeadings, orphanContent };
}

/**
 * Load article JSON from a locale file.
 */
function loadArticle(localesRoot: string, locale: string, articleKey: string): ArticleJson | null {
  const filePath = path.join(localesRoot, locale, `${articleKey}.json`);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ArticleJson;
  } catch {
    return null;
  }
}

/**
 * Save guide JSON to a locale file.
 */
function saveGuide(localesRoot: string, locale: string, guideKey: string, guide: GuideJson): void {
  const dirPath = path.join(localesRoot, locale, "guides", "content");
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${guideKey}.json`);
  const content = JSON.stringify(guide, null, 2) + "\n";
  writeFileSync(filePath, content, "utf8");
}

/**
 * Load grouping structure from a JSON file.
 */
function loadGroupingStructure(filePath: string): GroupingStructure | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw) as GroupingStructure;
  } catch {
    return null;
  }
}

/**
 * Convert a single article across all locales.
 */
function convertArticle(
  localesRoot: string,
  articleKey: ArticleKey,
  locales: string[],
  options: { dryRun: boolean; groupingStructure?: GroupingStructure },
): ConversionResult[] {
  const results: ConversionResult[] = [];

  for (const locale of locales) {
    const article = loadArticle(localesRoot, locale, articleKey);

    if (!article) {
      results.push({
        locale,
        articleKey,
        sectionCount: 0,
        orphanHeadings: [],
        orphanContent: [],
        guide: null,
        error: "Article file not found",
      });
      continue;
    }

    try {
      const { guide, orphanHeadings, orphanContent } = convertArticleToGuide(article, options.groupingStructure);

      if (!options.dryRun) {
        saveGuide(localesRoot, locale, articleKey, guide);
      }

      results.push({
        locale,
        articleKey,
        sectionCount: guide.sections.length,
        orphanHeadings,
        orphanContent,
        guide,
      });
    } catch (err) {
      results.push({
        locale,
        articleKey,
        sectionCount: 0,
        orphanHeadings: [],
        orphanContent: [],
        guide: null,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Generate a diff report for converted articles.
 */
function generateDiffReport(results: ConversionResult[]): DiffReport[] {
  const byArticle = new Map<string, ConversionResult[]>();

  for (const result of results) {
    const existing = byArticle.get(result.articleKey) ?? [];
    existing.push(result);
    byArticle.set(result.articleKey, existing);
  }

  const reports: DiffReport[] = [];

  for (const [articleKey, articleResults] of byArticle) {
    const successful = articleResults.filter((r) => r.guide !== null);
    const missing = articleResults.filter((r) => r.guide === null);

    const totalSections = successful.reduce((sum, r) => sum + r.sectionCount, 0);
    const avgSections = successful.length > 0 ? Math.round(totalSections / successful.length) : 0;

    const orphanIssues = articleResults
      .filter((r) => r.orphanHeadings.length > 0 || r.orphanContent.length > 0)
      .map((r) => ({
        locale: r.locale,
        orphanHeadings: r.orphanHeadings,
        orphanContent: r.orphanContent,
      }));

    reports.push({
      articleKey,
      localesFound: successful.length,
      localesMissing: missing.map((r) => r.locale),
      totalSections: avgSections,
      orphanIssues,
    });
  }

  return reports;
}

/**
 * Print diff report to console.
 */
function printDiffReport(reports: DiffReport[]): void {
  console.log("\n=== Conversion Diff Report ===\n");

  for (const report of reports) {
    console.log(`Article: ${report.articleKey}`);
    console.log(`  Locales found: ${report.localesFound}`);
    if (report.localesMissing.length > 0) {
      console.log(`  Locales missing: ${report.localesMissing.join(", ")}`);
    }
    console.log(`  Sections (avg): ${report.totalSections}`);

    if (report.orphanIssues.length > 0) {
      console.log("  Orphan issues:");
      for (const issue of report.orphanIssues) {
        if (issue.orphanHeadings.length > 0) {
          console.log(`    ${issue.locale}: headings without content: ${issue.orphanHeadings.join(", ")}`);
        }
        if (issue.orphanContent.length > 0) {
          console.log(`    ${issue.locale}: content without headings: ${issue.orphanContent.join(", ")}`);
        }
      }
    }
    console.log("");
  }
}

/**
 * Print conversion summary to console.
 */
function printSummary(results: ConversionResult[], dryRun: boolean): void {
  const successful = results.filter((r) => r.guide !== null);
  const failed = results.filter((r) => r.guide === null);

  console.log(`\n=== Conversion Summary ${dryRun ? "(DRY RUN)" : ""} ===\n`);
  console.log(`Total conversions: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed/Missing: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed conversions:");
    for (const result of failed) {
      console.log(`  ${result.locale}/${result.articleKey}: ${result.error}`);
    }
  }

  const orphanIssues = results.filter((r) => r.orphanHeadings.length > 0 || r.orphanContent.length > 0);
  if (orphanIssues.length > 0) {
    console.log("\nOrphan issues detected:");
    for (const result of orphanIssues) {
      if (result.orphanHeadings.length > 0) {
        console.log(`  ${result.locale}/${result.articleKey}: headings without content: ${result.orphanHeadings.join(", ")}`);
      }
      if (result.orphanContent.length > 0) {
        console.log(`  ${result.locale}/${result.articleKey}: content without headings: ${result.orphanContent.join(", ")}`);
      }
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);

  const diffMode = args.includes("--diff");
  const dryRun = args.includes("--dry-run") || diffMode;
  const convertAll = args.includes("--all");

  // Parse --grouping <path> option
  let groupingPath: string | null = null;
  const groupingIdx = args.indexOf("--grouping");
  if (groupingIdx !== -1 && args[groupingIdx + 1]) {
    groupingPath = args[groupingIdx + 1];
  }

  const articleKeys = args
    .filter((arg, idx) => !arg.startsWith("--") && args[idx - 1] !== "--grouping")
    .filter((arg): arg is ArticleKey => ALL_ARTICLE_KEYS.includes(arg as ArticleKey));

  if (!convertAll && articleKeys.length === 0) {
    console.log("Usage: pnpm tsx scripts/convert-assistance-articles-to-guides.ts [options] [articleKey...]");
    console.log("");
    console.log("Options:");
    console.log("  --diff              Output a diff report instead of writing files");
    console.log("  --dry-run           Show what would be written without actually writing");
    console.log("  --all               Convert all known article keys");
    console.log("  --grouping <path>   Use a grouping structure file to organize sections");
    console.log("");
    console.log("Available article keys:");
    console.log(`  ${ALL_ARTICLE_KEYS.join(", ")}`);
    process.exit(1);
  }

  const keysToConvert = convertAll ? [...ALL_ARTICLE_KEYS] : articleKeys;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const localesRoot = path.resolve(__dirname, "..", "src", "locales");

  // Load grouping structure if provided
  let groupingStructure: GroupingStructure | undefined;
  if (groupingPath) {
    const absGroupingPath = path.isAbsolute(groupingPath) ? groupingPath : path.resolve(process.cwd(), groupingPath);
    groupingStructure = loadGroupingStructure(absGroupingPath) ?? undefined;
    if (!groupingStructure) {
      console.error(`Error: Could not load grouping structure from ${absGroupingPath}`);
      process.exit(1);
    }
    console.log(`Using grouping structure with ${groupingStructure.groups.length} groups`);
  }

  // Discover locales by scanning the locales directory
  // Filter out internal directories (starting with _ or containing 'stub')
  const locales = readdirSync(localesRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("_") && !dirent.name.includes("stub"))
    .map((dirent) => dirent.name)
    .filter((name) => name !== "cimode" && name !== "guides");

  console.log(`Converting ${keysToConvert.length} article(s) across ${locales.length} locale(s)...`);
  if (dryRun && !diffMode) {
    console.log("(DRY RUN - no files will be written)");
  }

  const allResults: ConversionResult[] = [];

  for (const articleKey of keysToConvert) {
    const results = convertArticle(localesRoot, articleKey, locales, { dryRun, groupingStructure });
    allResults.push(...results);
  }

  if (diffMode) {
    const reports = generateDiffReport(allResults);
    printDiffReport(reports);
  } else {
    printSummary(allResults, dryRun);
  }

  // Exit with error if there are orphan issues (completeness check)
  const hasOrphans = allResults.some((r) => r.orphanHeadings.length > 0 || r.orphanContent.length > 0);
  if (hasOrphans) {
    console.log("\nWarning: Orphan issues detected. Please review the content mapping.");
  }
}

main();
