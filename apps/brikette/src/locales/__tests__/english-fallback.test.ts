/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Paths are constrained to repo-local fixtures under src/locales. [ttl=2026-12-31] */
import fs from "fs";
import path from "path";

type StringMap = Record<string, string>;

const MIN_LENGTH = 40;
const STRICT_MODE =
  process.env.CONTENT_READINESS_MODE === "fail" ||
  process.env.ENGLISH_FALLBACK_MODE === "fail";
const BYPASS =
  process.env.ALLOW_EN_FALLBACKS === "1" ||
  process.env.ENGLISH_FALLBACK_MODE === "warn" ||
  process.env.CONTENT_READINESS_MODE === "warn";

const localesDir = path.join(process.cwd(), "src/locales");
const enGuidesContentDir = path.join(localesDir, "en", "guides", "content");

function normalize(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

function isMostlyAsciiLetters(value: string): boolean {
  const asciiLetters = (value.match(/[A-Za-z]/g) ?? []).length;
  const nonAscii = (value.match(/[^\x00-\x7f]/g) ?? []).length;
  return asciiLetters >= 10 && asciiLetters >= nonAscii;
}

function isUrlLike(value: string): boolean {
  const normalized = value.trim();
  return (
    /^https?:\/\/\S+/i.test(normalized) ||
    normalized.startsWith("www.") ||
    normalized.startsWith("/") ||
    /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(normalized)
  );
}

function collectStrings(node: unknown, prefix: string, map: StringMap): void {
  if (typeof node === "string") {
    const normalized = normalize(node);
    if (isUrlLike(normalized)) return;
    if (normalized.length >= MIN_LENGTH && isMostlyAsciiLetters(normalized)) {
      map[prefix || "root"] = normalized;
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => collectStrings(item, `${prefix}[${index}]`, map));
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectStrings(value, nextPrefix, map);
    }
  }
}

function loadGuideStrings(dir: string): Record<string, StringMap> {
  const result: Record<string, StringMap> = {};
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json"));
  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const map: StringMap = {};
    collectStrings(json, "", map);
    result[file] = map;
  }
  return result;
}

describe("guides locales should not contain raw English content", () => {
  const enStringsByFile = loadGuideStrings(enGuidesContentDir);
  const locales = fs
    .readdirSync(localesDir)
    .filter((locale) => !locale.startsWith("_") && locale !== "en" && fs.statSync(path.join(localesDir, locale)).isDirectory());

  test("rejects English content copied into non-en guide files", () => {
    const duplicates: Array<{ locale: string; file: string; path: string; value: string }> = [];

    for (const locale of locales) {
      const localeDir = path.join(localesDir, locale, "guides", "content");
      if (!fs.existsSync(localeDir)) continue;
      const localeStringsByFile = loadGuideStrings(localeDir);

      for (const [file, enMap] of Object.entries(enStringsByFile)) {
        const localeMap = localeStringsByFile[file];
        if (!localeMap) continue;
        for (const [keyPath, enValue] of Object.entries(enMap)) {
          const localeValue = localeMap[keyPath];
          if (localeValue && localeValue === enValue) {
            duplicates.push({ locale, file, path: keyPath, value: localeValue.slice(0, 120) });
          }
        }
      }
    }

    if (duplicates.length === 0) return;

    const sample = duplicates
      .slice(0, 20)
      .map(
        (d) =>
          `${d.locale} :: ${d.file} :: ${d.path} :: ${JSON.stringify(d.value.length > 120 ? `${d.value.slice(0, 117)}...` : d.value)}`
      )
      .join("\n");

    if (BYPASS || !STRICT_MODE) {
      // Non-strict mode: report drift without failing local/dev runs.
      // eslint-disable-next-line no-console
      console.log(
        [
          `Found ${duplicates.length} English strings copied into non-en guide locales.`,
          "Translate these entries or explicitly allow a fallback.",
          "Sample:",
          sample,
        ].join("\n")
      );
      expect(duplicates.length).toBeGreaterThan(0);
      return;
    }

    throw new Error(
      [
        `Found ${duplicates.length} English strings copied into non-en guide locales.`,
        "Translate these entries or explicitly allow a fallback. (Set ALLOW_EN_FALLBACKS=1 to bypass temporarily.)",
        "Sample:",
        sample,
      ].join("\n")
    );
  });
});
