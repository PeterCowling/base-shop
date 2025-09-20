"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import MenuBar from "./MenuBar";
import DOMPurify from "dompurify";
import { LockClosedIcon } from "@radix-ui/react-icons";

interface Guides {
  x: number | null;
  y: number | null;
}

interface Props {
  selected: boolean;
  attributes: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  setNodeRef: (node: HTMLDivElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  style: React.CSSProperties;
  guides: Guides;
  snapping: boolean;
  kbResizing?: boolean;
  editor: Editor | null;
  editing: boolean;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  startDrag: (e: React.PointerEvent) => void;
  startResize: (e: React.PointerEvent, handle?: "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s") => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onRemove: () => void;
  content: string;
  zIndex?: number;
  locked?: boolean;
  spacingOverlay?: { type: "margin" | "padding"; side: "top" | "right" | "bottom" | "left"; top: number; left: number; width: number; height: number } | null;
}

const TextBlockView = ({
  selected,
  attributes,
  listeners,
  setNodeRef,
  containerRef,
  isDragging,
  style,
  guides,
  snapping,
  editor,
  editing,
  onStartEditing,
  onFinishEditing,
  startDrag,
  startResize,
  onKeyDown,
  onSelect,
  onRemove,
  content,
  zIndex,
  locked = false,
  kbResizing = false,
  spacingOverlay,
}: Props) => {
  const sanitized = DOMPurify.sanitize(content);
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      onClick={onSelect}
      role="listitem"
      aria-grabbed={isDragging}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ ...(zIndex !== undefined ? { zIndex } : {}), ...style }}
      className={
        "relative rounded border" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "")
      }
    >
      <div
        className="absolute left-0 top-0 z-10 h-3 w-3 cursor-move bg-muted"
        {...attributes}
        {...(listeners ?? {})}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        title="Drag or press space/enter to move"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
          if (!locked) startDrag(e);
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
      {locked && (
        <div className="absolute right-1 top-1 z-30 text-xs" title="Locked" aria-hidden>
          <LockClosedIcon />
        </div>
      )}
      {spacingOverlay && (
        <div
          className="pointer-events-none absolute z-30 bg-primary/20"
          style={{
            top: spacingOverlay.top,
            left: spacingOverlay.left,
            width: spacingOverlay.width,
            height: spacingOverlay.height,
          }}
        />
      )}
      {kbResizing && (
        <div className="pointer-events-none absolute -top-5 left-0 z-30 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow dark:bg-white/75 dark:text-black">
          {containerRef.current ? `${Math.round(containerRef.current.offsetWidth)}×${Math.round(containerRef.current.offsetHeight)}` : ""}
        </div>
      )}
      {editing ? (
        <div onBlur={onFinishEditing} onClick={(e) => e.stopPropagation()}>
          <MenuBar editor={editor} />
          <EditorContent
            editor={editor}
            className="min-h-[1rem] outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFinishEditing();
              }
            }}
          />
        </div>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onStartEditing();
          }}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
      {selected && (
        <>
          <div onPointerDown={(e) => !locked && startResize(e, "nw")} className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "ne")} className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "sw")} className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "se")} className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "n")} className="absolute -top-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "s")} className="absolute -bottom-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "w")} className="absolute top-1/2 -left-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "e")} className="absolute top-1/2 -right-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary" />
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
};

export default TextBlockView;
