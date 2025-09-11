/** @jest-environment node */

import { promises as fs } from "node:fs";

describe("getReturnLogistics cache", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("reads configuration once and caches result", async () => {
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

    const { getReturnLogistics } = await import("../src/returnLogistics");
    const first = await getReturnLogistics();
    const second = await getReturnLogistics();

    expect(first).toEqual(cfg);
    expect(second).toBe(first);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("propagates ENOENT errors", async () => {
    const err = Object.assign(new Error("missing"), { code: "ENOENT" });
    jest.spyOn(fs, "readFile").mockRejectedValue(err);
    const { getReturnLogistics } = await import("../src/returnLogistics");
    await expect(getReturnLogistics()).rejects.toBe(err);
  });

  it("throws on invalid JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("not-json" as any);
    const { getReturnLogistics } = await import("../src/returnLogistics");
    await expect(getReturnLogistics()).rejects.toBeInstanceOf(SyntaxError);
  });
});

