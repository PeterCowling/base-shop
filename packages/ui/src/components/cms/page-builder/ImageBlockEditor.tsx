import type { ImageComponent } from "@acme/types";
import React, { useCallback } from "react";
import ImageSourcePanel from "./ImageSourcePanel";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<ImageComponent>;

function ImageBlockEditor({ component, onChange }: Props) {
  const handleChange = useCallback(
    (patch: Partial<ImageComponent>) => {
      onChange(patch);
    },
    [onChange]
  );

  const initialFilter = (() => {
    try {
      const raw = (component as unknown as { styles?: unknown }).styles;
      if (typeof raw !== "string") return undefined;
      if (!raw) return undefined;
      const parsed = JSON.parse(String(raw)) as { effects?: { filter?: string } };
      return parsed?.effects?.filter;
    } catch {
      return undefined;
    }
  })();

  const applyFilter = useCallback((filter: string | undefined) => {
    try {
      const raw = (component as unknown as { styles?: unknown }).styles;
      const base = typeof raw === "string" && raw ? (JSON.parse(String(raw)) as Record<string, unknown>) : {};
      const next = { ...base, effects: { ...(base as { effects?: Record<string, unknown> }).effects ?? {}, filter } };
      onChange({ styles: JSON.stringify(next) });
    } catch {
      const next = { effects: { filter } };
      onChange({ styles: JSON.stringify(next) });
    }
  }, [component, onChange]);

  return (
    <div className="space-y-2">
      <ImageSourcePanel
        src={component.src}
        alt={component.alt}
        cropAspect={(component as unknown as { cropAspect?: string }).cropAspect}
        focalPoint={(component as unknown as { focalPoint?: { x: number; y: number } }).focalPoint}
        onChange={handleChange}
        initialFilter={initialFilter}
        onApplyFilter={applyFilter}
      />
      <p className="text-xs text-muted-foreground">
        {/* i18n-exempt -- PB-2414: editor-only hint */}
        Tip: When the image block is selected on the canvas, drag the focal point dot to adjust framing.
      </p>
    </div>
  );
}

export default React.memo(ImageBlockEditor);
