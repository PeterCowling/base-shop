import { LOCALES } from "@acme/i18n";
import {
  createSchema,
  updateSchema,
  emptyTranslated,
  componentsField,
} from "../validation";
import { describe, expect, it } from "@jest/globals";

describe("pages validation", () => {
  it("creates empty translated object for all locales", () => {
    const obj = emptyTranslated();
    expect(obj).toEqual(
      Object.fromEntries(LOCALES.map((l) => [l, ""]))
    );
  });

  it("parses valid create data", () => {
    const result = createSchema.parse({ slug: "home", components: "[]" });
    expect(result.slug).toBe("home");
    expect(result.components).toEqual([]);
  });

  it("rejects invalid image url", () => {
    const res = createSchema.safeParse({
      slug: "home",
      image: "not-url",
      components: "[]",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Invalid image URL");
      expect(res.error.issues[0].path).toEqual(["image"]);
    }
  });

  it("requires slug on update", () => {
    const res = updateSchema.safeParse({
      id: "1",
      updatedAt: "now",
      slug: "",
      components: "[]",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Slug required");
      expect(res.error.issues[0].path).toEqual(["slug"]);
    }
  });

  it("parses components field", () => {
    expect(componentsField.parse("[]")).toEqual([]);
  });

  it("adds issue for invalid components json", () => {
    const res = componentsField.safeParse("not json");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Invalid components");
    }
  });
});
