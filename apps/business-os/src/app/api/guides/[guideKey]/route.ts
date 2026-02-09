/**
 * Guide content API — GET/PUT guide content for a specific guide key.
 *
 * Migrated from apps/brikette/src/app/api/guides/[guideKey]/route.ts
 */
import { NextResponse } from "next/server";

import { guideContentSchema, SUPPORTED_LANGUAGES } from "@acme/guide-system";

import { isGuideAuthoringEnabled, isPreviewHeaderAllowed } from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";
import {
  type GuidesNamespace,
  loadGuidesNamespaceFromFs,
  writeGuidesNamespaceToFs,
} from "@/lib/guide-authoring/node-loader";

export const dynamic = "force-dynamic";

const normalizeLocale = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(trimmed) ? trimmed : null;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const resolveGuideEntry = (guideKey: string) =>
  listGuideManifestEntries().find((entry) => entry.key === guideKey);

export async function GET(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;
  const entry = resolveGuideEntry(guideKey);
  if (!entry) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const locale = normalizeLocale(url.searchParams.get("locale")) ?? "en";
  const bundle = loadGuidesNamespaceFromFs(locale);
  const contentRecord = isPlainRecord(bundle?.content) ? bundle?.content : {};
  const content = contentRecord[entry.contentKey];

  return NextResponse.json({
    ok: true,
    locale,
    guideKey,
    contentKey: entry.contentKey,
    exists: content !== undefined,
    content: content ?? {},
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ guideKey: string }> },
) {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { guideKey } = await context.params;
  const entry = resolveGuideEntry(guideKey);
  if (!entry) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = isPlainRecord(body) ? body : null;
  const locale = normalizeLocale(record?.locale) ?? null;
  if (!locale) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json({ ok: false, error: "Invalid locale" }, { status: 400 });
  }

  const content = record?.content;
  const parsed = guideContentSchema.safeParse(content);
  if (!parsed.success) {
    // i18n-exempt -- GS-001: API error message
    return NextResponse.json(
      { ok: false, error: "Invalid guide content", issues: parsed.error.format() },
      { status: 400 },
    );
  }

  // Auto-update lastUpdated timestamp on save
  const contentWithDate = {
    ...parsed.data,
    lastUpdated: new Date().toISOString(),
  };

  const existing = loadGuidesNamespaceFromFs(locale);
  const existingContent = isPlainRecord(existing?.content) ? existing?.content : {};
  const nextBundle: GuidesNamespace = {
    ...(existing ?? { content: {} }),
    content: {
      ...existingContent,
      [entry.contentKey]: contentWithDate,
    },
  };

  try {
    writeGuidesNamespaceToFs(locale, nextBundle);
  } catch (err) {
    // i18n-exempt -- GS-001: API error message
    const message = err instanceof Error ? err.message : "Failed to write guide content";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    locale,
    guideKey,
    contentKey: entry.contentKey,
  });
}
