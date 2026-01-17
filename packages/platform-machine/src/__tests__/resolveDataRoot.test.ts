/** @jest-environment node */

describe("resolveDataRoot", () => {
  // require instead of import to avoid ESM hoisting issues
  const fs = require("node:fs");
  const pathMod = require("node:path");
  const { resolveDataRoot } = require("@acme/platform-core/dataRoot");

  afterEach(() => {
    delete process.env.DATA_ROOT;
  });

  it("honors DATA_ROOT env var", () => {
    process.env.DATA_ROOT = "/custom";
    expect(resolveDataRoot()).toBe(pathMod.resolve("/custom"));
  });

  it("returns existing candidate", () => {
    const spy = jest
      .spyOn(fs, "existsSync")
      .mockReturnValueOnce(true as any)
      .mockReturnValue(false as any);
    const result = resolveDataRoot();
    expect(result).toBe(pathMod.join(process.cwd(), "data", "shops"));
    spy.mockRestore();
  });

  it("falls back when no folder exists", () => {
    const spy = jest.spyOn(fs, "existsSync").mockReturnValue(false as any);
    const result = resolveDataRoot();
    expect(result).toBe(pathMod.resolve(process.cwd(), "data", "shops"));
    spy.mockRestore();
  });
});

