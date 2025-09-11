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

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/settings.json.server",
  () => ({ jsonSettingsRepository: mockJson }),
);

jest.mock(
  "../packages/platform-core/src/repositories/settings.prisma.server",
  () => {
    prismaImportCount++;
    return { prismaSettingsRepository: mockPrisma };
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { setting: {} },
}));

jest.mock("../packages/platform-core/src/repositories/repoResolver", () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe("settings repository backend selection", () => {
  const origBackend = process.env.SETTINGS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
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
    const repo = await import(
      "../packages/platform-core/src/repositories/settings.server"
    );

    await repo.getShopSettings("shop");
    await repo.saveShopSettings("shop", {} as any);
    await repo.diffHistory("shop");

    expect(mockJson.getShopSettings).toHaveBeenCalledWith("shop");
    expect(mockJson.saveShopSettings).toHaveBeenCalledWith("shop", {});
    expect(mockJson.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockPrisma.getShopSettings).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when SETTINGS_BACKEND is not set", async () => {
    delete process.env.SETTINGS_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/settings.server"
    );

    await repo.getShopSettings("shop");
    await repo.saveShopSettings("shop", {} as any);
    await repo.diffHistory("shop");

    expect(mockPrisma.getShopSettings).toHaveBeenCalledWith("shop");
    expect(mockPrisma.saveShopSettings).toHaveBeenCalledWith("shop", {});
    expect(mockPrisma.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockJson.getShopSettings).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });

});

