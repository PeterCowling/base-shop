import { describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../../demoData";
import { toXaSearchDoc, xaMiniSearchProcessTerm } from "../xaSearchConfig";

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, ...rest } = overrides;
  return {
    id: "01ARZ3NDEKTSV4RRFFQ69G5FA0",
    slug: "product",
    title: "Café Jacket",
    price: 100,
    deposit: 0,
    stock: 3,
    forSale: true,
    forRental: false,
    media: [{ url: "https://example.com/img.jpg", type: "image" }],
    sizes: ["M"],
    description: "Soft knit",
    brand: "acme",
    collection: "core",
    createdAt: "2024-01-01T00:00:00Z",
    popularity: 1,
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "tops",
      color: ["black"],
      material: ["cotton"],
      ...(taxonomy ?? {}),
    },
    ...rest,
  };
};

describe("xaSearchConfig", () => {
  it("builds normalized search documents", () => {
    const doc = toXaSearchDoc(
      makeProduct({ brand: "Acme", collection: "Core", description: "Soft knit" }),
    );
    expect(doc.title).toBe("Cafe Jacket");
    expect(doc.brand).toBe("Acme");
    expect(doc.taxonomy).toContain("women");
  });

  it("normalizes search terms", () => {
    expect(xaMiniSearchProcessTerm("  Café  ")).toBe("cafe");
  });
});
