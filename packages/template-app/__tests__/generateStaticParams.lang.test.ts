/** @jest-environment node */
import { LOCALES } from "@acme/i18n";

import generateStaticParams from "../src/app/[lang]/generateStaticParams";

describe("[lang]/generateStaticParams", () => {
  it("returns one param per supported locale", () => {
    const params = generateStaticParams();
    expect(Array.isArray(params)).toBe(true);
    expect(params).toHaveLength(LOCALES.length);
    // Ensure all locales are represented as { lang }
    for (const locale of LOCALES) {
      expect(params).toContainEqual({ lang: locale });
    }
  });
});

