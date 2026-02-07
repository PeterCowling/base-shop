import React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { act,render, screen } from "@testing-library/react";
import i18next, { type i18n as I18nInstance } from "i18next";

import DesktopHeader from "../src/organisms/DesktopHeader";
import MobileNav from "../src/organisms/MobileNav";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => "/en",
  useParams: () => ({ lang: "en" }),
}));

jest.mock(require.resolve("../src/context/ModalContext"), () => ({
  useModal: () => ({ openModal: jest.fn() }),
}));

jest.mock(require.resolve("../src/hooks/useTheme"), () => ({
  useTheme: () => ({ theme: "light", isDark: false }),
}));

jest.mock(require.resolve("../src/molecules/LanguageSwitcher"), () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
  default: () => <div data-testid="language-switcher" />,
}));

jest.mock(require.resolve("../src/molecules/ThemeToggle"), () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
  default: () => <div data-testid="theme-toggle" />,
}));

const createI18n = async (): Promise<I18nInstance> => {
  const instance = i18next.createInstance();
  await instance.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    ns: ["header", "_tokens"],
    defaultNS: "header",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        header: {
          title: "Hostel Brikette",
          logoAlt: "Hostel Brikette",
        },
        _tokens: {
          checkAvailability: "Check availability",
        },
      },
      es: {
        header: {
          title: "Hostel Brikette",
          logoAlt: "Hostel Brikette",
        },
        _tokens: {
          checkAvailability: "Comprobar disponibilidad",
        },
      },
    },
  });
  return instance;
};

describe("Brikette header CTA translation", () => {
  it("updates the desktop CTA label when the language changes", async () => {
    const i18n = await createI18n();
    render(
      <I18nextProvider i18n={i18n}>
        <DesktopHeader lang="en" />
      </I18nextProvider>
    );

    expect(
      screen.getByRole("button", { name: "Check availability" })
    ).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("es");
    });

    expect(
      screen.getByRole("button", { name: "Comprobar disponibilidad" })
    ).toBeInTheDocument();
  });

  it("updates the mobile CTA label when the language changes", async () => {
    const i18n = await createI18n();
    render(
      <I18nextProvider i18n={i18n}>
        <MobileNav menuOpen={false} setMenuOpen={jest.fn()} />
      </I18nextProvider>
    );

    expect(
      screen.getByRole("button", { name: "Check availability" })
    ).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("es");
    });

    expect(
      screen.getByRole("button", { name: "Comprobar disponibilidad" })
    ).toBeInTheDocument();
  });
});
