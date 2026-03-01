import { describe, expect, it } from "@jest/globals";

import { catalogProductDraftSchema } from "@acme/lib/xa";

function baseDraft() {
  return {
    title: "Studio jacket",
    brandHandle: "atelier-x",
    collectionHandle: "outerwear",
    price: "189",
    description: "A structured layer.",
    createdAt: "2025-12-01T12:00:00.000Z",
    forSale: true,
    forRental: false,
    popularity: "0",
    deposit: "0",
    stock: "0",
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "outerwear",
      color: "black|cream",
      material: "wool|cotton",
    },
  };
}

describe("catalogProductDraftSchema", () => {
  it("accepts a valid clothing draft", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      taxonomy: {
        ...baseDraft().taxonomy,
        category: "clothing",
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(true);
  });

  it("accepts kids as a valid department", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      taxonomy: {
        ...baseDraft().taxonomy,
        department: "kids" as const,
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(true);
  });

  it("accepts collection_title without collection_handle", () => {
    const draft = {
      ...baseDraft(),
      collectionHandle: "",
      collectionTitle: "Outerwear",
      sizes: "S|M|L",
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(true);
  });

  it("rejects when neither collection handle nor title is provided", () => {
    const draft = {
      ...baseDraft(),
      collectionHandle: "",
      collectionTitle: "",
      sizes: "S|M|L",
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error.issues[0]?.message).toMatch(/Collection/);
  });

  it("rejects invalid createdAt", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      createdAt: "not-a-date",
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("requires sizes for clothing", () => {
    const draft = {
      ...baseDraft(),
      sizes: "",
      taxonomy: {
        ...baseDraft().taxonomy,
        category: "clothing",
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("requires metal for jewelry", () => {
    const draft = {
      ...baseDraft(),
      sizes: "",
      taxonomy: {
        ...baseDraft().taxonomy,
        category: "jewelry",
        metal: "",
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("rejects image alt text count mismatches", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      imageFiles: "a|b",
      imageAltTexts: "one",
      imageRoles: "front|side",
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("rejects image role count mismatches", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      imageFiles: "a|b",
      imageAltTexts: "one|two",
      imageRoles: "front",
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("requires category-specific image roles when images are present", () => {
    const draft = {
      ...baseDraft(),
      sizes: "S|M|L",
      imageFiles: "a|b",
      imageAltTexts: "one|two",
      imageRoles: "front|detail",
      taxonomy: {
        ...baseDraft().taxonomy,
        category: "clothing",
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(false);
  });

  it("accepts valid image roles for bag products", () => {
    const draft = {
      ...baseDraft(),
      sizes: "",
      imageFiles: "a|b|c",
      imageAltTexts: "one|two|three",
      imageRoles: "front|side|top",
      taxonomy: {
        ...baseDraft().taxonomy,
        category: "bags",
      },
    };
    const result = catalogProductDraftSchema.safeParse(draft);
    expect(result.success).toBe(true);
  });
});
