// apps/cover-me-pretty/__tests__/lang-layout.test.tsx

import { render, screen } from "@testing-library/react";
import type { getSeo as GetSeoFn } from "../src/lib/seo";
import type { getShopSettings as GetShopSettingsFn } from "@platform-core/repositories/settings.server";
import type { Messages } from "@i18n/Translations";
import type { ReactNode } from "react";

type GetSeo = typeof GetSeoFn;
type GetShopSettings = typeof GetShopSettingsFn;
type LangLayoutModule = typeof import("../src/app/[lang]/layout");

let LocaleLayout: LangLayoutModule["default"];
let generateMetadata: LangLayoutModule["generateMetadata"];

const getSeoMock = jest.fn<ReturnType<GetSeo>, Parameters<GetSeo>>();
const getShopSettingsMock = jest.fn<
  ReturnType<GetShopSettings>,
  Parameters<GetShopSettings>
>();

jest.mock("../src/lib/seo", () => ({
  __esModule: true,
  getSeo: (...args: Parameters<GetSeo>) => getSeoMock(...args),
}));

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: (...args: Parameters<GetShopSettings>) =>
    getShopSettingsMock(...args),
}));

jest.mock("@ui/components/layout/Footer", () => ({
  __esModule: true,
  default: () => <div data-cy="footer" />,
}));

jest.mock("@ui/components/layout/Header", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => (
    <div data-cy="header">{lang}</div>
  ),
}));

jest.mock("@i18n/Translations", () => ({
  __esModule: true,
  default: ({
    children,
    messages,
  }: {
    children: ReactNode;
    messages: Messages;
  }) => (
    <div data-cy="provider" data-messages={JSON.stringify(messages)}>
      {children}
    </div>
  ),
}));

jest.mock("@acme/ui", () => ({
  ThemeStyle: () => <div data-cy="theme-style" />,
}));

describe("[lang] layout", () => {
  beforeAll(async () => {
    ({ default: LocaleLayout, generateMetadata } = await import(
      "../src/app/[lang]/layout"
    ));
  });
  beforeEach(() => {
    getSeoMock.mockResolvedValue({
      title: "Title DE",
      description: "Desc DE",
      canonical: "https://example.com/de",
      openGraph: { url: "https://example.com/de" },
      twitter: { card: "summary" },
    });
    getShopSettingsMock.mockResolvedValue({ languages: ["de", "en", "it"], seo: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("generateMetadata resolves localized SEO fields", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: ["de"] }),
    });

    expect(getSeoMock).toHaveBeenCalledWith("de");
    expect(metadata.title).toBe("Title DE");
    expect(metadata.description).toBe("Desc DE");
    expect(metadata.alternates?.canonical).toBe("https://example.com/de");
    expect(metadata.openGraph).toEqual({ url: "https://example.com/de" });
    expect(metadata.twitter).toEqual({ card: "summary" });
    expect(metadata.alternates?.languages).toEqual({
      de: "https://example.com/de",
      en: "https://example.com/en",
      it: "https://example.com/it",
    });
  });

  it("wraps children with TranslationsProvider for resolved locale", async () => {
    const element = await LocaleLayout({
      params: Promise.resolve({ lang: ["de"] }),
      children: <div data-cy="child">Child</div>,
    });
    render(element);

    const provider = screen.getByTestId("provider");
    const messages = JSON.parse(provider.getAttribute("data-messages")!);
    expect(messages["nav.home"]).toBe("Startseite");
    expect(provider.textContent).toContain("Child");
  });

  it("handles root path with no lang param", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({}) });
    // default locale is en
    expect(getSeoMock).toHaveBeenCalledWith("en");
    expect(metadata.title).toBe("Title DE"); // from mock; shape asserted above

    const element = await LocaleLayout({
      params: Promise.resolve({}),
      children: <div />,
    });
    render(element);
    expect(screen.getByTestId("header").textContent).toBe("en");
    // JSON-LD script present
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });
});
