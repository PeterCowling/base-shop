import React from "react";
import { render, screen } from "@testing-library/react";

import { ThemeToggle } from "../src/molecules/ThemeToggle";

const themeState: { isDark: boolean } = { isDark: false };
const sharedTranslations = new Map<string, string>();
const appTranslations = new Map<string, string>();
const localizedResources = new Map<string, string>();
let activeLanguage = "en";

jest.mock("../src/hooks/useTheme", () => ({
  useTheme: () => ({
    isDark: themeState.isDark,
    setTheme: jest.fn(),
  }),
}));

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => sharedTranslations.get(key) ?? key,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => appTranslations.get(key) ?? key,
    i18n: {
      language: activeLanguage,
      resolvedLanguage: activeLanguage,
      getResource: (lang: string, namespace: string, key: string) => {
        if (lang !== activeLanguage || namespace !== "translation") {
          return undefined;
        }
        return localizedResources.get(key);
      },
    },
  }),
}));

describe("ThemeToggle localized labels", () => {
  beforeEach(() => {
    themeState.isDark = false;
    activeLanguage = "en";
    sharedTranslations.clear();
    appTranslations.clear();
    localizedResources.clear();
  });

  it("prefers the active locale translation resource when present", () => {
    activeLanguage = "ar";
    localizedResources.set("themeToggle.enableDark", "فعّل الوضع الداكن");
    localizedResources.set("themeToggle.switchToDark", "التبديل إلى الوضع الداكن");
    sharedTranslations.set("themeToggle.enableDark", "Enable dark mode");
    appTranslations.set("themeToggle.enableDark", "Enable dark mode");

    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "فعّل الوضع الداكن");
    expect(screen.getByRole("button")).toHaveAttribute("title", "التبديل إلى الوضع الداكن");
  });

  it("falls back to shared @acme/i18n messages when the locale bundle is missing", () => {
    sharedTranslations.set("themeToggle.enableDark", "Modo scuro attivo");
    sharedTranslations.set("themeToggle.switchToDark", "Passa al tema scuro");

    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Modo scuro attivo");
    expect(screen.getByRole("button")).toHaveAttribute("title", "Passa al tema scuro");
  });

  it("falls back to app translations when neither locale resources nor shared messages resolve", () => {
    themeState.isDark = true;
    appTranslations.set("themeToggle.enableLight", "Enable light mode");
    appTranslations.set("themeToggle.switchToLight", "Switch to light mode");

    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Enable light mode");
    expect(screen.getByRole("button")).toHaveAttribute("title", "Switch to light mode");
  });
});
