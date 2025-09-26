"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { ComponentEditor } from "@ui/components/cms/page-builder";

export default function ComponentEditorClient() {
  const initial = useMemo<PageComponent>(
    () => ({ id: ulid(), type: "Text", text: "Edit me" } as any),
    []
  );
  const [component, setComponent] = useState<PageComponent>(initial);

  const onChange = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  const onResize = useCallback((patch: Partial<PageComponent>) => {
    setComponent((prev) => ({ ...prev, ...patch } as PageComponent));
  }, []);

  return (
    <div className="space-y-4">
      <ComponentEditor component={component} onChange={onChange} onResize={onResize} />
      <div className="rounded border p-3 text-xs">
        <div className="mb-1 font-semibold">Component JSON</div>
        <pre className="whitespace-pre-wrap break-all text-[10px] leading-snug">
          {JSON.stringify(component, null, 2)}
        </pre>
      </div>
    </div>
  );
}

