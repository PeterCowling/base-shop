"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment, useState } from "react";
import type { PageComponent } from "@acme/types";
import CanvasItem from "./CanvasItem";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";
import type { DevicePreset } from "../../../utils/devicePresets";
import GridOverlay from "./GridOverlay";
import SnapLine from "./SnapLine";
import Block from "./Block";

interface Props {
  components: PageComponent[];
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
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
  viewport: "desktop" | "tablet" | "mobile";
  snapPosition?: number | null;
  device?: DevicePreset;
  preview?: boolean;
}

const PageCanvas = ({
  components,
  selectedId = null,
  onSelectId = () => {},
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
  viewport,
  snapPosition = null,
  device,
  preview = false,
}: Props) => {
  const [dropRect, setDropRect] = useState<
    { left: number; top: number; width: number; height: number } | null
  >(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (preview) return;
    e.preventDefault();
    setDragOver(true);
    const target = (e.target as HTMLElement).closest(
      '[role="listitem"], #canvas'
    );
    if (target instanceof HTMLElement && canvasRef?.current) {
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      setDropRect({
        left: rect.left - canvasBounds.left,
        top: rect.top - canvasBounds.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setDropRect(null);
    }
  };

  const clearHighlight = () => {
    setDragOver(false);
    setDropRect(null);
  };

  if (preview) {
    return (
      <div
        id="canvas"
        ref={canvasRef}
        style={containerStyle}
        className="relative mx-auto flex flex-col gap-4"
      >
        {components.map((c) => (
          <Block key={c.id} component={c} locale={locale} />
        ))}
      </div>
    );
  }

  return (
    <SortableContext
      items={components.map((c) => c.id)}
      strategy={rectSortingStrategy}
    >
      <div
        id="canvas"
        ref={canvasRef}
        style={containerStyle}
        role="list"
        aria-dropeffect="move"
        onDrop={onFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={clearHighlight}
        onDragEnd={clearHighlight}
        className={cn(
          "relative mx-auto flex flex-col gap-4 rounded border",
          dragOver && "ring-2 ring-primary"
        )}
      >
        {dropRect && (
          <div
            className="pointer-events-none absolute z-50 rounded border-2 border-primary/50 bg-primary/10"
            style={{
              left: dropRect.left,
              top: dropRect.top,
              width: dropRect.width,
              height: dropRect.height,
            }}
          />
        )}
        {showGrid && <GridOverlay gridCols={gridCols} />}
        <SnapLine x={snapPosition} />
        {components.map((c, i) => (
          <Fragment key={c.id}>
            {insertIndex === i && (
              <div
                data-placeholder
                className={cn(
                  "h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10",
                  snapPosition !== null && "ring-2 ring-primary"
                )}
              />
            )}
            <CanvasItem
              component={c}
              index={i}
              parentId={undefined}
              selectedId={selectedId}
              onSelectId={onSelectId}
              onRemove={() => dispatch({ type: "remove", id: c.id })}
              dispatch={dispatch}
              locale={locale}
              gridEnabled={showGrid}
              gridCols={gridCols}
              viewport={viewport}
              device={device}
            />
          </Fragment>
        ))}
        {insertIndex === components.length && (
          <div
            data-placeholder
            className={cn(
              "h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10",
              snapPosition !== null && "ring-2 ring-primary"
            )}
          />
        )}
      </div>
    </SortableContext>
  );
};

export default PageCanvas;
