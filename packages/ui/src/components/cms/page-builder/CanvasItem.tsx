"use client";

import type { Locale } from "@/i18n/locales";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { PageComponent } from "@types";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../atoms/shadcn";
import { blockRegistry } from "../blocks";
import type { Action } from "../PageBuilder";
import DOMPurify from "dompurify";

function Block({
  component,
  locale,
}: {
  component: PageComponent;
  locale: Locale;
}) {
  if (component.type === "Text") {
    const text = (component as any).text;
    const value =
      typeof text === "string" ? text : (text?.[locale] ?? "");
    const sanitized = DOMPurify.sanitize(value);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }
  const Comp = blockRegistry[component.type];
  if (!Comp) return null;
  const { id, type, ...props } = component as any;
  return <Comp {...props} locale={locale} />;
}

const MemoBlock = memo(Block);

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  return (
    <div className="mb-1 flex gap-1 border-b pb-1">
      <Button
        type="button"
        variant={editor.isActive("bold") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        type="button"
        variant={editor.isActive("link") ? "default" : "outline"}
        onClick={() => {
          const url = window.prompt("URL");
          if (url) {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }
        }}
      >
        Link
      </Button>
    </div>
  );
}

const CanvasItem = memo(function CanvasItem({
  component,
  index,
  parentId,
  selectedId,
  onSelectId,
  onRemove,
  dispatch,
  locale,
}: {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
}) {
  const selected = selectedId === component.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: component.id,
    data: { from: "canvas", index, parentId },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    l: number;
    t: number;
  } | null>(null);
  const [resizing, setResizing] = useState(false);
  const moveRef = useRef<{ x: number; y: number; l: number; t: number } | null>(
    null
  );
  const [moving, setMoving] = useState(false);
  const [editing, setEditing] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content:
      typeof (component as any).text === "string"
        ? (component as any).text
        : ((component as any).text?.[locale] ?? ""),
  });

  const hasChildren = Array.isArray((component as any).children);
  const childIds = hasChildren
    ? ((component as any).children as PageComponent[]).map((c) => c.id)
    : [];
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `container-${component.id}`,
    data: { parentId: component.id },
  });

  useEffect(() => {
    if (!editor || editing) return;
    const content =
      typeof (component as any).text === "string"
        ? (component as any).text
        : ((component as any).text?.[locale] ?? "");
    editor.commands.setContent(content);
  }, [locale, component, editor, editing]);

  useEffect(() => {
    if (editing) {
      editor?.commands.focus("end");
    }
  }, [editing, editor]);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const payload: Action = {
        type: "resize",
        id: component.id,
        width: `${startRef.current.w + dx}px`,
        height: `${startRef.current.h + dy}px`,
      };
      if (component.position === "absolute") {
        payload.left = `${startRef.current.l + dx}px`;
        payload.top = `${startRef.current.t + dy}px`;
      }
      dispatch(payload);
    };
    const stop = () => setResizing(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [resizing, component.id, component.position, dispatch]);

  useEffect(() => {
    if (!moving) return;
    const handleMove = (e: PointerEvent) => {
      if (!moveRef.current) return;
      const dx = e.clientX - moveRef.current.x;
      const dy = e.clientY - moveRef.current.y;
      dispatch({
        type: "resize",
        id: component.id,
        left: `${moveRef.current.l + dx}px`,
        top: `${moveRef.current.t + dy}px`,
      });
    };
    const stop = () => setMoving(false);
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
      component.width && component.width.endsWith("px")
        ? parseFloat(component.width)
        : el.offsetWidth;
    const startHeight =
      component.height && component.height.endsWith("px")
        ? parseFloat(component.height)
        : el.offsetHeight;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: startWidth,
      h: startHeight,
      l: el.offsetLeft,
      t: el.offsetTop,
    };
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
      style={{
        transform: CSS.Transform.toString(transform),
        ...(component.width ? { width: component.width } : {}),
        ...(component.height ? { height: component.height } : {}),
        ...(component.margin ? { margin: component.margin } : {}),
        ...(component.padding ? { padding: component.padding } : {}),
        ...(component.position ? { position: component.position } : {}),
        ...(component.top ? { top: component.top } : {}),
        ...(component.left ? { left: component.left } : {}),
      }}
      className={
        "relative rounded border" + (selected ? " ring-2 ring-blue-500" : "")
      }
    >
      <div
        className="absolute left-0 top-0 z-10 h-3 w-3 cursor-move bg-gray-200"
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelectId(component.id);
          startMove(e);
        }}
      />
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
        <MemoBlock component={component} locale={locale} />
      )}{" "}
      {selected && (
        <>
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-blue-500"
          />
          <div
            onPointerDown={startResize}
            className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-blue-500"
          />
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded bg-red-500 px-2 text-xs text-white"
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
            className="m-2 flex flex-col gap-4 border border-dashed border-gray-300 p-2"
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
