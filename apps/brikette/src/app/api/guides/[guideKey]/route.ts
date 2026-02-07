/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 API responses are developer-facing */
import { NextResponse } from "next/server";

import { PREVIEW_TOKEN } from "@/config/env";
import { i18nConfig } from "@/i18n.config";
import { loadGuidesNamespaceFromFs, writeGuidesNamespaceToFs } from "@/locales/_guides/node-loader";
import type { GuidesNamespace } from "@/locales/guides";
import { guideContentSchema } from "@/routes/guides/content-schema";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";

export const runtime = "nodejs";
export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

// Static export: no API responses (they require the Worker)
export function generateStaticParams() {
  return [];
}

const PREVIEW_HEADER = "x-preview-token";

const normalizeLocale = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return (i18nConfig.supportedLngs as readonly string[]).includes(trimmed) ? trimmed : null;
};

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
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = isPlainRecord(body) ? body : null;
  const locale = normalizeLocale(record?.locale) ?? null;
  if (!locale) {
    return NextResponse.json({ ok: false, error: "Invalid locale" }, { status: 400 });
  }

  const content = record?.content;
  const parsed = guideContentSchema.safeParse(content);
  if (!parsed.success) {
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
