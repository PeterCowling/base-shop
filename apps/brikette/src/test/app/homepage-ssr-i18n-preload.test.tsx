import React from "react";

const getTranslationsMock = jest.fn(async () => {
  return (key: string) => key;
});

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => (lang === "en" ? "en" : "en"),
  getTranslations: (...args: unknown[]) =>
    getTranslationsMock(...(args as [string, readonly string[]])),
}));

jest.mock("@/app/[lang]/HomeContent", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => React.createElement("div", { "data-lang": lang }),
}));

describe("home page SSR i18n preload contract", () => {
  beforeEach(() => {
    getTranslationsMock.mockClear();
  });

  it("preloads landing namespaces during server render to prevent key leakage", async () => {
    const { default: HomePage } = await import("@/app/[lang]/page");
    await HomePage({ params: Promise.resolve({ lang: "en" }) });

    expect(getTranslationsMock).toHaveBeenCalledWith(
      "en",
      expect.arrayContaining([
        "landingPage",
        "faq",
        "testimonials",
        "ratingsBar",
        "modals",
      ]),
    );
  });
});
