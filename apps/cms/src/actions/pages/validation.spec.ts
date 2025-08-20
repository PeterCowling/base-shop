import { LOCALES } from "@acme/i18n";
import {
  createSchema,
  updateSchema,
  emptyTranslated,
  componentsField,
} from "./validation";
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
  });

  it("requires slug on update", () => {
    const res = updateSchema.safeParse({
      id: "1",
      updatedAt: "now",
      slug: "",
      components: "[]",
    });
    expect(res.success).toBe(false);
  });

  it("parses components field", () => {
    expect(componentsField.parse("[]")).toEqual([]);
  });
});
