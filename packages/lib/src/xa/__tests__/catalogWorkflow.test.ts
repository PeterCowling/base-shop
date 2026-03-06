import { describe, expect, it } from "@jest/globals";

import type { CatalogProductDraftInput } from "../catalogAdminSchema";
import { getCatalogDraftWorkflowReadiness } from "../catalogWorkflow";

function baseDraft(): CatalogProductDraftInput {
  return {
    title: "Kelly 28",
    brandHandle: "hermes",
    collectionHandle: "kelly",
    price: "12000",
    description: "Structured top-handle bag.",
    createdAt: "2026-01-01T00:00:00.000Z",
    stock: "1",
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
  });

  it("does not mark publish-ready until category-required image roles are present", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/front.jpg|images/kelly/detail.jpg",
      imageRoles: "front|detail",
      imageAltTexts: "front view|detail view",
    });
    expect(readiness.isDataReady).toBe(true);
    expect(readiness.hasImages).toBe(true);
    expect(readiness.isPublishReady).toBe(false);
    expect(readiness.missingFieldPaths).toContain("imageRoles");
  });

  it("marks publish-ready once required roles are complete and aligned", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/front.jpg|images/kelly/side.jpg|images/kelly/top.jpg",
      imageRoles: "front|side|top",
      imageAltTexts: "front view|side view|top view",
    });
    expect(readiness.isDataReady).toBe(true);
    expect(readiness.hasImages).toBe(true);
    expect(readiness.isPublishReady).toBe(true);
    expect(readiness.isSubmissionReady).toBe(true);
    expect(readiness.missingFieldPaths).not.toContain("imageRoles");
  });

  it("does not mark publish-ready when role count does not match image count", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/front.jpg|images/kelly/side.jpg",
      imageRoles: "front",
      imageAltTexts: "front view|side view",
    });
    expect(readiness.isPublishReady).toBe(false);
    expect(readiness.missingFieldPaths).toContain("imageRoles");
  });

  it("returns specific missing roles when required roles are absent (bags)", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/front.jpg",
      imageRoles: "front",
      imageAltTexts: "front view",
    });
    expect(readiness.missingRoles).toContain("side");
    expect(readiness.missingRoles).toContain("top");
    expect(readiness.missingRoles).not.toContain("front");
    expect(readiness.isPublishReady).toBe(false);
  });

  it("returns empty missingRoles when all required roles are present", () => {
    const readiness = getCatalogDraftWorkflowReadiness({
      ...baseDraft(),
      imageFiles: "images/kelly/front.jpg|images/kelly/side.jpg|images/kelly/top.jpg",
      imageRoles: "front|side|top",
      imageAltTexts: "front view|side view|top view",
    });
    expect(readiness.missingRoles).toHaveLength(0);
    expect(readiness.isPublishReady).toBe(true);
  });

  it("returns all required roles as missing when no images exist", () => {
    const readiness = getCatalogDraftWorkflowReadiness(baseDraft());
    expect(readiness.missingRoles).toContain("front");
    expect(readiness.missingRoles).toContain("side");
    expect(readiness.missingRoles).toContain("top");
  });
});
