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
    formData.append("filterMappingsKey", ""); // blank key
    formData.append("filterMappingsValue", "ShouldOmit");
    formData.append("filterMappingsKey", "color");
    formData.append("filterMappingsValue", "Color");
    formData.append("filterMappingsKey", "size");
    formData.append("filterMappingsValue", ""); // blank value
    formData.append("filterMappingsKey", "orphanKey"); // no matching value

    expect(parseFilterMappings(formData)).toBe(
      JSON.stringify({ brand: "Brand", color: "Color" }),
    );
  });

  it("parses price overrides", () => {
    const formData = new FormData();
    formData.append("priceOverridesKey", "USD");
    formData.append("priceOverridesValue", "10");
    formData.append("priceOverridesKey", "");
    formData.append("priceOverridesValue", "5"); // blank key
    formData.append("priceOverridesKey", "GBP");
    formData.append("priceOverridesValue", "not-a-number"); // non-numeric
    formData.append("priceOverridesKey", "CAD");
    formData.append("priceOverridesValue", "7");
    formData.append("priceOverridesKey", "EUR"); // missing value

    expect(parsePriceOverrides(formData)).toBe(
      JSON.stringify({ USD: 10, CAD: 7 }),
    );
  });

  it("parses locale overrides", () => {
    const formData = new FormData();
    formData.append("localeOverridesKey", "en");
    formData.append("localeOverridesValue", "de");
    formData.append("localeOverridesKey", "");
    formData.append("localeOverridesValue", "shouldOmit"); // blank key
    formData.append("localeOverridesKey", "fr");
    formData.append("localeOverridesValue", ""); // blank value
    formData.append("localeOverridesKey", "es");
    formData.append("localeOverridesValue", "it");
    formData.append("localeOverridesKey", "orphan"); // no matching value

    expect(parseLocaleOverrides(formData)).toBe(
      JSON.stringify({ en: "de", es: "it" }),
    );
  });
});
