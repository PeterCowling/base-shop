import { describe, expect, it } from "@jest/globals";

import { buildCatalogArtifactsFromDrafts } from "../catalogDraftToContract";

function baseBagDraft() {
  return {
    id: "bag-001",
    slug: "hermes-kelly-28-black",
    title: "Hermes Kelly 28",
    brandHandle: "hermes",
    brandName: "Hermes",
    collectionHandle: "kelly",
    collectionTitle: "Kelly",
    collectionDescription: "",
    price: "10000",
    publishState: "live" as const,
    sizes: "",
    description: "Structured top-handle bag.",
    createdAt: "2026-03-04T10:00:00.000Z",
    popularity: "1",
    imageFiles: "",
    imageAltTexts: "",
    taxonomy: {
      department: "women" as const,
      category: "bags" as const,
      subcategory: "top-handle",
      color: "black",
      material: "leather",
      fit: "",
      length: "",
      neckline: "",
      sleeveLength: "",
      pattern: "",
      occasion: "",
      sizeClass: "",
      strapStyle: "",
      hardwareColor: "",
      interiorColor: "",
      closureType: "",
      fits: "",
      metal: "",
      gemstone: "",
      jewelrySize: "",
      jewelryStyle: "",
      jewelryTier: "",
    },
    details: {
      modelHeight: "",
      modelSize: "",
      fitNote: "",
      fabricFeel: "",
      care: "",
      dimensions: "",
      strapDrop: "",
      whatFits: "",
      interior: "",
      sizeGuide: "",
      warranty: "",
    },
  };
}

describe("buildCatalogArtifactsFromDrafts", () => {
  it("preserves main-image-first media order without role metadata", () => {
    const draft = {
      ...baseBagDraft(),
      imageFiles:
        "xa-b/hermes-kelly-28-black/500-detail.jpg|xa-b/hermes-kelly-28-black/400-top.jpg|xa-b/hermes-kelly-28-black/100-front.jpg|xa-b/hermes-kelly-28-black/300-back.jpg|xa-b/hermes-kelly-28-black/200-side.jpg",
      imageAltTexts: "detail|top|front|back|side",
    };

    const { catalog, mediaIndex } = buildCatalogArtifactsFromDrafts({
      storefront: "xa-b",
      products: [draft],
      strict: true,
    });

    expect(catalog.products).toHaveLength(1);
    const media = catalog.products[0]?.media ?? [];
    expect(media.map((item) => item.path)).toEqual([
      "xa-b/hermes-kelly-28-black/500-detail.jpg",
      "xa-b/hermes-kelly-28-black/400-top.jpg",
      "xa-b/hermes-kelly-28-black/100-front.jpg",
      "xa-b/hermes-kelly-28-black/300-back.jpg",
      "xa-b/hermes-kelly-28-black/200-side.jpg",
    ]);
    expect(media.every((item) => !("role" in item))).toBe(true);
    expect(mediaIndex.items.every((item) => !("role" in item))).toBe(true);
  });

  it("warn mode prunes unsupported cloud image paths", () => {
    const draft = {
      ...baseBagDraft(),
      imageFiles: "images/legacy/1.jpg|xa-b/hermes-kelly-28-black/100-front.jpg",
      imageAltTexts: "legacy|front",
    };

    const { catalog, warnings } = buildCatalogArtifactsFromDrafts({
      storefront: "xa-b",
      products: [draft],
      strict: false,
      mediaValidationPolicy: "warn",
    });

    expect(catalog.products[0]?.media.map((item) => item.path)).toEqual([
      "xa-b/hermes-kelly-28-black/100-front.jpg",
    ]);
    expect(warnings.some((warning) => warning.includes("unsupported cloud image path"))).toBe(true);
  });

  it("strict mode rejects unsupported cloud image paths", () => {
    const draft = {
      ...baseBagDraft(),
      imageFiles: "images/legacy/1.jpg",
      imageAltTexts: "legacy",
    };

    expect(() =>
      buildCatalogArtifactsFromDrafts({
        storefront: "xa-b",
        products: [draft],
        strict: false,
        mediaValidationPolicy: "strict",
      }),
    ).toThrow("unsupported cloud image path");
  });
});
