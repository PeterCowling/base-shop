"use client";

import { Button } from "../../atoms/shadcn";

interface Props {
  onAddSection: () => void;
  onOpenPalette: () => void;
  onOpenPresets?: () => void;
}

export default function EmptyCanvasOverlay({ onAddSection, onOpenPalette, onOpenPresets }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="pointer-events-auto max-w-lg rounded border bg-surface-1/95 p-4 text-center shadow">
        <div className="mb-2 text-base font-semibold">Start by adding a Section</div>
        <p className="mb-3 text-sm text-muted-foreground">
          Drag from the palette, or use the quick actions below to get going.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={onAddSection}>Add Section</Button>
          <Button type="button" variant="outline" onClick={onOpenPalette}>Open Palette</Button>
          {onOpenPresets && (
            <Button type="button" variant="outline" onClick={onOpenPresets}>Section Library</Button>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Tip: Press "/" or ⌘/Ctrl+K to insert anything
        </div>
      </div>
    </div>
  );
}
