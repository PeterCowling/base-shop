import { promises as fs } from "fs";
import * as path from "path";

import { jsonCouponsRepository } from "@acme/platform-core/repositories/coupons.json.server";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __couponsRepoTestDataRoot: string | undefined;
}
globalThis.__couponsRepoTestDataRoot = "/data/shops";

const DATA_ROOT = globalThis.__couponsRepoTestDataRoot!;

jest.mock("@acme/platform-core/dataRoot", () => ({
  get DATA_ROOT() {
    return globalThis.__couponsRepoTestDataRoot;
  },
}));

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __couponsRepoTestFiles: Map<string, string> | undefined;
}
globalThis.__couponsRepoTestFiles = new Map<string, string>();

const files = globalThis.__couponsRepoTestFiles!;

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(async (p: string) => {
      const data = globalThis.__couponsRepoTestFiles?.get(p);
      if (data === undefined) {
        const err = new Error("not found") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      }
      return data;
    }),
    writeFile: jest.fn(async (p: string, data: string) => {
      globalThis.__couponsRepoTestFiles?.set(p, data);
    }),
    rename: jest.fn(async (tmp: string, dest: string) => {
      const data = globalThis.__couponsRepoTestFiles?.get(tmp);
      if (data === undefined) throw new Error("missing");
      globalThis.__couponsRepoTestFiles?.set(dest, data);
      globalThis.__couponsRepoTestFiles?.delete(tmp);
    }),
    mkdir: jest.fn(async () => {}),
    get __files() {
      return globalThis.__couponsRepoTestFiles;
    },
  },
}));

const shop = "demo";
const file = path.join(DATA_ROOT, shop, "coupons.json");
const readFile = fs.readFile as jest.Mock;
const writeFile = fs.writeFile as jest.Mock;
const rename = fs.rename as jest.Mock;
const mkdir = fs.mkdir as jest.Mock;
const memfs = (fs as any).__files as Map<string, string>;

describe("jsonCouponsRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memfs.clear();
  });

  it("read returns empty array when file missing", async () => {
    await expect(jsonCouponsRepository.read(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalledWith(file, "utf8");
  });

  it("read returns empty array when JSON invalid", async () => {
    memfs.set(file, "not json");
    await expect(jsonCouponsRepository.read(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalledWith(file, "utf8");
  });

  it("write creates directories and renames temp file", async () => {
    const coupons = [{ code: "SAVE10", discountPercent: 10 }];
    const now = 123456;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    await jsonCouponsRepository.write(shop, coupons);
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

  it("getByCode matches coupon codes case-insensitively", async () => {
    const coupons = [{ code: "SAVE10", discountPercent: 10 }];
    memfs.set(file, JSON.stringify(coupons));
    await expect(jsonCouponsRepository.getByCode(shop, "save10")).resolves.toEqual(
      coupons[0],
    );
  });
});
