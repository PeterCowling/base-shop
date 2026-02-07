 
import { NextResponse } from "next/server";

import { PREVIEW_TOKEN } from "@/config/env";
import type { GuideKey } from "@/guides/slugs/keys";
import type { AppLanguage } from "@/i18n.config";
import { auditGuideSeo, saveAuditResults } from "@/lib/seo-audit";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

export const runtime = "nodejs";
export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

// Static export: no API responses (they require the Worker)
export function generateStaticParams() {
  return [];
}

const PREVIEW_HEADER = "x-preview-token";

const isPreviewHeaderAllowed = (request: Request): boolean => {
  const token = PREVIEW_TOKEN ?? "";
  if (!token) return false;
  const headerValue =
    request.headers.get(PREVIEW_HEADER) ??
    request.headers.get("preview-token");
  return headerValue === token;
};

/**
 * POST /api/guides/{guideKey}/audit
 *
 * Runs an SEO audit on the specified guide and saves results to manifest overrides.
 * Query params: locale (optional, default: "en")
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  // Check if the guide exists
  const manifest = getGuideManifestEntry(guideKey as GuideKey);
  if (!manifest) {
    return NextResponse.json(
      { ok: false, error: `Guide not found: ${guideKey}` },
      { status: 404 },
    );
  }

  // Get locale from query params
  const url = new URL(request.url);
  const locale = (url.searchParams.get("locale") || "en") as AppLanguage;

  try {
    // Run the audit
    const results = await auditGuideSeo(guideKey as GuideKey, locale);

    // Save results to manifest overrides
    await saveAuditResults(guideKey as GuideKey, results);

    return NextResponse.json({
      ok: true,
      guideKey,
      locale,
      results: {
        score: results.score,
        timestamp: results.timestamp,
        analysis: results.analysis,
        metrics: results.metrics,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Audit failed";

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        guideKey,
      },
      { status: 500 },
    );
  }
}
