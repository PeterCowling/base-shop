import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

const APP_ROOT = path.resolve(__dirname, "../../../..");
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

function setupTestLocales(): void {
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_LOCALES_DIR, { recursive: true });

  const enDir = path.join(TEST_LOCALES_DIR, "en");
  mkdirSync(path.join(enDir, "guides", "content"), { recursive: true });
  writeFileSync(
    path.join(enDir, "guides", "content", "testGuide.json"),
    JSON.stringify(
      {
        seo: { title: "Test Guide", description: "Test description" },
        intro: { title: "Welcome", body: "Introduction text" },
        sections: [{ id: "sec1", title: "Section 1", body: "Content here" }],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(enDir, "common.json"),
    JSON.stringify({ greeting: "Hello", farewell: "Goodbye" }, null, 2),
  );

  const deDir = path.join(TEST_LOCALES_DIR, "de");
  mkdirSync(path.join(deDir, "guides", "content"), { recursive: true });
  writeFileSync(
    path.join(deDir, "common.json"),
    JSON.stringify({ greeting: "Hallo" }, null, 2),
  );

  const frDir = path.join(TEST_LOCALES_DIR, "fr");
  mkdirSync(path.join(frDir, "guides", "content"), { recursive: true });
  writeFileSync(
    path.join(frDir, "guides", "content", "testGuide.json"),
    JSON.stringify(
      {
        seo: { title: "Guide de test", description: "Description du test" },
        intro: { title: "Bienvenue", body: "Texte d'introduction" },
        sections: [{ id: "sec1", title: "Section 1", body: "Contenu ici" }],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(frDir, "common.json"),
    JSON.stringify({ greeting: "Bonjour", farewell: "Au revoir" }, null, 2),
  );
}

function cleanupTestLocales(): void {
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
}

function runCoverageJson(args: string[], outputFile: string): CoverageReportJson {
  execSync(
    `pnpm exec tsx "${SCRIPT_PATH}" --json --output="${outputFile}" ${args.join(" ")}`,
    { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" },
  );
  return JSON.parse(readFileSync(outputFile, "utf8")) as CoverageReportJson;
}

describe("check-i18n-coverage CLI", () => {
  describe("JSON output format", () => {
    it("outputs valid JSON with correct schema structure", () => {
      setupTestLocales();
      try {
        const outputPath = path.join(TEST_OUTPUT_DIR, "report.json");
        const report = runCoverageJson(
          [`--locales-root="${TEST_LOCALES_DIR}"`, "--locales=de,fr"],
          outputPath,
        );

        expect(report.schemaVersion).toBe(1);
        expect(report.baselineLocale).toBe("en");
        expect(report.locales).toEqual(["de", "fr"]);
        expect(report.summary).toEqual({ totalMissingFiles: 1, totalMissingKeys: 1 });
        expect(report.reports.map((r) => r.locale)).toEqual(["de", "fr"]);

        const de = report.reports.find((r) => r.locale === "de");
        expect(de?.missingFiles).toEqual(["guides/content/testGuide.json"]);
        expect(de?.missingKeys).toEqual({ "common.json": ["farewell"] });

        const fr = report.reports.find((r) => r.locale === "fr");
        expect(fr?.missingFiles).toEqual([]);
        expect(fr?.missingKeys).toEqual({});
      } finally {
        cleanupTestLocales();
      }
    });

    it("includes per-locale reports with correct structure", () => {
      setupTestLocales();
      try {
        const outputPath = path.join(TEST_OUTPUT_DIR, "report2.json");
        const report = runCoverageJson(
          [`--locales-root="${TEST_LOCALES_DIR}"`, "--locales=de,fr"],
          outputPath,
        );

        for (const localeReport of report.reports) {
          expect(typeof localeReport.locale).toBe("string");
          expect(Array.isArray(localeReport.missingFiles)).toBe(true);
          expect(typeof localeReport.missingKeys).toBe("object");
          expect(localeReport.missingKeys).not.toBeNull();
        }
      } finally {
        cleanupTestLocales();
      }
    });

    it("includes locales from i18nConfig by default", () => {
      setupTestLocales();
      try {
        const outputPath = path.join(TEST_OUTPUT_DIR, "report3.json");
        const report = runCoverageJson([`--locales-root="${TEST_LOCALES_DIR}"`], outputPath);

        expect(report.locales).toContain("de");
        expect(report.locales).toContain("fr");
        expect(report.locales).toContain("it");
        expect(report.locales).toContain("es");
        expect(report.locales).not.toContain("en");
      } finally {
        cleanupTestLocales();
      }
    });
  });

  describe("--fail-on-missing flag", () => {
    it("exits with code 1 when missing keys found and flag is set", () => {
      setupTestLocales();
      try {
        execSync(
          `pnpm exec tsx "${SCRIPT_PATH}" --fail-on-missing --locales-root="${TEST_LOCALES_DIR}" --locales=de,fr`,
          { cwd: APP_ROOT, encoding: "utf8", stdio: "pipe" },
        );
        throw new Error("Expected script to exit non-zero in --fail-on-missing mode");
      } catch (error) {
        const exitCode = (error as { status?: number }).status;
        expect(exitCode).toBe(1);
      } finally {
        cleanupTestLocales();
      }
    });
  });

  describe("summary statistics", () => {
    it("calculates correct totals across all locales", () => {
      setupTestLocales();
      try {
        const outputPath = path.join(TEST_OUTPUT_DIR, "report4.json");
        const report = runCoverageJson(
          [`--locales-root="${TEST_LOCALES_DIR}"`, "--locales=de,fr"],
          outputPath,
        );

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
      } finally {
        cleanupTestLocales();
      }
    });
  });
});

