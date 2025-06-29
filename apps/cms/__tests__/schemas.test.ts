// apps/cms/__tests__/schemas.test.ts

import { productSchema, shopSchema } from "../src/actions/schemas";

describe("zod schemas", () => {
  it("productSchema parses valid data", () => {
    const data = {
      id: "p1",
      price: "10",
      title_en: "Hello",
      title_de: "Hallo",
      title_it: "Ciao",
    };
    const parsed = productSchema.parse(data);
    expect(parsed.price).toBe(10);
    expect(parsed.title_en).toBe("Hello");
    expect(parsed.desc_en).toBe("");
  });

  it("productSchema rejects invalid price", () => {
    const result = productSchema.safeParse({
      id: "p1",
      price: "-1",
      title_en: "Hey",
      title_de: "Hallo",
      title_it: "Ciao",
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.flatten().fieldErrors.price?.[0]).toBe("Invalid price");
  });

  it("shopSchema transforms catalogFilters", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "color, size , type",
    });
    expect(parsed.catalogFilters).toEqual(["color", "size", "type"]);
  });

  it("shopSchema requires name and themeId", () => {
    const result = shopSchema.safeParse({ id: "s1", name: "", themeId: "" });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    const errs = result.error.flatten().fieldErrors;
    expect(errs.name[0]).toBe("Required");
    expect(errs.themeId[0]).toBe("Required");
  });
});
