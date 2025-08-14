import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment } from "react";
import type { PageComponent } from "@acme/types";
import CanvasItem from "./CanvasItem";
import type { Locale } from "@/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";
import type { DevicePreset } from "@ui/utils/devicePresets";

interface Props {
  components: PageComponent[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileDrop: (e: DragEvent<HTMLDivElement>) => void;
  insertIndex: number | null;
  dispatch: (action: Action) => void;
  locale: Locale;
  containerStyle: CSSProperties;
  showGrid?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  snapPosition: number | null;
  device?: DevicePreset;
}

const PageCanvas = ({
  components,
  selectedId,
  onSelectId,
  canvasRef,
  dragOver,
  setDragOver,
  onFileDrop,
  insertIndex,
  dispatch,
  locale,
  containerStyle,
  showGrid = false,
  gridCols,
  viewport,
  snapPosition,
  device,
}: Props) => (
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
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDragEnd={() => setDragOver(false)}
      className={cn(
        "relative mx-auto flex flex-col gap-4 rounded border",
        dragOver && "ring-2 ring-primary"
      )}
    >
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 z-10 grid"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {Array.from({ length: gridCols }).map((_, i) => (
            <div
              key={i}
              className="border-l border-dashed border-muted-foreground/40"
            />
          ))}
        </div>
      )}
      {snapPosition !== null && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: snapPosition }}
        />
      )}
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

export default PageCanvas;
