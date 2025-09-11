import { jest } from "@jest/globals";

const mockJson = {
  getThemePresets: jest.fn(),
  saveThemePreset: jest.fn(),
  deleteThemePreset: jest.fn(),
};

const mockPrisma = {
  getThemePresets: jest.fn(),
  saveThemePreset: jest.fn(),
  deleteThemePreset: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/themePresets.json.server",
  () => ({ jsonThemePresetRepository: mockJson }),
);

jest.mock(
  "../packages/platform-core/src/repositories/themePresets.prisma.server",
  () => {
    prismaImportCount++;
    return { prismaThemePresetRepository: mockPrisma };
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { themePreset: {} },
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

describe("themePresets repository backend selection", () => {
  const origBackend = process.env.THEME_PRESETS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.THEME_PRESETS_BACKEND;
    } else {
      process.env.THEME_PRESETS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when THEME_PRESETS_BACKEND="json"', async () => {
    process.env.THEME_PRESETS_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/themePresets.server"
    );

    await repo.getThemePresets("shop");
    await repo.saveThemePreset("shop", "name", {});
    await repo.deleteThemePreset("shop", "name");

    expect(mockJson.getThemePresets).toHaveBeenCalledWith("shop");
    expect(mockJson.saveThemePreset).toHaveBeenCalledWith(
      "shop",
      "name",
      {},
    );
    expect(mockJson.deleteThemePreset).toHaveBeenCalledWith("shop", "name");
    expect(mockPrisma.getThemePresets).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when THEME_PRESETS_BACKEND is not set", async () => {
    delete process.env.THEME_PRESETS_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/themePresets.server"
    );

    await repo.getThemePresets("shop");
    await repo.saveThemePreset("shop", "name", {});
    await repo.deleteThemePreset("shop", "name");

    expect(mockPrisma.getThemePresets).toHaveBeenCalledWith("shop");
    expect(mockPrisma.saveThemePreset).toHaveBeenCalledWith(
      "shop",
      "name",
      {},
    );
    expect(mockPrisma.deleteThemePreset).toHaveBeenCalledWith("shop", "name");
    expect(mockJson.getThemePresets).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
