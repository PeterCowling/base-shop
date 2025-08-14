import { parseShopForm } from "../validation";

describe("validation service", () => {
  it("parses a valid shop form", () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("name", "My Shop");
    formData.set("themeId", "theme1");
    const result = parseShopForm(formData);
    expect(result.data?.id).toBe("1");
  });

  it("returns errors for invalid shop form", () => {
    const formData = new FormData();
    const result = parseShopForm(formData);
    expect(result.errors).toBeDefined();
  });

  it("parses key/value pairs", () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("name", "My Shop");
    formData.set("themeId", "theme1");
    formData.append("filterMappingsKey", "color");
    formData.append("filterMappingsValue", "colour");
    formData.append("priceOverridesKey", "en");
    formData.append("priceOverridesValue", "100");
    formData.append("localeOverridesKey", "/de");
    formData.append("localeOverridesValue", "de");
    const result = parseShopForm(formData);
    expect(result.data?.filterMappings).toEqual({ color: "colour" });
    expect(result.data?.priceOverrides).toEqual({ en: 100 });
    expect(result.data?.localeOverrides).toEqual({ "/de": "de" });
  });

  it("returns errors for invalid price override", () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("name", "My Shop");
    formData.set("themeId", "theme1");
    formData.append("priceOverridesKey", "en-US");
    formData.append("priceOverridesValue", "abc");
    const result = parseShopForm(formData);
    expect(result.errors?.priceOverrides).toBeDefined();
  });
});
