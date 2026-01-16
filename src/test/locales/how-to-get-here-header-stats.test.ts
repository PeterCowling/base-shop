import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { i18nConfig } from "@/i18n.config";

const HOW_TO_GET_HERE_FILENAME = "howToGetHere.json";
const SUPPORTED_LANGUAGES = i18nConfig.supportedLngs;
const LOCALES_DIR = path.join(process.cwd(), "src", "locales");

type StatsMap = Record<string, string>;

const englishStats = loadStats("en");
const statKeys = Object.keys(englishStats);

describe("howToGetHere header stats localisation", () => {
  it("defines baseline stat keys for English", () => {
    expect(statKeys.length).toBeGreaterThan(0);
    for (const key of statKeys) {
      expect(englishStats[key], `Missing ${key} in English stats`).toBeTruthy();
    }
  });

  for (const locale of SUPPORTED_LANGUAGES) {
    if (locale === "en") continue;

    it(`${locale} overrides English header stats`, () => {
      const stats = loadStats(locale);
      for (const key of statKeys) {
        expect(stats[key], `${locale}: header.stats.${key} is missing`).toBeTruthy();

        const translated = normalize(stats[key]);
        const englishValue = normalize(englishStats[key]);

        expect(translated.length, `${locale}: ${key} is empty`).toBeGreaterThan(0);
        expect(
          translated,
          `${locale}: header.stats.${key} still matches the English fallback`,
        ).not.toBe(englishValue);
      }
    });
  }
});

function loadStats(locale: string): StatsMap {
  const filePath = path.join(LOCALES_DIR, locale, HOW_TO_GET_HERE_FILENAME);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing locale file for ${locale}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as {
    header?: { stats?: Record<string, unknown> };
  };
  const stats = parsed.header?.stats;
  if (!stats) {
    throw new Error(`Missing header.stats block for ${locale}`);
  }

  return Object.fromEntries(
    Object.entries(stats ?? {}).map(([key, value]) => [key, String(value ?? "")]),
  );
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}