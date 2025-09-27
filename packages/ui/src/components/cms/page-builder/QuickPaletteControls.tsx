"use client";

import React from "react";
import { Tooltip, Popover, PopoverTrigger, PopoverContent } from "../../atoms";
import Palette from "./Palette";
import type { ComponentType } from "./defaults";

interface Props {
  onAdd: (type: ComponentType) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onShowPalette: () => void;
}

/**
 * Compact controls when the palette is hidden: popovers for components/media
 * and a button to re-open the palette.
 */
// i18n-exempt — internal builder controls; not user-facing in storefront
/* i18n-exempt */
const t = (s: string) => s;

const QuickPaletteControls = ({ onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, onShowPalette }: Props) => (
  <div className="shrink-0 w-8 flex flex-col items-center gap-2 pt-2">
    {/* Quick Components popover */}
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip text={t("Quick components")}>
          <button
            type="button"
            aria-label={t("Quick components")}
            className="rounded border border-border-2 bg-surface-2 px-1 text-xs min-h-10 min-w-10 text-center"
          >
            🧩
          </button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="max-h-[calc(100svh-6rem)] overflow-auto">
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
    <Tooltip text={t("Show palette")}>
      <button
        type="button"
        aria-label={t("Show palette")}
        className="rounded border border-border-2 bg-surface-2 px-1 text-xs min-h-10 min-w-10 text-center"
        onClick={onShowPalette}
        title={t("Show palette")}
      >
        ▶
      </button>
    </Tooltip>
  </div>
);

export default QuickPaletteControls;
