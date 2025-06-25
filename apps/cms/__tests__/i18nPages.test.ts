// packages/platform-core/__tests__/i18Pages.test.tsx
// -------------------------------------------------------
// This test file is now a proper ESM / JSX module.
// -------------------------------------------------------

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Static imports because Next 12-15 can handle literal “[lang]” folders.
import generateStaticParams from "../src/app/[lang]/generateStaticParams";
import LocaleLayout from "../src/app/[lang]/layout";

describe("i18n helpers", () => {
  it("generateStaticParams yields locales", () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([{ lang: "en" }, { lang: "de" }, { lang: "it" }])
    );
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
