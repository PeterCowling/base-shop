/**
 * Guide manifest override API — GET/PUT/DELETE manifest overrides for a guide.
 *
 * Migrated from apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts
 */
import { NextResponse } from "next/server";

import {
  type GuideArea,
  type GuideStatus,
  safeParseManifestOverride,
} from "@acme/guide-system";

import { isGuideAuthoringEnabled, isPreviewHeaderAllowed } from "@/lib/guide-authoring/config";
import {
  getGuideManifestEntry,
  getGuideManifestEntryWithOverrides,
  listGuideManifestEntries,
  resolveDraftPathSegment,
} from "@/lib/guide-authoring/manifest-loader";
import {
  getGuideManifestOverrideFromFs,
  loadGuideManifestOverridesFromFs,
  setGuideManifestOverrideToFs,
} from "@/lib/guide-authoring/manifest-overrides-fs";

export const dynamic = "force-dynamic";

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * GET /api/guides/{guideKey}/manifest
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  const baseEntry = getGuideManifestEntry(guideKey);
  if (!baseEntry) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  const overrides = loadGuideManifestOverridesFromFs();
  const override = overrides[guideKey];
  const mergedEntry = getGuideManifestEntryWithOverrides(guideKey, overrides);

  const effectiveDraftPath = resolveDraftPathSegment(
    mergedEntry ?? baseEntry,
    override?.draftPathSegment,
  );

  return NextResponse.json({
    ok: true,
    guideKey,
    manifest: mergedEntry
      ? {
          areas: mergedEntry.areas,
          primaryArea: mergedEntry.primaryArea,
          status: mergedEntry.status,
          draftPathSegment: effectiveDraftPath,
        }
      : null,
    override: override ?? null,
    base: {
      areas: baseEntry.areas,
      primaryArea: baseEntry.primaryArea,
      draftPathSegment: baseEntry.draftPathSegment,
    },
  });
}

/**
 * PUT /api/guides/{guideKey}/manifest
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  const baseEntry = getGuideManifestEntry(guideKey);
  if (!baseEntry) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = isPlainRecord(body) ? body : null;
  if (!record) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const areas = Array.isArray(record.areas) ? record.areas as GuideArea[] : undefined;
  const primaryArea = typeof record.primaryArea === "string" ? record.primaryArea as GuideArea : undefined;
  const status = typeof record.status === "string" ? record.status as GuideStatus : undefined;
  const draftPathSegment = typeof record.draftPathSegment === "string" ? record.draftPathSegment : undefined;

  // Handle clearing the override
  if (record.clear === true) {
    try {
      setGuideManifestOverrideToFs(guideKey, undefined);
      // i18n-exempt -- GS-001: API success message
      return NextResponse.json({
        ok: true,
        guideKey,
        override: null,
        message: "Override cleared",
      });
    } catch (err) {
      // i18n-exempt -- GS-001: API error message
      const message = err instanceof Error ? err.message : "Failed to clear override";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  if (!areas && !primaryArea && !status && !draftPathSegment) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json(
      { ok: false, error: "No areas, primaryArea, status, or draftPathSegment provided" },
      { status: 400 },
    );
  }

  // Validate draftPathSegment uniqueness (only for draft guides)
  if (draftPathSegment) {
    const currentOverrides = loadGuideManifestOverridesFromFs();
    const currentStatus = status ?? currentOverrides[guideKey]?.status ?? baseEntry.status;

    if (currentStatus !== "draft") {
      // i18n-exempt -- GS-001: API error message
      return NextResponse.json(
        { ok: false, error: "Draft path can only be edited for guides in draft status" },
        { status: 400 },
      );
    }

    const allEntries = listGuideManifestEntries();
    for (const entry of allEntries) {
      if (entry.key === guideKey) continue;
      const entryOverride = currentOverrides[entry.key];
      const entryDraftPath = entryOverride?.draftPathSegment ?? entry.draftPathSegment ?? `guides/${entry.slug}`;

      if (entryDraftPath === draftPathSegment) {
        return NextResponse.json(
          { ok: false, error: `Draft path "${draftPathSegment}" is already used by guide "${entry.key}"` },
          { status: 400 },
        );
      }
    }
  }

  const newOverride = {
    ...(areas ? { areas } : {}),
    ...(primaryArea ? { primaryArea } : {}),
    ...(status ? { status } : {}),
    ...(draftPathSegment ? { draftPathSegment } : {}),
  };

  const parsed = safeParseManifestOverride(newOverride);
  if (!parsed.success) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json(
      { ok: false, error: "Invalid override", issues: parsed.error.format() },
      { status: 400 },
    );
  }

  // Quality gate: Enforce SEO audit requirement for "live" status
  if (status === "live") {
    const allOverrides = loadGuideManifestOverridesFromFs();
    const audit = allOverrides[guideKey]?.auditResults;

    if (!audit) {
      // i18n-exempt -- GS-001: API error message
      return NextResponse.json(
        {
          ok: false,
          error: "SEO audit required before publishing",
          message: "Run an SEO audit before changing status to live.",
        },
        { status: 400 },
      );
    }

    if (audit.score < 9.0) {
      return NextResponse.json(
        {
          ok: false,
          error: `SEO score too low: ${audit.score.toFixed(1)}/10 (minimum: 9.0)`,
          currentScore: audit.score,
          issues: audit.analysis.criticalIssues,
          improvements: audit.analysis.improvements,
        },
        { status: 400 },
      );
    }
  }

  const existingOverride = getGuideManifestOverrideFromFs(guideKey);
  const mergedOverride = {
    ...existingOverride,
    ...parsed.data,
  };

  const mergedParsed = safeParseManifestOverride(mergedOverride);
  if (!mergedParsed.success) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json(
      { ok: false, error: "Invalid merged override", issues: mergedParsed.error.format() },
      { status: 400 },
    );
  }

  try {
    setGuideManifestOverrideToFs(guideKey, mergedParsed.data);
  } catch (err) {
    // i18n-exempt -- GS-001: API error message
    const message = err instanceof Error ? err.message : "Failed to save override";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const updatedOverrides = loadGuideManifestOverridesFromFs();
  const mergedEntry = getGuideManifestEntryWithOverrides(guideKey, updatedOverrides);

  const effectiveDraftPath = resolveDraftPathSegment(
    mergedEntry ?? baseEntry,
    updatedOverrides[guideKey]?.draftPathSegment,
  );

  return NextResponse.json({
    ok: true,
    guideKey,
    manifest: mergedEntry
      ? {
          areas: mergedEntry.areas,
          primaryArea: mergedEntry.primaryArea,
          status: mergedEntry.status,
          draftPathSegment: effectiveDraftPath,
        }
      : null,
    override: mergedParsed.data,
  });
}

/**
 * DELETE /api/guides/{guideKey}/manifest
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  const baseEntry = getGuideManifestEntry(guideKey);
  if (!baseEntry) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  try {
    setGuideManifestOverrideToFs(guideKey, undefined);
    // i18n-exempt -- GS-001: API success message
    return NextResponse.json({
      ok: true,
      guideKey,
      override: null,
      message: "Override cleared",
      base: {
        areas: baseEntry.areas,
        primaryArea: baseEntry.primaryArea,
      },
    });
  } catch (err) {
    // i18n-exempt -- GS-001: API error message
    const message = err instanceof Error ? err.message : "Failed to clear override";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
