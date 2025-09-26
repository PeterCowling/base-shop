import * as path from "node:path";

describe("themeTokens loadThemeTokensNode", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns {} for base or empty theme", async () => {
    const mod = await import("../index");
    expect(mod.loadThemeTokensNode("")).toEqual({});
    expect(mod.loadThemeTokensNode("base")).toEqual({});
  });

  it("walks up to workspace root and returns {} when nothing found", async () => {
    jest.doMock("node:fs", () => {
      const real = jest.requireActual("node:fs");
      return { ...real, existsSync: () => false, readFileSync: () => "" } as any;
    });
    jest.doMock("fs", () => {
      const real = jest.requireActual("fs");
      return { ...real, existsSync: () => false, readFileSync: () => "" } as any;
    });
    const mod = await import("../index");
    const res = mod.loadThemeTokensNode("t2");
    expect(res).toEqual({});
  });
});
