"use client";

import type { CSSProperties, DragEvent } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";

import type { DevicePreset } from "../../../utils/devicePresets";

import EditableCanvas from "./EditableCanvas";
import PreviewCanvas from "./PreviewCanvas";
import type { Action } from "./state";

export interface PageCanvasProps {
  components: PageComponent[];
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  dragOver?: boolean;
  setDragOver?: (v: boolean) => void;
  onFileDrop?: (e: DragEvent<HTMLDivElement>) => void;
  insertIndex?: number | null;
  dispatch?: (action: Action) => void;
  locale: Locale;
  containerStyle: CSSProperties;
  showGrid?: boolean;
  gridCols?: number;
  snapEnabled?: boolean;
  showRulers?: boolean;
  viewport: "desktop" | "tablet" | "mobile";
  snapPosition?: number | null;
  device?: DevicePreset;
  preview?: boolean;
  editor?: HistoryState["editor"];
  shop?: string | null;
  pageId?: string | null;
  showComments?: boolean;
  zoom?: number;
  showBaseline?: boolean;
  baselineStep?: number;
  dropAllowed?: boolean | null;
  insertParentId?: string | undefined;
  preferParentOnClick?: boolean;
}

const PageCanvas = ({
  components,
  selectedIds = [],
  onSelectIds = () => {},
  canvasRef,
  dragOver = false,
  setDragOver = () => {},
  onFileDrop = () => {},
  insertIndex = null,
  dispatch = () => {},
  locale,
  containerStyle,
  showGrid = false,
  gridCols = 1,
  snapEnabled,
  showRulers = false,
  viewport,
  snapPosition = null,
  device,
  preview = false,
  editor,
  shop,
  pageId,
  showComments = true,
  zoom = 1,
  showBaseline = false,
  baselineStep = 8,
  dropAllowed = null,
  insertParentId,
  preferParentOnClick = false,
}: PageCanvasProps) => {
  if (preview) {
    return (
      <PreviewCanvas
        components={components}
        canvasRef={canvasRef}
        containerStyle={containerStyle}
        editor={editor}
        viewport={viewport}
        locale={locale}
      />
    );
  }

  return (
    <EditableCanvas
      components={components}
      selectedIds={selectedIds}
      onSelectIds={onSelectIds}
      canvasRef={canvasRef}
      dragOver={dragOver}
      setDragOver={setDragOver}
      onFileDrop={onFileDrop}
      insertIndex={insertIndex}
      insertParentId={insertParentId}
      dispatch={dispatch}
      locale={locale}
      containerStyle={containerStyle}
      showGrid={showGrid}
      gridCols={gridCols}
      snapEnabled={snapEnabled}
      showRulers={showRulers}
      viewport={viewport}
      snapPosition={snapPosition}
      device={device}
      editor={editor}
      shop={shop}
      pageId={pageId}
      showComments={showComments}
      zoom={zoom}
      showBaseline={showBaseline}
      baselineStep={baselineStep}
      dropAllowed={dropAllowed}
      preferParentOnClick={preferParentOnClick}
    />
  );
};

export default PageCanvas;
