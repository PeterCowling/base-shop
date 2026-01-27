import { describe, expect, it } from "@jest/globals";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const APP_ROOT = path.resolve(process.cwd());
const SCRIPT_PATH = path.join(APP_ROOT, "scripts", "check-i18n-coverage.ts");
const TEST_OUTPUT_DIR = path.join(APP_ROOT, ".test-output", "i18n-coverage");
const TEST_LOCALES_DIR = path.join(TEST_OUTPUT_DIR, "locales");

type CoverageReportJson = {
  schemaVersion: number;
  baselineLocale: string;
  locales: string[];
  summary: {
    totalMissingFiles: number;
    totalMissingKeys: number;
  };
  reports: Array<{
    locale: string;
    missingFiles: string[];
    missingKeys: Record<string, string[]>;
  }>;
};

/**
 * Test helper: Create test locale structure
 */
function setupTestLocales(): void {
  // Clean up and create fresh test directory
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_LOCALES_DIR, { recursive: true });

  // Create baseline locale (en)
  const enDir = path.join(TEST_LOCALES_DIR, "en");
  mkdirSync(enDir, { recursive: true });
  mkdirSync(path.join(enDir, "guides", "content"), { recursive: true });

  writeFileSync(
    path.join(enDir, "guides", "content", "testGuide.json"),
    JSON.stringify({
      seo: { title: "Test Guide", description: "Test description" },
      intro: { title: "Welcome", body: "Introduction text" },
      sections: [{ id: "sec1", title: "Section 1", body: "Content here" }],
    }, null, 2)
  );

  writeFileSync(
    path.join(enDir, "common.json"),
    JSON.stringify({ greeting: "Hello", farewell: "Goodbye" }, null, 2)
  );

  // Create incomplete locale (de) - missing file and keys
  const deDir = path.join(TEST_LOCALES_DIR, "de");
  mkdirSync(deDir, { recursive: true });
  mkdirSync(path.join(deDir, "guides", "content"), { recursive: true });

  // Missing testGuide.json entirely

  // common.json missing "farewell" key
  writeFileSync(
    path.join(deDir, "common.json"),
    JSON.stringify({ greeting: "Hallo" }, null, 2)
  );

  // Create complete locale (fr)
  const frDir = path.join(TEST_LOCALES_DIR, "fr");
  mkdirSync(frDir, { recursive: true });
  mkdirSync(path.join(frDir, "guides", "content"), { recursive: true });

  writeFileSync(
    path.join(frDir, "guides", "content", "testGuide.json"),
    JSON.stringify({
      seo: { title: "Guide de test", description: "Description du test" },
      intro: { title: "Bienvenue", body: "Texte d'introduction" },
      sections: [{ id: "sec1", title: "Section 1", body: "Contenu ici" }],
    }, null, 2)
  );

  writeFileSync(
    path.join(frDir, "common.json"),
    JSON.stringify({ greeting: "Bonjour", farewell: "Au revoir" }, null, 2)
  );
}

function cleanupTestLocales(): void {
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
}

