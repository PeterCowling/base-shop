import { join } from "node:path";

const fsMock = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn(),
};

const cpMock = {
  spawnSync: jest.fn(() => ({ status: 0 })),
};

jest.mock("node:fs", () => fsMock);
jest.mock("node:child_process", () => cpMock);

describe("republish-shop", () => {
  const root = "/repo";
  const shopId = "shop1";
  const appDir = join(root, "apps", shopId);
  const componentsDir = join(appDir, "src", "components");
  const upgradeFile = join(root, "data", "shops", shopId, "upgrade.json");
  const shopJson = join(root, "data", "shops", shopId, "shop.json");
  const upgradeChanges = join(appDir, "upgrade-changes.json");

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("removes upgrade-changes and .bak files", async () => {
    fsMock.existsSync.mockImplementation(
      (p: any) =>
        p === upgradeFile ||
        p === upgradeChanges ||
        p === appDir ||
        p === join(appDir, "src") ||
        p === componentsDir ||
        p === join(componentsDir, "nested") ||
        p === shopJson
    );
    fsMock.readFileSync.mockImplementation((p: any) => {
      if (p === upgradeFile || p === shopJson) return "{}";
      return "";
    });
    fsMock.readdirSync.mockImplementation((p: any) => {
      if (p === appDir) {
        return [
          {
            name: "upgrade-changes.json",
            isDirectory: () => false,
            isFile: () => true,
          },
          { name: "src", isDirectory: () => true, isFile: () => false },
        ];
      }
      if (p === join(appDir, "src")) {
        return [
          { name: "components", isDirectory: () => true, isFile: () => false },
        ];
      }
      if (p === componentsDir) {
        return [
          { name: "a.bak", isDirectory: () => false, isFile: () => true },
          { name: "b.ts", isDirectory: () => false, isFile: () => true },
          { name: "nested", isDirectory: () => true, isFile: () => false },
        ];
      }
      if (p === join(componentsDir, "nested")) {
        return [
          { name: "c.bak", isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    const { republishShop } = await import("../src/republish-shop");
    republishShop(shopId, root);

    expect(fsMock.unlinkSync).toHaveBeenCalledWith(upgradeChanges);
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(
      join(componentsDir, "a.bak")
    );
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(
      join(componentsDir, "nested", "c.bak")
    );
  });

  it("removes .bak files in arbitrary subdirectories", async () => {
    const otherDir = join(appDir, "other");
    fsMock.existsSync.mockImplementation(
      (p: any) =>
        p === upgradeFile ||
        p === upgradeChanges ||
        p === appDir ||
        p === otherDir ||
        p === shopJson
    );
    fsMock.readFileSync.mockImplementation((p: any) => {
      if (p === upgradeFile || p === shopJson) return "{}";
      return "";
    });
    fsMock.readdirSync.mockImplementation((p: any) => {
      if (p === appDir) {
        return [{ name: "other", isDirectory: () => true, isFile: () => false }];
      }
      if (p === otherDir) {
        return [
          { name: "file.bak", isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    const { republishShop } = await import("../src/republish-shop");
    republishShop(shopId, root);

    expect(fsMock.unlinkSync).toHaveBeenCalledWith(
      join(otherDir, "file.bak")
    );
  });

  it("updates componentVersions in shop.json", async () => {
    const pkg = join(appDir, "package.json");
    fsMock.existsSync.mockImplementation((p: any) => p === pkg || p === shopJson);
    fsMock.readFileSync.mockImplementation((p: any) => {
      if (p === pkg) return JSON.stringify({ dependencies: { comp: "1.0.0" } });
      if (p === shopJson) return "{}";
      return "";
    });

    const { republishShop } = await import("../src/republish-shop");
    republishShop(shopId, root);

    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      shopJson,
      JSON.stringify(
        { status: "published", componentVersions: { comp: "1.0.0" } },
        null,
        2
      )
    );
  });
});
