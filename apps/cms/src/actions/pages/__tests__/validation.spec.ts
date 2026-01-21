import { describe, expect, it } from "@jest/globals";

import { LOCALES } from "@acme/i18n";

import {
  componentsField,
  createSchema,
  emptyTranslated,
  updateSchema,
} from "../validation";

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

  it("requires slug only when publishing on update", () => {
    const ok = updateSchema.safeParse({
      id: "1",
      updatedAt: "now",
      slug: "",
      status: "draft",
      components: "[]",
    });
    expect(ok.success).toBe(true);

    const res = updateSchema.safeParse({
      id: "1",
      updatedAt: "now",
      slug: "",
      status: "published",
      components: "[]",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Slug required to publish");
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
