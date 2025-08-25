import {
  parseFilterMappings,
  parsePriceOverrides,
  parseLocaleOverrides,
} from "../formData";

describe("form data helpers", () => {
  it("parses filter mappings", () => {
    const formData = new FormData();
    formData.append("filterMappingsKey", "brand");
    formData.append("filterMappingsValue", "Brand");
    formData.append("filterMappingsKey", "color");
    formData.append("filterMappingsValue", "Color");

    expect(parseFilterMappings(formData)).toBe(
      JSON.stringify({ brand: "Brand", color: "Color" }),
    );
  });

  it("parses price overrides", () => {
    const formData = new FormData();
    formData.append("priceOverridesKey", "USD");
    formData.append("priceOverridesValue", "10");
    formData.append("priceOverridesKey", "EUR");
    formData.append("priceOverridesValue", "9");

    expect(parsePriceOverrides(formData)).toBe(
      JSON.stringify({ USD: 10, EUR: 9 }),
    );
  });

  it("parses locale overrides", () => {
    const formData = new FormData();
    formData.append("localeOverridesKey", "en");
    formData.append("localeOverridesValue", "de");

    expect(parseLocaleOverrides(formData)).toBe(
      JSON.stringify({ en: "de" }),
    );
  });
});
