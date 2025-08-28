import { parseThemeLibraryEntry } from "../theme-schema";

describe("theme-library schema", () => {
  it("parses valid entry", () => {
    const entry = parseThemeLibraryEntry({
      id: "1",
      name: "Default",
      brandColor: "#ffffff",
      createdBy: "tester",
      version: 1,
      theme: { "--color-primary": "0 0% 0%" },
    });
    expect(entry.name).toBe("Default");
  });

  it("rejects missing fields", () => {
    expect(() => parseThemeLibraryEntry({} as any)).toThrow();
  });
});
