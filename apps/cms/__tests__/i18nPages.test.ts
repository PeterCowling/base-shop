// apps/cms/__tests__/i18nPages.test.ts
// -------------------------------------------------------
// This test file is now a proper ESM / JSX module.
// -------------------------------------------------------

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Static imports because Next 12-15 can handle literal “[lang]” folders.
import { LOCALES } from "@acme/i18n";
import generateStaticParams from "../src/app/[lang]/generateStaticParams";
import LocaleLayout from "../src/app/[lang]/layout";

describe("i18n helpers", () => {
  it("generateStaticParams yields locales", () => {
    const params = generateStaticParams();

    for (const locale of LOCALES) {
      expect(params).toContainEqual({ lang: locale });
    }

    expect(params).toMatchSnapshot();
  });

  it("layout wraps children with TranslationsProvider", async () => {
    const html = renderToStaticMarkup(
      await LocaleLayout({
        children: React.createElement("div", { id: "c" }),
        // Next 15 delivers a *Promise*, so emulate that here.
        params: Promise.resolve({ lang: "de" }),
      })
    );

    expect(html).toContain('id="c"');
  });
});
