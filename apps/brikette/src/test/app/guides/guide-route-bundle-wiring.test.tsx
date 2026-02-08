import type { ReactElement } from "react";

const mockGuideNamespace = jest.fn();
const mockGuidePath = jest.fn();
const mockResolveGuideKeyFromSlug = jest.fn();
const mockIsGuidePublished = jest.fn();
const mockLoadGuideI18nBundle = jest.fn();
const mockLoadGuideManifestOverridesFromFs = jest.fn();
const mockListGuideManifestEntries = jest.fn();

const fallbackSlugFromKey = (key: string): string =>
  key.replace(/([a-z\d])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound");
  }),
  permanentRedirect: jest.fn(() => {
    throw new Error("permanentRedirect");
  }),
}));

jest.mock("@/app/_lib/guide-i18n-bundle", () => ({
  loadGuideI18nBundle: (...args: unknown[]) => mockLoadGuideI18nBundle(...args),
}));

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => lang,
  getTranslations: jest.fn(),
}));

jest.mock("@/routes.guides-helpers", () => ({
  guideNamespace: (...args: unknown[]) => mockGuideNamespace(...args),
  guidePath: (...args: unknown[]) => mockGuidePath(...args),
  guideSlug: (_lang: string, key: string) => fallbackSlugFromKey(key),
  resolveGuideKeyFromSlug: (...args: unknown[]) => mockResolveGuideKeyFromSlug(...args),
}));

jest.mock("@/routes/guides/guide-manifest-overrides.node", () => ({
  loadGuideManifestOverridesFromFs: () => mockLoadGuideManifestOverridesFromFs(),
}));

jest.mock("@/routes/guides/guide-manifest", () => ({
  listGuideManifestEntries: () => mockListGuideManifestEntries(),
}));

jest.mock("@/lib/how-to-get-here/definitions", () => ({
  listHowToSlugs: () => [],
}));

jest.mock("@/data/guides.index", () => ({
  GUIDES_INDEX: [],
  isGuidePublished: (...args: unknown[]) => mockIsGuidePublished(...args),
}));

jest.mock("@acme/ui/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: () => "/img/mock.webp",
}));

jest.mock("@/app/_lib/metadata", () => ({
  buildAppMetadata: () => ({}),
}));

jest.mock("@/app/_lib/static-params", () => ({
  generateLangParams: () => [],
}));

jest.mock("@/app/[lang]/experiences/[slug]/GuideContent", () => ({
  __esModule: true,
  default: () => null,
}));

type GuideContentProps = {
  lang: string;
  guideKey: string;
  serverGuides?: Record<string, unknown>;
  serverGuidesEn?: Record<string, unknown>;
  serverOverrides?: Record<string, unknown>;
};

describe("guide route bundle wiring", () => {
  beforeEach(() => {
    mockGuideNamespace.mockReset();
    mockGuidePath.mockReset();
    mockResolveGuideKeyFromSlug.mockReset();
    mockIsGuidePublished.mockReset();
    mockLoadGuideI18nBundle.mockReset();
    mockLoadGuideManifestOverridesFromFs.mockReset();
    mockListGuideManifestEntries.mockReset();
    mockIsGuidePublished.mockReturnValue(true);

    mockLoadGuideI18nBundle.mockResolvedValue({
      serverGuides: { content: { travelHelp: { intro: ["Localized"] } } },
      serverGuidesEn: { content: { travelHelp: { intro: ["English"] } } },
    });
  });

  it("passes bundles to assistance guide pages", async () => {
    mockResolveGuideKeyFromSlug.mockReturnValue("travelHelp");
    mockGuideNamespace.mockReturnValue({ baseKey: "assistance", baseSlug: "assistance" });

    const module = await import("@/app/[lang]/assistance/[article]/page");
    const element = (await module.default({
      params: Promise.resolve({ lang: "de", article: "travel-help" }),
    })) as ReactElement<GuideContentProps>;

    expect(mockLoadGuideI18nBundle).toHaveBeenCalledWith("de", "travelHelp");
    expect(element.props.lang).toBe("de");
    expect(element.props.guideKey).toBe("travelHelp");
    expect(element.props.serverGuides).toEqual({
      content: { travelHelp: { intro: ["Localized"] } },
    });
    expect(element.props.serverGuidesEn).toEqual({
      content: { travelHelp: { intro: ["English"] } },
    });
  });

  it("passes bundles to how-to-get-here guide pages", async () => {
    mockResolveGuideKeyFromSlug.mockReturnValue("salernoPositano");
    mockGuideNamespace.mockReturnValue({ baseKey: "howToGetHere", baseSlug: "how-to-get-here" });
    mockLoadGuideManifestOverridesFromFs.mockReturnValue({ salernoPositano: { status: "live" } });
    mockLoadGuideI18nBundle.mockResolvedValue({
      serverGuides: { content: { salernoPositano: { intro: ["Localized"] } } },
      serverGuidesEn: { content: { salernoPositano: { intro: ["English"] } } },
    });

    const module = await import("@/app/[lang]/how-to-get-here/[slug]/page");
    const element = (await module.default({
      params: Promise.resolve({ lang: "fr", slug: "salerno-positano" }),
    })) as ReactElement<GuideContentProps>;

    expect(mockLoadGuideI18nBundle).toHaveBeenCalledWith("fr", "salernoPositano");
    expect(element.props.serverOverrides).toEqual({ salernoPositano: { status: "live" } });
    expect(element.props.serverGuides).toEqual({
      content: { salernoPositano: { intro: ["Localized"] } },
    });
    expect(element.props.serverGuidesEn).toEqual({
      content: { salernoPositano: { intro: ["English"] } },
    });
  });

  it("passes bundles to experiences guide pages", async () => {
    mockResolveGuideKeyFromSlug.mockReturnValue("pathOfTheGods");
    mockGuideNamespace.mockReturnValue({ baseKey: "experiences", baseSlug: "experiences" });
    mockLoadGuideManifestOverridesFromFs.mockReturnValue({ pathOfTheGods: { status: "live" } });
    mockLoadGuideI18nBundle.mockResolvedValue({
      serverGuides: { content: { pathOfTheGods: { intro: ["Localized"] } } },
      serverGuidesEn: { content: { pathOfTheGods: { intro: ["English"] } } },
    });

    const module = await import("@/app/[lang]/experiences/[slug]/page");
    const element = (await module.default({
      params: Promise.resolve({ lang: "es", slug: "path-of-the-gods" }),
    })) as ReactElement<GuideContentProps>;

    expect(mockLoadGuideI18nBundle).toHaveBeenCalledWith("es", "pathOfTheGods");
    expect(element.props.serverOverrides).toEqual({ pathOfTheGods: { status: "live" } });
    expect(element.props.serverGuides).toEqual({
      content: { pathOfTheGods: { intro: ["Localized"] } },
    });
    expect(element.props.serverGuidesEn).toEqual({
      content: { pathOfTheGods: { intro: ["English"] } },
    });
  });

});
