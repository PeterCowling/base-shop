"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../atoms-shadcn";
import { blockRegistry } from "../blocks";
function Block({ component, locale, }) {
    if (component.type === "Text") {
        return _jsx("div", { children: component.text ?? "" });
        const text = component.text;
        const value = typeof text === "string" ? text : (text?.[locale] ?? "");
        return _jsx("div", { dangerouslySetInnerHTML: { __html: value } });
    }
    const Comp = blockRegistry[component.type];
    if (!Comp)
        return null;
    const { id, type, ...props } = component;
    return _jsx(Comp, { ...props, locale: locale });
}
const MemoBlock = memo(Block);
function MenuBar({ editor }) {
    if (!editor)
        return null;
    return (_jsxs("div", { className: "mb-1 flex gap-1 border-b pb-1", children: [_jsx(Button, { type: "button", variant: editor.isActive("bold") ? "default" : "outline", onClick: () => editor.chain().focus().toggleBold().run(), children: "B" }), _jsx(Button, { type: "button", variant: editor.isActive("italic") ? "default" : "outline", onClick: () => editor.chain().focus().toggleItalic().run(), children: "I" }), _jsx(Button, { type: "button", variant: editor.isActive("link") ? "default" : "outline", onClick: () => {
                    const url = window.prompt("URL");
                    if (url) {
                        editor
                            .chain()
                            .focus()
                            .extendMarkRange("link")
                            .setLink({ href: url })
                            .run();
                    }
                }, children: "Link" })] }));
}
const CanvasItem = memo(function CanvasItem({ component, index, onRemove, selected, onSelect, dispatch, locale, }) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({
        id: component.id,
        data: { from: "canvas", index },
    });
    const containerRef = useRef(null);
    const startRef = useRef(null);
    const [resizing, setResizing] = useState(false);
    const moveRef = useRef(null);
    const [moving, setMoving] = useState(false);
    const [editing, setEditing] = useState(false);
    const editor = useEditor({
        extensions: [StarterKit, Link],
        content: typeof component.text === "string"
            ? component.text
            : (component.text?.[locale] ?? ""),
    });
    useEffect(() => {
        if (!editor || editing)
            return;
        const content = typeof component.text === "string"
            ? component.text
            : (component.text?.[locale] ?? "");
        editor.commands.setContent(content);
    }, [locale, component, editor, editing]);
    useEffect(() => {
        if (editing) {
            editor?.commands.focus("end");
        }
    }, [editing, editor]);
    useEffect(() => {
        if (!resizing)
            return;
        const handleMove = (e) => {
            if (!startRef.current)
                return;
            const dx = e.clientX - startRef.current.x;
            const dy = e.clientY - startRef.current.y;
            const payload = {
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
    }, [resizing, component.id, dispatch]);
    useEffect(() => {
        if (!moving)
            return;
        const handleMove = (e) => {
            if (!moveRef.current)
                return;
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
    const startResize = (e) => {
        if (editing)
            return;
        e.stopPropagation();
        const el = containerRef.current;
        if (!el)
            return;
        startRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: el.offsetWidth,
            h: el.offsetHeight,
            l: el.offsetLeft,
            t: el.offsetTop,
        };
        setResizing(true);
    };
    const startMove = (e) => {
        if (component.position !== "absolute" || editing)
            return;
        const el = containerRef.current;
        if (!el)
            return;
        moveRef.current = {
            x: e.clientX,
            y: e.clientY,
            l: el.offsetLeft,
            t: el.offsetTop,
        };
        setMoving(true);
    };
    const finishEdit = useCallback(() => {
        if (!editor)
            return;
        dispatch({
            type: "update",
            id: component.id,
            patch: {
                text: {
                    ...(typeof component.text === "object"
                        ? component.text
                        : {}),
                    [locale]: editor.getHTML(),
                },
            },
        });
        setEditing(false);
    }, [editor, dispatch, component.id, locale, component]);
    return (_jsxs("div", { ref: (node) => {
            setNodeRef(node);
            containerRef.current = node;
        }, ...attributes, ...listeners, onPointerDownCapture: (e) => {
            onSelect();
            startMove(e);
        }, style: {
            transform: CSS.Transform.toString(transform),
            ...(component.width ? { width: component.width } : {}),
            ...(component.height ? { height: component.height } : {}),
            ...(component.margin ? { margin: component.margin } : {}),
            ...(component.padding ? { padding: component.padding } : {}),
            ...(component.position ? { position: component.position } : {}),
            ...(component.top ? { top: component.top } : {}),
            ...(component.left ? { left: component.left } : {}),
        }, className: "relative rounded border" + (selected ? " ring-2 ring-blue-500" : ""), children: [component.type === "Text" ? (editing ? (_jsxs("div", { onBlur: finishEdit, onClick: (e) => e.stopPropagation(), children: [_jsx(MenuBar, { editor: editor }), _jsx(EditorContent, { editor: editor, className: "min-h-[1rem] outline-none", onKeyDown: (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                finishEdit();
                            }
                        } })] })) : (_jsx("div", { onClick: (e) => {
                    e.stopPropagation();
                    setEditing(true);
                    onSelect();
                }, dangerouslySetInnerHTML: {
                    __html: typeof component.text === "string"
                        ? component.text
                        : (component.text?.[locale] ?? ""),
                } }))) : (_jsx(MemoBlock, { component: component, locale: locale })), " ", selected && (_jsxs(_Fragment, { children: [_jsx("div", { onPointerDown: startResize, className: "absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-blue-500" }), _jsx("div", { onPointerDown: startResize, className: "absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-blue-500" }), _jsx("div", { onPointerDown: startResize, className: "absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-blue-500" }), _jsx("div", { onPointerDown: startResize, className: "absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-blue-500" })] })), _jsx("button", { type: "button", onClick: onRemove, className: "absolute top-1 right-1 rounded bg-red-500 px-2 text-xs text-white", children: "\u00D7" })] }));
});
export default CanvasItem;
