"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import MenuBar from "./MenuBar";
import DOMPurify from "dompurify";

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
  editor: Editor | null;
  editing: boolean;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  startDrag: (e: React.PointerEvent) => void;
  startResize: (e: React.PointerEvent) => void;
  onSelect: () => void;
  onRemove: () => void;
  content: string;
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
  onSelect,
  onRemove,
  content,
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
      style={style}
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
};

export default TextBlockView;

