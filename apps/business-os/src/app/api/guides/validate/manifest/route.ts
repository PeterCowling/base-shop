/**
 * Guide manifest validation API — GET to check manifest for violations.
 *
 * Migrated from apps/brikette/src/app/api/guides/validate/manifest/route.ts
 */
import { type NextRequest, NextResponse } from "next/server";

import type { GuideManifestEntry } from "@acme/guide-system";

import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

type ManifestViolation = {
  guideKey: string;
  status: string;
  draftOnly: boolean;
  violation: string;
  relatedGuide?: string;
  suggestion?: string;
};

function validateManifestEntry(
  entry: GuideManifestEntry,
  manifestMap: Map<string, GuideManifestEntry>
): ManifestViolation[] {
  const violations: ManifestViolation[] = [];
  const { key, relatedGuides, status = "draft", draftOnly = false } = entry;

  // Check for duplicates
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const relatedKey of relatedGuides) {
    if (seen.has(relatedKey)) {
      duplicates.add(relatedKey);
    }
    seen.add(relatedKey);
  }

  for (const duplicate of duplicates) {
    violations.push({
      guideKey: key,
      status,
      draftOnly,
      violation: `Duplicate related guide key: "${duplicate}"`,
      relatedGuide: duplicate,
    });
  }

  // Check for self-reference
  if (relatedGuides.includes(key)) {
    violations.push({
      guideKey: key,
      status,
      draftOnly,
      violation: `Self-reference detected: guide lists itself in relatedGuides`,
      relatedGuide: key,
    });
  }

  // Check that all related guides exist
  for (const relatedKey of relatedGuides) {
    if (!manifestMap.has(relatedKey)) {
      const targetLower = relatedKey.toLowerCase();
      const closeMatches = Array.from(manifestMap.keys())
        .filter((k) => {
          const keyLower = k.toLowerCase();
          return (
            keyLower.includes(targetLower) ||
            targetLower.includes(keyLower.slice(0, 4)) ||
            keyLower.includes(targetLower.slice(0, 4))
          );
        })
        .sort((a, b) => a.length - b.length);

      violations.push({
        guideKey: key,
        status,
        draftOnly,
        violation: `Related guide key "${relatedKey}" not found in manifest`,
        relatedGuide: relatedKey,
        suggestion: closeMatches[0],
      });
    }
  }

  // Check live -> draftOnly constraint
  const isLiveGuide = status === "live" && !draftOnly;
  if (isLiveGuide) {
    for (const relatedKey of relatedGuides) {
      const relatedEntry = manifestMap.get(relatedKey);
      if (relatedEntry?.draftOnly) {
        violations.push({
          guideKey: key,
          status,
          draftOnly,
          violation: `Live guide references draft-only guide: "${relatedKey}"`,
          relatedGuide: relatedKey,
        });
      }
    }
  }

  return violations;
}

export async function GET(_request: NextRequest) {
  try {
    const manifest = listGuideManifestEntries();

    const manifestMap = new Map<string, GuideManifestEntry>();
    for (const entry of manifest) {
      manifestMap.set(entry.key, entry);
    }

    const violations: ManifestViolation[] = [];
    let totalRelatedGuides = 0;
    let guidesWithRelatedGuides = 0;

    for (const entry of manifest) {
      if (entry.relatedGuides.length > 0) {
        guidesWithRelatedGuides++;
        totalRelatedGuides += entry.relatedGuides.length;
      }

      const entryViolations = validateManifestEntry(entry, manifestMap);
      violations.push(...entryViolations);
    }

    const byType = new Map<string, ManifestViolation[]>();
    for (const v of violations) {
      const violationType = v.violation.split(":")[0].trim();
      if (!byType.has(violationType)) {
        byType.set(violationType, []);
      }
      byType.get(violationType)!.push(v);
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalGuides: manifest.length,
        guidesWithRelatedGuides,
        totalRelatedGuides,
        violationCount: violations.length,
      },
      violations,
      violationsByType: Object.fromEntries(byType),
    });
  } catch (error) {
    console.error("Manifest validation error:", error);
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
