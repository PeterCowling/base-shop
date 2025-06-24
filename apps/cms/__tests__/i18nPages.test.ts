// packages/platform-core/__tests__/localeHelpers.test.tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import generateStaticParams from "../src/app/[lang]/generateStaticParams";
import LocaleLayout       from "../src/app/[lang]/layout";

describe("i18n helpers", () => {
  it("generateStaticParams yields locales", () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([
        { lang: "en" },
        { lang: "de" },
        { lang: "it" },
      ]),
    );
  });

  it("layout wraps children with TranslationsProvider", async () => {
    const html = renderToStaticMarkup(
      await LocaleLayout({
        children: <div id="c" />,                 // any ReactNode
        params: Promise.resolve({ lang: "de" }),  // <- Promise<{ lang }>
      }),
    );

    expect(html).toContain('id="c"');
  });
});
