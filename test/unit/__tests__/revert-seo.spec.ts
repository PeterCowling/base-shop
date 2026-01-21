(process.env as Record<string, string>).NODE_ENV = "development";
import { revertSeo } from "../../../apps/cms/src/actions/shops.server";
import "../../../apps/cms/src/types/next-auth.d.ts";
import { __setMockSession } from "next-auth";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

const mockDiffHistory = jest.fn();
const mockSaveShopSettings = jest.fn();
const mockGetShopSettings = jest.fn();

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  diffHistory: (...args: any[]) => mockDiffHistory(...args),
  saveShopSettings: (...args: any[]) => mockSaveShopSettings(...args),
  getShopSettings: (...args: any[]) => mockGetShopSettings(...args),
}));
jest.mock("@acme/platform-core/repositories/json.server", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetShopSettings.mockResolvedValue({
    languages: [],
    seo: {},
    updatedAt: "",
    updatedBy: "",
  });
  __setMockSession({ user: { role: "admin" } } as any);
});

describe("revertSeo", () => {
  it("applies diffs up to the given timestamp", async () => {
    mockDiffHistory.mockResolvedValue([
      { timestamp: "t1", diff: { seo: { en: { title: "A" } } } },
      { timestamp: "t2", diff: { seo: { en: { title: "B" } } } },
      { timestamp: "t3", diff: { seo: { en: { title: "C" } } } },
    ]);

    const state = await revertSeo("shop", "t3");

    expect(mockSaveShopSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        languages: [],
        seo: { en: { title: "B" } },
        updatedAt: "",
        updatedBy: "",
      }),
    );
    expect(state).toEqual(
      expect.objectContaining({
        languages: [],
        seo: { en: { title: "B" } },
        updatedAt: "",
        updatedBy: "",
      }),
    );
  });

  it("throws when timestamp not found", async () => {
    mockDiffHistory.mockResolvedValue([{ timestamp: "t1", diff: {} }]);
    await expect(revertSeo("shop", "missing")).rejects.toThrow(
      "Version not found"
    );
  });
});
