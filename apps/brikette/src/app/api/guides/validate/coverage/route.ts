import { NextRequest, NextResponse } from "next/server";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";
import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

/**
 * API endpoint for guide coverage reporting
 *
 * Runs a lightweight version of scripts/report-guide-coverage.ts
 * Returns JSON with coverage metrics for UI display
 */

type CoverageReport = {
  totalGuides: number;
  byStatus: {
    live: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
    review: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
    draft: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
  };
  belowThreshold: Array<{ key: string; status: string; count: number; minimum: number }>;
  orphans: string[];
  inlineLinkStats: {
    guidesWithLinks: number;
    totalLinks: number;
    average: number;
  };
  mapsUrlCount: number;
  missingReciprocals: Array<{ from: string; to: string }>;
};

const MINIMUM_THRESHOLDS: Record<string, number> = {
  live: 2,
  review: 1,
  draft: 0,
};

function extractLinkTokens(content: string): Array<{ type: string; target: string }> {
  const linkPattern = /%LINK:([^|%]+)\|([^%]+)%/g;
  const matches: Array<{ type: string; target: string }> = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    matches.push({
      type: "LINK",
      target: match[1],
    });
  }

  return matches;
}

function containsGoogleMapsUrl(content: string): boolean {
  return content.includes("google.com/maps");
}

async function scanGuideContent(
  locale: string,
  manifest: GuideManifestEntry[]
): Promise<Map<string, { hasInlineLinks: boolean; linkCount: number; hasMapsUrls: boolean }>> {
  const contentStats = new Map<
    string,
    { hasInlineLinks: boolean; linkCount: number; hasMapsUrls: boolean }
  >();

  const localesDir = join(process.cwd(), "src", "locales", locale, "guides", "content");

  for (const entry of manifest) {
    const contentPath = join(localesDir, `${entry.contentKey}.json`);

    try {
      const rawContent = await readFile(contentPath, "utf-8");
      const linkTokens = extractLinkTokens(rawContent);
      const hasMaps = containsGoogleMapsUrl(rawContent);

      contentStats.set(entry.key, {
        hasInlineLinks: linkTokens.length > 0,
        linkCount: linkTokens.length,
        hasMapsUrls: hasMaps,
      });
    } catch (error) {
      // Content file doesn't exist, skip
      contentStats.set(entry.key, {
        hasInlineLinks: false,
        linkCount: 0,
        hasMapsUrls: false,
      });
    }
  }

  return contentStats;
}

function buildInboundLinksMap(
  manifest: GuideManifestEntry[],
  contentStats: Map<string, { hasInlineLinks: boolean; linkCount: number; hasMapsUrls: boolean }>
): Map<string, Set<string>> {
  const inboundLinks = new Map<string, Set<string>>();

  // Initialize all guides
  for (const entry of manifest) {
    inboundLinks.set(entry.key, new Set());
  }

  // Track manifest relatedGuides
  for (const entry of manifest) {
    for (const relatedKey of entry.relatedGuides) {
      if (!inboundLinks.has(relatedKey)) {
        inboundLinks.set(relatedKey, new Set());
      }
      inboundLinks.get(relatedKey)!.add(entry.key);
    }
  }

  return inboundLinks;
}

function detectMissingReciprocals(
  manifest: GuideManifestEntry[]
): Array<{ from: string; to: string }> {
  const missing: Array<{ from: string; to: string }> = [];

  // Build map of guide → Set<relatedGuides>
  const relatedMap = new Map<string, Set<string>>();
  for (const entry of manifest) {
    relatedMap.set(entry.key, new Set(entry.relatedGuides));
  }

  // Check each A→B relationship
  for (const entry of manifest) {
    for (const relatedKey of entry.relatedGuides) {
      const reciprocalSet = relatedMap.get(relatedKey);
      if (reciprocalSet && !reciprocalSet.has(entry.key)) {
        missing.push({ from: entry.key, to: relatedKey });
      }
    }
  }

  return missing;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    const manifest = listGuideManifestEntries();
    const contentStats = await scanGuideContent(locale, manifest);
    const inboundLinks = buildInboundLinksMap(manifest, contentStats);
    const missingReciprocals = detectMissingReciprocals(manifest);

    // Calculate stats
    const byStatus: CoverageReport["byStatus"] = {
      live: { total: 0, withRelatedGuides: 0, withoutRelatedGuides: 0 },
      review: { total: 0, withRelatedGuides: 0, withoutRelatedGuides: 0 },
      draft: { total: 0, withRelatedGuides: 0, withoutRelatedGuides: 0 },
    };

    const belowThreshold: CoverageReport["belowThreshold"] = [];
    const orphans: string[] = [];

    let guidesWithInlineLinks = 0;
    let totalInlineLinks = 0;
    let guidesWithMapsUrls = 0;

    for (const entry of manifest) {
      const status = (entry.status || "draft") as keyof typeof byStatus;
      const hasRelatedGuides = entry.relatedGuides.length > 0;

      byStatus[status].total++;
      if (hasRelatedGuides) {
        byStatus[status].withRelatedGuides++;
      } else {
        byStatus[status].withoutRelatedGuides++;
      }

      // Check threshold
      const minimum = MINIMUM_THRESHOLDS[status] || 0;
      if (entry.relatedGuides.length < minimum) {
        belowThreshold.push({
          key: entry.key,
          status,
          count: entry.relatedGuides.length,
          minimum,
        });
      }

      // Check orphans
      const inbound = inboundLinks.get(entry.key);
      if (inbound && inbound.size === 0) {
        orphans.push(entry.key);
      }

      // Inline link stats
      const stats = contentStats.get(entry.key);
      if (stats) {
        if (stats.hasInlineLinks) {
          guidesWithInlineLinks++;
          totalInlineLinks += stats.linkCount;
        }
        if (stats.hasMapsUrls) {
          guidesWithMapsUrls++;
        }
      }
    }

    const report: CoverageReport = {
      totalGuides: manifest.length,
      byStatus,
      belowThreshold,
      orphans,
      inlineLinkStats: {
        guidesWithLinks: guidesWithInlineLinks,
        totalLinks: totalInlineLinks,
        average: guidesWithInlineLinks > 0 ? totalInlineLinks / guidesWithInlineLinks : 0,
      },
      mapsUrlCount: guidesWithMapsUrls,
      missingReciprocals: missingReciprocals.slice(0, 50), // Limit to 50 for UI
    };

    return NextResponse.json({
      success: true,
      locale,
      report,
    });
  } catch (error) {
    console.error("Coverage reporting error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
