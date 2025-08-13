"use client";

import type { Locale } from "@/i18n/locales";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent } from "@tiptap/react";
import type { PageComponent } from "@acme/types";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Action } from "../PageBuilder";
import DOMPurify from "dompurify";
import Block from "./Block";
import MenuBar from "./MenuBar";
import useTextEditor from "./useTextEditor";
import useSortableBlock from "./useSortableBlock";
import { snapToGrid } from "./usePageBuilderDrag";

const CanvasItem = memo(function CanvasItem({
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
    setDropRef,
    isOver,
  } = useSortableBlock(component.id, index, parentId);

  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [resizing, setResizing] = useState(false);
  const [snapWidth, setSnapWidth] = useState(false);
  const [snapHeight, setSnapHeight] = useState(false);
  const moveRef = useRef<{ x: number; y: number; l: number; t: number } | null>(
    null
  );
  const [moving, setMoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const siblingEdgesRef = useRef<{ vertical: number[]; horizontal: number[] }>({
    vertical: [],
    horizontal: [],
  });
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>(
    { x: null, y: null }
  );

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

  const editor = useTextEditor(component, locale, editing);

  const hasChildren = Array.isArray((component as any).children);
  const childIds = hasChildren
    ? ((component as any).children as PageComponent[]).map((c) => c.id)
    : [];

  const snapping = snapWidth || snapHeight || guides.x !== null || guides.y !== null;

  const computeSiblingEdges = () => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return { vertical: [], horizontal: [] };
    const vertical: number[] = [];
    const horizontal: number[] = [];
    Array.from(parent.children).forEach((child) => {
      if (child === el) return;
      const c = child as HTMLElement;
      vertical.push(c.offsetLeft, c.offsetLeft + c.offsetWidth);
      horizontal.push(c.offsetTop, c.offsetTop + c.offsetHeight);
    });
    return { vertical, horizontal };
  };

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: PointerEvent) => {
      if (!startRef.current || !containerRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const parent = containerRef.current.parentElement;
      const parentW = parent?.offsetWidth ?? startRef.current.w + dx;
      const parentH = parent?.offsetHeight ?? startRef.current.h + dy;
      let newW = startRef.current.w + dx;
      let newH = startRef.current.h + dy;
      const threshold = 10;
      const left = containerRef.current.offsetLeft;
      const top = containerRef.current.offsetTop;
      let guideX: number | null = null;
      let guideY: number | null = null;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        const right = left + newW;
        if (Math.abs(right - edge) <= threshold) {
          newW = edge - left;
          guideX = edge;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        const bottom = top + newH;
        if (Math.abs(bottom - edge) <= threshold) {
          newH = edge - top;
          guideY = edge;
        }
      });
      const snapW = e.shiftKey || Math.abs(parentW - newW) <= threshold;
      const snapH = e.shiftKey || Math.abs(parentH - newH) <= threshold;
      if (gridEnabled) {
        const unit = parent ? parent.offsetWidth / gridCols : null;
        if (unit) {
          newW = snapToGrid(newW, unit);
          newH = snapToGrid(newH, unit);
        }
      }
      dispatch({
        type: "resize",
        id: component.id,
        [widthKey]: snapW ? "100%" : `${newW}px`,
        [heightKey]: snapH ? "100%" : `${newH}px`,
      } as any);
      setSnapWidth(snapW || guideX !== null);
      setSnapHeight(snapH || guideY !== null);
      setGuides({
        x: guideX !== null ? guideX - left : null,
        y: guideY !== null ? guideY - top : null,
      });
    };
    const stop = () => {
      setResizing(false);
      setSnapWidth(false);
      setSnapHeight(false);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [resizing, component.id, dispatch]);

  useEffect(() => {
    if (!moving) return;
    const handleMove = (e: PointerEvent) => {
      if (!moveRef.current || !containerRef.current) return;
      const dx = e.clientX - moveRef.current.x;
      const dy = e.clientY - moveRef.current.y;
      let newL = moveRef.current.l + dx;
      let newT = moveRef.current.t + dy;
      const threshold = 10;
      let guideX: number | null = null;
      let guideY: number | null = null;
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        if (Math.abs(newL - edge) <= threshold) {
          newL = edge;
          guideX = edge;
        }
        if (Math.abs(newL + width - edge) <= threshold) {
          newL = edge - width;
          guideX = edge;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        if (Math.abs(newT - edge) <= threshold) {
          newT = edge;
          guideY = edge;
        }
        if (Math.abs(newT + height - edge) <= threshold) {
          newT = edge - height;
          guideY = edge;
        }
      });
      if (gridEnabled) {
        const parent = containerRef.current.parentElement;
        const unit = parent ? parent.offsetWidth / gridCols : null;
        if (unit) {
          newL = snapToGrid(newL, unit);
          newT = snapToGrid(newT, unit);
        }
      }
      dispatch({
        type: "resize",
        id: component.id,
        left: `${newL}px`,
        top: `${newT}px`,
      });
      setGuides({
        x: guideX !== null ? guideX - newL : null,
        y: guideY !== null ? guideY - newT : null,
      });
    };
    const stop = () => {
      setMoving(false);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [moving, component.id, dispatch]);

  const startResize = (e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const startWidth =
      widthVal && widthVal.endsWith("px") ? parseFloat(widthVal) : el.offsetWidth;
    const startHeight =
      heightVal && heightVal.endsWith("px")
        ? parseFloat(heightVal)
        : el.offsetHeight;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: startWidth,
      h: startHeight,
    };
    siblingEdgesRef.current = computeSiblingEdges();
    setResizing(true);
  };

  const startMove = (e: React.PointerEvent) => {
    if (component.position !== "absolute" || editing) return;
    const el = containerRef.current;
    if (!el) return;
    moveRef.current = {
      x: e.clientX,
      y: e.clientY,
      l: el.offsetLeft,
      t: el.offsetTop,
    };
    siblingEdgesRef.current = computeSiblingEdges();
    setMoving(true);
  };

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
      aria-dropeffect="move"
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
          startMove(e);
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
      {component.type === "Text" ? (
        editing ? (
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
        )
      ) : (
        <Block component={component} locale={locale} />
      )}{" "}
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
        className="absolute top-1 right-1 rounded bg-danger px-2 text-xs text-danger-foreground"
      >
        ×
      </button>
      {hasChildren && (
        <SortableContext
          id={`context-${component.id}`}
          items={childIds}
          strategy={rectSortingStrategy}
        >
          <div
            ref={setDropRef}
            id={`container-${component.id}`}
            role="list"
            aria-dropeffect="move"
            className="m-2 flex flex-col gap-4 border border-dashed border-muted p-2"
          >
            {isOver && (
              <div
                data-testid="drop-placeholder"
                className="h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10"
              />
            )}
            {(component as any).children.map(
              (child: PageComponent, i: number) => (
                <CanvasItem
                  key={child.id}
                  component={child}
                  index={i}
                  parentId={component.id}
                  selectedId={selectedId}
                  onSelectId={onSelectId}
                  onRemove={() =>
                    dispatch({ type: "remove", id: child.id })
                  }
                  dispatch={dispatch}
                  locale={locale}
                  gridEnabled={gridEnabled}
                  gridCols={gridCols}
                />
              )
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
});

export default CanvasItem;
