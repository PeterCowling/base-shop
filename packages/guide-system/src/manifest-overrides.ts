/**
 * Manifest override schema and types for editable guide areas.
 *
 * Defines the structure for JSON-based manifest overrides that merge
 * with the TypeScript manifest at runtime.
 *
 * Extracted from apps/brikette/src/routes/guides/guide-manifest-overrides.ts
 */
import { z } from "zod";

import { GUIDE_AREA_VALUES, GUIDE_STATUS_VALUES, type GuideArea, type GuideStatus } from "./manifest-types";

const seoAuditIssueSchema = z.object({
  issue: z.string(),
  impact: z.number(),
});

const seoAuditAnalysisSchema = z.object({
  strengths: z.array(z.string()).default([]),
  criticalIssues: z.array(seoAuditIssueSchema).default([]),
  improvements: z.array(seoAuditIssueSchema).default([]),
});

const seoAuditMetricsSchema = z.record(z.string(), z.number().optional());

const seoAuditResultSchema = z.object({
  timestamp: z.string().datetime(),
  score: z.number().min(0).max(10),
  analysis: seoAuditAnalysisSchema,
  metrics: seoAuditMetricsSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning (e.g., 1.0.0)"),
});

export type SeoAuditResult = z.infer<typeof seoAuditResultSchema>;

const URL_SAFE_SEGMENT_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const draftPathSegmentSchema = z
  .string()
  .min(1, "Draft path cannot be empty")
  .max(200, "Draft path is too long")
  .refine(
    (value) => {
      const segments = value.split("/");
      return segments.length >= 1 && segments.length <= 5;
    },
    { message: "Draft path must have 1-5 segments" },
  )
  .refine(
    (value) => {
      const segments = value.split("/");
      return segments.every((segment) => URL_SAFE_SEGMENT_REGEX.test(segment));
    },
    { message: "Draft path segments must be URL-safe (lowercase letters, numbers, hyphens)" },
  );

export const manifestOverrideSchema = z
  .object({
    areas: z.array(z.enum(GUIDE_AREA_VALUES)).min(1).optional(),
    primaryArea: z.enum(GUIDE_AREA_VALUES).optional(),
    status: z.enum(GUIDE_STATUS_VALUES).optional(),
    auditResults: seoAuditResultSchema.optional(),
    draftPathSegment: draftPathSegmentSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.areas && data.primaryArea) {
        return data.areas.includes(data.primaryArea);
      }
      return true;
    },
    {
      message: "primaryArea must be included in areas when both are provided",
      path: ["primaryArea"],
    },
  );

export type ManifestOverride = z.infer<typeof manifestOverrideSchema>;

export const manifestOverridesSchema = z.record(z.string(), manifestOverrideSchema);

export type ManifestOverrides = Partial<Record<string, ManifestOverride>>;

export function validateManifestOverride(data: unknown): ManifestOverride {
  return manifestOverrideSchema.parse(data);
}

export function validateManifestOverrides(data: unknown): ManifestOverrides {
  return manifestOverridesSchema.parse(data) as ManifestOverrides;
}

export function safeParseManifestOverride(data: unknown) {
  return manifestOverrideSchema.safeParse(data);
}

export function safeParseManifestOverrides(data: unknown) {
  return manifestOverridesSchema.safeParse(data);
}

export function createManifestOverride(
  areas: GuideArea[],
  primaryArea?: GuideArea,
  status?: GuideStatus,
): ManifestOverride {
  if (areas.length === 0) {
    throw new Error("areas must contain at least one area");
  }
  const primary = primaryArea ?? areas[0];
  if (!areas.includes(primary)) {
    throw new Error("primaryArea must be included in areas");
  }
  return {
    areas,
    primaryArea: primary,
    ...(status ? { status } : {}),
  };
}