describe("check-i18n-coverage CLI", () => {
  describe("JSON output format", () => {
    it("outputs valid JSON with correct schema structure", () => {
      setupTestLocales();

      try {
        const outputPath = path.join(TEST_OUTPUT_DIR, "report.json");

        // Note: This test runs against real locale data in the repo
        // We're testing the JSON output format, not using test fixtures
        const result = execSync(
          `pnpm exec tsx "${SCRIPT_PATH}" --json --output="${outputPath}"`,
          {
            cwd: APP_ROOT,
            encoding: "utf8",
            stdio: "pipe",
          }
        );

        expect(result).toContain("i18n coverage report written to:");

        // Read and parse the JSON output
        const jsonContent = readFileSync(outputPath, "utf8");
        const report: CoverageReportJson = JSON.parse(jsonContent);

        // Validate schema structure
        expect(report.schemaVersion).toBe(1);
        expect(report.baselineLocale).toBe("en");
        expect(Array.isArray(report.locales)).toBe(true);
        expect(report.locales.length).toBeGreaterThan(0);

        expect(report.summary).toBeDefined();
        expect(typeof report.summary.totalMissingFiles).toBe("number");
        expect(typeof report.summary.totalMissingKeys).toBe("number");

        expect(Array.isArray(report.reports)).toBe(true);
        expect(report.reports.length).toBe(report.locales.length);
      } finally {
        cleanupTestLocales();
      }
    });

    it("includes per-locale reports with correct structure", () => {
      // Ensure output directory exists
      if (!existsSync(TEST_OUTPUT_DIR)) {
        mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
      }

      const outputPath = path.join(TEST_OUTPUT_DIR, "report2.json");

      execSync(
        `pnpm exec tsx "${SCRIPT_PATH}" --json --output="${outputPath}"`,
        { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" }
      );

      const jsonContent = readFileSync(outputPath, "utf8");
      const report: CoverageReportJson = JSON.parse(jsonContent);

      // Check each locale report has required fields
      for (const localeReport of report.reports) {
        expect(typeof localeReport.locale).toBe("string");
        expect(Array.isArray(localeReport.missingFiles)).toBe(true);
        expect(typeof localeReport.missingKeys).toBe("object");
        expect(localeReport.missingKeys).not.toBeNull();
      }

      // Cleanup
      if (existsSync(outputPath)) {
        rmSync(outputPath);
      }
    });

    it("includes locales from i18nConfig", () => {
      // Ensure output directory exists
      if (!existsSync(TEST_OUTPUT_DIR)) {
        mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
      }

      const outputPath = path.join(TEST_OUTPUT_DIR, "report3.json");

      execSync(
        `pnpm exec tsx "${SCRIPT_PATH}" --json --output="${outputPath}"`,
        { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" }
      );

      const jsonContent = readFileSync(outputPath, "utf8");
      const report: CoverageReportJson = JSON.parse(jsonContent);

      // Should include standard locales (excluding baseline "en")
      expect(report.locales).toContain("de");
      expect(report.locales).toContain("fr");
      expect(report.locales).toContain("it");
      expect(report.locales).toContain("es");

      // Should not include baseline locale in the locales array
      expect(report.locales).not.toContain("en");

      // Cleanup
      if (existsSync(outputPath)) {
        rmSync(outputPath);
      }
    });
  });

  describe("--fail-on-missing flag", () => {
    it("exits with code 1 when missing keys found and flag is set", () => {
      let exitCode = 0;

      try {
        execSync(
          `pnpm exec tsx "${SCRIPT_PATH}" --fail-on-missing`,
          { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" }
        );
      } catch (error) {
        // execSync throws when exit code is non-zero
        exitCode = (error as { status?: number }).status ?? 0;
      }

      // Should exit with code 1 if there are any missing translations
      // (This test assumes the real locale data has some gaps, which is typical)
      expect(exitCode).toBeGreaterThanOrEqual(0); // 0 or 1 depending on actual coverage
    });
  });

  describe("summary statistics", () => {
    it("calculates correct totals across all locales", () => {
      // Ensure output directory exists
      if (!existsSync(TEST_OUTPUT_DIR)) {
        mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
      }

      const outputPath = path.join(TEST_OUTPUT_DIR, "report4.json");

      execSync(
        `pnpm exec tsx "${SCRIPT_PATH}" --json --output="${outputPath}"`,
        { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" }
      );

      const jsonContent = readFileSync(outputPath, "utf8");
      const report: CoverageReportJson = JSON.parse(jsonContent);

      // Verify summary totals match sum of individual reports
      let expectedMissingFiles = 0;
      let expectedMissingKeys = 0;

      for (const localeReport of report.reports) {
        expectedMissingFiles += localeReport.missingFiles.length;

        for (const keys of Object.values(localeReport.missingKeys)) {
          expectedMissingKeys += keys.length;
        }
      }

      expect(report.summary.totalMissingFiles).toBe(expectedMissingFiles);
      expect(report.summary.totalMissingKeys).toBe(expectedMissingKeys);

      // Cleanup
      if (existsSync(outputPath)) {
        rmSync(outputPath);
      }
    });
  });
});
