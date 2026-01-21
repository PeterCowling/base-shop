"use client";

import React from "react";

import { Popover, PopoverContent,PopoverTrigger, Tooltip } from "@acme/design-system/atoms";

import type { ComponentType } from "./defaults";
import Palette from "./Palette";
import type { PaletteProps } from "./palette.types";

interface Props {
  onAdd: (type: ComponentType) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onShowPalette: () => void;
  allowedTypes?: PaletteProps["allowedTypes"];
}

/**
 * Compact controls when the palette is hidden: popovers for components/media
 * and a button to re-open the palette.
 */
// i18n-exempt — internal builder controls; not user-facing in storefront
/* i18n-exempt */
const t = (s: string) => s;

const QuickPaletteControls = ({
  onAdd,
  onInsertImage,
  onSetSectionBackground,
  selectedIsSection,
  onShowPalette,
  allowedTypes,
}: Props) => (
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
            {/* i18n-exempt — decorative icon glyph */}
            🧩
          </button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- PB-2419 Needs calc() for viewport-limited popover height */}
        <div className="overflow-auto max-h-[calc(100svh-6rem)]">
          <Palette
            onAdd={onAdd}
            onInsertImage={onInsertImage}
            onSetSectionBackground={onSetSectionBackground}
            selectedIsSection={selectedIsSection}
            defaultTab="components"
            allowedTypes={allowedTypes}
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
        {/* i18n-exempt — decorative icon glyph */}
        ▶
      </button>
    </Tooltip>
  </div>
);

export default QuickPaletteControls;
