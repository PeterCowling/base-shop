const mockGuidePath = jest.fn();
const mockGuideSlug = jest.fn();
const mockResolveGuideKeyFromSlug = jest.fn();
const mockIsGuideLive = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound");
  }),
  permanentRedirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => lang,
}));

jest.mock("@/app/_lib/static-params", () => ({
  generateLangParams: () => [{ lang: "en" }, { lang: "fr" }],
}));

jest.mock("@/data/guides.index", () => ({
  GUIDES_INDEX: [
    { key: "whatToPack", status: "live" },
    { key: "pathOfTheGods", status: "live" },
  ],
  isGuideLive: (...args: unknown[]) => mockIsGuideLive(...args),
}));

jest.mock("@/routes.guides-helpers", () => ({
  guidePath: (...args: unknown[]) => mockGuidePath(...args),
  guideSlug: (...args: unknown[]) => mockGuideSlug(...args),
  resolveGuideKeyFromSlug: (...args: unknown[]) => mockResolveGuideKeyFromSlug(...args),
}));

describe("legacy guide alias routes", () => {
  beforeEach(() => {
    mockGuidePath.mockReset();
    mockGuideSlug.mockReset();
    mockResolveGuideKeyFromSlug.mockReset();
    mockIsGuideLive.mockReset();

    mockGuideSlug.mockImplementation((lang: string, key: string) => {
      const byGuide: Record<string, Record<string, string>> = {
        whatToPack: {
          en: "what-to-pack-amalfi-coast",
          fr: "que-mettre-dans-sa-valise-pour-la-cote-amalfitaine",
        },
        pathOfTheGods: {
          en: "path-of-the-gods",
          fr: "sentier-des-dieux",
        },
      };
      return byGuide[key]?.[lang] ?? byGuide[key]?.en ?? key;
    });

    mockIsGuideLive.mockReturnValue(true);
  });

  it("redirects /[lang]/help/[slug] to canonical guide path", async () => {
    mockResolveGuideKeyFromSlug.mockImplementation((slug: string, lang: string) => {
      if (slug === "what-to-pack-amalfi-coast" && lang === "en") return "whatToPack";
      return undefined;
    });
    mockGuidePath.mockReturnValue("/en/assistance/what-to-pack-amalfi-coast");

    const module = await import("@/app/[lang]/help/[slug]/page");
    await expect(
      module.default({
        params: Promise.resolve({ lang: "en", slug: "what-to-pack-amalfi-coast" }),
      }),
    ).rejects.toThrow("redirect:/en/assistance/what-to-pack-amalfi-coast");

    expect(mockGuidePath).toHaveBeenCalledWith("en", "whatToPack");
  });

  it("falls back to EN slug resolution for non-EN /[lang]/guides/[slug]", async () => {
    mockResolveGuideKeyFromSlug.mockImplementation((slug: string, lang: string) => {
      if (slug !== "what-to-pack-amalfi-coast") return undefined;
      if (lang === "fr") return undefined;
      if (lang === "en") return "whatToPack";
      return undefined;
    });
    mockGuidePath.mockReturnValue("/fr/assistance/que-mettre-dans-sa-valise-pour-la-cote-amalfitaine");

    const module = await import("@/app/[lang]/guides/[slug]/page");
    await expect(
      module.default({
        params: Promise.resolve({ lang: "fr", slug: "what-to-pack-amalfi-coast" }),
      }),
    ).rejects.toThrow("redirect:/fr/assistance/que-mettre-dans-sa-valise-pour-la-cote-amalfitaine");

    expect(mockResolveGuideKeyFromSlug).toHaveBeenNthCalledWith(1, "what-to-pack-amalfi-coast", "fr");
    expect(mockResolveGuideKeyFromSlug).toHaveBeenNthCalledWith(2, "what-to-pack-amalfi-coast", "en");
    expect(mockGuidePath).toHaveBeenCalledWith("fr", "whatToPack");
  });

  it("returns notFound when legacy slug does not resolve", async () => {
    mockResolveGuideKeyFromSlug.mockReturnValue(undefined);

    const module = await import("@/app/[lang]/help/[slug]/page");
    await expect(
      module.default({
        params: Promise.resolve({ lang: "en", slug: "unknown-guide" }),
      }),
    ).rejects.toThrow("notFound");
  });

  it("returns notFound when resolved guide is not live", async () => {
    mockResolveGuideKeyFromSlug.mockReturnValue("whatToPack");
    mockIsGuideLive.mockReturnValue(false);

    const module = await import("@/app/[lang]/guides/[slug]/page");
    await expect(
      module.default({
        params: Promise.resolve({ lang: "en", slug: "what-to-pack-amalfi-coast" }),
      }),
    ).rejects.toThrow("notFound");
  });

  it("includes EN + localized slugs in static params for alias routes", async () => {
    const module = await import("@/app/[lang]/guides/[slug]/page");
    const params = await module.generateStaticParams();

    expect(params).toContainEqual({ lang: "en", slug: "what-to-pack-amalfi-coast" });
    expect(params).toContainEqual({
      lang: "fr",
      slug: "que-mettre-dans-sa-valise-pour-la-cote-amalfitaine",
    });
    expect(params).toContainEqual({ lang: "fr", slug: "what-to-pack-amalfi-coast" });
  });
});
