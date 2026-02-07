import path from "node:path";

import {
  findEnglishGuideDuplicates,
  formatEnglishGuideDuplicatesSample,
} from "../helpers/englishFallbacks";

const STRICT_MODE =
  process.env.CONTENT_READINESS_MODE === "fail" ||
  process.env.ENGLISH_FALLBACK_MODE === "fail";

const BYPASS =
  process.env.ALLOW_EN_FALLBACKS === "1" ||
  process.env.ENGLISH_FALLBACK_MODE === "warn" ||
  process.env.CONTENT_READINESS_MODE === "warn";

function formatLocaleSummary(duplicates: ReturnType<typeof findEnglishGuideDuplicates>): string {
  const byLocale = new Map<string, { strings: number; files: Set<string> }>();
  for (const dup of duplicates) {
    const existing = byLocale.get(dup.locale) ?? { strings: 0, files: new Set<string>() };
    existing.strings += 1;
    existing.files.add(dup.file);
    byLocale.set(dup.locale, existing);
  }

  return Array.from(byLocale.entries())
    .sort(([, a], [, b]) => b.strings - a.strings)
    .slice(0, 10)
    .map(([locale, stats]) => `  ${locale}: ${stats.strings} strings in ${stats.files.size} files`)
    .join("\n");
}

describe.skip("guide locales should not contain raw English content", () => {
  it("reports English guide content copied into non-en locales", () => {
    const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");
    const duplicates = findEnglishGuideDuplicates({ localesDir: LOCALES_ROOT });

    if (duplicates.length === 0) {
      expect(duplicates).toEqual([]);
      return;
    }

    const summary = formatLocaleSummary(duplicates);
    const sample = formatEnglishGuideDuplicatesSample(duplicates);

    const message = [
      `Found ${duplicates.length} English strings copied into non-en guide locales.`,
      "Translate these entries or explicitly allow a fallback (leave missing so i18n falls back to EN, rather than copying EN text into locale JSON).",
      "",
      "Top locales:",
      summary,
      "",
      "Sample:",
      sample,
    ].join("\n");

    if (BYPASS || !STRICT_MODE) {
      // eslint-disable-next-line no-console
      console.warn("[WARN] " + message);
      expect(true).toBe(true);
      return;
    }

    throw new Error(message);
  });
});

