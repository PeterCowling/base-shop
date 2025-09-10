const DATA_ROOT = "/data/shops";

jest.mock("../../dataRoot", () => ({
  DATA_ROOT,
}));

const files = new Map<string, string>();

jest.mock("fs", () => {
  return {
    promises: {
      readFile: jest.fn(async (p: string) => {
        const data = files.get(p);
        if (data === undefined) {
          const err = new Error("not found") as NodeJS.ErrnoException;
          err.code = "ENOENT";
          throw err;
        }
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

import { promises as fs } from "fs";
import * as path from "path";
import {
  readCouponRepo,
  writeCouponRepo,
  getCouponByCode,
} from "../coupons.server";

const shop = "demo";
const file = path.join(DATA_ROOT, shop, "coupons.json");
const readFile = fs.readFile as jest.Mock;
const writeFile = fs.writeFile as jest.Mock;
const rename = fs.rename as jest.Mock;
const mkdir = fs.mkdir as jest.Mock;
const memfs = (fs as any).__files as Map<string, string>;

describe("coupon repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memfs.clear();
  });

  it("readCouponRepo returns empty array when file missing", async () => {
    await expect(readCouponRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalledWith(file, "utf8");
  });

  it("readCouponRepo returns empty array when JSON invalid", async () => {
    memfs.set(file, "not json");
    await expect(readCouponRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalledWith(file, "utf8");
  });

  it("getCouponByCode is case-insensitive and null when absent", async () => {
    const coupons = [{ code: "SAVE10", discountPercent: 10 }];
    memfs.set(file, JSON.stringify(coupons));
    await expect(getCouponByCode(shop, "save10")).resolves.toEqual(coupons[0]);
    await expect(getCouponByCode(shop, "missing")).resolves.toBeNull();
  });

  it("writeCouponRepo writes via temp file then renames", async () => {
    const coupons = [{ code: "SAVE10", discountPercent: 10 }];
    const now = 123456;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    await writeCouponRepo(shop, coupons);
    const tmp = `${file}.${now}.tmp`;
    expect(mkdir).toHaveBeenCalledWith(path.join(DATA_ROOT, shop), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      tmp,
      JSON.stringify(coupons, null, 2),
      "utf8",
    );
    expect(rename).toHaveBeenCalledWith(tmp, file);
    expect(memfs.get(file)).toEqual(JSON.stringify(coupons, null, 2));
    expect(memfs.has(tmp)).toBe(false);
    nowSpy.mockRestore();
  });
});

it("sanitizes shop name in file path", async () => {
  jest.clearAllMocks();
  memfs.clear();
  jest.doMock("../../shops/index", () => ({
    validateShopName: () => "evil",
  }));
  await jest.isolateModulesAsync(async () => {
    const { readCouponRepo } = await import("../coupons.server");
    await expect(readCouponRepo("../evil")).resolves.toEqual([]);
  });
  const p = readFile.mock.calls[0][0] as string;
  expect(p).toBe(path.join(DATA_ROOT, "evil", "coupons.json"));
  expect(path.relative(DATA_ROOT, p).startsWith("..")).toBe(false);
});
