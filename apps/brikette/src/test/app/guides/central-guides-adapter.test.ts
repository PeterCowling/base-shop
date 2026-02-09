import {
  isCentralGuidesEnabled,
  readCentralGuideBundle,
} from "@/routes/guides/central-guides-adapter.server";

const mockGetGuideContent = jest.fn();
const mockReadGuideRepo = jest.fn();

jest.mock("@acme/platform-core/repositories/guides.server", () => ({
  getGuideContent: (...args: unknown[]) => mockGetGuideContent(...args),
  readGuideRepo: (...args: unknown[]) => mockReadGuideRepo(...args),
}));

describe("central-guides-adapter", () => {
  const originalUseCentralGuides = process.env["USE_CENTRAL_GUIDES"];

  beforeEach(() => {
    mockGetGuideContent.mockReset();
    mockReadGuideRepo.mockReset();
    delete process.env["USE_CENTRAL_GUIDES"];
  });

  afterAll(() => {
    if (originalUseCentralGuides) {
      process.env["USE_CENTRAL_GUIDES"] = originalUseCentralGuides;
      return;
    }
    delete process.env["USE_CENTRAL_GUIDES"];
  });

  it("treats USE_CENTRAL_GUIDES=1 as enabled", () => {
    expect(isCentralGuidesEnabled()).toBe(false);
    process.env["USE_CENTRAL_GUIDES"] = "1";
    expect(isCentralGuidesEnabled()).toBe(true);
  });

  it("returns null without calling repositories when central mode is disabled", async () => {
    const result = await readCentralGuideBundle("de", "travelHelp" as never);

    expect(result).toBeNull();
    expect(mockReadGuideRepo).not.toHaveBeenCalled();
    expect(mockGetGuideContent).not.toHaveBeenCalled();
  });

  it("loads metadata and localized content when central mode is enabled", async () => {
    process.env["USE_CENTRAL_GUIDES"] = "1";
    mockReadGuideRepo.mockResolvedValue([
      {
        id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        shop: "brikette",
        key: "travelHelp",
        slug: "travel-help",
        contentKey: "travelHelp",
        status: "published",
        areas: ["help"],
        primaryArea: "help",
        blocks: [],
        relatedGuides: [],
        structuredData: [],
        riskTier: 0,
        schemaVersion: 1,
        row_version: 1,
        created_at: "2026-02-09T00:00:00.000Z",
        updated_at: "2026-02-09T00:00:00.000Z",
      },
    ]);
    mockGetGuideContent
      .mockResolvedValueOnce({ seo: { title: "DE", description: "DE desc" } })
      .mockResolvedValueOnce({ seo: { title: "EN", description: "EN desc" } });

    const result = await readCentralGuideBundle("de", "travelHelp" as never);

    expect(mockReadGuideRepo).toHaveBeenCalledWith("brikette");
    expect(mockGetGuideContent).toHaveBeenNthCalledWith(1, "brikette", "travelHelp", "de");
    expect(mockGetGuideContent).toHaveBeenNthCalledWith(2, "brikette", "travelHelp", "en");
    expect(result?.localizedContent).toEqual({
      seo: { title: "DE", description: "DE desc" },
    });
    expect(result?.englishContent).toEqual({
      seo: { title: "EN", description: "EN desc" },
    });
  });

  it("returns null when central repo has no matching guide", async () => {
    process.env["USE_CENTRAL_GUIDES"] = "1";
    mockReadGuideRepo.mockResolvedValue([]);

    const result = await readCentralGuideBundle("de", "travelHelp" as never);

    expect(result).toBeNull();
    expect(mockGetGuideContent).not.toHaveBeenCalled();
  });

  it("falls back to english content when localized content is missing", async () => {
    process.env["USE_CENTRAL_GUIDES"] = "1";
    mockReadGuideRepo.mockResolvedValue([
      {
        id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        shop: "brikette",
        key: "travelHelp",
        slug: "travel-help",
        contentKey: "travelHelp",
        status: "published",
        areas: ["help"],
        primaryArea: "help",
        blocks: [],
        relatedGuides: [],
        structuredData: [],
        riskTier: 0,
        schemaVersion: 1,
        row_version: 1,
        created_at: "2026-02-09T00:00:00.000Z",
        updated_at: "2026-02-09T00:00:00.000Z",
      },
    ]);
    mockGetGuideContent
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ seo: { title: "EN", description: "EN desc" } });

    const result = await readCentralGuideBundle("de", "travelHelp" as never);

    expect(result?.localizedContent).toBeNull();
    expect(result?.englishContent).toEqual({
      seo: { title: "EN", description: "EN desc" },
    });
  });
});
