/* eslint-disable ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/no-hardcoded-copy, react/forbid-dom-props -- PB-0001: builder canvas uses absolute/z-index and requires dynamic inline styles for runtime positioning */
"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import MenuBar from "./MenuBar";
import DOMPurify from "dompurify";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useState } from "react";
import LinkPicker from "./LinkPicker";

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
  startRotate?: (e: React.PointerEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onRemove: () => void;
  content: string;
  zIndex?: number;
  locked?: boolean;
  spacingOverlay?: { type: "margin" | "padding"; side: "top" | "right" | "bottom" | "left"; top: number; left: number; width: number; height: number } | null;
  rotating?: boolean;
  rotateAngle?: number;
  staticTransform?: string;
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
  startRotate,
  onKeyDown,
  onSelect,
  onRemove,
  content,
  zIndex,
  locked = false,
  kbResizing = false,
  spacingOverlay,
  rotating = false,
  rotateAngle = 0,
  staticTransform,
}: Props) => {
  const sanitized = DOMPurify.sanitize(content);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    if (!editor || !editing) return;
    const update = () => {
      try {
        const sel = window.getSelection?.();
        if (!sel || sel.rangeCount === 0) { setToolbarPos((p) => ({ ...p, visible: false })); return; }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const host = containerRef.current?.getBoundingClientRect();
        if (!host || !rect || (rect.width === 0 && rect.height === 0)) { setToolbarPos((p) => ({ ...p, visible: false })); return; }
        const x = Math.max(0, rect.left - host.left + rect.width / 2);
        const y = Math.max(0, rect.top - host.top) - 32; // 32px above selection
        setToolbarPos({ x, y, visible: true });
      } catch {
        setToolbarPos((p) => ({ ...p, visible: false }));
      }
    };
    update();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      try { editor.off("selectionUpdate", update); } catch {}
      try { editor.off("transaction", update); } catch {}
    };
  }, [editor, editing, containerRef]);
  const assignNodeRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    containerRef.current = node;
  }, [setNodeRef, containerRef]);

  return (
    <div
      ref={assignNodeRef}
      onClick={onSelect}
      role="button"
      aria-pressed={selected}
      aria-label={"Canvas item" /* i18n-exempt: internal builder control */}
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
        className="absolute start-0 top-0 z-10 h-6 w-6 cursor-move bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        {...attributes}
        {...(listeners ?? {})}
        role="button"
        tabIndex={0}
        aria-pressed={isDragging}
        aria-describedby="pb-drag-instructions"
        title={"Drag or press space/enter to move" /* i18n-exempt: internal builder hint */}
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
              className="absolute start-0 end-0 h-px bg-primary"
              style={{ top: guides.y }}
            />
          )}
        </div>
      )}
      {locked && (
        <div className="absolute end-1 top-1 z-30 text-xs" title={"Locked" /* i18n-exempt: internal builder indicator */} aria-hidden>
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
        <div className="pointer-events-none absolute -top-5 start-0 z-30 rounded bg-black/75 px-1 font-mono text-xs text-white shadow dark:bg-white/75 dark:text-black">
          {containerRef.current ? `${Math.round(containerRef.current.offsetWidth)}×${Math.round(containerRef.current.offsetHeight)}` : ""}
        </div>
      )}
      {rotating && (
        <div className="pointer-events-none absolute -top-8 start-1/2 z-30 -translate-x-1/2 rounded bg-black/75 px-1 font-mono text-xs text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(rotateAngle)}°
        </div>
      )}
      {editing ? (
        <div role="presentation" onBlur={onFinishEditing} onPointerDown={(e) => e.stopPropagation()}>
          <MenuBar editor={editor} />
          <EditorContent
            editor={editor}
            className="min-h-4 outline-none"
            onKeyDown={(e) => {
              // Finish editing on Enter
              if (e.key === "Enter") {
                e.preventDefault();
                onFinishEditing();
              }
              // Ensure underline shortcut works
              if ((e.metaKey || e.ctrlKey) && (e.key === "u" || e.key === "U")) {
                e.preventDefault();
                try { editor?.chain().focus().toggleUnderline?.().run(); } catch {}
              }
            }}
          />
          {toolbarPos.visible && (
            <div
              className="pointer-events-auto absolute z-40 flex -translate-x-1/2 gap-1 rounded border bg-background p-1 shadow"
              style={{ left: toolbarPos.x, top: toolbarPos.y }}
            >
              {/* eslint-disable ds/min-tap-size -- PB-0001: compact toolbar controls are desktop-targeted */}
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label={"Bold" /* i18n-exempt: toolbar label */}>B</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label={"Italic" /* i18n-exempt: toolbar label */}>I</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleUnderline?.().run()} aria-label={"Underline" /* i18n-exempt: toolbar label */}>U</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => setLinkOpen(true)} aria-label={"Link" /* i18n-exempt: toolbar label */}>Link</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label={"Bulleted" /* i18n-exempt: toolbar label */}>•</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label={"Numbered" /* i18n-exempt: toolbar label */}>1.</button>
              <button type="button" className="rounded px-1 text-xs hover:bg-muted" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label={"H2" /* i18n-exempt: toolbar label */}>H2</button>
              {/* eslint-enable ds/min-tap-size -- PB-0001 */}
            </div>
          )}
          <LinkPicker
            open={linkOpen}
            onClose={() => setLinkOpen(false)}
            onPick={(href) => {
              editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
              setLinkOpen(false);
            }}
          />
        </div>
      ) : (
        (staticTransform ? (
          <div style={{ transform: staticTransform }}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onStartEditing();
                }
              }}
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onStartEditing();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onStartEditing();
              }
            }}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        ))
      )}
      {selected && (
        <>
          {startRotate && (
            <div className="absolute -top-5 start-1/2 -translate-x-1/2 group pointer-events-auto">
              <div
                onPointerDown={(e) => !locked && startRotate(e)}
                title={"Rotate (Shift = precise)" /* i18n-exempt: internal builder hint */}
                className="h-3 w-3 cursor-crosshair rounded-full bg-primary"
              />
              <div className="pointer-events-none absolute -top-7 start-1/2 -translate-x-1/2 rounded bg-black/60 px-1 text-xs text-white opacity-0 shadow transition-opacity duration-200 delay-200 group-hover:opacity-100 group-hover:delay-0 dark:bg-white/70 dark:text-black">
                {/* i18n-exempt: internal builder hint */}Shift = precise
              </div>
            </div>
          )}
          <div onPointerDown={(e) => !locked && startResize(e, "nw")} className="absolute -top-1 -start-1 h-2 w-2 cursor-nwse-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "ne")} className="absolute -top-1 -end-1 h-2 w-2 cursor-nesw-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "sw")} className="absolute -bottom-1 -start-1 h-2 w-2 cursor-nesw-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "se")} className="absolute -end-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "n")} className="absolute -top-1 start-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "s")} className="absolute -bottom-1 start-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "w")} className="absolute top-1/2 -start-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary" />
          <div onPointerDown={(e) => !locked && startResize(e, "e")} className="absolute top-1/2 -end-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary" />
        </>
      )}
      {/* eslint-disable ds/min-tap-size -- PB-0001: close affordance is intentionally compact */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 end-1 rounded bg-danger px-2 text-xs"
        data-token="--color-danger"
      >
        <span className="text-danger-foreground" data-token="--color-danger-fg">
          {/* i18n-exempt: icon glyph */}×
        </span>
      </button>
      {/* eslint-enable ds/min-tap-size -- PB-0001 */}
    </div>
  );
};

export default TextBlockView;
