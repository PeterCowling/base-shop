/**
 * Content readiness guardrail: guide manifest override schema validation.
 */
import { describe, expect, it } from "@jest/globals";

import type { SeoAuditResult } from "@/routes/guides/guide-manifest-overrides";
import { manifestOverrideSchema, validateManifestOverride } from "@/routes/guides/guide-manifest-overrides";

describe("manifestOverrideSchema", () => {
  describe("SEO audit results validation", () => {
    it("accepts valid audit results", () => {
      const validAuditResult: SeoAuditResult = {
        timestamp: "2026-01-29T10:00:00.000Z",
        score: 8.5,
        analysis: {
          strengths: ["Good meta title", "Strong FAQs"],
          criticalIssues: [],
          improvements: [
            { issue: "Add more internal links", impact: 0.2 },
            { issue: "Increase content length", impact: 0.3 },
          ],
        },
        metrics: {
          metaTitleLength: 55,
          metaDescriptionLength: 145,
          contentWordCount: 1800,
          headingCount: 12,
          internalLinkCount: 4,
          faqCount: 8,
          imageCount: 6,
        },
        version: "1.0.0",
      };

      const override = {
        areas: ["experience"] as const,
        primaryArea: "experience" as const,
        status: "draft" as const,
        auditResults: validAuditResult,
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(true);
    });

    it("accepts audit results with empty analysis arrays", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: 10.0,
          analysis: {
            strengths: [],
            criticalIssues: [],
            improvements: [],
          },
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(true);
    });

    it("accepts minimal valid audit results", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: 0,
          analysis: {
            strengths: [],
            criticalIssues: [
              { issue: "Missing meta title", impact: 1.0 },
              { issue: "No content", impact: 1.0 },
            ],
            improvements: [],
          },
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(true);
    });

    it("rejects audit results with score below 0", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: -1,
          analysis: {
            strengths: [],
            criticalIssues: [],
            improvements: [],
          },
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["auditResults", "score"]);
      }
    });

    it("rejects audit results with score above 10", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: 10.5,
          analysis: {
            strengths: [],
            criticalIssues: [],
            improvements: [],
          },
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["auditResults", "score"]);
      }
    });

    it("rejects audit results with invalid timestamp", () => {
      const override = {
        auditResults: {
          timestamp: "not-a-valid-date",
          score: 8.5,
          analysis: {
            strengths: [],
            criticalIssues: [],
            improvements: [],
          },
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["auditResults", "timestamp"]);
      }
    });

    it("rejects audit results with invalid version format", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: 8.5,
          analysis: {
            strengths: [],
            criticalIssues: [],
            improvements: [],
          },
          metrics: {},
          version: "v1.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["auditResults", "version"]);
      }
    });

    it("rejects audit results missing required fields", () => {
      const override = {
        auditResults: {
          timestamp: "2026-01-29T10:00:00.000Z",
          score: 8.5,
          // Missing analysis
          metrics: {},
          version: "1.0.0",
        },
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["auditResults", "analysis"]);
      }
    });

    it("accepts override without audit results", () => {
      const override = {
        areas: ["experience"] as const,
        primaryArea: "experience" as const,
        status: "draft" as const,
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(true);
    });
  });

  describe("existing validation", () => {
    it("validates primaryArea is in areas", () => {
      const override = {
        areas: ["experience"] as const,
        primaryArea: "help" as const,
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("primaryArea must be included in areas");
      }
    });

    it("accepts valid override with areas and primaryArea", () => {
      const override = {
        areas: ["experience", "help"] as const,
        primaryArea: "experience" as const,
        status: "live" as const,
      };

      const result = manifestOverrideSchema.safeParse(override);
      expect(result.success).toBe(true);
    });
  });
});
