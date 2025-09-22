"use client";

import React from "react";
import type { PageComponent } from "@acme/types";
import { Tooltip, Popover, PopoverTrigger, PopoverContent } from "../../atoms";
import Palette from "./Palette";
import type { ComponentType } from "./defaults";

interface Props {
  onAdd: (type: ComponentType, initializer?: Partial<PageComponent>) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onShowPalette: () => void;
}

/**
 * Compact controls when the palette is hidden: popovers for components/media
 * and a button to re-open the palette.
 */
const QuickPaletteControls = ({ onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, onShowPalette }: Props) => (
  <div className="shrink-0 w-8 flex flex-col items-center gap-2 pt-2">
    {/* Quick Components popover */}
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip text="Quick components">
          <button type="button" aria-label="Quick components" className="rounded border border-border-2 bg-surface-2 px-1 text-xs">🧩</button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="max-h-[70vh] overflow-auto">
          <Palette
            onAdd={onAdd}
            onInsertImage={onInsertImage}
            onSetSectionBackground={onSetSectionBackground}
            selectedIsSection={selectedIsSection}
            defaultTab="components"
          />
        </div>
      </PopoverContent>
    </Popover>
    {/* Quick Media popover */}
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip text="Quick media">
          <button type="button" aria-label="Quick media" className="rounded border border-border-2 bg-surface-2 px-1 text-xs">🖼</button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="max-h-[70vh] overflow-auto">
          <Palette
            onAdd={onAdd}
            onInsertImage={onInsertImage}
            onSetSectionBackground={onSetSectionBackground}
            selectedIsSection={selectedIsSection}
            defaultTab="media"
          />
        </div>
      </PopoverContent>
    </Popover>
    <Tooltip text="Show palette">
      <button
        type="button"
        aria-label="Show palette"
        className="rounded border border-border-2 bg-surface-2 px-1 text-xs"
        onClick={onShowPalette}
        title="Show palette"
      >
        ▶
      </button>
    </Tooltip>
  </div>
);

export default QuickPaletteControls;

