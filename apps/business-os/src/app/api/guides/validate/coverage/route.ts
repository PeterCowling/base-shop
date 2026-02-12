/**
 * Guide coverage reporting API — GET coverage metrics for all guides.
 *
 * Migrated from apps/brikette/src/app/api/guides/validate/coverage/route.ts
 * Adapted to use brikette's content directory via config paths.
 */
import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

import type { GuideManifestEntry } from "@acme/guide-system";

import { getLocalesDir } from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

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
    matches.push({ type: "LINK", target: match[1] });
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

  const localesDir = getLocalesDir();
  const contentDir = join(localesDir, locale, "guides", "content");

  for (const entry of manifest) {
    const contentPath = join(contentDir, `${entry.contentKey}.json`);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- GS-001: path derived from config
      const rawContent = await readFile(contentPath, "utf-8");
      const linkTokens = extractLinkTokens(rawContent);
      const hasMaps = containsGoogleMapsUrl(rawContent);

      contentStats.set(entry.key, {
        hasInlineLinks: linkTokens.length > 0,
        linkCount: linkTokens.length,
        hasMapsUrls: hasMaps,
      });
    } catch {
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
): Map<string, Set<string>> {
  const inboundLinks = new Map<string, Set<string>>();

  for (const entry of manifest) {
    inboundLinks.set(entry.key, new Set());
  }

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

  const relatedMap = new Map<string, Set<string>>();
  for (const entry of manifest) {
    relatedMap.set(entry.key, new Set(entry.relatedGuides));
  }

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
    const inboundLinks = buildInboundLinksMap(manifest);
    const missingReciprocals = detectMissingReciprocals(manifest);

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

      const minimum = MINIMUM_THRESHOLDS[status] || 0;
      if (entry.relatedGuides.length < minimum) {
        belowThreshold.push({
          key: entry.key,
          status,
          count: entry.relatedGuides.length,
          minimum,
        });
      }

      const inbound = inboundLinks.get(entry.key);
      if (inbound && inbound.size === 0) {
        orphans.push(entry.key);
      }

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
      missingReciprocals: missingReciprocals.slice(0, 50),
    };

    return NextResponse.json({
      success: true,
      locale,
      report,
    });
  } catch (error) {
    console.error("Coverage reporting error:", error);
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
