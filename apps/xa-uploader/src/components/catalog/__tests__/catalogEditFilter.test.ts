import type { CatalogProductDraftInput } from "@acme/lib/xa";

import {
  type EditFilterCriteria,
  extractFilterOptions,
  filterCatalogProducts,
} from "../catalogEditFilter";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const base: CatalogProductDraftInput = {
  title: "",
  brandHandle: "",
  brandName: "",
  collectionHandle: "",
  collectionTitle: "",
  price: "0",
  description: "",
  taxonomy: {
    department: "women",
    category: "bags",
    subcategory: "tote",
    color: "",
    material: "",
  },
};

function product(
  overrides: Partial<CatalogProductDraftInput> & { taxonomy?: Partial<CatalogProductDraftInput["taxonomy"]> },
): CatalogProductDraftInput {
  return {
    ...base,
    ...overrides,
    taxonomy: { ...base.taxonomy, ...overrides.taxonomy },
  };
}

const birkin25Gold = product({
  title: "Hermes Birkin 25 Gold",
  slug: "hermes-birkin-25-gold",
  brandHandle: "hermes",
  collectionHandle: "birkin",
  sizes: "25",
  taxonomy: { color: "gold", material: "togo" },
});

const birkin30Black = product({
  title: "Hermes Birkin 30 Black",
  slug: "hermes-birkin-30-black",
  brandHandle: "hermes",
  collectionHandle: "birkin",
  sizes: "30",
  taxonomy: { color: "black", material: "togo" },
});

const kelly25Etoupe = product({
  title: "Hermes Kelly 25 Etoupe",
  slug: "hermes-kelly-25-etoupe",
  brandHandle: "hermes",
  collectionHandle: "kelly",
  sizes: "25",
  taxonomy: { color: "etoupe", material: "epsom" },
});

const customBrandBag = product({
  title: "Custom Brand Bag",
  slug: "custom-brand-bag",
  brandHandle: "__custom__",
  collectionHandle: "__custom__",
  sizes: "one-size",
  taxonomy: { color: "brown", material: "leather" },
});

const birkin25BlackTogo = product({
  title: "Hermes Birkin 25 Black Togo",
  slug: "hermes-birkin-25-black-togo",
  brandHandle: "hermes",
  collectionHandle: "birkin",
  sizes: "25",
  taxonomy: { color: "black", material: "togo" },
});

const products = [birkin25Gold, birkin30Black, kelly25Etoupe, customBrandBag, birkin25BlackTogo];

/* ------------------------------------------------------------------ */
/*  filterCatalogProducts                                              */
/* ------------------------------------------------------------------ */

describe("filterCatalogProducts", () => {
  it("TC-01: no criteria returns all products", () => {
    expect(filterCatalogProducts(products, {})).toEqual(products);
  });

  it("TC-02: brand filter only", () => {
    const result = filterCatalogProducts(products, { brand: "hermes" });
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.brandHandle === "hermes")).toBe(true);
  });

  it("TC-03: brand + collection", () => {
    const result = filterCatalogProducts(products, {
      brand: "hermes",
      collection: "birkin",
    });
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.collectionHandle === "birkin")).toBe(true);
  });

  it("TC-04: brand + collection + size", () => {
    const result = filterCatalogProducts(products, {
      brand: "hermes",
      collection: "birkin",
      size: "25",
    });
    expect(result).toHaveLength(2);
    expect(result).toContain(birkin25Gold);
    expect(result).toContain(birkin25BlackTogo);
  });

  it("TC-05: full cascade narrows to exact match", () => {
    const result = filterCatalogProducts(products, {
      brand: "hermes",
      collection: "birkin",
      size: "25",
      color: "gold",
    });
    expect(result).toEqual([birkin25Gold]);
  });

  it("TC-06: no matches returns empty array", () => {
    const result = filterCatalogProducts(products, {
      brand: "hermes",
      collection: "birkin",
      size: "40",
    });
    expect(result).toEqual([]);
  });

  it("TC-07: custom brand handle matches", () => {
    const result = filterCatalogProducts(products, { brand: "__custom__" });
    expect(result).toEqual([customBrandBag]);
  });

  it("handles products with empty sizes gracefully", () => {
    const noSize = product({
      brandHandle: "hermes",
      collectionHandle: "birkin",
      sizes: "",
    });
    const result = filterCatalogProducts([...products, noSize], {
      brand: "hermes",
      collection: "birkin",
      size: "25",
    });
    // noSize should not match since it has no sizes
    expect(result).not.toContain(noSize);
  });

  it("handles products with pipe-delimited multi-color", () => {
    const multiColor = product({
      brandHandle: "hermes",
      collectionHandle: "birkin",
      sizes: "25",
      taxonomy: { color: "gold|black", material: "togo" },
    });
    const result = filterCatalogProducts([multiColor], {
      brand: "hermes",
      collection: "birkin",
      size: "25",
      color: "gold",
    });
    expect(result).toEqual([multiColor]);
  });
});

/* ------------------------------------------------------------------ */
/*  extractFilterOptions                                               */
/* ------------------------------------------------------------------ */

describe("extractFilterOptions", () => {
  it("TC-08: scopes collections to selected brand", () => {
    const opts = extractFilterOptions(products, { brand: "hermes" });
    expect(opts.collections.sort()).toEqual(["birkin", "kelly"]);
  });

  it("TC-09: empty products returns empty option sets", () => {
    const opts = extractFilterOptions([], {});
    expect(opts.brands).toEqual([]);
    expect(opts.collections).toEqual([]);
    expect(opts.sizes).toEqual([]);
    expect(opts.colors).toEqual([]);
  });

  it("returns all unique brands with no criteria", () => {
    const opts = extractFilterOptions(products, {});
    expect(opts.brands.sort()).toEqual(["__custom__", "hermes"]);
  });

  it("scopes sizes to selected brand + collection", () => {
    const opts = extractFilterOptions(products, {
      brand: "hermes",
      collection: "birkin",
    });
    expect(opts.sizes.sort()).toEqual(["25", "30"]);
  });

  it("scopes colors to selected brand + collection + size", () => {
    const opts = extractFilterOptions(products, {
      brand: "hermes",
      collection: "birkin",
      size: "25",
    });
    expect(opts.colors.sort()).toEqual(["black", "gold"]);
  });

  it("deduplicates pipe-delimited color values", () => {
    const multiColor = product({
      brandHandle: "hermes",
      collectionHandle: "birkin",
      sizes: "25",
      taxonomy: { color: "gold|red", material: "togo" },
    });
    const opts = extractFilterOptions([birkin25Gold, multiColor], {
      brand: "hermes",
      collection: "birkin",
      size: "25",
    });
    expect(opts.colors.sort()).toEqual(["gold", "red"]);
  });
});
