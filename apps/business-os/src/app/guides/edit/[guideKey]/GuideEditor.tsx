"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@acme/design-system/primitives";
import {
  type GuideContentInput,
  guideContentSchema,
  type GuideManifestEntry,
  SUPPORTED_LANGUAGES,
} from "@acme/guide-system";

import { PREVIEW_TOKEN } from "@/lib/guide-authoring/config";

import EditorialSidebar from "./components/EditorialSidebar";
import TabBar from "./components/TabBar";
import FaqsTab from "./tabs/FaqsTab";
import OverviewTab from "./tabs/OverviewTab";
import RawJsonTab from "./tabs/RawJsonTab";
import SectionsTab from "./tabs/SectionsTab";
import { ValidationTab } from "./tabs/ValidationTab";
import type { EditorTab, LoadState } from "./types";
import { setDeep } from "./types";

type Props = {
  guideKey: string;
  contentKey: string;
  manifest: GuideManifestEntry;
  initialLocale?: string;
};

function formatGuideTitle(guideKey: string): string {
  return guideKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default function GuideEditor({
  guideKey,
  contentKey,
  manifest,
  initialLocale,
}: Props) {
  const [selectedLocale, setSelectedLocale] = useState<string>(initialLocale ?? "en");
  const [content, setContent] = useState<Partial<GuideContentInput>>({});
  const [initialContent, setInitialContent] = useState<Partial<GuideContentInput>>({});
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
    async (locale: string) => {
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
        const validContent: Partial<GuideContentInput> = parsed.success ? parsed.data : {};
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
    <div className="grid grid-cols-[1fr_360px] gap-6">
      {/* Left column: Editor */}
      <div className="flex flex-col gap-6">
        <EditorHeader guideKey={guideKey} />
        <EditorForm
          guideKey={guideKey}
          selectedLocale={selectedLocale}
          setSelectedLocale={setSelectedLocale}
          filePath={filePath}
          exists={exists}
          loadState={loadState}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          error={error}
          content={content}
          setContent={setContent}
          updateField={updateField}
          hasChanges={hasChanges}
          hasPreviewToken={hasPreviewToken}
          onSave={handleSave}
          onReset={handleReset}
          onReload={handleReload}
        />
      </div>

      {/* Right column: Editorial Sidebar */}
      <div className="sticky top-8 self-start">
        <EditorialSidebar manifest={manifest} guideKey={guideKey} />
      </div>
    </div>
  );
}

// ── Extracted sub-components ──

function EditorHeader({ guideKey }: { guideKey: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
            Guide Editor
          </p>
          <h1 className="text-2xl font-semibold text-brand-heading">{formatGuideTitle(guideKey)}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            href="/guides"
            prefetch={true}
            className="text-brand-primary underline decoration-brand-primary/40 underline-offset-4"
          >
            Guides dashboard
          </Link>
        </div>
      </div>
      <p className="text-sm text-brand-text/80">
        Editing writes directly to your working tree. Commit changes before sharing.
      </p>
    </div>
  );
}

function EditorForm({
  guideKey,
  selectedLocale,
  setSelectedLocale,
  filePath,
  exists,
  loadState,
  activeTab,
  setActiveTab,
  error,
  content,
  setContent,
  updateField,
  hasChanges,
  hasPreviewToken,
  onSave,
  onReset,
  onReload,
}: {
  guideKey: string;
  selectedLocale: string;
  setSelectedLocale: (locale: string) => void;
  filePath: string;
  exists: boolean;
  loadState: LoadState;
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  error: string | null;
  content: Partial<GuideContentInput>;
  setContent: React.Dispatch<React.SetStateAction<Partial<GuideContentInput>>>;
  updateField: (path: string, value: unknown) => void;
  hasChanges: boolean;
  hasPreviewToken: boolean;
  onSave: () => void;
  onReset: () => void;
  onReload: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-brand-outline/20 bg-brand-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
            Locale
          </label>
          <select
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
            disabled={loadState !== "idle"}
            className="appearance-none rounded-md border border-brand-outline/40 bg-brand-surface px-3 py-2 pr-8 text-sm text-brand-heading"
          >
            {SUPPORTED_LANGUAGES.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-text/60">
          <span className="font-semibold">File:</span>
          <code className="rounded bg-brand-surface/70 px-2 py-1 font-mono text-xs">
            {filePath}
          </code>
        </div>
        <span className="text-xs text-brand-text/50">
          {exists ? "Loaded from disk" : "No existing file; saving will create it."}
        </span>
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} disabled={loadState !== "idle"} />

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="min-h-96">
        {loadState === "loading" ? (
          <div className="flex h-96 items-center justify-center">
            <p className="text-sm text-brand-text/60">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab content={content as GuideContentInput} updateField={updateField} />
            )}
            {activeTab === "sections" && (
              <SectionsTab content={content as GuideContentInput} updateField={updateField} />
            )}
            {activeTab === "faqs" && (
              <FaqsTab content={content as GuideContentInput} updateField={updateField} />
            )}
            {activeTab === "validation" && <ValidationTab guideKey={guideKey} />}
            {activeTab === "raw" && (
              <RawJsonTab
                content={content as GuideContentInput}
                setContent={setContent as React.Dispatch<React.SetStateAction<GuideContentInput>>}
              />
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-brand-outline/20 pt-4">
        <Button
          type="button"
          onClick={onSave}
          disabled={loadState !== "idle" || !hasChanges}
          className="h-10 rounded-lg bg-brand-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loadState === "saving" ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={!hasChanges || loadState !== "idle"}
          className="h-10 rounded-lg border-brand-outline/40 px-4 text-sm text-brand-text"
        >
          Reset changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
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
      </div>
    </div>
  );
}
