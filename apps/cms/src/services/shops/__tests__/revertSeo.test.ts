import { authorize, fetchDiffHistory, persistSettings } from "../helpers";
import { revertSeo } from "../seoService";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchDiffHistory: jest.fn(),
  persistSettings: jest.fn().mockResolvedValue(undefined),
}));

describe("revertSeo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when authorization fails", async () => {
    (authorize as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    await expect(revertSeo("shop", "2024-01-01")).rejects.toThrow("nope");
    expect(fetchDiffHistory).not.toHaveBeenCalled();
    expect(persistSettings).not.toHaveBeenCalled();
  });

  it("reconstructs settings when timestamp exists", async () => {
    (fetchDiffHistory as jest.Mock).mockResolvedValue([
      { timestamp: "2024-01-01", diff: { languages: ["en"] } },
      {
        timestamp: "2024-02-01",
        diff: { seo: { en: { title: "T1", description: "D2" } } },
      },
      { timestamp: "2024-03-01", diff: { seo: { en: { image: "I3" } } } },
    ]);
    const expected = {
      languages: ["en"],
      seo: { en: { title: "T1", description: "D2" } },
      luxuryFeatures: {
        premierDelivery: false,
        blog: false,
        contentMerchandising: false,
        raTicketing: false,
        fraudReviewThreshold: 0,
        requireStrongCustomerAuth: false,
        strictReturnConditions: false,
        trackingDashboard: false,
      },
      freezeTranslations: false,
      updatedAt: "",
      updatedBy: "",
    };
    const result = await revertSeo("shop", "2024-03-01");
    expect(persistSettings).toHaveBeenCalledWith("shop", expected);
    expect(result).toEqual(expected);
  });

  it("throws when timestamp not found", async () => {
    (fetchDiffHistory as jest.Mock).mockResolvedValue([
      { timestamp: "2024-01-01", diff: {} },
    ]);
    await expect(revertSeo("shop", "2024-02-01")).rejects.toThrow("Version not found");
    expect(persistSettings).not.toHaveBeenCalled();
  });
});
