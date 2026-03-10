import { describe, expect, it } from "@jest/globals";

import type { CatalogProductDraftInput } from "../catalogAdminSchema";
import { deriveCatalogPublishState, getCatalogDraftWorkflowReadiness } from "../catalogWorkflow";

function baseDraft(): CatalogProductDraftInput {
  return {
    title: "Kelly 28",
    brandHandle: "hermes",
    collectionHandle: "kelly",
    price: "12000",
    description: "Structured top-handle bag.",
    createdAt: "2026-01-01T00:00:00.000Z",
    taxonomy: {
      department: "women",
      category: "bags",
      subcategory: "top-handle",
      color: "black",
      material: "clemence",
    },
  };
}

describe("catalogWorkflow", () => {
  it("keeps drafts data-ready while images are still missing", () => {
    const readiness = getCatalogDraftWorkflowReadiness(baseDraft());
    expect(readiness.isDataReady).toBe(true);
    expect(readiness.hasImages).toBe(false);
    expect(readiness.isPublishReady).toBe(false);
    expect(readiness.missingFieldPaths).toContain("imageFiles");
  });

  it("does not mark publish-ready until at least one image exists", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "",
      imageAltTexts: "",
    });
    expect(readiness.isDataReady).toBe(true);
    expect(readiness.hasImages).toBe(false);
    expect(readiness.isPublishReady).toBe(false);
    expect(readiness.missingFieldPaths).toContain("imageFiles");
  });

  it("marks publish-ready once one main image exists", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/main.jpg",
      imageAltTexts: "main view",
    });
    expect(readiness.isDataReady).toBe(true);
    expect(readiness.hasImages).toBe(true);
    expect(readiness.isPublishReady).toBe(true);
    expect(readiness.isSubmissionReady).toBe(true);
    expect(readiness.missingRoles).toHaveLength(0);
  });

  it("preserves out_of_stock once the draft is publish-ready", () => {
    const state = deriveCatalogPublishState({
      ...baseDraft(),
      publishState: "out_of_stock",
      imageFiles: "images/kelly/main.jpg",
      imageAltTexts: "main view",
    });
    expect(state).toBe("out_of_stock");
  });
});
