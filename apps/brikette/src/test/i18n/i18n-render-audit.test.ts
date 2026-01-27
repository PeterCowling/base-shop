/**
 * i18n Render Audit Test Suite
 *
 * Scans locale JSON files for raw i18n keys and placeholder phrases that
 * should not appear in translated content.
 *
 * Default behaviour: warn-only (test passes; writes report to stdout).
 * Strict mode: set I18N_MISSING_KEYS_MODE=fail to make the suite fail if findings exist.
 *
 * @see docs/plans/i18n-missing-key-detection-plan.md
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

import {
  detectRenderedI18nPlaceholders,
  formatI18nPlaceholderReport,
  type PlaceholderFinding,
} from "@tests/utils/detectRenderedI18nPlaceholders";

import { i18nConfig } from "@/i18n.config";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const LOCALES_ROOT = path.resolve(__dirname, "../../locales");
const BASELINE_LOCALE = "en";

// Strict mode: when set to "fail", the test fails on any findings
const STRICT_MODE = process.env.I18N_MISSING_KEYS_MODE === "fail";

// High-traffic namespaces to audit (add more as needed)
const NAMESPACES_TO_AUDIT = [
  "translation",
  "footer",
  "experiencesPage",
  "header",
  "modals",
  "guides",
];

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
 * Read and parse a JSON file from the locales directory.
 */
function readLocaleJson(locale: string, namespace: string): unknown | null {
  // Standard namespace path: {locale}/{namespace}.json
  const standardPath = path.join(LOCALES_ROOT, locale, `${namespace}.json`);
  if (existsSync(standardPath)) {
    try {
      const content = readFileSync(standardPath, "utf8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  return null;
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
      .map((f) => path.join(GUIDES_CONTENT_DIR, f));
  } catch {
    return [];
  }
}

/**
 * Audit a single locale namespace for placeholder phrases.
 */
function auditLocaleNamespace(
  locale: string,
  namespace: string
): LocaleAuditResult {
  const json = readLocaleJson(locale, namespace);
  const findings: PlaceholderFinding[] = [];

  if (!json) {
    return { locale, namespace, findings };
  }

  // Extract all string values from the JSON
  const strings = extractStrings(json);

  // Scan each string for placeholder phrases
  // We intentionally don't check for raw keys here since the JSON
  // structure itself contains keys - we're looking for placeholder
  // phrases that indicate incomplete translations
  for (const { value } of strings) {
    // Only check for placeholder phrases, not raw keys
    // (JSON keys naturally look like raw keys)
    const detected = detectRenderedI18nPlaceholders(value, {
      // Disable raw key detection for JSON scanning
      keyPrefixes: [],
      minDotSegments: 999, // effectively disables
    });

    // Only keep placeholder phrase findings
    const phraseFindings = detected.filter((f) => f.kind === "placeholderPhrase");
    findings.push(...phraseFindings);
  }

  return { locale, namespace, findings };
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
    // Audit standard namespaces
    for (const namespace of NAMESPACES_TO_AUDIT) {
      const result = auditLocaleNamespace(locale, namespace);
      if (result.findings.length > 0) {
        results.push(result);
      }
    }

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
  lines.push("i18n Render Audit Report");
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

describe("i18n Render Audit", () => {
  describe("placeholder phrase detection", () => {
    it("scans locale files for placeholder phrases", () => {
      const report = runFullAudit();
      const formattedReport = formatAuditReport(report);

      // Always log the report for visibility
      // eslint-disable-next-line no-console
      console.log("\n" + formattedReport);

      if (STRICT_MODE) {
        // In strict mode, fail if any placeholder phrases are found
        expect(report.totalFindings).toBe(0);
      } else {
        // In warn mode, always pass but report findings
        if (report.totalFindings > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[WARN] Found ${report.totalFindings} placeholder phrase(s) in locale files.`
          );
          // eslint-disable-next-line no-console
          console.warn("Run with I18N_MISSING_KEYS_MODE=fail to enforce.");
        }
        expect(true).toBe(true);
      }
    });
  });

  describe("detectRenderedI18nPlaceholders utility", () => {
    it("detects placeholder phrases in sample text", () => {
      const sampleText = `
        Welcome to our hotel. Traduzione in arrivo.
        Contact us at hello@example.com for more info.
      `;

      const findings = detectRenderedI18nPlaceholders(sampleText);
      const phraseFindings = findings.filter((f) => f.kind === "placeholderPhrase");

      expect(phraseFindings.length).toBeGreaterThan(0);
      expect(phraseFindings[0].value).toContain("Traduzione in arrivo");
    });

    it("does not flag normal content", () => {
      const normalContent = "Welcome to Positano! Enjoy the beautiful coast.";
      const findings = detectRenderedI18nPlaceholders(normalContent);

      expect(findings).toHaveLength(0);
    });
  });

  describe("formatI18nPlaceholderReport", () => {
    it("formats findings into readable report", () => {
      const findings: PlaceholderFinding[] = [
        {
          value: "Translation in progress",
          kind: "placeholderPhrase",
          snippet: "...Translation in progress...",
        },
      ];

      const report = formatI18nPlaceholderReport(findings);

      expect(report).toContain("1 potential i18n issue");
      expect(report).toContain("Placeholder phrases");
    });
  });
});
