import {
  fetchShop,
  persistShop,
  fetchSettings,
  persistSettings,
  fetchDiffHistory,
} from "../persistence";

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({ id: "1" }),
  updateShopInRepo: jest.fn().mockResolvedValue({ id: "1" }),
}));

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn().mockResolvedValue({ foo: "bar" }),
  saveShopSettings: jest.fn().mockResolvedValue(undefined),
  diffHistory: jest.fn().mockResolvedValue([]),
}));

describe("persistence service", () => {
  it("fetches a shop", async () => {
    const shop = await fetchShop("s1");
    expect(shop).toEqual({ id: "1" });
  });

  it("persists a shop", async () => {
    const saved = await persistShop("s1", { id: "1" });
    expect(saved).toEqual({ id: "1" });
  });

  it("fetches settings", async () => {
    const settings = await fetchSettings("s1");
    expect(settings).toEqual({ foo: "bar" });
  });

  it("persists settings", async () => {
    await persistSettings("s1", { foo: "bar" } as any);
    const { saveShopSettings } = await import(
      "@acme/platform-core/repositories/settings.server"
    );
    expect(saveShopSettings).toHaveBeenCalled();
  });

  it("fetches diff history", async () => {
    const history = await fetchDiffHistory("s1");
    expect(history).toEqual([]);
  });
});
