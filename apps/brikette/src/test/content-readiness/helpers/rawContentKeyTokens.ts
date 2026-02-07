/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import fs from "node:fs";
import path from "node:path";

import { walkJsonStrings, type JsonPath } from "./jsonWalker";
import { resolveGuideContentFileAllowlist } from "./guideFilters";

export type RawContentKeyTokenMatch = {
  locale: string;
  file: string;
  path: JsonPath;
  value: string;
};

const DEFAULT_PLACEHOLDER_REGEX = /^content\.[^\s]+$/u;

export function findRawContentKeyTokens(options: {
  localesDir: string;
  placeholderRegex?: RegExp;
}): RawContentKeyTokenMatch[] {
  const { localesDir, placeholderRegex = DEFAULT_PLACEHOLDER_REGEX } = options;
  const allowlist = resolveGuideContentFileAllowlist();
  const locales = fs
    .readdirSync(localesDir)
    .filter((locale) => {
      if (locale.startsWith("_")) return false;
      if (locale === "en") return false;
      const stats = fs.statSync(path.join(localesDir, locale));
      return stats.isDirectory();
    });

  const matches: RawContentKeyTokenMatch[] = [];

  for (const locale of locales) {
    const localeGuidesDir = path.join(localesDir, locale, "guides", "content");
    if (!fs.existsSync(localeGuidesDir)) continue;

    const files = fs.readdirSync(localeGuidesDir).filter((file) => file.endsWith(".json"));
    for (const fileName of files) {
      if (allowlist && !allowlist.has(`guides/content/${fileName}`)) continue;
      const filePath = path.join(localeGuidesDir, fileName);
      const json = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      walkJsonStrings(json, ({ path: jsonPath, value }) => {
        const trimmed = value.trim();
        if (placeholderRegex.test(trimmed)) {
          matches.push({
            locale,
            file: fileName,
            path: jsonPath,
            value: trimmed,
          });
        }
      });
    }
  }

  return matches;
}

export function formatRawContentKeyTokensSample(matches: RawContentKeyTokenMatch[], maxItems = 20): string {
  return matches
    .slice(0, maxItems)
    .map((match) => `${match.locale} :: ${match.file} :: ${match.path} :: "${match.value}"`)
    .join("\n");
}
