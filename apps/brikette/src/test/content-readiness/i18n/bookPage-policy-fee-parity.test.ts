/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { type AppLanguage,i18nConfig } from "@/i18n.config";

const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");

type BookPageLocale = {
  policies?: {
    title?: unknown;
    items?: unknown;
    footer?: unknown;
  };
};

const SUPPORTED_LOCALES = (i18nConfig.supportedLngs ?? []) as AppLanguage[];

describe.each(SUPPORTED_LOCALES)("bookPage.policies parity (%s)", (locale) => {
  it("exists and includes mandatory fee/policy lines", () => {
    const filePath = path.join(LOCALES_ROOT, locale, "bookPage.json");
    expect(existsSync(filePath)).toBe(true);

    const raw = readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as BookPageLocale;

    expect(typeof data.policies?.title).toBe("string");
    expect((data.policies?.title as string).trim().length).toBeGreaterThan(0);

    const items = data.policies?.items;
    expect(Array.isArray(items)).toBe(true);

    const lines = items as unknown[];
    expect(lines.length).toBeGreaterThanOrEqual(5);

    for (const line of lines) {
      expect(typeof line).toBe("string");
      expect((line as string).trim().length).toBeGreaterThan(0);
    }

    // Safety assertion: the first line should represent a mandatory fee (city/tourist tax).
    const taxLine = String(lines[0]);
    expect(taxLine).toMatch(/\d/);
    expect(taxLine).toMatch(/€|\bEUR\b/i);

    expect(typeof data.policies?.footer).toBe("string");
    expect((data.policies?.footer as string).trim().length).toBeGreaterThan(0);
  });
});
