import { jest } from "@jest/globals";

const mockJson = {
  getShopSettings: jest.fn(),
  saveShopSettings: jest.fn(),
  diffHistory: jest.fn(),
};

const mockPrisma = {
  getShopSettings: jest.fn(),
  saveShopSettings: jest.fn(),
  diffHistory: jest.fn(),
};

jest.mock("../settings.json.server", () => ({
  jsonSettingsRepository: mockJson,
}));

jest.mock("../settings.prisma.server", () => ({
  prismaSettingsRepository: mockPrisma,
}));

jest.mock("../../db", () => ({ prisma: { setting: {} } }));

describe("settings repository backend selection", () => {
  const origBackend = process.env.SETTINGS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.SETTINGS_BACKEND;
    } else {
      process.env.SETTINGS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when SETTINGS_BACKEND="json"', async () => {
    process.env.SETTINGS_BACKEND = "json";
    const {
      getShopSettings,
      saveShopSettings,
      diffHistory,
    } = await import("../settings.server");

    await getShopSettings("shop");
    await saveShopSettings("shop", {} as any);
    await diffHistory("shop");

    expect(mockJson.getShopSettings).toHaveBeenCalledWith("shop");
    expect(mockJson.saveShopSettings).toHaveBeenCalledWith("shop", {});
    expect(mockJson.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockPrisma.getShopSettings).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when SETTINGS_BACKEND is not set", async () => {
    delete process.env.SETTINGS_BACKEND;
    const {
      getShopSettings,
      saveShopSettings,
      diffHistory,
    } = await import("../settings.server");

    await getShopSettings("shop");
    await saveShopSettings("shop", {} as any);
    await diffHistory("shop");

    expect(mockPrisma.getShopSettings).toHaveBeenCalledWith("shop");
    expect(mockPrisma.saveShopSettings).toHaveBeenCalledWith("shop", {});
    expect(mockPrisma.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockJson.getShopSettings).not.toHaveBeenCalled();
  });
});

