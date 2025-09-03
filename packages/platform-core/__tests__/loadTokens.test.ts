import { jest } from "@jest/globals";
import fs from "fs";

jest.mock("../src/themeTokens", () => ({
  loadThemeTokensNode: jest.fn(),
}));

let loadTokens: (theme: string) => Record<string, string>;
let themeTokens: typeof import("../src/themeTokens");

beforeAll(async () => {
  themeTokens = await import("../src/themeTokens");
  ({ loadTokens } = await import("../src/createShop/themeUtils"));
});

describe("loadTokens", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("combines base and theme token maps with theme overriding", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.endsWith("tokens.ts")) {
        return "export const tokens = { baseOnly: { light: 'base' }, shared: { light: 'base' } };";
      }
      return "";
    });

    (themeTokens.loadThemeTokensNode as jest.Mock).mockReturnValue({
      themeOnly: "theme",
      shared: "theme",
    });

    const tokens = loadTokens("foo");
    expect(tokens).toEqual({
      baseOnly: "base",
      themeOnly: "theme",
      shared: "theme",
    });
  });
});

