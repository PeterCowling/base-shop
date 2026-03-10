import { describe, expect, it } from "@jest/globals";

import { buildCsvRowUpdateFromDraft, rowToDraftInput } from "@acme/lib/xa";

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

  it("writes media_paths in the same order as image_files", () => {
    const row = buildCsvRowUpdateFromDraft({
      title: "Studio bag",
      brandHandle: "atelier-x",
      collectionHandle: "bags",
      price: "189",
      description: "A structured bag.",
      createdAt: "2025-12-01T12:00:00.000Z",
      popularity: "0",
      imageFiles: "images/a.jpg|images/b.jpg|images/c.jpg",
      imageAltTexts: "front|side|top",
      taxonomy: {
        department: "women",
        category: "bags",
        subcategory: "crossbody",
        color: "black",
        material: "leather",
      },
      details: {},
    });

    expect(row.media_paths).toBe("images/a.jpg|images/b.jpg|images/c.jpg");
  });

  it("reads canonical media_paths as ordered image files when image_files is empty", () => {
    const draft = rowToDraftInput({
      id: "id-1",
      slug: "studio-bag",
      title: "Studio bag",
      brand_handle: "atelier-x",
      collection_handle: "bags",
      price: "189",
      description: "A structured bag.",
      created_at: "2025-12-01T12:00:00.000Z",
      popularity: "0",
      media_paths: "images/a.jpg|images/b.jpg",
      taxonomy_department: "women",
      taxonomy_category: "bags",
      taxonomy_subcategory: "crossbody",
      taxonomy_color: "black|cream",
      taxonomy_material: "leather|suede",
    });

    expect(draft?.imageFiles).toBe("images/a.jpg|images/b.jpg");
  });

  it("discards legacy role-prefixed media_paths rows", () => {
    const draft = rowToDraftInput({
      id: "id-1",
      slug: "studio-bag",
      title: "Studio bag",
      brand_handle: "atelier-x",
      collection_handle: "bags",
      price: "189",
      description: "A structured bag.",
      created_at: "2025-12-01T12:00:00.000Z",
      popularity: "0",
      media_paths: "front:images/a.jpg|side:images/b.jpg",
      taxonomy_department: "women",
      taxonomy_category: "bags",
      taxonomy_subcategory: "crossbody",
      taxonomy_color: "black|cream",
      taxonomy_material: "leather|suede",
    });

    expect(draft).toBeNull();
  });
});
