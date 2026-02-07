/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 API responses are developer-facing */
import { type NextRequest, NextResponse } from "next/server";

import { PREVIEW_TOKEN } from "@/config/env";
import { i18nConfig } from "@/i18n.config";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { analyzeTranslationCoverage } from "@/routes/guides/guide-diagnostics";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";

export const runtime = "nodejs";
export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

const PREVIEW_HEADER = "x-preview-token";

const isPreviewHeaderAllowed = (request: NextRequest): boolean => {
  const token = PREVIEW_TOKEN ?? "";
  if (!token) return false;
  const headerValue =
    request.headers.get(PREVIEW_HEADER) ??
    request.headers.get("preview-token");
  return headerValue === token;
};

interface GuideCoverageResult {
  key: string;
  slug: string;
  status: string;
  coverage: {
    complete: string[];
    incomplete: string[];
    percentage: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const guides = listGuideManifestEntries();
  const results: GuideCoverageResult[] = guides.map((entry) => {
    const coverage = analyzeTranslationCoverage(entry.key, i18nConfig.supportedLngs);
    return {
      key: entry.key,
      slug: entry.slug,
      status: entry.status,
      coverage: {
        complete: [...coverage.completeLocales],
        incomplete: [...coverage.missingLocales],
        percentage: Math.round((coverage.completeLocales.length / coverage.totalLocales) * 100),
      },
    };
  });

  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const csv = [
      "Guide Key,Slug,Status,Complete Locales,Incomplete Locales,Percentage",
      ...results.map((r) =>
        `${r.key},${r.slug},${r.status},"${r.coverage.complete.join(";")}","${r.coverage.incomplete.join(";")}",${r.coverage.percentage}%`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=guide-translation-status.csv",
      },
    });
  }

  return NextResponse.json({ ok: true, guides: results });
}
