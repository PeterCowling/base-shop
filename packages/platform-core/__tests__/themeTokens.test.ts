import fs from "fs";
import {
  loadThemeTokensNode,
  loadThemeTokensBrowser,
  baseTokens,
} from "../src/themeTokens";

describe("theme token loaders", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("loads tokens in Node environment", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue("export const tokens = { '--color-bg': '#000' };");
    const tokens = loadThemeTokensNode("dark");
    expect(tokens["--color-bg"]).toBe("#000");
  });

  it("loads tokens in browser environment", async () => {
    const tokens = await loadThemeTokensBrowser("abc");
    expect(tokens["--color-bg"]).toBeDefined();
  });

  it("falls back to base tokens", async () => {
    const tokens = await loadThemeTokensBrowser("nope");
    expect(tokens["--color-bg"]).toBe(baseTokens["--color-bg"]);
  });
});
