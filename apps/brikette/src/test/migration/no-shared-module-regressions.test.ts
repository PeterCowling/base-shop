import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

const EXCLUDED_DIRS = new Set(["test", "locales", "node_modules"]);
const INCLUDED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const FORBIDDEN_IMPORT_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "CfImage local component", pattern: /from\s+["']@\/components\/images\/CfImage["']/ },
  { label: "buildCfImageUrl local module", pattern: /from\s+["']@\/lib\/buildCfImageUrl["']/ },
  { label: "useResponsiveImage local hook", pattern: /from\s+["']@\/hooks\/useResponsiveImage["']/ },
];

const JSONLD_DIR_MATCH = /components\/seo|components\/assistance\/quick-links-section/;
const JSON_STRINGIFY_PATTERN = /\bJSON\.stringify\b/;

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

function findForbiddenImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  const matches: string[] = [];
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const rule of FORBIDDEN_IMPORT_PATTERNS) {
      if (rule.pattern.test(line)) {
        matches.push(`${filePath}:${index + 1} (${rule.label})`);
      }
    }
  }
  return matches;
}

function findJsonLdStringify(filePath: string): string[] {
  if (!JSONLD_DIR_MATCH.test(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const matches: string[] = [];
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (JSON_STRINGIFY_PATTERN.test(line)) {
      matches.push(`${filePath}:${index + 1}`);
    }
  }
  return matches;
}

describe("shared-module guardrails", () => {
  it("does not reintroduce local image pipeline imports", () => {
    const files = walk(ROOT);
    const offenders = files.flatMap(findForbiddenImports);
    expect(offenders).toEqual([]);
  });

  it("does not stringify JSON-LD payloads in SEO/assistance components", () => {
    const files = walk(ROOT);
    const offenders = files.flatMap(findJsonLdStringify);
    expect(offenders).toEqual([]);
  });
});
