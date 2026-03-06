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
    imageRoles: "",
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
  it("propagates image roles and orders media as front/back/top first", () => {
    const draft = {
      ...baseBagDraft(),
      imageFiles:
        "xa-b/hermes-kelly-28-black/500-detail.jpg|xa-b/hermes-kelly-28-black/400-top.jpg|xa-b/hermes-kelly-28-black/100-front.jpg|xa-b/hermes-kelly-28-black/300-back.jpg|xa-b/hermes-kelly-28-black/200-side.jpg",
      imageRoles: "detail|top|front|back|side",
      imageAltTexts: "detail|top|front|back|side",
    };

    const { catalog, mediaIndex } = buildCatalogArtifactsFromDrafts({
      storefront: "xa-b",
      products: [draft],
      strict: true,
    });

    expect(catalog.products).toHaveLength(1);
    const media = catalog.products[0]?.media ?? [];
    expect(media.map((item) => item.role)).toEqual([
      "front",
      "back",
      "top",
      "side",
      "detail",
    ]);
    expect(media.map((item) => item.path)).toEqual([
      "xa-b/hermes-kelly-28-black/100-front.jpg",
      "xa-b/hermes-kelly-28-black/300-back.jpg",
      "xa-b/hermes-kelly-28-black/400-top.jpg",
      "xa-b/hermes-kelly-28-black/200-side.jpg",
      "xa-b/hermes-kelly-28-black/500-detail.jpg",
    ]);

    expect(
      mediaIndex.items.find((item) => item.catalogPath.endsWith("100-front.jpg"))?.role,
    ).toBe("front");
    expect(
      mediaIndex.items.find((item) => item.catalogPath.endsWith("300-back.jpg"))?.role,
    ).toBe("back");
  });

  it("warn mode prunes unsupported cloud image paths", () => {
    const draft = {
      ...baseBagDraft(),
      imageFiles: "images/legacy/1.jpg|xa-b/hermes-kelly-28-black/100-front.jpg",
      imageRoles: "front|front",
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
      imageRoles: "front",
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
