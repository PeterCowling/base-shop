"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { ComponentEditor } from "@ui/components/cms/page-builder";
import { useTranslations } from "@acme/i18n";
import { saveLibrary } from "@ui/components/cms/page-builder/libraryStore";

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
  // Extract to avoid eslint false positive from key substring 'ariaLabel' matching 'arial'
  const nameAriaLabel = String(t("cms.componentEditor.name.ariaLabel")); // eslint-disable-line ds/no-raw-font -- false positive: 'ariaLabel' substring triggers rule (ABC-123 [ttl=2025-12-31])

  const onChange = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev: PageComponent) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  const onResize = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev: PageComponent) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  return (
    <div className="space-y-4">
      <ComponentEditor component={component} onChange={onChange} onResize={onResize} />
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
              try {
                const item = { id: ulid(), label: label.trim(), template: component, createdAt: Date.now() };
                await saveLibrary("_global", item);
                setMessage(String(t("cms.componentEditor.savedToGlobal")));
              } catch (err) {
                console.error(err);
                setMessage(String(t("cms.componentEditor.saveFailed")));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("actions.saving") : t("cms.componentEditor.button.saveToGlobal")}
          </button>
        </div>
        {message && <div className="text-xs text-muted-foreground" aria-live="polite">{message}</div>}
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
