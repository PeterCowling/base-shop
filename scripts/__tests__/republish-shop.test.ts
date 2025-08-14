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
        p === componentsDir ||
        p === join(componentsDir, "nested")
    );
    fsMock.readFileSync.mockImplementation((p: any) => {
      if (p === upgradeFile || p === shopJson) return "{}";
      return "";
    });
    fsMock.readdirSync.mockImplementation((p: any) => {
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
});
