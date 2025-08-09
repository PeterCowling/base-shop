// apps/cms/__tests__/schemas.test.ts
import { productSchema, shopSchema } from "../src/actions/schemas";

describe("zod schemas", () => {
  /* ---------------------------------------------------------------------- */
  /* productSchema                                                          */
  /* ---------------------------------------------------------------------- */

  it("productSchema parses valid data", () => {
    const data = {
      id: "p1",
      price: "10",
      title: { en: "Hello", de: "Hallo", it: "Ciao" },
      description: { en: "World", de: "Welt", it: "Mondo" },
    };

    const parsed = productSchema.parse(data);

    expect(parsed.price).toBe(10);
    expect(parsed.title.en).toBe("Hello");
    expect(parsed.description.en).toBe("World");
  });

  it("productSchema rejects invalid price", () => {
    const result = productSchema.safeParse({
      id: "p1",
      price: "-1",
      title: { en: "Hey", de: "Hallo", it: "Ciao" },
      description: { en: "World", de: "Welt", it: "Mondo" },
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");

    const priceErr = result.error.flatten().fieldErrors.price?.[0];
    expect(priceErr).toBe("Invalid price");
  });

  /* ---------------------------------------------------------------------- */
  /* shopSchema                                                             */
  /* ---------------------------------------------------------------------- */

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

    /*  --- Type guards remove TS18048 warnings --- */
    expect(errs.name).toBeDefined();
    expect(errs.themeId).toBeDefined();

    expect(errs.name?.[0]).toBe("Required");
    expect(errs.themeId?.[0]).toBe("Required");
  });
});
