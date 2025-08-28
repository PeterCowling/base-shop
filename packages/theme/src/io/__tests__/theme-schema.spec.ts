import { themeLibraryEntrySchema } from "../theme-schema";

describe("themeLibraryEntrySchema", () => {
  it("parses minimal entry", () => {
    const result = themeLibraryEntrySchema.parse({
      name: "Demo",
      brandColor: "#fff",
      createdBy: "tester",
      version: "1.0.0",
    });
    expect(result).toEqual({
      name: "Demo",
      brandColor: "#fff",
      createdBy: "tester",
      version: "1.0.0",
      tokens: {},
    });
  });

  it("fails on missing fields", () => {
    expect(() =>
      themeLibraryEntrySchema.parse({ name: "X" })
    ).toThrow();
  });
});
