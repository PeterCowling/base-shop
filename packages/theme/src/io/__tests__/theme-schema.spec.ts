import { parseTheme } from "../theme-schema";

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

  it("applies defaults for optional fields", () => {
    const theme = parseTheme({
      id: "test",
      name: "Test Theme",
      brandColor: "#fff",
      createdBy: "tester",
    });
    expect(theme.version).toBe(1);
    expect(theme.themeDefaults).toEqual({});
    expect(theme.themeOverrides).toEqual({});
    expect(theme.themeTokens).toEqual({});
  });

  it("throws on unknown properties", () => {
    expect(() =>
      parseTheme({
        id: "test",
        name: "Test Theme",
        brandColor: "#fff",
        createdBy: "tester",
        extra: true,
      })
    ).toThrow();
  });

  it("requires id", () => {
    expect(() =>
      parseTheme({
        name: "Test Theme",
        brandColor: "#fff",
        createdBy: "tester",
      })
    ).toThrow();
  });

  it("requires name", () => {
    expect(() =>
      parseTheme({
        id: "test",
        brandColor: "#fff",
        createdBy: "tester",
      })
    ).toThrow();
  });

  it("requires brandColor", () => {
    expect(() =>
      parseTheme({
        id: "test",
        name: "Test Theme",
        createdBy: "tester",
      })
    ).toThrow();
  });

  it("requires createdBy", () => {
    expect(() =>
      parseTheme({
        id: "test",
        name: "Test Theme",
        brandColor: "#fff",
      })
    ).toThrow();
  });
});
