import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

const EXCLUDED_DIRS = new Set(["test", "locales"]);
const INCLUDED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".json"]);

const LEGACY_GUIDES_PATTERN = /['"]\/guides(\/|['"])/;

function shouldScanFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return INCLUDED_EXTS.has(ext);
}

function walk(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findLegacyGuidesUsage(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  const matches: string[] = [];
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (LEGACY_GUIDES_PATTERN.test(line)) {
      matches.push(`${filePath}:${index + 1}`);
    }
  }
  return matches;
}

describe("legacy /guides URL guardrail", () => {
  it("does not generate legacy /guides URLs in source", () => {
    const files = walk(ROOT);
    const offenders = files.flatMap(findLegacyGuidesUsage);
    expect(offenders).toEqual([]);
  });
});
