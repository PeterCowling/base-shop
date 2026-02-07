 
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { type Editor, EditorContent } from "@tiptap/react";
import DOMPurify from "dompurify";

import { cn } from "@acme/design-system/utils/style/cn";
import { useTranslations } from "@acme/i18n";

import LinkPicker from "./LinkPicker";
import MenuBar from "./MenuBar";

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

type ToolbarPosition = { x: number; y: number; visible: boolean };

function useTextToolbarPosition(
  editor: Editor | null,
  editing: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition>({
    x: 0,
    y: 0,
    visible: false,
  });
  useEffect(() => {
    if (!editor || !editing) return;
    const update = () => {
      try {
        const sel = window.getSelection?.();
        if (!sel || sel.rangeCount === 0) {
          setToolbarPos((p) => ({ ...p, visible: false }));
          return;
        }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const host = containerRef.current?.getBoundingClientRect();
        if (!host || !rect || (rect.width === 0 && rect.height === 0)) {
          setToolbarPos((p) => ({ ...p, visible: false }));
          return;
        }
        const x = Math.max(0, rect.left - host.left + rect.width / 2);
        const y = Math.max(0, rect.top - host.top) - 32;
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
  return toolbarPos;
}

function DragHandle({
  attributes,
  listeners,
  isDragging,
  onSelect,
  startDrag,
  locked,
}: {
  attributes: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  isDragging: boolean;
  onSelect: () => void;
  startDrag: (e: React.PointerEvent) => void;
  locked: boolean;
}) {
  const t = useTranslations();
  return (
    <div
      className="absolute start-0 top-0 z-10 h-6 w-6 cursor-move bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      {...attributes}
      {...(listeners ?? {})}
      role="button"
      tabIndex={0}
      aria-pressed={isDragging}
      aria-describedby="pb-drag-instructions"
      title={t("cms.builder.textBlock.dragHandle")}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        if (!locked) startDrag(e);
      }}
    />
  );
}

function GuidesOverlay({ guides }: { guides: Guides }) {
  if (guides.x === null && guides.y === null) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {guides.x !== null && <div className="absolute top-0 bottom-0 w-px bg-primary" style={{ left: guides.x }} />}
      {guides.y !== null && <div className="absolute start-0 end-0 h-px bg-primary" style={{ top: guides.y }} />}
    </div>
  );
}

function LockedBadge() {
  const t = useTranslations();
  return (
    <div className="absolute end-1 top-1 z-30 text-xs" title={t("cms.builder.textBlock.locked")} aria-hidden>
      <LockClosedIcon />
    </div>
  );
}

function SpacingOverlay({ overlay }: { overlay: Props["spacingOverlay"] }) {
  if (!overlay) return null;
  return (
    <div
      className="pointer-events-none absolute z-30 bg-primary/20"
      style={{
        top: overlay.top,
        left: overlay.left,
        width: overlay.width,
        height: overlay.height,
      }}
    />
  );
}

function SizeBadge({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const label = containerRef.current
    ? `${Math.round(containerRef.current.offsetWidth)}×${Math.round(containerRef.current.offsetHeight)}`
    : "";
  return (
    <div className="pointer-events-none absolute -top-5 start-0 z-30 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow dark:bg-card/75 dark:text-foreground">
      {label}
    </div>
  );
}

function RotateBadge({ rotateAngle }: { rotateAngle: number }) {
  return (
    <div className="pointer-events-none absolute -top-8 start-1/2 z-30 -translate-x-1/2 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow dark:bg-card/75 dark:text-foreground">
      {Math.round(rotateAngle)}°
    </div>
  );
}

function SelectionHandles({
  locked,
  startResize,
  startRotate,
}: {
  locked: boolean;
  startResize: Props["startResize"];
  startRotate?: Props["startRotate"];
}) {
  const t = useTranslations();
  return (
    <>
      {startRotate && (
        <div className="absolute -top-5 start-1/2 -translate-x-1/2 group pointer-events-auto">
          <div
            onPointerDown={(e) => !locked && startRotate(e)}
            title={t("cms.builder.textBlock.rotate")}
            className="h-3 w-3 cursor-crosshair rounded-full bg-primary"
          />
          <div className="pointer-events-none absolute -top-7 start-1/2 -translate-x-1/2 rounded bg-foreground/60 px-1 text-xs text-foreground opacity-0 shadow transition-opacity duration-200 delay-200 group-hover:opacity-100 group-hover:delay-0 dark:bg-card/70 dark:text-foreground">
            {t("cms.builder.textBlock.rotateHint")}
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
  );
}

function EditingContent({
  editor,
  onFinishEditing,
  onStartLink,
  toolbarPos,
}: {
  editor: Editor | null;
  onFinishEditing: () => void;
  onStartLink: () => void;
  toolbarPos: ToolbarPosition;
}) {
  const t = useTranslations();
  return (
    <div role="presentation" onBlur={onFinishEditing} onPointerDown={(e) => e.stopPropagation()}>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-4 outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onFinishEditing();
          }
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
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label={t("cms.builder.textToolbar.bold")}>B</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label={t("cms.builder.textToolbar.italic")}>I</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleUnderline?.().run()} aria-label={t("cms.builder.textToolbar.underline")}>U</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={onStartLink} aria-label={t("cms.builder.textToolbar.link")}>Link</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label={t("cms.builder.textToolbar.bulleted")}>•</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label={t("cms.builder.textToolbar.numbered")}>1.</button>
          <button type="button" className="rounded px-1 text-xs hover:bg-muted min-h-11 min-w-11" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label={t("cms.builder.textToolbar.h2")}>H2</button>
        </div>
      )}
    </div>
  );
}

