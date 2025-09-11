/** @jest-environment node */

// packages/platform-core/__tests__/tax.rules.test.ts
import { promises as fs } from "fs";

describe("tax rules", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("caches rates after initial read and defaults to 0 for unknown regions", async () => {
    const readSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("{\"us-ca\":0.1}");

    const { getTaxRate } = await import("../src/tax");

    const first = await getTaxRate("us-ca");
    const second = await getTaxRate("us-ca");
    const unknown = await getTaxRate("us-ny");

    expect(first).toBe(0.1);
    expect(second).toBe(0.1);
    expect(unknown).toBe(0);
    expect(readSpy).toHaveBeenCalledTimes(1);
  });

  it("returns 0 when rules file is missing", async () => {
    const err: NodeJS.ErrnoException = Object.assign(new Error("missing"), {
      code: "ENOENT",
    });
    const readSpy = jest.spyOn(fs, "readFile").mockRejectedValue(err);

    const { getTaxRate } = await import("../src/tax");

    const rate1 = await getTaxRate("us-ca");
    const rate2 = await getTaxRate("us-ny");

    expect(rate1).toBe(0);
    expect(rate2).toBe(0);
    expect(readSpy).toHaveBeenCalledTimes(1);
  });
});

