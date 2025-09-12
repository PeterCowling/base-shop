import * as path from "path";
import * as os from "os";
const DATA_ROOT = path.join(os.tmpdir(), "shop-json-tests");

jest.mock("../../dataRoot", () => ({ DATA_ROOT }));

jest.mock("fs", () => {
  const files = new Map<string, string>();
  return {
    promises: {
      readFile: jest.fn(async (p: string) => {
        const data = files.get(p);
        if (data === undefined) throw new Error("not found");
        return data;
      }),
      writeFile: jest.fn(async (p: string, data: string) => {
        files.set(p, data);
      }),
      rename: jest.fn(async (tmp: string, dest: string) => {
        const data = files.get(tmp);
        if (data === undefined) throw new Error("missing");
        files.set(dest, data);
        files.delete(tmp);
      }),
      mkdir: jest.fn(async () => {}),
      __files: files,
    },
  };
});

jest.mock("../../shops/index", () => ({ validateShopName: (s: string) => s }));

import { promises as fs } from "fs";

describe("shop.json.server", () => {
  const fsMock = fs as unknown as typeof fs & { __files: Map<string, string> };
  beforeEach(() => {
    fsMock.__files.clear();
    jest.clearAllMocks();
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

  it("throws when shop file missing", async () => {
    const { getShopById } = await import("../shop.json.server");
    await expect(getShopById("missing")).rejects.toThrow(/not found/);
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
    const updated = await updateShopInRepo("shop2", { id: "shop2", name: "Updated" });
    expect(updated.name).toBe("Updated");
    expect(fsMock.__files.get(shopPath)).toContain("Updated");
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

