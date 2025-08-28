import { themeLibraryEntrySchema } from "../theme-schema";

describe("themeLibraryEntrySchema", () => {
  it("validates a proper entry", () => {
    const data = {
      name: "Example",
      brandColor: "#ffffff",
      createdBy: "tester",
      version: 1,
      tokens: { "--color-primary": "#ffffff" },
    };
    expect(themeLibraryEntrySchema.parse(data)).toMatchObject(data);
  });

  it("rejects missing fields", () => {
    const result = themeLibraryEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
