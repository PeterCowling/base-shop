/**
 * Tests for seoAudit checklist item in buildGuideChecklist.
 */
import { describe, expect, it } from "@jest/globals";

import type { GuideManifestEntry, ManifestOverrides, SeoAuditResult } from "@/routes/guides/guide-manifest";
import { buildGuideChecklist } from "@/routes/guides/guide-manifest";

describe("buildGuideChecklist - seoAudit item", () => {
  const createMockEntry = (overrides?: Partial<GuideManifestEntry>): GuideManifestEntry => ({
    key: "positanoBeaches",
    slug: "positano-beaches",
    contentKey: "positanoBeaches",
    status: "draft",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: [],
    relatedGuides: [],
    blocks: [],
    ...overrides,
  });

  const createMockAudit = (score: number): SeoAuditResult => ({
    timestamp: "2026-01-29T10:00:00.000Z",
    score,
    analysis: {
      strengths: ["Good content"],
      criticalIssues: [],
      improvements: [],
    },
    metrics: {
      contentWordCount: 2000,
    },
    version: "1.0.0",
  });

  it("should show seoAudit as missing when no overrides provided", () => {
    const entry = createMockEntry();
    const checklist = buildGuideChecklist(entry);

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem).toBeDefined();
    expect(seoAuditItem?.status).toBe("missing");
    expect(seoAuditItem?.note).toBe("SEO Audit");
  });

  it("should show seoAudit as missing when overrides exist but no audit results", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        areas: ["experience"],
        primaryArea: "experience",
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("missing");
    expect(seoAuditItem?.note).toBe("Not audited");
  });

  it("should show seoAudit as inProgress when score < 9.0", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        auditResults: createMockAudit(8.5),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("inProgress");
    expect(seoAuditItem?.note).toBe("Score: 8.5/10");
  });

  it("should show seoAudit as complete when score >= 9.0", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        auditResults: createMockAudit(9.0),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("complete");
    expect(seoAuditItem?.note).toBe("Score: 9.0/10");
  });

  it("should show seoAudit as complete when score is 10.0", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        auditResults: createMockAudit(10.0),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("complete");
    expect(seoAuditItem?.note).toBe("Score: 10.0/10");
  });

  it("should show seoAudit as inProgress when score is exactly 8.9", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        auditResults: createMockAudit(8.9),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("inProgress");
    expect(seoAuditItem?.note).toBe("Score: 8.9/10");
  });

  it("should show seoAudit as inProgress with low score", () => {
    const entry = createMockEntry();
    const overrides: ManifestOverrides = {
      positanoBeaches: {
        auditResults: createMockAudit(5.0),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    expect(seoAuditItem?.status).toBe("inProgress");
    expect(seoAuditItem?.note).toBe("Score: 5.0/10");
  });

  it("should include seoAudit in checklist items", () => {
    const entry = createMockEntry();
    const checklist = buildGuideChecklist(entry);

    const itemIds = checklist.items.map((item) => item.id);
    expect(itemIds).toContain("seoAudit");
  });

  it("should handle different guide key with audit results", () => {
    const entry = createMockEntry({ key: "fornilloBeachGuide" });
    const overrides: ManifestOverrides = {
      fornilloBeachGuide: {
        auditResults: createMockAudit(9.5),
      },
      positanoBeaches: {
        auditResults: createMockAudit(7.0),
      },
    };

    const checklist = buildGuideChecklist(entry, { overrides });

    const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
    // Should use fornilloBeachGuide's audit (9.5), not positanoBeaches (7.0)
    expect(seoAuditItem?.status).toBe("complete");
    expect(seoAuditItem?.note).toBe("Score: 9.5/10");
  });
});
