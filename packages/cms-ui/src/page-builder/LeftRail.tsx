"use client";

import React from "react";
import {
  ChevronRightIcon,
  FontFamilyIcon,
  LayersIcon,
  PlusIcon,
  ReaderIcon,
  SectionIcon,
  TableIcon,
  TokensIcon,
} from "@radix-ui/react-icons";

import { Tooltip } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import { DesignMenuContent } from "./DesignMenu";
import type GridSettings from "./GridSettings";
import MoreMenu from "./MoreMenu";
import type { Breakpoint } from "./panels/BreakpointsPanel";
import { ViewMenuContent } from "./ViewMenu";

interface Props {
  onOpenAdd: () => void;
  onOpenSections: () => void;
  onOpenLayers: () => void;
  onOpenPages: () => void;
  onOpenSiteStyles: () => void;
  onOpenFonts?: () => void;
  onOpenGlobalSections: () => void;
  onOpenCMS: () => void;
  onToggleInspector: () => void;
  isAddActive?: boolean;
  isSectionsActive?: boolean;
  isLayersActive?: boolean;
  isInspectorActive?: boolean;
  isFontsActive?: boolean;
  isSiteStylesActive?: boolean;
  // For More actions content
  gridProps?: React.ComponentProps<typeof GridSettings>;
  startTour?: () => void;
  toggleComments?: () => void;
  showComments?: boolean;
  togglePreview?: () => void;
  showPreview?: boolean;
  showPalette?: boolean;
  togglePalette?: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  breakpoints?: Breakpoint[];
  setBreakpoints?: (list: Breakpoint[]) => void;
  // Optional: hide certain entries (used by SectionBuilder mode)
  hideAddElements?: boolean;
  hidePages?: boolean;
  hideGlobalSections?: boolean;
  hideSiteStyles?: boolean;
  hideCMS?: boolean;
}

// Minimal left icon rail. Uses simple glyphs; replace with line icons later.
// Extracted Item component to avoid nested component definition during render
function Item({ label, onClick, icon, active = false }: { label: string; onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <Tooltip text={label}>
      <button
        type="button"
        className={`h-10 w-10 rounded-md border ${active ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface-2'} hover:bg-surface-3`} // i18n-exempt -- ENG-1234 CSS utility class string [ttl=2026-12-31]
        aria-label={label}
        onClick={onClick}
        title={label}
        aria-pressed={active}
      >
        <span aria-hidden className="text-foreground">
          {icon}
        </span>
      </button>
    </Tooltip>
  );
}

export default function LeftRail({ onOpenAdd, onOpenSections, onOpenLayers, onOpenPages, onOpenSiteStyles, onOpenGlobalSections, onOpenCMS, onToggleInspector, isAddActive = false, isSectionsActive = false, isLayersActive = false, isInspectorActive = false, isFontsActive = false, isSiteStylesActive = false, gridProps, startTour, toggleComments, showComments, togglePreview, showPreview, showPalette, togglePalette, parentFirst, onParentFirstChange, crossBreakpointNotices, onCrossBreakpointNoticesChange, breakpoints, setBreakpoints, hideAddElements, hidePages, hideGlobalSections, hideSiteStyles, hideCMS, onOpenFonts }: Props) {
  const t = useTranslations();

  return (
    <aside className="ms-6 flex w-16 shrink-0 flex-col items-center gap-4 border-r bg-surface-1/80 py-4">
      <Item label={String(t("cms.builder.presets.addSection"))} onClick={onOpenSections} icon={<SectionIcon className="h-5 w-5" />} active={isSectionsActive} />
      {!hideAddElements && (
        <Item label={String(t("cms.builder.leftRail.addElements"))} onClick={onOpenAdd} icon={<PlusIcon className="h-5 w-5" />} active={isAddActive} />
      )}
      <Item label={String(t("cms.builder.layers.title"))} onClick={onOpenLayers} icon={<LayersIcon className="h-5 w-5" />} active={isLayersActive} />
      {!hidePages && <Item label={String(t("cms.breadcrumb.pages"))} onClick={onOpenPages} icon={<ReaderIcon className="h-5 w-5" />} />}
      {!hideGlobalSections && <Item label={String(t("cms.builder.leftRail.globalSections"))} onClick={onOpenGlobalSections} icon={<SectionIcon className="h-5 w-5" />} />}
      {!hideSiteStyles && <Item label={String(t("cms.builder.leftRail.siteStyles"))} onClick={onOpenSiteStyles} icon={<TokensIcon className="h-5 w-5" />} active={isSiteStylesActive} />}
      {/* Dedicated Fonts editor */}
      {onOpenFonts && <Item label={String(t("cms.builder.leftRail.typography"))} onClick={onOpenFonts} icon={<FontFamilyIcon className="h-5 w-5" />} active={isFontsActive} />}
      {!hideCMS && <Item label={String(t("cms.builder.leftRail.cms"))} onClick={onOpenCMS} icon={<TableIcon className="h-5 w-5" />} />}
      <div className="mt-auto" />
      <Item label={String(t("cms.builder.leftRail.toggleInspector"))} onClick={onToggleInspector} icon={<ChevronRightIcon className="h-5 w-5" />} active={isInspectorActive} />
      {/* More actions moved to bottom of left rail with 30px gap from prior button */}
      <div className="mt-8">
        <MoreMenu
          content={
            <div className="flex flex-col gap-4">
              {gridProps && (
                <ViewMenuContent
                  showPreview={!!showPreview}
                  togglePreview={togglePreview || (() => {})}
                  showComments={!!showComments}
                  toggleComments={toggleComments || (() => {})}
                  startTour={startTour || (() => {})}
                  showPalette={!!showPalette}
                  togglePalette={togglePalette || (() => {})}
                  parentFirst={parentFirst}
                  onParentFirstChange={onParentFirstChange}
                  gridProps={gridProps}
                  crossBreakpointNotices={crossBreakpointNotices}
                  onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
                />
              )}
              <DesignMenuContent
                breakpoints={breakpoints ?? []}
                onChangeBreakpoints={(list) => setBreakpoints?.(list)}
              />
            </div>
          }
        />
      </div>
    </aside>
  );
}
