import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment } from "react";
import type { PageComponent } from "@acme/types";
import CanvasItem from "./CanvasItem";
import type { Locale } from "@/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";

interface Props {
  components: PageComponent[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  sensors: any;
  handleDragMove: (ev: DragMoveEvent) => void;
  handleDragEnd: (ev: DragEndEvent) => void;
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
}

const PageCanvas = ({
  components,
  selectedId,
  onSelectId,
  sensors,
  handleDragMove,
  handleDragEnd,
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
}: Props) => (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
    onDragMove={handleDragMove}
  >
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
        {components.map((c, i) => (
          <Fragment key={c.id}>
            {insertIndex === i && (
              <div
                data-placeholder
                className="h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10"
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
            />
          </Fragment>
        ))}
        {insertIndex === components.length && (
          <div
            data-placeholder
            className="h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10"
          />
        )}
      </div>
    </SortableContext>
  </DndContext>
);

export default PageCanvas;
