import { promises as fs } from "node:fs";
import path from "node:path";

import * as coupons from "../coupons";
import { resolveDataRoot } from "../dataRoot";

describe("listCoupons", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns coupons from valid JSON file", async () => {
    const data = [{ code: "SAVE" }];
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValueOnce(JSON.stringify(data));

    await expect(coupons.listCoupons("demo")).resolves.toEqual(data);
  });

  it("returns empty array when coupons file missing", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));

    await expect(coupons.listCoupons("demo")).resolves.toEqual([]);
  });

  it("returns empty array for invalid JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValueOnce("not json");

    await expect(coupons.listCoupons("demo")).resolves.toEqual([]);
  });

  it("returns empty array for non-array JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify({ foo: 1 }));

    await expect(coupons.listCoupons("demo")).resolves.toEqual([]);
  });
});

describe("saveCoupons", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates directory and writes coupons file", async () => {
    const mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValueOnce(undefined as never);
    const writeSpy = jest
      .spyOn(fs, "writeFile")
      .mockResolvedValueOnce(undefined as never);
    const data = [{ code: "SAVE" }];
    const fp = path.join(resolveDataRoot(), "demo", "discounts.json");

    await coupons.saveCoupons("demo", data);

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname(fp), { recursive: true });
    expect(writeSpy).toHaveBeenCalledWith(fp, JSON.stringify(data, null, 2), "utf8");
  });
});

describe("findCoupon", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("matches codes case-insensitively", async () => {
    const item = { code: "SAVE", active: true } as const;
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify([item]));

    await expect(coupons.findCoupon("demo", "save")).resolves.toEqual(item);
  });

  it("ignores inactive coupons", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValueOnce(JSON.stringify([{ code: "SAVE", active: false }]));

    await expect(coupons.findCoupon("demo", "SAVE")).resolves.toBeUndefined();
  });

  it("returns undefined for undefined code", async () => {
    const spy = jest.spyOn(fs, "readFile");
    await expect(coupons.findCoupon("demo", undefined)).resolves.toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns undefined for empty code", async () => {
    const spy = jest.spyOn(fs, "readFile");
    await expect(coupons.findCoupon("demo", "")).resolves.toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });
});
