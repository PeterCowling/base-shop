"use client";

import type { Locale } from "@/i18n/locales";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent } from "@tiptap/react";
import type { PageComponent } from "@acme/types";
import { memo, useCallback, useRef, useState } from "react";
import DOMPurify from "dompurify";
import MenuBar from "./MenuBar";
import useTextEditor from "./useTextEditor";
import useSortableBlock from "./useSortableBlock";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import type { Action } from "./state";

const TextBlock = memo(function TextBlock({
  component,
  index,
  parentId,
  selectedId,
  onSelectId,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
}: {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const selected = selectedId === component.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortableBlock(component.id, index, parentId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const widthKey =
    viewport === "desktop"
      ? "widthDesktop"
      : viewport === "tablet"
      ? "widthTablet"
      : "widthMobile";
  const heightKey =
    viewport === "desktop"
      ? "heightDesktop"
      : viewport === "tablet"
      ? "heightTablet"
      : "heightMobile";
  const widthVal = (component as any)[widthKey] ?? component.width;
  const heightVal = (component as any)[heightKey] ?? component.height;
  const marginKey =
    viewport === "desktop"
      ? "marginDesktop"
      : viewport === "tablet"
      ? "marginTablet"
      : "marginMobile";
  const paddingKey =
    viewport === "desktop"
      ? "paddingDesktop"
      : viewport === "tablet"
      ? "paddingTablet"
      : "paddingMobile";
  const marginVal = (component as any)[marginKey] ?? component.margin;
  const paddingVal = (component as any)[paddingKey] ?? component.padding;

  const {
    startResize,
    guides: resizeGuides,
    snapping: resizeSnapping,
  } = useCanvasResize({
    componentId: component.id,
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled: editing,
  });

  const {
    startDrag,
    guides: dragGuides,
    snapping: dragSnapping,
  } = useCanvasDrag({
    componentId: component.id,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled: editing,
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const snapping = resizeSnapping || dragSnapping;

  const editor = useTextEditor(component, locale, editing);

  const finishEdit = useCallback(() => {
    if (!editor) return;
    dispatch({
      type: "update",
      id: component.id,
      patch: {
        text: {
          ...(typeof (component as any).text === "object"
            ? (component as any).text
            : {}),
          [locale]: editor.getHTML(),
        },
      } as Partial<PageComponent>,
    });
    setEditing(false);
  }, [editor, dispatch, component.id, locale, component]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      onClick={() => onSelectId(component.id)}
      role="listitem"
      aria-grabbed={isDragging}
      tabIndex={0}
      style={{
        transform: CSS.Transform.toString(transform),
        ...(widthVal ? { width: widthVal } : {}),
        ...(heightVal ? { height: heightVal } : {}),
        ...(marginVal ? { margin: marginVal } : {}),
        ...(paddingVal ? { padding: paddingVal } : {}),
        ...(component.position ? { position: component.position } : {}),
        ...(component.top ? { top: component.top } : {}),
        ...(component.left ? { left: component.left } : {}),
      }}
      className={
        "relative rounded border" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "")
      }
    >
      <div
        className="absolute left-0 top-0 z-10 h-3 w-3 cursor-move bg-muted"
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        title="Drag or press space/enter to move"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelectId(component.id);
          startDrag(e);
        }}
      />
      {(guides.x !== null || guides.y !== null) && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {guides.x !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary"
              style={{ left: guides.x }}
            />
          )}
          {guides.y !== null && (
            <div
              className="absolute left-0 right-0 h-px bg-primary"
              style={{ top: guides.y }}
            />
          )}
        </div>
      )}
      {editing ? (
        <div onBlur={finishEdit} onClick={(e) => e.stopPropagation()}>
          <MenuBar editor={editor} />
          <EditorContent
            editor={editor}
            className="min-h-[1rem] outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                finishEdit();
              }
            }}
          />
        </div>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
            onSelectId(component.id);
          }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              typeof (component as any).text === "string"
                ? (component as any).text
                : (component as any).text?.[locale] ?? ""
            ),
          }}
        />
      )}
      {selected && (
        <>
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary"
          />
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded bg-danger px-2 text-xs"
        data-token="--color-danger"
      >
        <span className="text-danger-foreground" data-token="--color-danger-fg">
          ×
        </span>
      </button>
    </div>
  );
});

export default TextBlock;
