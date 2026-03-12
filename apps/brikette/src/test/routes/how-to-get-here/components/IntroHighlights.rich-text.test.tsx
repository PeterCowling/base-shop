/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001 locale fixture audit reads repo-local howToGetHere namespace files by known language folders. [ttl=2026-12-31] */
import "@testing-library/jest-dom";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { render } from "@testing-library/react";
import { detectRenderedI18nPlaceholders } from "@tests/utils/detectRenderedI18nPlaceholders";
import type { TFunction } from "i18next";

import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { IntroHighlights } from "@/routes/how-to-get-here/components/IntroHighlights";
import { SEA_HORSE_SHUTTLE_URL } from "@/routes/how-to-get-here/styles";

type LocaleDictionary = Record<string, unknown>;

type MockTransProps = {
  components?: Record<string, unknown>;
  defaults?: string;
  i18nKey: string;
  t?: (key: string, options?: Record<string, unknown>) => string;
  values?: Record<string, unknown>;
};

const LOCALES_ROOT = path.resolve(__dirname, "../../../../locales");

const getNestedValue = (dictionary: LocaleDictionary, key: string): unknown =>
  key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dictionary);

const interpolate = (template: string, values: Record<string, unknown> = {}): string =>
  template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, token: string) => {
    const value = values[token.trim()];
    return value === undefined || value === null ? "" : String(value);
  });

jest.mock("react-i18next", () => {
  const React = require("react") as typeof import("react");

  const renderRichText = (template: string, components: Record<string, unknown> = {}) => {
    const nodes: Array<import("react").ReactNode> = [];
    const pattern = /<([A-Z][A-Za-z0-9]*)>(.*?)<\/\1>/g;
    let cursor = 0;
    let match: RegExpExecArray | null = pattern.exec(template);

    while (match) {
      const [fullMatch, tagName, innerText] = match;
      const matchIndex = match.index;

      if (matchIndex > cursor) {
        nodes.push(template.slice(cursor, matchIndex));
      }

      const component = components[tagName];
      if (React.isValidElement(component)) {
        nodes.push(React.cloneElement(component, { key: `${tagName}-${matchIndex}` }, innerText));
      } else {
        nodes.push(fullMatch);
      }

      cursor = matchIndex + fullMatch.length;
      match = pattern.exec(template);
    }

    if (cursor < template.length) {
      nodes.push(template.slice(cursor));
    }

    return nodes;
  };

  return {
    Trans: ({ components, defaults, i18nKey, t, values }: MockTransProps) => {
      const template = typeof t === "function"
        ? t(i18nKey, { defaultValue: defaults ?? "", ...(values ?? {}) })
        : defaults ?? "";
      return React.createElement(React.Fragment, null, ...renderRichText(template, components));
    },
  };
});

const loadHowToGetHereDictionary = (lang: AppLanguage): LocaleDictionary => {
  const filePath = path.join(LOCALES_ROOT, lang, "howToGetHere.json");
  return JSON.parse(readFileSync(filePath, "utf8")) as LocaleDictionary;
};

const createTranslator = (dictionary: LocaleDictionary): TFunction<"howToGetHere"> =>
  ((key: string, options?: Record<string, unknown>) => {
    const resolved = getNestedValue(dictionary, key);
    if (typeof resolved === "string") {
      return interpolate(resolved, options);
    }
    if (Array.isArray(resolved) || (resolved && typeof resolved === "object")) {
      return resolved;
    }
    const fallback = options?.defaultValue;
    if (typeof fallback === "string") {
      return interpolate(fallback, options);
    }
    return key;
  }) as unknown as TFunction<"howToGetHere">;

const localeUnderTest = readdirSync(LOCALES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((lang): lang is AppLanguage => (i18nConfig.supportedLngs as string[]).includes(lang))
  .sort();

describe("IntroHighlights rich-text rendering", () => {
  it.each(localeUnderTest)("renders %s intro copy without leaking raw Trans tags", (lang) => {
    const dictionary = loadHowToGetHereDictionary(lang);
    const t = createTranslator(dictionary);
    const taxiContact = String(getNestedValue(dictionary, "intro.taxiContact") ?? "+39 379 125 6222");
    const taxiEyebrow = String(getNestedValue(dictionary, "intro.taxiEyebrow") ?? "Taxi");
    const shuttleEyebrow = String(getNestedValue(dictionary, "intro.shuttleEyebrow") ?? "Shuttle");

    const { container } = render(
      <IntroHighlights
        lang={lang}
        t={t}
        introKey="intro"
        taxiEyebrow={taxiEyebrow}
        taxiContact={taxiContact}
        shuttleEyebrow={shuttleEyebrow}
      />,
    );

    const renderedText = container.textContent ?? "";
    expect(detectRenderedI18nPlaceholders(renderedText)).toEqual([]);
    expect(renderedText).not.toMatch(/<\/?(?:Link|Strong)>/);
    expect(container.querySelectorAll(`a[href="${SEA_HORSE_SHUTTLE_URL}"]`).length).toBeGreaterThanOrEqual(2);

    const emphasisedTaxiContact = Array.from(container.querySelectorAll("strong")).map((node) => node.textContent?.trim());
    expect(emphasisedTaxiContact).toContain(taxiContact);
  });
});
