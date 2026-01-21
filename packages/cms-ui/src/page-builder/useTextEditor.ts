"use client";
import { useEffect } from "react";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { type Locale,locales } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";

type TextComponent = PageComponent & {
  type: "Text";
  text?: string | Record<string, string>;
};

const DEFAULT_LOCALE = locales[0] as Locale;

function getContent(component: TextComponent, locale: Locale) {
  const { text } = component;
  if (typeof text === "string") {
    return text;
  }
  const record = (text ?? {}) as Record<string, string | undefined>;
  const direct = record[locale];
  if (typeof direct === "string" && direct.length > 0) return direct;

  const primary = record[DEFAULT_LOCALE];
  if (typeof primary === "string" && primary.length > 0) return primary;

  for (const loc of locales) {
    const val = record[loc];
    if (typeof val === "string" && val.length > 0) return val;
  }

  const anyVal = Object.values(record).find((v) => typeof v === "string" && v.length > 0);
  return anyVal ?? "";
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
