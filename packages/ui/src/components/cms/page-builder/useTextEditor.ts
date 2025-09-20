"use client";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import { useEffect } from "react";

type TextComponent = PageComponent & {
  type: "Text";
  text?: string | Record<string, string>;
};

function getContent(component: TextComponent, locale: Locale) {
  return typeof component.text === "string"
    ? component.text
    : component.text?.[locale] ?? "";
}

export default function useTextEditor(
  component: TextComponent,
  locale: Locale,
  editing: boolean,
) {
  const editor = useEditor({
    extensions: [StarterKit, Link, Underline],
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
