const { parseTheme } = require("../theme-schema");

describe("themeLibrarySchema", () => {
  it("parses valid theme", () => {
    const theme = parseTheme({
      id: "test",
      name: "Test Theme",
      brandColor: "#fff",
      createdBy: "tester",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    });
    expect(theme.name).toBe("Test Theme");
  });

  it("throws on invalid theme", () => {
    expect(() => parseTheme({})).toThrow();
  });
});
