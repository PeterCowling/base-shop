// packages/platform-core/__tests__/themePresets.server.test.ts
import { jest } from "@jest/globals";

const mockRepo = {
  getThemePresets: jest.fn(async () => ({})),
  saveThemePreset: jest.fn(async () => {}),
  deleteThemePreset: jest.fn(async () => {}),
};

const mockResolveRepo = jest.fn(async () => mockRepo);

jest.mock("../src/db", () => ({ prisma: { themePreset: {} } }));
jest.mock("../src/repositories/repoResolver", () => ({ resolveRepo: mockResolveRepo }));

describe("themePresets.server", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function importRepo() {
    return await import("../src/repositories/themePresets.server");
  }

  it("delegates to the resolved repository", async () => {
    const repo = await importRepo();

    await repo.getThemePresets("shop");
    await repo.saveThemePreset("shop", "name", { color: "red" });
    await repo.deleteThemePreset("shop", "name");

    expect(mockRepo.getThemePresets).toHaveBeenCalledWith("shop");
    expect(mockRepo.saveThemePreset).toHaveBeenCalledWith("shop", "name", { color: "red" });
    expect(mockRepo.deleteThemePreset).toHaveBeenCalledWith("shop", "name");
  });

  it("caches the repository", async () => {
    const repo = await importRepo();

    await repo.getThemePresets("shop");
    await repo.saveThemePreset("shop", "name", {});
    await repo.getThemePresets("shop");

    expect(mockResolveRepo).toHaveBeenCalledTimes(1);
    expect(mockRepo.getThemePresets).toHaveBeenCalledTimes(2);
  });
});
