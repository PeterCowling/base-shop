/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");

function listJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listJsonFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(fullPath);
    }
  }
  return out;
}

describe("locale JSON should parse", () => {
  it("parses every src/locales/*/**/*.json file", () => {
    // Quick sanity: LOCALES_ROOT should exist and be a directory.
    expect(statSync(LOCALES_ROOT).isDirectory()).toBe(true);

    const files = listJsonFiles(LOCALES_ROOT);
    const failures: Array<{ file: string; error: string }> = [];

    for (const file of files) {
      try {
        JSON.parse(readFileSync(file, "utf8"));
      } catch (error) {
        failures.push({
          file: path.relative(process.cwd(), file),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (failures.length === 0) return;

    const sample = failures
      .slice(0, 20)
      .map((f) => `${f.file}: ${f.error}`)
      .join("\n");

    throw new Error(
      [
        `Found ${failures.length} malformed locale JSON file(s) under src/locales/.`,
        "Sample:",
        sample,
      ].join("\n"),
    );
  });
});

