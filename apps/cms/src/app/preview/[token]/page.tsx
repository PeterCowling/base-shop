"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { TranslationsProvider, useTranslations } from "@acme/i18n";
import en from "@acme/i18n/en.json";
import type { HistoryState,PageComponent } from "@acme/page-builder-core";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";

import { Button, Input } from "@/components/atoms/shadcn";

interface VersionResponse {
  shop: string;
  pageId: string;
  versionId: string;
  label: string;
  timestamp: string;
  components: PageComponent[];
  editor?: HistoryState["editor"];
}

export default function PreviewViewer({ params }: { params: { token: string } }) {
  const t = useTranslations();
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [data, setData] = useState<VersionResponse | null>(null);

  useEffect(() => {
    setToken(params.token);
  }, [params]);

  const apiUrl = useMemo(
    () =>
      token
        ? `/cms/api/page-versions/preview/${token}${
            pw ? `?pw=${encodeURIComponent(pw)}` : ""
          }`
        : "",
    [token, pw],
  );

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (res.status === 401) {
        setError(t("cms.preview.error.passwordRequired") as string);
        return;
      }
      if (!res.ok)
        throw new Error(`Failed to load preview: ${res.status}`); // i18n-exempt: developer error string
      const json = (await res.json()) as VersionResponse;
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt load without password initially
    if (token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-612: Only re-run when token changes; load() depends on stable refs
  }, [token]);

  return (
    <TranslationsProvider messages={en}>
      <div className="mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">{t("cms.preview.title")}</h1>
        <div className="rounded border border-border/10 p-3 space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium">
                {t("cms.preview.password.label")}
              </label>
              <Input
                type="password"
                value={pw}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPw(e.target.value)
                }
                placeholder={
                  t("cms.preview.password.placeholder") as string
                }
              />
            </div>
            <Button
              className="min-h-10"
              onClick={load}
              disabled={loading || !token}
            >
              {loading
                ? t("cms.preview.actions.loading")
                : t("cms.preview.actions.load")}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-danger-foreground">{error}</p>
          )}
        </div>
        {data && (
          <div className="space-y-3">
            <div className="rounded border border-border/10 p-3">
              <div className="mb-2 text-sm font-medium">
                {t("cms.preview.runtime.title")}
              </div>
              <div className="overflow-auto rounded border border-border/20 bg-surface-2 p-4">
                <DynamicRenderer
                  components={data.components}
                  // Version previews are currently EN-only; if multi-locale
                  // support is added, this can be wired to the selected locale.
                  locale="en"
                  editor={data.editor}
                />
              </div>
            </div>
            <div className="rounded border border-border/10 p-3">
              <div className="text-sm text-muted-foreground">
                {t("cms.preview.meta.shop")}:{" "}
                <span className="font-mono">{data.shop}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("cms.preview.meta.page")}:{" "}
                <span className="font-mono">{data.pageId}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("cms.preview.meta.version")}:{" "}
                <span className="font-mono">{data.versionId}</span>
              </div>
              <div className="text-sm">
                {t("cms.preview.meta.label")}:{" "}
                <span className="font-medium">{data.label}</span>
              </div>
              <div className="text-sm">
                {/* eslint-disable-next-line ds/no-raw-font -- CMS-202 false positive on 'timestamp' [ttl=2026-03-31] */}
                {t("cms.preview.meta.timestamp")}:{" "}
                {new Date(data.timestamp).toLocaleString()}
              </div>
              <div className="mt-2 text-sm">
                {t("cms.preview.meta.components")}:{" "}
                <span className="font-mono">
                  {Array.isArray(data.components)
                    ? data.components.length
                    : 0}
                </span>
              </div>
            </div>
            <div className="rounded border border-border/10 p-3">
              <div className="mb-2 text-sm font-medium">
                {t("cms.preview.json.title")}
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs bg-muted/40 p-2 rounded">
                {JSON.stringify(data, null, 2)}
              </pre>
              <div className="mt-2 text-xs">
                <a
                  className="inline-flex items-center min-h-11 min-w-11 text-link underline"
                  href={apiUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("cms.preview.json.openRaw")}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </TranslationsProvider>
  );
}
