// apps/cms/__tests__/i18nPages.test.ts
// -------------------------------------------------------
// This test file is now a proper ESM / JSX module.
// -------------------------------------------------------

import React, { Children, isValidElement } from "react";

// Static imports because Next 12-15 can handle literal “[lang]” folders.
import { LOCALES } from "@acme/i18n";
import { TranslationsProvider } from "@acme/i18n/Translations";

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
    const tree = await LocaleLayout({
      children: React.createElement("div", { id: "c" }),
      // Next 15 delivers a *Promise*, so emulate that here.
      params: Promise.resolve({ lang: "de" }),
    });

    // Root element should be the translations provider
    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(TranslationsProvider);

    // Ensure our child is somewhere in the tree
    const hasChild = (node: React.ReactNode): boolean =>
      isValidElement(node)
        ? (node.props as { id?: string }).id === "c" ||
          Children.toArray((node.props as { children?: React.ReactNode }).children).some(hasChild)
        : false;

    expect(hasChild(tree)).toBe(true);
  });
});
