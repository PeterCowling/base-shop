/**
 * Bulk translation status API — GET translation coverage for all guides.
 *
 * Migrated from apps/brikette/src/app/api/guides/bulk-translation-status/route.ts
 *
 * NOTE: The original route uses brikette's `analyzeTranslationCoverage` which
 * depends on `getGuideResource` (runtime i18n lookup). For the business-os
 * version, we perform a simpler filesystem-based check: does the content file
 * exist and have meaningful content for each locale?
 */
import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { SUPPORTED_LANGUAGES } from "@acme/guide-system";

import {
  getLocalesDir,
  isGuideAuthoringEnabled,
  isPreviewHeaderAllowed,
} from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

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

function hasContentFile(localesDir: string, locale: string, contentKey: string): boolean {
  // Check split directory structure first
  const splitPath = path.join(localesDir, locale, "guides", "content", `${contentKey}.json`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- GS-001: path derived from config
  if (fs.existsSync(splitPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- GS-001: path derived from config
      const raw = fs.readFileSync(splitPath, "utf-8");
      const parsed = JSON.parse(raw);
      // Check that the file has meaningful content (not just empty object)
      return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  }

  // Check legacy single-file format
  const legacyPath = path.join(localesDir, locale, "guides.json");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- GS-001: path derived from config
  if (fs.existsSync(legacyPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- GS-001: path derived from config
      const raw = fs.readFileSync(legacyPath, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed?.content?.[contentKey] !== undefined;
    } catch {
      return false;
    }
  }

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const localesDir = getLocalesDir();
  const guides = listGuideManifestEntries();

  const results: GuideCoverageResult[] = guides.map((entry) => {
    const complete: string[] = [];
    const incomplete: string[] = [];

    for (const locale of SUPPORTED_LANGUAGES) {
      if (hasContentFile(localesDir, locale, entry.contentKey)) {
        complete.push(locale);
      } else {
        incomplete.push(locale);
      }
    }

    return {
      key: entry.key,
      slug: entry.slug,
      status: entry.status,
      coverage: {
        complete,
        incomplete,
        percentage: Math.round((complete.length / SUPPORTED_LANGUAGES.length) * 100),
      },
    };
  });

  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    // i18n-exempt -- GS-001: CSV header
    const csv = [
      "Guide Key,Slug,Status,Complete Locales,Incomplete Locales,Percentage",
      ...results.map((r) =>
        `${r.key},${r.slug},${r.status},"${r.coverage.complete.join(";")}","${r.coverage.incomplete.join(";")}",${r.coverage.percentage}%`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        // i18n-exempt -- GS-001: HTTP header
        "Content-Disposition": "attachment; filename=guide-translation-status.csv",
      },
    });
  }

  return NextResponse.json({ ok: true, guides: results });
}
