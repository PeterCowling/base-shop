// packages/ui/src/components/cms/page-builder/ViewMenu.tsx
"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Switch, Tooltip } from "../../atoms";
import type { ComponentProps } from "react";
import type GridSettings from "./GridSettings";
import { useTranslations } from "@acme/i18n";

interface Props {
  showPreview: boolean;
  togglePreview: () => void;
  showComments: boolean;
  toggleComments: () => void;
  startTour: () => void;
  showPalette?: boolean;
  togglePalette?: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  // Optional canvas settings to expose in the View menu for parity with spec
  gridProps?: ComponentProps<typeof GridSettings>;
  // Cross-breakpoint override notices
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  // Controlled popover support
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewMenuContent({ showPreview, togglePreview, showComments, toggleComments, startTour: _startTour, showPalette, togglePalette, parentFirst, onParentFirstChange, gridProps, crossBreakpointNotices, onCrossBreakpointNoticesChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{t("cms.builder.view.title")}</div>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>{t("cms.builder.preview.title")}</span>
        <Switch checked={showPreview} onChange={togglePreview} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>{t("cms.builder.view.comments")}</span>
        <Switch checked={showComments} onChange={toggleComments} />
      </label>
      {typeof showPalette === "boolean" && togglePalette && (
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>{t("cms.builder.drag.palette")}</span>
          <Switch checked={showPalette} onChange={togglePalette} />
        </label>
      )}
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>{t("cms.builder.view.layerSelectionParentFirst")}</span>
        <Switch checked={!!parentFirst} onChange={() => onParentFirstChange?.(!parentFirst)} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>{t("cms.builder.view.crossBreakpointNotifications")}</span>
        <Switch checked={!!crossBreakpointNotices} onChange={() => onCrossBreakpointNoticesChange?.(!crossBreakpointNotices)} />
      </label>

      {/* Zoom controls removed per requirements */}

      {/* Canvas indications moved into View for parity with spec */}
      {gridProps && (
        <div className="mt-2 space-y-2">
          <div className="text-sm font-medium">{t("cms.builder.view.canvasIndications")}</div>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("cms.builder.view.grid")}</span>
            <Switch checked={!!gridProps.showGrid} onChange={gridProps.toggleGrid} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("cms.builder.view.snapToGrid")}</span>
            <Switch checked={!!gridProps.snapToGrid} onChange={gridProps.toggleSnap} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("cms.builder.view.rulers")}</span>
            <Switch checked={!!gridProps.showRulers} onChange={gridProps.toggleRulers} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("cms.builder.view.baselineGrid")}</span>
            <Switch checked={!!gridProps.showBaseline} onChange={gridProps.toggleBaseline} />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">{t("cms.builder.view.baselineStep")}</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={64}
                step={1}
                value={gridProps.baselineStep}
                onChange={(e) => gridProps.setBaselineStep?.(Number(e.target.value))}
              />
              <span className="w-8 text-end text-sm">{gridProps.baselineStep}</span>
            </div>
          </div>
        </div>
      )}
      {/* Start tour moved to Help modal */}
    </div>
  );
}

export default function ViewMenu(props: Props) {
  const { open, onOpenChange, ...rest } = props;
  const contentProps: Omit<Props, "open" | "onOpenChange"> = rest;
  const t = useTranslations();
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip text={t("cms.builder.view.options")}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={t("cms.builder.view.options")}
          >
            {t("cms.builder.view.title")}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <ViewMenuContent {...contentProps} />
      </PopoverContent>
    </Popover>
  );
}
