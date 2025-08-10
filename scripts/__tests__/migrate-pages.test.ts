import { join } from "node:path";

const fsMock = {
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
  rmSync: jest.fn(),
};

jest.mock("node:fs", () => fsMock);

describe("migrate-pages", () => {
  const scriptDir = join(__dirname, "..", "src");
  const root = join(scriptDir, "..");
  const dataDir = join(root, "data");
  const shopsDir = join(dataDir, "shops");

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("moves legacy pages and removes empty directories", async () => {
    const shopId = "shop1";
    const legacyDir = join(dataDir, shopId);
    const legacyPages = join(legacyDir, "pages.json");
    const targetDir = join(shopsDir, shopId);
    const targetFile = join(targetDir, "pages.json");

    fsMock.readdirSync.mockImplementation((p: any, opts?: any) => {
      if (p === dataDir && opts?.withFileTypes) {
        return [{ isDirectory: () => true, name: shopId }];
      }
      if (p === legacyDir) {
        return [];
      }
      return [];
    });
    fsMock.existsSync.mockImplementation((p: any) => p === legacyPages);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/migrate-pages");

    expect(fsMock.renameSync).toHaveBeenCalledWith(legacyPages, targetFile);
    expect(fsMock.rmSync).toHaveBeenCalledWith(legacyDir);
    expect(logSpy).toHaveBeenCalledWith(`Moved pages for ${shopId}`);
  });

  it("skips shops that already migrated", async () => {
    const shopId = "shop2";
    const legacyDir = join(dataDir, shopId);
    const legacyPages = join(legacyDir, "pages.json");
    const targetDir = join(shopsDir, shopId);
    const targetFile = join(targetDir, "pages.json");

    fsMock.readdirSync.mockImplementation((p: any, opts?: any) => {
      if (p === dataDir && opts?.withFileTypes) {
        return [{ isDirectory: () => true, name: shopId }];
      }
      return [];
    });
    fsMock.existsSync.mockImplementation((p: any) => {
      if (p === legacyPages) return true;
      if (p === targetFile) return true;
      return false;
    });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/migrate-pages");

    expect(fsMock.renameSync).not.toHaveBeenCalled();
    expect(fsMock.rmSync).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(`Skipping ${shopId}; already migrated`);
  });
});
