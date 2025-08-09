// packages/platform-core/__tests__/createShopUtils.test.ts
import fs from "fs";
import {
  copyTemplate,
  loadBaseTokens,
  loadThemeTokens,
} from "../src/createShop/utils";

describe("createShop utils", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("copies template directory with filter", () => {
    jest.spyOn(fs, "cpSync").mockImplementation(() => {});
    copyTemplate("src", "dest");
    expect(fs.cpSync).toHaveBeenCalledWith(
      "src",
      "dest",
      expect.objectContaining({ recursive: true, filter: expect.any(Function) })
    );
    const filter = (fs.cpSync as jest.Mock).mock.calls[0][2].filter as (
      src: string
    ) => boolean;
    expect(filter("a/node_modules/b")).toBe(false);
    expect(filter("a/src/index.ts")).toBe(true);
  });

  it("loads base tokens", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.endsWith("tokens.ts")) {
        return "export const tokens = { '--color-bg': { light: '#fff' } };";
      }
      return "";
    });
    const tokens = loadBaseTokens();
    expect(tokens["--color-bg"]).toBeDefined();
  });

  it("loads theme tokens", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.endsWith("tailwind-tokens.ts")) {
        return "export const tokens = { '--color-bg': '#000' };";
      }
      return "";
    });
    const tokens = loadThemeTokens("dark");
    expect(tokens["--color-bg"]).toBeDefined();
  });

  it("returns empty object for missing theme", () => {
    const tokens = loadThemeTokens("nope");
    expect(tokens).toEqual({});
  });
});
