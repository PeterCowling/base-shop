"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { ComponentEditor } from "@ui/components/cms/page-builder";
import { saveLibrary } from "@ui/components/cms/page-builder/libraryStore";

export default function ComponentEditorClient() {
  const initial = useMemo<PageComponent>(
    () => ({ id: ulid(), type: "Text", text: "Edit me" } as any),
    []
  );
  const [component, setComponent] = useState<PageComponent>(initial);
  const [label, setLabel] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

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
        <div className="font-semibold">Save to Global Library</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
            placeholder="Component name (e.g. Hero, Promo Card)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Component name"
          />
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            disabled={saving || !label.trim()}
            onClick={async () => {
              setSaving(true);
              setMessage("");
              try {
                const item = { id: ulid(), label: label.trim(), template: component, createdAt: Date.now() } as any;
                await saveLibrary("_global", item);
                setMessage("Saved to Global Library");
              } catch (err) {
                console.error(err);
                setMessage("Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save to Global"}
          </button>
        </div>
        {message && <div className="text-xs text-muted-foreground" aria-live="polite">{message}</div>}
      </div>
      <div className="rounded border p-3 text-xs">
        <div className="mb-1 font-semibold">Component JSON</div>
        <pre className="whitespace-pre-wrap break-all text-[10px] leading-snug">
          {JSON.stringify(component, null, 2)}
        </pre>
      </div>
    </div>
  );
}
