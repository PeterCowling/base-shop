// Test helper to load actual guide content from filesystem
// This ensures guides namespace is properly initialized for tests

import fs from "fs";
import path from "path";

import { __setGuidesModulesForTests } from "@/locales/guides";
import type { GuidesNamespace, ModuleOverrides, ModuleRecord } from "@/locales/guides.types";

/**
 * Load guide content from filesystem for a specific locale.
 * Call this in beforeAll() or beforeEach() to ensure guides are available in tests.
 */
export function loadGuidesForTest(locales: string[] = ["en"]): void {
  const localesRoot = path.resolve(__dirname, "../../locales");

  const legacyModules: ModuleRecord<GuidesNamespace> = {};
  const splitGlobalModules: ModuleRecord = {};
  const splitContentModules: ModuleRecord = {};

  const readJsonFile = <T = unknown>(filePath: string): T => {
    const data = fs.readFileSync(filePath, "utf8");
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
    }
  };

  const makeKey = (locale: string, relativePath: string): string =>
    `./${locale}/${relativePath}`.replace(/\\/g, "/");

  for (const locale of locales) {
    const localeDir = path.join(localesRoot, locale);

    if (!fs.existsSync(localeDir)) {
      console.warn(`Locale directory not found: ${localeDir}`);
      continue;
    }

    // Load legacy guides.json if it exists
    const legacyFile = path.join(localeDir, "guides.json");
    if (fs.existsSync(legacyFile) && fs.statSync(legacyFile).isFile()) {
      legacyModules[makeKey(locale, "guides.json")] = {
        default: readJsonFile<GuidesNamespace>(legacyFile),
      };
    }

    // Load split guides structure
    const guidesDir = path.join(localeDir, "guides");
    if (!fs.existsSync(guidesDir) || !fs.statSync(guidesDir).isDirectory()) {
      continue;
    }

    const stack: Array<{ dir: string; segments: string[] }> = [{ dir: guidesDir, segments: [] }];

    while (stack.length > 0) {
      const { dir, segments } = stack.pop()!;
      const children = fs.readdirSync(dir, { withFileTypes: true });

      for (const child of children) {
        if (child.name.startsWith("_")) continue;
        const nextSegments = [...segments, child.name];
        const absolute = path.join(dir, child.name);

        if (child.isDirectory()) {
          stack.push({ dir: absolute, segments: nextSegments });
          continue;
        }

        if (!child.isFile() || !child.name.endsWith(".json")) {
          continue;
        }

        const relativePath = ["guides", ...nextSegments].join("/");
        const data = readJsonFile(absolute);
        splitGlobalModules[makeKey(locale, relativePath)] = { default: data };

        if (nextSegments[0] === "content" && nextSegments.length === 2) {
          splitContentModules[makeKey(locale, relativePath)] = { default: data };
        }
      }
    }
  }

  const overrides: ModuleOverrides = {
    legacy: legacyModules,
    splitGlobal: splitGlobalModules,
    splitContent: splitContentModules,
  };

  __setGuidesModulesForTests(overrides);
}
