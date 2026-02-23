import { describe, expect, it } from "@jest/globals";

import { collectFacetValues, getFilterConfigs } from "../xaFilters";

describe("xaFilters", () => {
  it("uses category-specific label and filters for bags", () => {
    const bagConfigs = getFilterConfigs("bags");
    const typeConfig = bagConfigs.find((config) => config.key === "type");

    expect(typeConfig).toBeDefined();
    expect(typeConfig?.label).toBe("Bag type");
    expect(bagConfigs.map((config) => config.key)).toEqual(
      expect.arrayContaining(["strap-style", "hardware-color", "closure-type"]),
    );
  });

  it("can hide category filter when showType is false", () => {
    const clothingConfigs = getFilterConfigs("clothing", { showType: false });
    expect(clothingConfigs.map((config) => config.key)).not.toContain("type");
  });

  it("sorts size facet values using apparel size order", () => {
    const sizeConfig = getFilterConfigs("clothing").find(
      (config) => config.key === "size",
    );
    if (!sizeConfig) throw new Error("size config missing");

    const products = [
      { sizes: ["L", "S"], brand: "alpha", taxonomy: {} },
      { sizes: ["M", "XS"], brand: "beta", taxonomy: {} },
      { sizes: ["XXL", "XXS"], brand: "gamma", taxonomy: {} },
    ] as any[];

    const facets = collectFacetValues(products, [sizeConfig]);
    expect(facets.size).toEqual(["XXS", "XS", "S", "M", "L", "XXL"]);
  });

  it("formats unknown designer handles with title-cased fallback", () => {
    const designerConfig = getFilterConfigs("all").find(
      (config) => config.key === "designer",
    );
    if (!designerConfig) throw new Error("designer config missing");

    expect(designerConfig.formatValue("new_designer-label")).toBe("New Designer Label");
  });
});
