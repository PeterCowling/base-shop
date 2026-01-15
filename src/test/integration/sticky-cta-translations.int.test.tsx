// src/test/integration/sticky-cta-translations.int.test.tsx

import { render, screen } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

import StickyBookNow from "@acme/ui/organisms/StickyBookNow";
import { i18nConfig } from "@/i18n.config";

import enTranslation from "@/locales/en/translation.json";
import esTranslation from "@/locales/es/translation.json";
import jaTranslation from "@/locales/ja/translation.json";

import enTokens from "@/locales/en/_tokens.json";
import esTokens from "@/locales/es/_tokens.json";
import jaTokens from "@/locales/ja/_tokens.json";

const originalLocation = window.location;

const resources = {
  en: { translation: enTranslation, _tokens: enTokens },
  es: { translation: esTranslation, _tokens: esTokens },
  ja: { translation: jaTranslation, _tokens: jaTokens },
} as const;

type SupportedTestLang = keyof typeof resources;

const stickyCopies: Record<SupportedTestLang, { directHeadline: string; directSubcopy: string }> = {
  en: (enTranslation as { stickyCta: { directHeadline: string; directSubcopy: string } }).stickyCta,
  es: (esTranslation as { stickyCta: { directHeadline: string; directSubcopy: string } }).stickyCta,
  ja: (jaTranslation as { stickyCta: { directHeadline: string; directSubcopy: string } }).stickyCta,
};

async function renderSticky(lang: SupportedTestLang) {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    ...i18nConfig,
    lng: lang,
    fallbackLng: "en",
    resources,
    ns: ["translation", "_tokens"],
    defaultNS: "translation",
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <StickyBookNow lang={lang} />
    </I18nextProvider>
  );
}

const originalLocation = window.location;

function resetWindowLocation() {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: {
      search: "?checkin=2025-07-01&checkout=2025-07-03&pax=2",
      href: "",
      pathname: "/en",
    },
  });
}

describe("StickyBookNow translations", () => {
  beforeEach(() => {
    resetWindowLocation();
    window.sessionStorage.clear();
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it.each<SupportedTestLang>(["en", "es", "ja"])("renders locale-specific copy for %s", async (lang) => {
    await renderSticky(lang);
    const expected = stickyCopies[lang];

    expect(await screen.findByText(expected.directHeadline)).toBeInTheDocument();
    expect(screen.getByText(expected.directSubcopy)).toBeInTheDocument();
  });
});