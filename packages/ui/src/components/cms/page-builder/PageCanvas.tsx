import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment } from "react";
import type { PageComponent } from "@acme/types";
import CanvasItem from "./CanvasItem";
import type { Locale } from "@/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";
import GridOverlay from "./GridOverlay";
import SnapLine from "./SnapLine";

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
      {showGrid && <GridOverlay gridCols={gridCols} />}
      <SnapLine position={snapPosition} />
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
