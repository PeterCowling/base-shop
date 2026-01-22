import { jest } from "@jest/globals";

jest.mock("../src/themeTokens", () => ({
  baseTokens: { baseOnly: "base", shared: "base" },
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
