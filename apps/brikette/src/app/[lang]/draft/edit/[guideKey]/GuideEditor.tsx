"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@acme/design-system/primitives";

import { Inline, Stack } from "@/components/ui/flex";
import { PREVIEW_TOKEN } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import type { GuideContentInput } from "@/routes/guides/content-schema";
import { guideContentSchema } from "@/routes/guides/content-schema";

import TabBar from "./components/TabBar";
import FaqsTab from "./tabs/FaqsTab";
import GalleryTab from "./tabs/GalleryTab";
import OverviewTab from "./tabs/OverviewTab";
import RawJsonTab from "./tabs/RawJsonTab";
import SectionsTab from "./tabs/SectionsTab";
import type { EditorTab, LoadState } from "./types";
import { setDeep } from "./types";

type Props = {
  lang: AppLanguage;
  guideKey: string;
  contentKey: string;
  availableLocales: AppLanguage[];
  initialLocale?: AppLanguage;
};

export default function GuideEditor({
  lang,
  guideKey,
  contentKey,
  availableLocales,
  initialLocale,
}: Props) {
  const [selectedLocale, setSelectedLocale] = useState<AppLanguage>(initialLocale ?? lang);
  const [content, setContent] = useState<GuideContentInput>({});
  const [initialContent, setInitialContent] = useState<GuideContentInput>({});
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean>(false);

  const previewToken = PREVIEW_TOKEN ?? "";
  const hasPreviewToken = previewToken.length > 0;
  const hasChanges = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(initialContent),
    [content, initialContent],
  );

  const filePath = useMemo(
    () => `src/locales/${selectedLocale}/guides/content/${contentKey}.json`,
    [contentKey, selectedLocale],
  );

  const updateField = useCallback((path: string, value: unknown) => {
    setContent((prev) => setDeep(prev, path, value));
  }, []);

  const fetchContent = useCallback(
    async (locale: AppLanguage) => {
      if (!hasPreviewToken) {
        setError("Preview token missing; set NEXT_PUBLIC_PREVIEW_TOKEN to load content.");
        return;
      }
      setLoadState("loading");
      setError(null);
      try {
        const res = await fetch(`/api/guides/${guideKey}?locale=${locale}`, {
          headers: { "x-preview-token": previewToken },
          cache: "no-store",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          content?: unknown;
          exists?: boolean;
          error?: string;
        };
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? "Unable to load guide content.");
          return;
        }
        const parsed = guideContentSchema.safeParse(data.content ?? {});
        const validContent = parsed.success ? parsed.data : {};
        setContent(validContent);
        setInitialContent(validContent);
        setExists(Boolean(data.exists));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load guide content.";
        setError(message);
      } finally {
        setLoadState("idle");
      }
    },
    [guideKey, hasPreviewToken, previewToken],
  );

  const handleSave = useCallback(async () => {
    if (!hasPreviewToken) {
      setError("Preview token missing; set NEXT_PUBLIC_PREVIEW_TOKEN to save.");
      return;
    }
    setError(null);

    const validation = guideContentSchema.safeParse(content);
    if (!validation.success) {
      const issues = validation.error.issues
        .map((i) => `${i.path.join(".") || "content"}: ${i.message}`)
        .join("; ");
      setError(`Validation failed: ${issues}`);
      return;
    }

    setLoadState("saving");
    try {
      const res = await fetch(`/api/guides/${guideKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-preview-token": previewToken,
        },
        body: JSON.stringify({
          locale: selectedLocale,
          content: validation.data,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Save failed.");
        return;
      }
      setContent(validation.data);
      setInitialContent(validation.data);
      setExists(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
    } finally {
      setLoadState("idle");
    }
  }, [content, guideKey, hasPreviewToken, previewToken, selectedLocale]);

  const handleReset = useCallback(() => {
    setContent(initialContent);
    setError(null);
  }, [initialContent]);

  const handleReload = useCallback(() => {
    void fetchContent(selectedLocale);
  }, [fetchContent, selectedLocale]);

  useEffect(() => {
    void fetchContent(selectedLocale);
  }, [fetchContent, selectedLocale]);

  return (
    <Stack className="gap-6">
      {/* Header */}
      <Stack className="gap-1">
        <Inline className="flex-wrap items-center justify-between gap-3">
          <Stack className="gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
              Guide Editor
            </p>
            <h1 className="text-2xl font-semibold text-brand-heading">{guideKey}</h1>
          </Stack>
          <Inline className="gap-3 text-xs font-semibold">
            <Link
              href={`/${lang}/draft`}
              prefetch={true}
              className="text-brand-primary underline decoration-brand-primary/40 underline-offset-4"
            >
              Draft dashboard
            </Link>
          </Inline>
        </Inline>
        <p className="text-sm text-brand-text/80">
          Editing writes directly to your working tree. Commit changes before sharing.
        </p>
      </Stack>

      {/* Locale selector and file info */}
      <Stack className="gap-4 rounded-xl border border-brand-outline/20 bg-brand-surface p-4 shadow-sm">
        <Inline className="flex-wrap items-center gap-4">
          <Inline className="items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
              Locale
            </label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value as AppLanguage)}
              disabled={loadState !== "idle"}
              className="rounded-md border border-brand-outline/40 bg-brand-surface px-3 py-2 text-sm text-brand-heading"
            >
              {availableLocales.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </select>
          </Inline>
          <Inline className="items-center gap-2 text-xs text-brand-text/60">
            <span className="font-semibold">File:</span>
            <code className="rounded bg-brand-surface/70 px-2 py-1 font-mono text-xs">
              {filePath}
            </code>
          </Inline>
          <span className="text-xs text-brand-text/50">
            {exists ? "Loaded from disk" : "No existing file; saving will create it."}
          </span>
        </Inline>

        {/* Tab navigation */}
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={loadState !== "idle"}
        />

        {/* Error display */}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {/* Tab content */}
        <div className="min-h-96">
          {loadState === "loading" ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-sm text-brand-text/60">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab content={content} updateField={updateField} />
              )}
              {activeTab === "sections" && (
                <SectionsTab content={content} updateField={updateField} />
              )}
              {activeTab === "faqs" && (
                <FaqsTab content={content} updateField={updateField} />
              )}
              {activeTab === "gallery" && (
                <GalleryTab content={content} updateField={updateField} />
              )}
              {activeTab === "raw" && (
                <RawJsonTab
                  content={content}
                  setContent={setContent}
                />
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <Inline className="flex-wrap items-center gap-3 border-t border-brand-outline/20 pt-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={loadState !== "idle" || !hasChanges}
            className="h-10 rounded-lg bg-brand-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadState === "saving" ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || loadState !== "idle"}
            className="h-10 rounded-lg border-brand-outline/40 px-4 text-sm text-brand-text"
          >
            Reset changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReload}
            disabled={loadState !== "idle"}
            className="h-10 rounded-lg border-brand-outline/40 px-4 text-sm text-brand-text"
          >
            Reload from disk
          </Button>
          <span className="text-xs text-brand-text/50">
            {hasChanges ? "Unsaved changes" : "No changes"}
          </span>
          {!hasPreviewToken && (
            <span className="text-xs text-brand-terra">
              Preview token missing; API access blocked.
            </span>
          )}
        </Inline>
      </Stack>
    </Stack>
  );
}
