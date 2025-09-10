import fs from "fs";
import { join } from "node:path";
import * as themeTokens from "../src/themeTokens";

const { loadThemeTokensNode, loadThemeTokensBrowser, baseTokens } = themeTokens;

describe("loadThemeTokensNode", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("selects first existing candidate", () => {
    const existsSpy = jest.spyOn(fs, "existsSync");
    existsSpy.mockReturnValueOnce(false); // .js
    existsSpy.mockReturnValueOnce(false); // .ts
    existsSpy.mockReturnValueOnce(true); // src/tailwind-tokens.ts
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue("export const tokens = { '--color-bg': '#000' };");
    const tokens = loadThemeTokensNode("dark");
    const rootDir = join(__dirname, "../../..");
    const calls = existsSpy.mock.calls.slice(-3);
    expect(calls).toEqual([
      [
        join(rootDir, "packages", "themes", "dark", "tailwind-tokens.js"),
      ],
      [
        join(rootDir, "packages", "themes", "dark", "tailwind-tokens.ts"),
      ],
      [
        join(
          rootDir,
          "packages",
          "themes",
          "dark",
          "src",
          "tailwind-tokens.ts",
        ),
      ],
    ]);
    expect(tokens["--color-bg"]).toBe("#000");
  });

  it("returns empty object when no candidate exists", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const tokens = loadThemeTokensNode("dark");
    expect(tokens).toEqual({});
  });

  it.each(["", "base"])('returns empty object for %s theme', (theme) => {
    const tokens = loadThemeTokensNode(theme as string);
    expect(tokens).toEqual({});
  });
});

describe("loadThemeTokensBrowser", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("loads tokens from @themes/<theme>", async () => {
    const dir = join(__dirname, "../../themes/custom/src");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      join(dir, "index.ts"),
      "export const tokens = { '--color-bg': { light: '#fff' } };",
    );
    const tokens = await loadThemeTokensBrowser("custom");
    expect(tokens["--color-bg"]).toBe("#fff");
    fs.rmSync(join(__dirname, "../../themes/custom"), { recursive: true, force: true });
  });

  it("falls back to tailwind-tokens when direct import fails", async () => {
    const dir = join(
      __dirname,
      "../../themes/fallback/tailwind-tokens/src",
    );
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      join(dir, "index.ts"),
      "export const tokens = { '--color-bg': '#123' };",
    );
    const tokens = await loadThemeTokensBrowser("fallback");
    expect(tokens["--color-bg"]).toBe("#123");
    fs.rmSync(join(__dirname, "../../themes/fallback"), { recursive: true, force: true });
  });

  it("short-circuits for base theme", async () => {
    const tokens = await loadThemeTokensBrowser("base");
    expect(tokens).toBe(baseTokens);
  });

  it("returns base tokens when all imports fail", async () => {
    const tokens = await loadThemeTokensBrowser("missing-theme");
    expect(tokens).toBe(baseTokens);
  });
});

describe("loadThemeTokens", () => {
  it("delegates to node implementation when window is undefined", async () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue("export const tokens = { '--color-bg': '#abc' };");
    const original = global.window;
    // @ts-expect-error - simulate Node environment
    delete global.window;
    const tokens = await themeTokens.loadThemeTokens("dark");
    expect(tokens["--color-bg"]).toBe("#abc");
    global.window = original;
  });

  it("delegates to browser implementation when window is defined", async () => {
    const dir = join(__dirname, "../../themes/delegation/src");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      join(dir, "index.ts"),
      "export const tokens = { '--color-bg': { light: '#def' } };",
    );
    const tokens = await themeTokens.loadThemeTokens("delegation");
    expect(tokens["--color-bg"]).toBe("#def");
    fs.rmSync(join(__dirname, "../../themes/delegation"), { recursive: true, force: true });
  });
});
