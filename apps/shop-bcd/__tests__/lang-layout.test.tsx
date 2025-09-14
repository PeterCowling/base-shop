// apps/shop-bcd/__tests__/lang-layout.test.tsx

import { render, screen } from "@testing-library/react";
let LocaleLayout: any;
let generateMetadata: any;

const getSeoMock = jest.fn();

jest.mock("../src/lib/seo", () => ({
  __esModule: true,
  getSeo: (...args: any[]) => getSeoMock(...args),
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
  default: ({ children, messages }: any) => (
    <div data-cy="provider" data-messages={JSON.stringify(messages)}>
      {children}
    </div>
  ),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("generateMetadata resolves localized SEO fields", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: ["de"] }),
    });

    expect(getSeoMock).toHaveBeenCalledWith("de");
    expect(metadata).toEqual({
      title: "Title DE",
      description: "Desc DE",
      alternates: { canonical: "https://example.com/de" },
      openGraph: { url: "https://example.com/de" },
      twitter: { card: "summary" },
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
});

