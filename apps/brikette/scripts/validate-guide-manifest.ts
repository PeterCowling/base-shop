#!/usr/bin/env node
/**
 * Validation script for guide manifest relatedGuides correctness
 *
 * Checks:
 * - All relatedGuides keys exist in the manifest
 * - No duplicate keys within a guide's relatedGuides array
 * - No self-references (guide doesn't list itself)
 * - Live guides cannot reference draftOnly guides
 *
 * Usage:
 *   pnpm validate-manifest          # Validate all guides
 *   pnpm validate-manifest --verbose # Show detailed output
 *   pnpm validate-manifest --warn-only # Exit 0 even with violations (for CI transition)
 */

import { listGuideManifestEntries } from "../src/routes/guides/guide-manifest";
import type { GuideManifestEntry } from "../src/routes/guides/guide-manifest";

// Parse CLI arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const warnOnly = args.includes("--warn-only");

type ManifestViolation = {
  guideKey: string;
  status: string;
  draftOnly: boolean;
  violation: string;
  relatedGuide?: string;
  suggestion?: string;
};

/**
 * Validate a single manifest entry's relatedGuides
 */
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
      // Try to find close matches for suggestions
      const targetLower = relatedKey.toLowerCase();
      const closeMatches = Array.from(manifestMap.keys())
        .filter((k) => {
          const keyLower = k.toLowerCase();
          return keyLower.includes(targetLower) ||
                 targetLower.includes(keyLower.slice(0, 4)) ||
                 keyLower.includes(targetLower.slice(0, 4));
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

  // Check live → draftOnly constraint
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

/**
 * Main validation function
 */
const main = async (): Promise<void> => {
  const manifest = listGuideManifestEntries();

  console.log("Validating guide manifest relatedGuides...");
  console.log(`Total guides: ${manifest.length}`);
  console.log("");

  // Build manifest lookup map
  const manifestMap = new Map<string, GuideManifestEntry>();
  for (const entry of manifest) {
    manifestMap.set(entry.key, entry);
  }

  // Collect all violations
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

  // Report statistics
  console.log("Validation Summary:");
  console.log(`  Guides with relatedGuides: ${guidesWithRelatedGuides}`);
  console.log(`  Total relatedGuides references: ${totalRelatedGuides}`);
  console.log(`  Validation violations: ${violations.length}`);
  console.log("");

  if (violations.length > 0) {
    console.log("Manifest Violations:");
    console.log("");

    // Group by violation type for better readability
    const byType = new Map<string, ManifestViolation[]>();
    for (const v of violations) {
      const violationType = v.violation.split(":")[0].trim();
      if (!byType.has(violationType)) {
        byType.set(violationType, []);
      }
      byType.get(violationType)!.push(v);
    }

    for (const [type, typeViolations] of byType) {
      console.log(`  ${type} (${typeViolations.length}):`);
      for (const violation of typeViolations) {
        console.log(`    Guide: ${violation.guideKey} (status: ${violation.status}${violation.draftOnly ? ", draftOnly" : ""})`);
        console.log(`      ${violation.violation}`);
        if (violation.suggestion) {
          console.log(`      Suggestion: ${violation.suggestion}`);
        }
        if (verbose && violation.relatedGuide) {
          console.log(`      Related guide key: ${violation.relatedGuide}`);
        }
      }
      console.log("");
    }

    if (warnOnly) {
      console.warn("⚠️  Validation failed but running in warn-only mode (--warn-only)");
      console.warn("    Fix these violations before enforcing validation in CI");
    } else {
      console.error("❌ Validation failed due to manifest violations.");
      process.exitCode = 1;
    }
  } else {
    console.log("✅ All manifest relatedGuides validated successfully!");
  }
};

main().catch((error) => {
  console.error("Fatal error during validation:");
  console.error(error);
  process.exitCode = 1;
});
