import type { Metadata } from "next";

const mockPermanentRedirect = jest.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});

const mockGenerateAssistanceIndexMetadata = jest.fn(async (lang: string) => ({
  title: `meta:${lang}`,
})) as jest.Mock<Promise<Metadata>, [string]>;

const mockRenderAssistanceIndexPage = jest.fn(async (lang: string) => `render:${lang}`);

jest.mock("next/navigation", () => ({
  permanentRedirect: (path: string) => mockPermanentRedirect(path),
}));

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => (lang === "fr" ? "fr" : "en"),
}));

jest.mock("@/app/_lib/static-params", () => ({
  generateLangParams: () => [{ lang: "en" }, { lang: "fr" }],
}));

jest.mock("@/utils/slug", () => ({
  getSlug: (key: string, lang: string) => {
    if (key !== "assistance") return key;
    return lang === "fr" ? "aide" : "help";
  },
}));

jest.mock("@/app/[lang]/assistance/page.shared", () => ({
  generateAssistanceIndexMetadata: (lang: string) => mockGenerateAssistanceIndexMetadata(lang),
  renderAssistanceIndexPage: (lang: string) => mockRenderAssistanceIndexPage(lang),
}));

describe("/[lang]/help route", () => {
  type HelpPageModule = typeof import("@/app/[lang]/help/page");

  async function loadHelpPageModule(): Promise<HelpPageModule> {
    return (await import("@/app/[lang]/help/page")) as HelpPageModule;
  }

  beforeEach(() => {
    mockPermanentRedirect.mockClear();
    mockGenerateAssistanceIndexMetadata.mockClear();
    mockRenderAssistanceIndexPage.mockClear();
  });

  it("renders the shared assistance index instead of redirecting when help is the canonical slug", async () => {
    const module = await loadHelpPageModule();

    await expect(
      module.default({
        params: Promise.resolve({ lang: "en" }),
      }),
    ).resolves.toBe("render:en");

    expect(mockPermanentRedirect).not.toHaveBeenCalled();
    expect(mockRenderAssistanceIndexPage).toHaveBeenCalledWith("en");
  });

  it("reuses assistance metadata when help is the canonical slug", async () => {
    const module = await loadHelpPageModule();
    const metadata = (await module.generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    })) as Metadata;

    expect(metadata).toEqual({ title: "meta:en" });
    expect(mockGenerateAssistanceIndexMetadata).toHaveBeenCalledWith("en");
  });

  it("keeps /[lang]/help as a legacy redirect when another localized slug is canonical", async () => {
    const module = await loadHelpPageModule();

    await expect(
      module.default({
        params: Promise.resolve({ lang: "fr" }),
      }),
    ).rejects.toThrow("redirect:/fr/aide");

    expect(mockRenderAssistanceIndexPage).not.toHaveBeenCalled();
    expect(mockPermanentRedirect).toHaveBeenCalledWith("/fr/aide");
  });

  it("returns empty metadata for legacy redirect locales", async () => {
    const module = await loadHelpPageModule();
    const metadata = (await module.generateMetadata({
      params: Promise.resolve({ lang: "fr" }),
    })) as Metadata;

    expect(metadata).toEqual({});
    expect(mockGenerateAssistanceIndexMetadata).not.toHaveBeenCalled();
  });
});
