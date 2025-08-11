import Link from "@tiptap/extension-link";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Locale } from "@/i18n/locales";
import type { PageComponent } from "@acme/types";
import { useEffect } from "react";

function getContent(component: PageComponent, locale: Locale) {
  return typeof (component as any).text === "string"
    ? (component as any).text
    : ( (component as any).text?.[locale] ?? "");
}

export default function useTextEditor(
  component: PageComponent,
  locale: Locale,
  editing: boolean,
) {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: getContent(component, locale),
  });

  useEffect(() => {
    if (!editor || editing) return;
    editor.commands.setContent(getContent(component, locale));
  }, [editor, component, locale, editing]);

  useEffect(() => {
    if (editing) {
      editor?.commands.focus("end");
    }
  }, [editing, editor]);

  return editor;
}
