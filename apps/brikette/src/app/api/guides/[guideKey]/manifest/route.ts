/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 API responses are developer-facing */
import { NextResponse } from "next/server";

import { PREVIEW_TOKEN } from "@/config/env";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import {
  getGuideManifestEntry,
  getGuideManifestEntryWithOverrides,
  type GuideArea,
  type GuideStatus,
} from "@/routes/guides/guide-manifest";
import {
  getGuideManifestOverrideFromFs,
  setGuideManifestOverrideToFs,
  loadGuideManifestOverridesFromFs,
} from "@/routes/guides/guide-manifest-overrides.node";
import { safeParseManifestOverride } from "@/routes/guides/guide-manifest-overrides";
import type { GuideKey } from "@/guides/slugs/keys";

export const runtime = "nodejs";

const PREVIEW_HEADER = "x-preview-token";

const isPreviewHeaderAllowed = (request: Request): boolean => {
  const token = PREVIEW_TOKEN ?? "";
  if (!token) return false;
  const headerValue =
    request.headers.get(PREVIEW_HEADER) ??
    request.headers.get("preview-token");
  return headerValue === token;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * GET /api/guides/{guideKey}/manifest
 *
 * Returns the current manifest entry (merged with any overrides) and the raw override if any.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  // Check if the guide exists
  const baseEntry = getGuideManifestEntry(guideKey as GuideKey);
  if (!baseEntry) {
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  // Load current overrides
  const overrides = loadGuideManifestOverridesFromFs();
  const override = overrides[guideKey as GuideKey];

  // Get merged manifest entry
  const mergedEntry = getGuideManifestEntryWithOverrides(guideKey as GuideKey, overrides);

  return NextResponse.json({
    ok: true,
    guideKey,
    // The merged manifest entry (TypeScript defaults + JSON overrides)
    manifest: mergedEntry
      ? {
          areas: mergedEntry.areas,
          primaryArea: mergedEntry.primaryArea,
          status: mergedEntry.status,
        }
      : null,
    // The raw override (if any) - useful for UI to show what's been customized
    override: override ?? null,
    // Base TypeScript manifest values (before override)
    base: {
      areas: baseEntry.areas,
      primaryArea: baseEntry.primaryArea,
    },
  });
}

/**
 * PUT /api/guides/{guideKey}/manifest
 *
 * Updates the manifest override for a specific guide.
 * Body: { areas?: GuideArea[], primaryArea?: GuideArea, status?: GuideStatus }
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  // Check if the guide exists
  const baseEntry = getGuideManifestEntry(guideKey as GuideKey);
  if (!baseEntry) {
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = isPlainRecord(body) ? body : null;
  if (!record) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Extract areas, primaryArea, and status from the request
  const areas = Array.isArray(record.areas) ? record.areas as GuideArea[] : undefined;
  const primaryArea = typeof record.primaryArea === "string" ? record.primaryArea as GuideArea : undefined;
  const status = typeof record.status === "string" ? record.status as GuideStatus : undefined;

  // Handle clearing the override
  if (record.clear === true) {
    try {
      setGuideManifestOverrideToFs(guideKey as GuideKey, undefined);
      return NextResponse.json({
        ok: true,
        guideKey,
        override: null,
        message: "Override cleared",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear override";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  // If no areas, primaryArea, or status provided, nothing to update
  if (!areas && !primaryArea && !status) {
    return NextResponse.json(
      { ok: false, error: "No areas, primaryArea, or status provided" },
      { status: 400 },
    );
  }

  // Build the override object
  const newOverride = {
    ...(areas ? { areas } : {}),
    ...(primaryArea ? { primaryArea } : {}),
    ...(status ? { status } : {}),
  };

  // Validate the override
  const parsed = safeParseManifestOverride(newOverride);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid override",
        issues: parsed.error.format(),
      },
      { status: 400 },
    );
  }

  // Quality gate: Enforce SEO audit requirement for "live" status
  if (status === "live") {
    const allOverrides = loadGuideManifestOverridesFromFs();
    const audit = allOverrides[guideKey as GuideKey]?.auditResults;

    if (!audit) {
      return NextResponse.json(
        {
          ok: false,
          error: "SEO audit required before publishing",
          message: "Run an SEO audit using the /audit-guide-seo skill before changing status to live.",
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

  // Get existing override and merge if needed
  const existingOverride = getGuideManifestOverrideFromFs(guideKey as GuideKey);
  const mergedOverride = {
    ...existingOverride,
    ...parsed.data,
  };

  // Re-validate merged override
  const mergedParsed = safeParseManifestOverride(mergedOverride);
  if (!mergedParsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid merged override",
        issues: mergedParsed.error.format(),
      },
      { status: 400 },
    );
  }

  try {
    setGuideManifestOverrideToFs(guideKey as GuideKey, mergedParsed.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save override";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  // Return updated manifest
  const updatedOverrides = loadGuideManifestOverridesFromFs();
  const mergedEntry = getGuideManifestEntryWithOverrides(guideKey as GuideKey, updatedOverrides);

  return NextResponse.json({
    ok: true,
    guideKey,
    manifest: mergedEntry
      ? {
          areas: mergedEntry.areas,
          primaryArea: mergedEntry.primaryArea,
          status: mergedEntry.status,
        }
      : null,
    override: mergedParsed.data,
  });
}

/**
 * DELETE /api/guides/{guideKey}/manifest
 *
 * Clears the manifest override for a specific guide.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;

  // Check if the guide exists
  const baseEntry = getGuideManifestEntry(guideKey as GuideKey);
  if (!baseEntry) {
    return NextResponse.json({ ok: false, error: "Guide not found" }, { status: 404 });
  }

  try {
    setGuideManifestOverrideToFs(guideKey as GuideKey, undefined);
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
    const message = err instanceof Error ? err.message : "Failed to clear override";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
