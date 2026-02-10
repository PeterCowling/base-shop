import React from "react";
import { render, within } from "@testing-library/react";

import MobileMenu from "../src/organisms/MobileMenu";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...props }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("focus-trap-react", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../src/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("../src/molecules/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

jest.mock("../src/molecules/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "en" },
  }),
}));

function getMobileMenu(): HTMLElement {
  const menu = document.getElementById("mobile-menu");
  expect(menu).not.toBeNull();
  return menu as HTMLElement;
}

describe("Brikette mobile menu state", () => {
  it("keeps links unfocusable and hidden when the menu is closed", () => {
    render(<MobileMenu menuOpen={false} setMenuOpen={jest.fn()} lang="en" />);

    const menu = getMobileMenu();
    expect(menu).toHaveAttribute("aria-hidden", "true");
    expect(menu).toHaveClass("translate-y-full");
    expect(menu).toHaveClass("invisible");
    expect(menu).toHaveClass("pointer-events-none");
    expect(menu).toHaveStyle({ transform: "translate3d(0, 100%, 0)" });

    const links = within(menu).getAllByRole("link", { hidden: true });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("tabindex", "-1");
      expect(link).toHaveClass("min-h-11");
      expect(link).toHaveClass("min-w-11");
    }
  });

  it("exposes links and interaction state when the menu is open", () => {
    render(<MobileMenu menuOpen={true} setMenuOpen={jest.fn()} lang="en" />);

    const menu = getMobileMenu();
    expect(menu).toHaveAttribute("aria-hidden", "false");
    expect(menu).toHaveAttribute("aria-modal", "true");
    expect(menu).toHaveClass("translate-y-0");
    expect(menu).toHaveClass("visible");
    expect(menu).toHaveClass("pointer-events-auto");
    expect(menu).toHaveStyle({ transform: "translate3d(0, 0%, 0)" });

    const links = within(menu).getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("tabindex", "0");
    }
  });
});
