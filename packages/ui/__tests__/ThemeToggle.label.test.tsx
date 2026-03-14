import React from "react";
import { render, screen } from "@testing-library/react";

import { ThemeToggle } from "../src/molecules/ThemeToggle";

const themeState: { isDark: boolean } = { isDark: false };
const sharedTranslations = new Map<string, string>();

jest.mock("../src/hooks/useTheme", () => ({
  useTheme: () => ({
    isDark: themeState.isDark,
    setTheme: jest.fn(),
  }),
}));

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => sharedTranslations.get(key) ?? key,
}));

describe("ThemeToggle localized labels", () => {
  beforeEach(() => {
    themeState.isDark = false;
    sharedTranslations.clear();
  });

  it("uses shared @acme/i18n translations for labels", () => {
    sharedTranslations.set("themeToggle.enableDark", "Modo scuro attivo");
    sharedTranslations.set("themeToggle.switchToDark", "Passa al tema scuro");

    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Modo scuro attivo");
    expect(screen.getByRole("button")).toHaveAttribute("title", "Passa al tema scuro");
  });

  it("falls back to key when no translation exists", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "themeToggle.enableDark");
    expect(screen.getByRole("button")).toHaveAttribute("title", "themeToggle.switchToDark");
  });

  it("uses light-mode labels when dark mode is active", () => {
    themeState.isDark = true;
    sharedTranslations.set("themeToggle.enableLight", "Enable light mode");
    sharedTranslations.set("themeToggle.switchToLight", "Switch to light mode");

    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Enable light mode");
    expect(screen.getByRole("button")).toHaveAttribute("title", "Switch to light mode");
  });
});
