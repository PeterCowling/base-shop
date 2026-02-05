/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");

const TARGET_DIR_PATTERNS = [
  `${path.sep}guides${path.sep}content${path.sep}`,
  `${path.sep}how-to-get-here${path.sep}routes${path.sep}`,
];

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  return (
    trimmed.startsWith("/img/") ||
    /\.(?:png|jpe?g|webp|svg|gif)(?:\\?|#|$)/iu.test(trimmed)
  );
}

function scanForMissingAlt(
  value: unknown,
  currentPath: string,
  findings: Array<{ path: string; src: string }>,
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      scanForMissingAlt(value[i], `${currentPath}[${i}]`, findings);
    }
    return;
  }

  if (!isRecord(value)) return;

  const src = value["src"];
  if (typeof src === "string" && looksLikeImageSrc(src)) {
    const alt = value["alt"];
    if (typeof alt !== "string" || alt.trim().length === 0) {
      findings.push({ path: currentPath || "(root)", src });
    }
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    scanForMissingAlt(child, nextPath, findings);
  }
}

describe("locale images should have non-empty alt text", () => {
  it("requires alt for image-like objects in guides/content and how-to-get-here/routes", () => {
    expect(statSync(LOCALES_ROOT).isDirectory()).toBe(true);

    const all = listJsonFiles(LOCALES_ROOT).filter((file) =>
      TARGET_DIR_PATTERNS.some((pattern) => file.includes(pattern)),
    );

    const failures: Array<{ file: string; path: string; src: string }> = [];

    for (const file of all) {
      let json: unknown;
      try {
        json = JSON.parse(readFileSync(file, "utf8")) as unknown;
      } catch {
        // Parsing is validated elsewhere (json-parse.test.ts). Keep this suite focused on alt coverage.
        continue;
      }

      const findings: Array<{ path: string; src: string }> = [];
      scanForMissingAlt(json, "", findings);
      for (const finding of findings) {
        failures.push({
          file: path.relative(process.cwd(), file),
          path: finding.path,
          src: finding.src,
        });
      }
    }

    if (failures.length === 0) return;

    const sample = failures
      .slice(0, 30)
      .map((f) => `${f.file} :: ${f.path} :: ${f.src}`)
      .join("\n");

    throw new Error(
      [
        `Found ${failures.length} image object(s) missing alt text.`,
        "These break accessibility and should be fixed at authoring time.",
        "Sample:",
        sample,
      ].join("\n"),
    );
  });
});

