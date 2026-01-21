/* eslint-disable security/detect-non-literal-fs-filename -- TEST-HTGH-1: Paths are constrained to repo-local locale directories. [ttl=2026-12-31] */
import fs from "node:fs";
import path from "node:path";

type DefinitionsDoc = {
  routes?: Record<string, { contentKey?: string }>;
};

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, "utf8")) as T;

describe("how-to-get-here split route content files", () => {
  test("every locale has JSON for every route definition contentKey", () => {
    const repoRoot = process.cwd();
    const localesRoot = path.join(repoRoot, "src", "locales");
    const defsPath = path.join(repoRoot, "src", "data", "how-to-get-here", "routes.json");

    if (!fs.existsSync(defsPath)) {
      throw new Error(`Missing how-to-get-here route definitions JSON: ${defsPath}`);
    }
    if (!fs.existsSync(localesRoot)) {
      throw new Error(`Missing locales directory: ${localesRoot}`);
    }

    const defs = readJson<DefinitionsDoc>(defsPath);
    const routes = defs.routes ?? {};
    const contentKeys = Object.entries(routes)
      .map(([slug, entry]) => {
        const key = entry?.contentKey;
        if (typeof key !== "string" || !key.trim()) {
          throw new Error(`Route "${slug}" is missing a valid contentKey in ${defsPath}`);
        }
        return key;
      })
      .sort((a, b) => a.localeCompare(b));

    const locales = fs
      .readdirSync(localesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const missing: Array<{ locale: string; contentKey: string; filePath: string }> = [];

    for (const locale of locales) {
      for (const contentKey of contentKeys) {
        const filePath = path.join(
          localesRoot,
          locale,
          "how-to-get-here",
          "routes",
          `${contentKey}.json`,
        );
        if (!fs.existsSync(filePath)) {
          missing.push({ locale, contentKey, filePath });
        }
      }
    }

    if (missing.length === 0) return;

    const sample = missing
      .slice(0, 50)
      .map((entry) => `${entry.locale} :: ${entry.contentKey} :: ${entry.filePath}`)
      .join("\n");

    throw new Error(
      [
        `Missing ${missing.length} how-to-get-here split route JSON files.`,
        "Sample:",
        sample,
      ].join("\n"),
    );
  });
});

