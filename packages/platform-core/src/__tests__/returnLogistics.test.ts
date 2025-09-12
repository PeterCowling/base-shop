/** @jest-environment node */

import { promises as fs } from "fs";

describe("getReturnBagAndLabel", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("returns only bag and label fields", async () => {
    const cfg = {
      labelService: "ups",
      inStore: true,
      dropOffProvider: "happy-returns",
      tracking: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      mobileApp: true,
      requireTags: true,
      allowWear: false,
    };

    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(JSON.stringify(cfg) as any);

    const { getReturnBagAndLabel } = await import("../returnLogistics");
    const result = await getReturnBagAndLabel();

    expect(result).toEqual({
      bagType: cfg.bagType,
      labelService: cfg.labelService,
      tracking: cfg.tracking,
      returnCarrier: cfg.returnCarrier,
      homePickupZipCodes: cfg.homePickupZipCodes,
    });

    expect(result).not.toHaveProperty("inStore");
    expect(result).not.toHaveProperty("dropOffProvider");
    expect(result).not.toHaveProperty("mobileApp");
    expect(result).not.toHaveProperty("requireTags");
    expect(result).not.toHaveProperty("allowWear");
  });
});

describe("getReturnLogistics", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("caches the parsed configuration", async () => {
    const cfg = {
      labelService: "ups",
      inStore: true,
      dropOffProvider: "happy-returns",
      tracking: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      mobileApp: true,
      requireTags: true,
      allowWear: false,
    };

    const spy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(JSON.stringify(cfg) as any);

    const { getReturnLogistics } = await import("../returnLogistics");
    const first = await getReturnLogistics();
    const second = await getReturnLogistics();

    expect(first).toEqual(cfg);
    expect(second).toBe(first);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("throws when return logistics JSON is invalid", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("not-json" as any);
    const { getReturnLogistics } = await import("../returnLogistics");
    await expect(getReturnLogistics()).rejects.toBeInstanceOf(SyntaxError);
  });

  it("propagates ENOENT errors", async () => {
    const err = Object.assign(new Error("missing"), { code: "ENOENT" });
    jest.spyOn(fs, "readFile").mockRejectedValue(err);
    const { getReturnLogistics } = await import("../returnLogistics");
    await expect(getReturnLogistics()).rejects.toBe(err);
  });
});

