import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";

const mockReadCentralGuideBundle = jest.fn();
const mockGetTranslations = jest.fn();
const mockExtractGuideBundle = jest.fn();

jest.mock("@/routes/guides/central-guides-adapter.server", () => ({
  readCentralGuideBundle: (...args: unknown[]) => mockReadCentralGuideBundle(...args),
}));

jest.mock("@/app/_lib/i18n-server", () => ({
  getTranslations: (...args: unknown[]) => mockGetTranslations(...args),
}));

jest.mock("@/utils/extractGuideBundle", () => ({
  extractGuideBundle: (...args: unknown[]) => mockExtractGuideBundle(...args),
}));

describe("loadGuideI18nBundle", () => {
  beforeEach(() => {
    mockReadCentralGuideBundle.mockReset();
    mockGetTranslations.mockReset();
    mockExtractGuideBundle.mockReset();
    mockGetTranslations.mockResolvedValue(() => "");
    mockReadCentralGuideBundle.mockResolvedValue(null);
  });

  it("loads locale + English bundles for non-English guides", async () => {
    mockExtractGuideBundle.mockImplementation((lang: string) =>
      lang === "de" ? { content: { travelHelp: { intro: ["DE"] } } } : { content: { travelHelp: { intro: ["EN"] } } },
    );

    const result = await loadGuideI18nBundle("de", "travelHelp" as never);

    expect(mockGetTranslations).toHaveBeenCalledWith("de", ["guides"]);
    expect(mockExtractGuideBundle).toHaveBeenNthCalledWith(1, "de", "travelHelp");
    expect(mockExtractGuideBundle).toHaveBeenNthCalledWith(2, "en", "travelHelp");
    expect(result).toEqual({
      serverGuides: { content: { travelHelp: { intro: ["DE"] } } },
      serverGuidesEn: { content: { travelHelp: { intro: ["EN"] } } },
    });
  });

  it("loads only locale bundle for English guides", async () => {
    mockExtractGuideBundle.mockReturnValue({ content: { travelHelp: { intro: ["EN"] } } });

    const result = await loadGuideI18nBundle("en", "travelHelp" as never);

    expect(mockGetTranslations).toHaveBeenCalledWith("en", ["guides"]);
    expect(mockExtractGuideBundle).toHaveBeenCalledTimes(1);
    expect(mockExtractGuideBundle).toHaveBeenCalledWith("en", "travelHelp");
    expect(result).toEqual({
      serverGuides: { content: { travelHelp: { intro: ["EN"] } } },
      serverGuidesEn: undefined,
    });
  });

  it("injects central content when available", async () => {
    mockExtractGuideBundle.mockImplementation((lang: string) =>
      lang === "de"
        ? {
            labels: { backLink: "Zuruck" },
            content: { travelHelp: { intro: ["Legacy DE"] } },
          }
        : {
            labels: { backLink: "Back" },
            content: { travelHelp: { intro: ["Legacy EN"] } },
          },
    );
    mockReadCentralGuideBundle.mockResolvedValue({
      guide: {
        id: "guide",
        key: "travelHelp",
      },
      localizedContent: { seo: { title: "Central DE", description: "Central DE desc" } },
      englishContent: { seo: { title: "Central EN", description: "Central EN desc" } },
    });

    const result = await loadGuideI18nBundle("de", "travelHelp" as never);

    expect(mockReadCentralGuideBundle).toHaveBeenCalledWith("de", "travelHelp");
    expect(result.serverGuides).toEqual({
      labels: { backLink: "Zuruck" },
      content: {
        travelHelp: { seo: { title: "Central DE", description: "Central DE desc" } },
      },
    });
    expect(result.serverGuidesEn).toEqual({
      labels: { backLink: "Back" },
      content: {
        travelHelp: { seo: { title: "Central EN", description: "Central EN desc" } },
      },
    });
  });

  it("uses central english content when localized content is missing", async () => {
    mockExtractGuideBundle.mockImplementation((lang: string) =>
      lang === "de"
        ? { labels: { backLink: "Zuruck" }, content: {} }
        : { labels: { backLink: "Back" }, content: {} },
    );
    mockReadCentralGuideBundle.mockResolvedValue({
      guide: {
        id: "guide",
        key: "travelHelp",
      },
      localizedContent: null,
      englishContent: { seo: { title: "Central EN", description: "Central EN desc" } },
    });

    const result = await loadGuideI18nBundle("de", "travelHelp" as never);

    expect(result.serverGuides).toEqual({
      labels: { backLink: "Zuruck" },
      content: {
        travelHelp: { seo: { title: "Central EN", description: "Central EN desc" } },
      },
    });
    expect(result.serverGuidesEn).toEqual({
      labels: { backLink: "Back" },
      content: {
        travelHelp: { seo: { title: "Central EN", description: "Central EN desc" } },
      },
    });
  });
});
