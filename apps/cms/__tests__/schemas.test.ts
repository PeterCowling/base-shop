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
      media: [],
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
      media: [],
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
    expect(parsed.luxuryFeatures).toEqual({
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
    });
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

  it("shopSchema parses blog checkbox", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
      blog: "on",
    });

    expect(parsed.luxuryFeatures.blog).toBe(true);
  });

  it("shopSchema parses luxury feature checkboxes", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
      contentMerchandising: "on",
      raTicketing: "on",
      fraudReviewThreshold: "150",
      requireStrongCustomerAuth: "on",
    });

    expect(parsed.luxuryFeatures).toEqual({
      blog: false,
      contentMerchandising: true,
      raTicketing: true,
      fraudReviewThreshold: 150,
      requireStrongCustomerAuth: true,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
    });
  });

  /* ---------------------------------------------------------------------- */
  /* jsonRecord                                                             */
  /* ---------------------------------------------------------------------- */

  it("jsonRecord parses valid JSON strings", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
      themeOverrides: '{"color":"red"}',
    });

    expect(parsed.themeOverrides).toEqual({ color: "red" });
  });

  it("jsonRecord reports invalid JSON", () => {
    const result = shopSchema.safeParse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
      themeOverrides: "{invalid",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");

    const err = result.error.flatten().fieldErrors.themeOverrides?.[0];
    expect(err).toBe("Invalid JSON");
  });

  it("jsonRecord defaults empty input to an empty object", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
    });

    expect(parsed.themeOverrides).toEqual({});
  });

  /* ---------------------------------------------------------------------- */
  /* catalogFilters                                                          */
  /* ---------------------------------------------------------------------- */

  it("catalogFilters parses an empty string to an empty array", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
    });

    expect(parsed.catalogFilters).toEqual([]);
  });

  it("catalogFilters parses a single value", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "color",
    });

    expect(parsed.catalogFilters).toEqual(["color"]);
  });

  /* ---------------------------------------------------------------------- */
  /* boolean preprocessors                                                   */
  /* ---------------------------------------------------------------------- */

  it("boolean preprocessors treat 'off' as false", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
      blog: "off",
    });

    expect(parsed.luxuryFeatures.blog).toBe(false);
  });

  it("boolean preprocessors default undefined to false", () => {
    const parsed = shopSchema.parse({
      id: "s1",
      name: "Shop",
      themeId: "base",
      catalogFilters: "",
    });

    expect(parsed.luxuryFeatures.blog).toBe(false);
  });
});
