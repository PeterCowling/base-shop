import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

const DATA_ROOT = path.join(os.tmpdir(), "shop-json-tests");

jest.mock("../../dataRoot", () => ({ DATA_ROOT }));

// Use globalThis to store test files - this avoids Jest hoisting issues
declare global {
  // eslint-disable-next-line no-var
  var __shopJsonTestFiles: Map<string, string> | undefined;
}
globalThis.__shopJsonTestFiles = new Map<string, string>();

jest.mock("fs", () => {
  return {
    promises: {
      readFile: jest.fn(async (p: string) => {
        const files = globalThis.__shopJsonTestFiles;
        const data = files?.get(p);
        if (data === undefined) throw new Error("not found");
        return data;
      }),
      writeFile: jest.fn(async (p: string, data: string) => {
        globalThis.__shopJsonTestFiles?.set(p, data);
      }),
      rename: jest.fn(async (tmp: string, dest: string) => {
        const files = globalThis.__shopJsonTestFiles;
        const data = files?.get(tmp);
        if (data === undefined) throw new Error("missing");
        files?.set(dest, data);
        files?.delete(tmp);
      }),
      mkdir: jest.fn(async () => {}),
      get __files() {
        return globalThis.__shopJsonTestFiles;
      },
    },
  };
});

jest.mock("../../shops/index", () => ({ validateShopName: jest.fn((s: string) => s) }));

// Import the mocked validateShopName from the mocked module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateShopName } = require("../../shops/index") as { validateShopName: jest.Mock };

describe("shop.json.server", () => {
  const fsMock = fs as unknown as typeof fs & { __files: Map<string, string> };
  beforeEach(() => {
    globalThis.__shopJsonTestFiles?.clear();
    jest.clearAllMocks();
    validateShopName.mockImplementation((s: string) => s);
  });

  afterAll(() => {
    delete globalThis.__shopJsonTestFiles;
  });

  it("reads existing shop file", async () => {
    const shopPath = path.join(DATA_ROOT, "shop1", "shop.json");
    fsMock.__files.set(
      shopPath,
      JSON.stringify({
        id: "shop1",
        name: "Shop 1",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
      })
    );
    const { getShopById } = await import("../shop.json.server");
    const result = await getShopById("shop1");
    expect(result.id).toBe("shop1");
  });

  it("throws 'Shop not found' when shop file missing", async () => {
    const { getShopById } = await import("../shop.json.server");
    await expect(getShopById("missing")).rejects.toThrow(
      "Shop missing not found",
    );
  });

  it("rethrows 'Shop <id> not found' when fs.readFile fails", async () => {
    const { getShopById } = await import("../shop.json.server");
    (fsMock.readFile as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await expect(getShopById("boomshop")).rejects.toThrow(
      "Shop boomshop not found",
    );
  });

  it("throws on malformed JSON", async () => {
    const shopPath = path.join(DATA_ROOT, "bad", "shop.json");
    fsMock.__files.set(shopPath, "{not json");
    const { getShopById } = await import("../shop.json.server");
    await expect(getShopById("bad")).rejects.toThrow(/not found/);
  });

  it("updates shop when ids match", async () => {
    const shopPath = path.join(DATA_ROOT, "shop2", "shop.json");
    fsMock.__files.set(
      shopPath,
      JSON.stringify({
        id: "shop2",
        name: "Shop 2",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
      })
    );
    const { updateShopInRepo } = await import("../shop.json.server");
    const updated = await updateShopInRepo("shop2", {
      id: "shop2",
      name: "Updated",
    });
    expect(updated.name).toBe("Updated");
    expect(fsMock.__files.get(shopPath)).toContain("Updated");
    expect(fsMock.mkdir).toHaveBeenCalledWith(path.dirname(shopPath), {
      recursive: true,
    });
    const tmpPath = (fsMock.writeFile as jest.Mock).mock.calls[0][0];
    expect(tmpPath).toMatch(/\.tmp$/);
    expect(tmpPath).toContain(path.join(DATA_ROOT, "shop2", "shop.json"));
    expect(fsMock.rename).toHaveBeenCalledWith(tmpPath, shopPath);
    expect(
      (fsMock.writeFile as jest.Mock).mock.invocationCallOrder[0],
    ).toBeLessThan((fsMock.rename as jest.Mock).mock.invocationCallOrder[0]);
  });

  it("throws when patch id does not match", async () => {
    const shopPath = path.join(DATA_ROOT, "shop3", "shop.json");
    fsMock.__files.set(
      shopPath,
      JSON.stringify({
        id: "shop3",
        name: "Shop 3",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
      })
    );
    const { updateShopInRepo } = await import("../shop.json.server");
    await expect(
      updateShopInRepo("shop3", { id: "other", name: "x" } as any)
    ).rejects.toThrow(/not found/);
  });

  it("validates shop name and uses normalized path when updating", async () => {
    const original = "shopv";
    const normalized = original.toUpperCase();
    validateShopName.mockImplementation((s: string) => s.toUpperCase());
    const shopPath = path.join(DATA_ROOT, normalized, "shop.json");
    fsMock.__files.set(
      shopPath,
      JSON.stringify({
        id: normalized,
        name: "Shop V",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
      }),
    );
    const { updateShopInRepo } = await import("../shop.json.server");
    await updateShopInRepo(original, { id: normalized, name: "Updated" });
    expect(validateShopName).toHaveBeenCalledWith(original);
    expect(fsMock.mkdir).toHaveBeenCalledWith(
      path.join(DATA_ROOT, normalized),
      { recursive: true },
    );
    const tmpPath = (fsMock.writeFile as jest.Mock).mock.calls[0][0];
    expect(tmpPath).toContain(path.join(DATA_ROOT, normalized, "shop.json"));
    expect(fsMock.rename).toHaveBeenCalledWith(tmpPath, shopPath);
  });

  it("getShopJson reads existing file", async () => {
    const shopPath = path.join(DATA_ROOT, "s1", "shop.json");
    fsMock.__files.set(
      shopPath,
      JSON.stringify({
        id: "s1",
        name: "S1",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
      }),
    );
    const { getShopJson } = await import("../shop.json.server");
    const data = await getShopJson("s1");
    expect(data.id).toBe("s1");
  });

  it("getShopJson rejects missing file", async () => {
    const { getShopJson } = await import("../shop.json.server");
    await expect(getShopJson("nope")).rejects.toThrow(/not found/);
  });
});

