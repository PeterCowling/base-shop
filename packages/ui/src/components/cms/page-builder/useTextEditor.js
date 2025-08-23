import Link from "@tiptap/extension-link";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
function getContent(component, locale) {
    return typeof component.text === "string"
        ? component.text
        : component.text?.[locale] ?? "";
}
export default function useTextEditor(component, locale, editing) {
    const editor = useEditor({
        extensions: [StarterKit, Link],
        content: getContent(component, locale),
    });
    useEffect(() => {
        if (!editor || editing)
            return;
        editor.commands.setContent(getContent(component, locale));
    }, [editor, component, locale, editing]);
    useEffect(() => {
        if (editing) {
            editor?.commands.focus("end");
        }
    }, [editing, editor]);
    return editor;
}
