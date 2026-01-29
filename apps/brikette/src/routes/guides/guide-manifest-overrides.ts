/**
 * Manifest override schema and types for editable guide areas.
 *
 * This module defines the structure for JSON-based manifest overrides that merge
 * with the TypeScript manifest at runtime. Overrides are stored in a committed JSON
 * file and edited via the authoring API in dev/preview environments.
 */
import { z } from "zod";

import type { GuideKey } from "../../guides/slugs/keys";

import { GUIDE_AREA_VALUES, GUIDE_STATUS_VALUES, type GuideArea, type GuideStatus } from "./guide-manifest";

/**
 * Schema for SEO audit analysis results.
 */
const seoAuditAnalysisSchema = z.object({
  strengths: z.array(z.string()).default([]),
  criticalIssues: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

/**
 * Schema for SEO audit metrics.
 * All metrics are optional numbers.
 */
const seoAuditMetricsSchema = z.record(z.string(), z.number().optional());

/**
 * Schema for complete SEO audit results.
 * Validates:
 * - timestamp is a valid ISO 8601 string
 * - score is between 0-10
 * - version follows semantic versioning format
 */
const seoAuditResultSchema = z.object({
  timestamp: z.string().datetime(),
  score: z.number().min(0).max(10),
  analysis: seoAuditAnalysisSchema,
  metrics: seoAuditMetricsSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning (e.g., 1.0.0)"),
});

/**
 * TypeScript type for SEO audit results.
 */
export type SeoAuditResult = z.infer<typeof seoAuditResultSchema>;

/**
 * Schema for a single guide's manifest override.
 * Validates that:
 * - areas is a non-empty array of valid GuideArea values (when provided)
 * - primaryArea is a valid GuideArea (when provided)
 * - primaryArea must be included in areas when both are provided
 * - status is a valid GuideStatus value (when provided)
 * - auditResults follows the SEO audit schema (when provided)
 */
export const manifestOverrideSchema = z
  .object({
    areas: z.array(z.enum(GUIDE_AREA_VALUES)).min(1).optional(),
    primaryArea: z.enum(GUIDE_AREA_VALUES).optional(),
    status: z.enum(GUIDE_STATUS_VALUES).optional(),
    auditResults: seoAuditResultSchema.optional(),
  })
  .refine(
    (data) => {
      // If both areas and primaryArea are provided, primaryArea must be in areas
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

/**
 * TypeScript type for a single guide's manifest override.
 */
export type ManifestOverride = z.infer<typeof manifestOverrideSchema>;

/**
 * Schema for the full overrides file (keyed by guide key).
 * Uses a record schema to allow any string key but typed as GuideKey for consumers.
 */
export const manifestOverridesSchema = z.record(z.string(), manifestOverrideSchema);

/**
 * TypeScript type for the full manifest overrides record.
 */
export type ManifestOverrides = Partial<Record<GuideKey, ManifestOverride>>;

/**
 * Validates a single override entry.
 * Returns the validated data or throws a ZodError.
 */
export function validateManifestOverride(data: unknown): ManifestOverride {
  return manifestOverrideSchema.parse(data);
}

/**
 * Validates the full overrides record.
 * Returns the validated data or throws a ZodError.
 */
export function validateManifestOverrides(data: unknown): ManifestOverrides {
  return manifestOverridesSchema.parse(data) as ManifestOverrides;
}

/**
 * Safely parses a single override entry.
 * Returns the result with success/error information.
 */
export function safeParseManifestOverride(data: unknown) {
  return manifestOverrideSchema.safeParse(data);
}

/**
 * Safely parses the full overrides record.
 * Returns the result with success/error information.
 */
export function safeParseManifestOverrides(data: unknown) {
  return manifestOverridesSchema.safeParse(data);
}

/**
 * Creates a valid override entry with areas, primaryArea, and optionally status.
 * Ensures primaryArea defaults to the first area if not specified.
 */
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
