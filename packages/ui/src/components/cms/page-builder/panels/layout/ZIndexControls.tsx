// packages/ui/src/components/cms/page-builder/panels/layout/ZIndexControls.tsx
"use client";

import { Button, Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { EditorFlags } from "./types";

interface Props {
  locked: boolean;
  editorFlags?: EditorFlags;
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
}

export default function ZIndexControls({ locked, editorFlags, onUpdateEditor }: Props) {
  return (
    <div className="flex items-end gap-2">
      <Input
        label={
          <span className="flex items-center gap-1">
            z-index
            <Tooltip text="Stacking order (number)">?</Tooltip>
          </span>
        }
        type="number"
        value={(editorFlags?.zIndex as number | undefined) ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
          if (onUpdateEditor) onUpdateEditor({ zIndex: val as number | undefined });
        }}
        disabled={locked}
      />
      <div className="flex gap-1">
        <Button type="button" variant="outline" disabled={locked} onClick={() => onUpdateEditor?.({ zIndex: Math.max(0, (editorFlags?.zIndex as number | undefined) ?? 0) })}>Back</Button>
        <Button type="button" variant="outline" disabled={locked} onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) - 1) })}>-1</Button>
        <Button type="button" variant="outline" disabled={locked} onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) + 1) })}>+1</Button>
        <Button type="button" variant="outline" disabled={locked} onClick={() => onUpdateEditor?.({ zIndex: 999 })}>Front</Button>
      </div>
    </div>
  );
}

