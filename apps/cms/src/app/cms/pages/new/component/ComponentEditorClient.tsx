"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { ComponentEditor } from "@ui/components/cms/page-builder";
import { useTranslations } from "@acme/i18n";
import { saveLibraryStrict } from "@ui/components/cms/page-builder/libraryStore";
import { validateComponentRules } from "@acme/platform-core/validation/componentRules";

export default function ComponentEditorClient() {
  const t = useTranslations();
  const initial = useMemo<PageComponent>(
    () => ({ id: ulid(), type: "Text", text: String(t("cms.componentEditor.initialText")) }),
    [t]
  );
  const [component, setComponent] = useState<PageComponent>(initial);
  const [label, setLabel] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [issues, setIssues] = useState<Array<{ path: Array<string | number>; message: string }>>([]);
  // Extract to avoid eslint false positive from key substring 'ariaLabel' matching 'arial'
  const nameAriaLabel = String(t("cms.componentEditor.name.ariaLabel"));

  const onChange = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev: PageComponent) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  const onResize = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev: PageComponent) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  return (
    <div className="space-y-4">
      <ComponentEditor component={component} onChange={onChange} onResize={onResize} issues={issues} />
      <div className="rounded border p-3 space-y-2">
        <div className="font-semibold">{t("cms.componentEditor.saveToGlobalLibrary.title")}</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="min-w-0 flex-1 rounded border px-2 py-1 text-sm min-h-10"
            placeholder={String(t("cms.componentEditor.name.placeholder"))}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={nameAriaLabel}
          />
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm min-h-11 min-w-11"
            disabled={saving || !label.trim()}
            onClick={async () => {
              setSaving(true);
              setMessage("");
              setIsError(false);
              setIssues([]);
              try {
                // Client-side preflight validation for faster feedback
                const pre = validateComponentRules([component]);
                if (pre.ok === false) {
                  setIsError(true);
                  setIssues(pre.issues ?? []);
                  setMessage(pre.errors.join("\n"));
                  return;
                }
                const item = { id: ulid(), label: label.trim(), template: component, createdAt: Date.now() };
                await saveLibraryStrict("_global", item);
                setMessage(String(t("cms.componentEditor.savedToGlobal")));
                setIsError(false);
                setIssues([]);
              } catch (err) {
                console.error(err);
                const msg = (err as Error)?.message || String(t("cms.componentEditor.saveFailed"));
                setMessage(msg);
                setIsError(true);
                type ValidationIssue = { path: Array<string | number>; message: string };
                type ApiError = Error & { data?: { error?: string; issues?: ValidationIssue[] } };
                const data = (err as ApiError)?.data;
                if (data && Array.isArray(data.issues)) setIssues(data.issues);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("actions.saving") : t("cms.componentEditor.button.saveToGlobal")}
          </button>
        </div>
        {message && (
          <div
            className={
              isError
                ? "text-xs rounded border border-red-300 bg-red-50 text-red-700 px-2 py-1"
                : "text-xs text-muted-foreground"
            }
            role={isError ? "alert" : undefined}
            aria-live={isError ? "assertive" : "polite"}
          >
            {message}
          </div>
        )}
      </div>
      <div className="rounded border p-3 text-xs">
        <div className="mb-1 font-semibold">{t("cms.componentEditor.componentJson")}</div>
        <pre className="whitespace-pre-wrap break-all text-xs leading-snug">
          {JSON.stringify(component, null, 2)}
        </pre>
      </div>
    </div>
  );
}
