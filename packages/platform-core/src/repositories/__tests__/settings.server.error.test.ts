import { jest } from "@jest/globals";

const repo = {
  getShopSettings: jest.fn(),
  saveShopSettings: jest.fn(),
  diffHistory: jest.fn(),
};

jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(() => repo),
}));

jest.mock("../../db", () => ({ prisma: { setting: {} } }));

describe("settings.server error handling", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("throws when repository reports missing shop", async () => {
    repo.getShopSettings.mockRejectedValue(new Error("not found"));
    const { getShopSettings } = await import("../settings.server");
    await expect(getShopSettings("missing")).rejects.toThrow("not found");
    expect(repo.getShopSettings).toHaveBeenCalledWith("missing");
  });

  it("propagates validation errors from saveShopSettings", async () => {
    repo.saveShopSettings.mockRejectedValue(new Error("invalid"));
    const { saveShopSettings } = await import("../settings.server");
    await expect(saveShopSettings("shop", {} as any)).rejects.toThrow("invalid");
    expect(repo.saveShopSettings).toHaveBeenCalledWith("shop", {});
  });
});

