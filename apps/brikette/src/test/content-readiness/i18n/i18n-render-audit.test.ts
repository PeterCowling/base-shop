/**
 * i18n Render Audit Test Suite
 *
 * Scans locale JSON files for placeholder phrases that should not appear in translated content.
 *
 * Default behaviour: warn-only (test passes; writes report to stdout).
 * Strict mode: set I18N_MISSING_KEYS_MODE=fail to make the suite fail if findings exist.
 *
 * @see docs/plans/i18n-missing-key-detection-plan.md
 */

import { existsSync,readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  detectRenderedI18nPlaceholders,
  type PlaceholderFinding,
} from "@tests/utils/detectRenderedI18nPlaceholders";

import { i18nConfig } from "@/i18n.config";

import { resolveGuideContentFileAllowlist } from "../helpers/guideFilters";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");
const BASELINE_LOCALE = "en";
const GUIDE_CONTENT_ALLOWLIST = resolveGuideContentFileAllowlist();

// Strict mode: when set to "fail", the test fails on any findings
const STRICT_MODE =
  process.env.I18N_MISSING_KEYS_MODE === "fail" ||
  process.env.CONTENT_READINESS_MODE === "fail";

// Subdirectories containing guide-specific content
const GUIDES_CONTENT_DIR = "guides/content";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface LocaleAuditResult {
  locale: string;
  namespace: string;
  findings: PlaceholderFinding[];
}

interface AuditReport {
  totalFindings: number;
  localesWithIssues: number;
  results: LocaleAuditResult[];
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/**
 * Recursively extract all string values from a JSON object.
 */
function extractStrings(
  obj: unknown,
  prefix = ""
): Array<{ key: string; value: string }> {
  const strings: Array<{ key: string; value: string }> = [];

  if (typeof obj === "string") {
    strings.push({ key: prefix, value: obj });
    return strings;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      strings.push(...extractStrings(obj[i], `${prefix}[${i}]`));
    }
    return strings;
  }

  if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      strings.push(...extractStrings(value, nextPrefix));
    }
  }

  return strings;
}

/**
 * List all guide content files for a locale.
 */
function listGuideContentFiles(locale: string): string[] {
  const guidesDir = path.join(LOCALES_ROOT, locale, GUIDES_CONTENT_DIR);
  if (!existsSync(guidesDir)) {
    return [];
  }

  try {
    const files = readdirSync(guidesDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .filter((f) => {
        if (!GUIDE_CONTENT_ALLOWLIST) return true;
        return GUIDE_CONTENT_ALLOWLIST.has(path.join(GUIDES_CONTENT_DIR, f));
      })
      .map((f) => path.join(GUIDES_CONTENT_DIR, f));
  } catch {
    return [];
  }
}

/**
 * Audit guide content files for a locale.
 */
function auditGuideContent(locale: string): LocaleAuditResult[] {
  const results: LocaleAuditResult[] = [];
  const guideFiles = listGuideContentFiles(locale);

  for (const relPath of guideFiles) {
    const filePath = path.join(LOCALES_ROOT, locale, relPath);
    try {
      const content = readFileSync(filePath, "utf8");
      const json = JSON.parse(content);
      const strings = extractStrings(json);
      const findings: PlaceholderFinding[] = [];

      for (const { value } of strings) {
        const detected = detectRenderedI18nPlaceholders(value, {
          keyPrefixes: [],
          minDotSegments: 999,
        });
        const phraseFindings = detected.filter((f) => f.kind === "placeholderPhrase");
        findings.push(...phraseFindings);
      }

      if (findings.length > 0) {
        results.push({
          locale,
          namespace: relPath.replace(/\.json$/, ""),
          findings,
        });
      }
    } catch {
      // Skip files that can't be parsed
    }
  }

  return results;
}

/**
 * Run the full audit across all locales and namespaces.
 */
function runFullAudit(): AuditReport {
  const results: LocaleAuditResult[] = [];
  const locales = (i18nConfig.supportedLngs ?? []).filter(
    (l) => l !== BASELINE_LOCALE
  );

  for (const locale of locales) {
    // Audit guide content files
    const guideResults = auditGuideContent(locale);
    results.push(...guideResults);
  }

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
  const localesWithIssues = new Set(results.map((r) => r.locale)).size;

  return { totalFindings, localesWithIssues, results };
}

/**
 * Format the audit report for console output.
 */
function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("Guide Content Placeholder Audit Report");
  lines.push("=".repeat(60));
  lines.push("");

  if (report.totalFindings === 0) {
    lines.push("No placeholder phrases detected in locale files.");
    return lines.join("\n");
  }

  lines.push(`Total findings: ${report.totalFindings}`);
  lines.push(`Locales with issues: ${report.localesWithIssues}`);
  lines.push("");

  // Group by locale
  const byLocale = new Map<string, LocaleAuditResult[]>();
  for (const result of report.results) {
    const existing = byLocale.get(result.locale) ?? [];
    existing.push(result);
    byLocale.set(result.locale, existing);
  }

  for (const [locale, results] of byLocale) {
    const localeTotal = results.reduce((sum, r) => sum + r.findings.length, 0);
    lines.push(`${locale} (${localeTotal} issues):`);

    for (const result of results) {
      lines.push(`  ${result.namespace}: ${result.findings.length}`);
      // Show first few findings
      const sample = result.findings.slice(0, 3);
      for (const finding of sample) {
        lines.push(`    - "${finding.value}"`);
      }
      if (result.findings.length > 3) {
        lines.push(`    ... and ${result.findings.length - 3} more`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("guide content placeholder audit", () => {
  it("scans non-en guide content files for placeholder phrases", () => {
    const report = runFullAudit();
    const formattedReport = formatAuditReport(report);

    // Always log the report for visibility
    // eslint-disable-next-line no-console
    console.log("\n" + formattedReport);

    if (STRICT_MODE) {
      expect(report.totalFindings).toBe(0);
      return;
    }

    if (report.totalFindings > 0) {
       
      console.warn(
        `[WARN] Found ${report.totalFindings} placeholder phrase(s) in non-en guide content.`
      );
       
      console.warn("Run with CONTENT_READINESS_MODE=fail to enforce.");
    }
    expect(true).toBe(true);
  });
});
