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
      const raw = (component as any).styles as string | undefined;
      if (!raw) return undefined;
      const parsed = JSON.parse(String(raw)) as { effects?: { filter?: string } };
      return parsed?.effects?.filter;
    } catch {
      return undefined;
    }
  })();

  const applyFilter = useCallback((filter: string | undefined) => {
    try {
      const raw = (component as any).styles as string | undefined;
      const base = raw ? (JSON.parse(String(raw)) as any) : {};
      const next = { ...base, effects: { ...(base.effects ?? {}), filter } };
      onChange({ styles: JSON.stringify(next) } as any);
    } catch {
      const next = { effects: { filter } };
      onChange({ styles: JSON.stringify(next) } as any);
    }
  }, [component, onChange]);

  return (
    <div className="space-y-2">
      <ImageSourcePanel
        src={component.src}
        alt={component.alt}
        cropAspect={(component as any).cropAspect}
        focalPoint={(component as any).focalPoint}
        onChange={handleChange}
        initialFilter={initialFilter}
        onApplyFilter={applyFilter}
      />
      <p className="text-xs text-muted-foreground">
        Tip: When the image block is selected on the canvas, drag the focal point dot to adjust framing.
      </p>
    </div>
  );
}

export default React.memo(ImageBlockEditor);
