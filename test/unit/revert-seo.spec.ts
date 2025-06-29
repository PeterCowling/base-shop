import { revertSeo } from "@cms/actions/shops";
import "../../apps/cms/src/types/next-auth.d.ts";
(process.env as Record<string, string>).NODE_ENV = "development";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

const diffHistoryMock = jest.fn();
const saveShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops", () => ({
  diffHistory: (...args: any[]) => diffHistoryMock(...args),
  saveShopSettings: (...args: any[]) => saveShopSettingsMock(...args),
}));
jest.mock("@platform-core/repositories/json", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("revertSeo", () => {
  it("applies diffs up to the given timestamp", async () => {
    diffHistoryMock.mockResolvedValue([
      { timestamp: "t1", diff: { seo: { en: { title: "A" } } } },
      { timestamp: "t2", diff: { seo: { en: { title: "B" } } } },
      { timestamp: "t3", diff: { seo: { en: { title: "C" } } } },
    ]);

    const state = await revertSeo("shop", "t3");

    expect(saveShopSettingsMock).toHaveBeenCalledWith("shop", {
      languages: [],
      seo: { en: { title: "B" } },
      updatedAt: "",
      updatedBy: "",
    });
    expect(state).toEqual({
      languages: [],
      seo: { en: { title: "B" } },
      updatedAt: "",
      updatedBy: "",
    });
  });

  it("throws when timestamp not found", async () => {
    diffHistoryMock.mockResolvedValue([{ timestamp: "t1", diff: {} }]);
    await expect(revertSeo("shop", "missing")).rejects.toThrow(
      "Version not found"
    );
  });
});
