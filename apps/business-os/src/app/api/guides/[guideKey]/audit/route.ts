/**
 * Guide SEO audit API — POST to run an audit on a specific guide.
 *
 * Migrated from apps/brikette/src/app/api/guides/[guideKey]/audit/route.ts
 *
 * NOTE: This route delegates to brikette's seo-audit module. Because the audit
 * logic is deeply coupled to brikette's internal imports (getGuideResource, etc.),
 * we invoke the audit via the brikette CLI script rather than reimplementing it.
 * For local dev this uses child_process; for production the audit should be run
 * as a build-time or CLI operation.
 */
import { NextResponse } from "next/server";
import { execSync } from "child_process";

import type { AppLanguage, SeoAuditResult } from "@acme/guide-system";

import { getBriketteRoot, isGuideAuthoringEnabled, isPreviewHeaderAllowed } from "@/lib/guide-authoring/config";
import { getGuideManifestEntry } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

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

  const manifest = getGuideManifestEntry(guideKey);
  if (!manifest) {
    return NextResponse.json(
      { ok: false, error: `Guide not found: ${guideKey}` },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const locale = (url.searchParams.get("locale") || "en") as AppLanguage;

  try {
    // Run the audit via brikette's CLI script which has all the internal deps
    const briketteRoot = getBriketteRoot();
    const output = execSync(
      `pnpm exec tsx scripts/audit-guide-seo.ts "${guideKey}" --locale "${locale}" --json`,
      {
        cwd: briketteRoot,
        encoding: "utf-8",
        timeout: 60_000,
        env: { ...process.env, NODE_NO_WARNINGS: "1" },
      },
    );

    // Parse the JSON output from the CLI
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // i18n-exempt -- GS-001: API error message
      return NextResponse.json(
        { ok: false, error: "Audit script produced no JSON output" },
        { status: 500 },
      );
    }

    const results = JSON.parse(jsonMatch[0]) as SeoAuditResult;

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
      { ok: false, error: errorMessage, guideKey },
      { status: 500 },
    );
  }
}
