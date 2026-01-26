"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 authoring UI labels are developer-facing */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button, Textarea } from "@acme/design-system/primitives";

import { Cluster, Inline, Stack } from "@/components/ui/flex";
import { PREVIEW_TOKEN } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import { guideContentSchema } from "@/routes/guides/content-schema";

type Props = {
  lang: AppLanguage;
  guideKey: string;
  contentKey: string;
  availableLocales: AppLanguage[];
  initialLocale?: AppLanguage;
};

type LoadState = "idle" | "loading" | "saving";

const formatJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 2);

const buildIssues = (issues: Array<{ path: (string | number)[]; message: string }>): string[] =>
  issues.map((issue) => `${issue.path.join(".") || "content"}: ${issue.message}`);

export default function GuideJsonEditor({
  lang,
  guideKey,
  contentKey,
  availableLocales,
  initialLocale,
}: Props) {
  const [selectedLocale, setSelectedLocale] = useState<AppLanguage>(initialLocale ?? lang);
  const [draft, setDraft] = useState<string>("");
  const [initialDraft, setInitialDraft] = useState<string>("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[] | null>(null);
  const [exists, setExists] = useState<boolean>(false);
  const [englishDraft, setEnglishDraft] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);

  const previewToken = PREVIEW_TOKEN ?? "";
  const hasPreviewToken = previewToken.length > 0;
  const hasChanges = draft.trim() !== initialDraft.trim();
  const filePath = useMemo(
    () => `src/locales/${selectedLocale}/guides/content/${contentKey}.json`,
    [contentKey, selectedLocale],
  );

  const fetchContent = useCallback(
    async (locale: AppLanguage) => {
      if (!hasPreviewToken) {
        setError("Preview token missing; set NEXT_PUBLIC_PREVIEW_TOKEN to load content.");
        return;
      }
      setLoadState("loading");
      setError(null);
      setIssues(null);
      try {
        const res = await fetch(`/api/guides/${guideKey}?locale=${locale}`, {
          headers: {
            "x-preview-token": previewToken,
          },
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
        const formatted = formatJson(data.content ?? {});
        setDraft(formatted);
        setInitialDraft(formatted);
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

  const fetchEnglish = useCallback(async () => {
    if (!hasPreviewToken) return;
    try {
      const res = await fetch(`/api/guides/${guideKey}?locale=en`, {
        headers: {
          "x-preview-token": previewToken,
        },
        cache: "no-store",
      });
      const data = (await res.json()) as { ok?: boolean; content?: unknown };
      if (!res.ok || !data?.ok) return;
      setEnglishDraft(formatJson(data.content ?? {}));
    } catch {
      setEnglishDraft(null);
    }
  }, [guideKey, hasPreviewToken, previewToken]);

  useEffect(() => {
    void fetchContent(selectedLocale);
  }, [fetchContent, selectedLocale]);

  useEffect(() => {
    if (!showEnglish || selectedLocale === "en") {
      setEnglishDraft(null);
      return;
    }
    void fetchEnglish();
  }, [fetchEnglish, selectedLocale, showEnglish]);

  const handleFormat = () => {
    setError(null);
    setIssues(null);
    try {
      const parsed = JSON.parse(draft);
      setDraft(formatJson(parsed));
    } catch {
      setError("Invalid JSON: fix formatting errors before formatting.");
    }
  };

  const handleReset = () => {
    setDraft(initialDraft);
    setError(null);
    setIssues(null);
  };

  const handleSave = async () => {
    if (!hasPreviewToken) {
      setError("Preview token missing; set NEXT_PUBLIC_PREVIEW_TOKEN to save.");
      return;
    }
    setError(null);
    setIssues(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("Invalid JSON: fix syntax errors before saving.");
      return;
    }

    const validation = guideContentSchema.safeParse(parsed);
    if (!validation.success) {
      setIssues(buildIssues(validation.error.issues));
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
      const formatted = formatJson(validation.data);
      setDraft(formatted);
      setInitialDraft(formatted);
      setExists(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
    } finally {
      setLoadState("idle");
    }
  };

  return (
    <Stack className="gap-6">
      <Stack className="gap-1">
        <Inline className="flex-wrap items-center justify-between gap-3">
          <Stack className="gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
              Guide authoring
            </p>
            <h1 className="text-2xl font-semibold text-brand-heading">
              Edit guide content JSON
            </h1>
          </Stack>
          <LinkRow lang={lang} />
        </Inline>
        <p className="text-sm text-brand-text/80">
          Editing writes directly to your working tree. Commit changes before sharing.
        </p>
      </Stack>

      <Stack className="gap-4 rounded-xl border border-brand-outline/20 bg-brand-surface p-4 shadow-sm">
        <Cluster className="flex-wrap gap-3">
          <Inline className="items-center gap-2 text-sm text-brand-text/80">
            <span className="font-semibold text-brand-heading">Guide</span>
            <code className="rounded bg-brand-surface/70 px-2 py-1 text-xs font-semibold text-brand-heading">
              {guideKey}
            </code>
            <span className="text-xs text-brand-text/60">Content key: {contentKey}</span>
          </Inline>
          <Inline className="items-center gap-2 text-xs text-brand-text/70">
            <span className="font-semibold">File</span>
            <code className="rounded bg-brand-surface/70 px-2 py-1 font-mono text-xs">
              {filePath}
            </code>
          </Inline>
        </Cluster>

        <Inline className="flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
            Locale
          </label>
          <select
            value={selectedLocale}
            onChange={(event) => setSelectedLocale(event.target.value as AppLanguage)}
            className="rounded-md border border-brand-outline/40 bg-brand-surface px-3 py-2 text-sm text-brand-heading"
          >
            {availableLocales.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>
          <Inline className="items-center gap-2 text-xs text-brand-text/60">
            <span>{exists ? "Loaded from disk" : "No existing file; saving will create it."}</span>
          </Inline>
        </Inline>

        <Inline className="flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 rounded-lg bg-brand-primary px-4 text-xs font-semibold text-white"
            onClick={handleSave}
            disabled={loadState !== "idle"}
          >
            {loadState === "saving" ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-brand-outline/40 px-4 text-xs text-brand-text"
            onClick={handleFormat}
            disabled={loadState !== "idle"}
          >
            Format JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-brand-outline/40 px-4 text-xs text-brand-text"
            onClick={handleReset}
            disabled={!hasChanges || loadState !== "idle"}
          >
            Reset changes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-brand-outline/40 px-4 text-xs text-brand-text"
            onClick={() => fetchContent(selectedLocale)}
            disabled={loadState !== "idle"}
          >
            Reload from disk
          </Button>
          <Inline className="items-center gap-2 text-xs text-brand-text/60">
            <span>{hasChanges ? "Unsaved changes" : "No local changes"}</span>
          </Inline>
        </Inline>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        {issues && issues.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <p className="font-semibold">Validation issues</p>
            <ul className="mt-2 list-disc space-y-1 ps-4">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Textarea
          label="Guide content JSON"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={26}
          className="font-mono text-xs"
        />

        <Inline className="items-center gap-3 text-xs text-brand-text/70">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showEnglish}
              onChange={(event) => setShowEnglish(event.target.checked)}
              className="h-4 w-4 rounded border-brand-outline/40"
              disabled={selectedLocale === "en"}
            />
            Show English reference
          </label>
          {!hasPreviewToken ? (
            <span className="text-brand-terra">
              Preview token missing; API access blocked.
            </span>
          ) : null}
        </Inline>

        {showEnglish && selectedLocale !== "en" ? (
          <Textarea
            label="English reference (read-only)"
            value={englishDraft ?? ""}
            readOnly={true}
            rows={18}
            className="font-mono text-xs"
          />
        ) : null}
      </Stack>
    </Stack>
  );
}

function LinkRow({ lang }: { lang: AppLanguage }) {
  return (
    <Inline className="items-center gap-3 text-xs font-semibold">
      <Link
        href={`/${lang}/draft`}
        prefetch={true}
        className="underline decoration-brand-primary/40 underline-offset-4 text-brand-primary"
      >
        Draft dashboard
      </Link>
    </Inline>
  );
}