function StaticContent({
  sanitized,
  staticTransform,
  onStartEditing,
}: {
  sanitized: string;
  staticTransform?: string;
  onStartEditing: () => void;
}) {
  const content = (
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
  );
  return staticTransform ? <div style={{ transform: staticTransform }}>{content}</div> : content;
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
  const t = useTranslations();
  const dangerToken = "--color-danger";
  const dangerFgToken = "--color-danger-fg";
  const sanitized = useMemo(() => DOMPurify.sanitize(content), [content]);
  const toolbarPos = useTextToolbarPosition(editor, editing, containerRef);
  const [linkOpen, setLinkOpen] = useState(false);
  const assignNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      containerRef.current = node;
    },
    [setNodeRef, containerRef]
  );

  return (
    <div
      ref={assignNodeRef}
      onClick={onSelect}
      role="listitem"
      aria-label={t("cms.builder.textBlock.canvasItem")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ ...(zIndex !== undefined ? { zIndex } : {}), ...style }}
      className={cn(
        "relative rounded border",
        selected && "ring-2 ring-blue-500",
        snapping && "border-primary"
      )}
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
        onSelect={onSelect}
        startDrag={startDrag}
        locked={locked}
      />
      <GuidesOverlay guides={guides} />
      {locked && <LockedBadge />}
      <SpacingOverlay overlay={spacingOverlay ?? null} />
      {kbResizing && <SizeBadge containerRef={containerRef} />}
      {rotating && <RotateBadge rotateAngle={rotateAngle} />}
      {editing ? (
        <EditingContent
          editor={editor}
          onFinishEditing={onFinishEditing}
          onStartLink={() => setLinkOpen(true)}
          toolbarPos={toolbarPos}
        />
      ) : (
        <StaticContent sanitized={sanitized} staticTransform={staticTransform} onStartEditing={onStartEditing} />
      )}
      {selected && <SelectionHandles locked={locked} startResize={startResize} startRotate={startRotate} />}
      <LinkPicker
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onPick={(href) => {
          editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
          setLinkOpen(false);
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 end-1 rounded bg-danger px-2 text-xs min-h-11 min-w-11"
        data-token={dangerToken}
      >
        <span className="text-danger-foreground" data-token={dangerFgToken}>
          {/* i18n-exempt: icon glyph */}×
        </span>
      </button>
    </div>
  );
};

export default TextBlockView;
