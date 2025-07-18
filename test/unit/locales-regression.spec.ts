// test/unit/locales-regression.spec.ts

import { resolveLocale } from "@i18n/locales";
import { assertLocale } from "@platform-core/src/products";
import { LOCALES, type Locale } from "@types";
import { parseMultilingualInput } from "@ui/src/utils/multilingual";
import { getSeo } from "../../packages/template-app/src/lib/seo";

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: () => Promise.resolve({ seo: {} }),
}));

describe("locale handlers support all locales", () => {
  const handlers = [
    (locale: Locale) => resolveLocale(locale),
    (locale: Locale) => assertLocale(locale),
    async (locale: Locale) => {
      await getSeo(locale);
    },
    (locale: Locale) => parseMultilingualInput(`title_${locale}`, LOCALES),
  ];

  LOCALES.forEach((locale) => {
    it(`handlers accept '${locale}'`, async () => {
      for (const fn of handlers) {
        await expect(() => fn(locale)).not.toThrow();
      }
    });
  });
});
