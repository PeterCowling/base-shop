const mockGetTranslations = jest.fn();
const mockExtractGuideBundle = jest.fn();

jest.mock("@/app/_lib/i18n-server", () => ({
  getTranslations: (...args: unknown[]) => mockGetTranslations(...args),
}));

jest.mock("@/utils/extractGuideBundle", () => ({
  extractGuideBundle: (...args: unknown[]) => mockExtractGuideBundle(...args),
}));

import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";

describe("loadGuideI18nBundle", () => {
  beforeEach(() => {
    mockGetTranslations.mockReset();
    mockExtractGuideBundle.mockReset();
    mockGetTranslations.mockResolvedValue(() => "");
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
});
