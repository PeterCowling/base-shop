import { describe, expect, it } from "@jest/globals";

import { buildCsvRowUpdateFromDraft, rowToDraftInput } from "../catalogCsvMapping";

describe("catalogCsvMapping", () => {
  it("derives collection_handle from collectionTitle when handle is empty", () => {
    const row = buildCsvRowUpdateFromDraft({
      title: "Studio jacket",
      brandHandle: "atelier-x",
      collectionHandle: "",
      collectionTitle: "Outerwear",
      price: "189",
      description: "A structured layer.",
      createdAt: "2025-12-01T12:00:00.000Z",
      forSale: true,
      forRental: false,
      deposit: "0",
      stock: "0",
      popularity: "0",
      sizes: "S|M|L",
      taxonomy: {
        department: "women",
        category: "clothing",
        subcategory: "outerwear",
        color: "black, cream",
        material: "wool\ncotton",
      },
      details: {},
    });

    expect(row.collection_handle).toBe("outerwear");
    expect(row.taxonomy_color).toBe("black|cream");
    expect(row.taxonomy_material).toBe("wool|cotton");
  });

  it("parses boolean fields when reading a CSV row", () => {
    const draft = rowToDraftInput({
      id: "id-1",
      slug: "studio-jacket",
      title: "Studio jacket",
      brand_handle: "atelier-x",
      collection_handle: "outerwear",
      price: "189",
      description: "A structured layer.",
      created_at: "2025-12-01T12:00:00.000Z",
      popularity: "0",
      for_sale: "false",
      for_rental: "true",
      taxonomy_department: "women",
      taxonomy_category: "clothing",
      taxonomy_subcategory: "outerwear",
      taxonomy_color: "black|cream",
      taxonomy_material: "wool|cotton",
    });

    expect(draft.forSale).toBe(false);
    expect(draft.forRental).toBe(true);
  });
});

