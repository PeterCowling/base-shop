"use client";

import { useCallback, useState } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { TextComponent as BaseTextComponent } from "@acme/types";

import useTextEditor from "./useTextEditor";

type TextComponent = Omit<BaseTextComponent, "text"> & {
  text?: string | Record<string, string>;
};

export default function useLocalizedTextEditor(
  component: TextComponent,
  locale: Locale,
) {
  const [editing, setEditing] = useState(false);
  type EditorInputText = Parameters<typeof useTextEditor>[0];
  const editor = useTextEditor(component as unknown as EditorInputText, locale, editing);

  const startEditing = useCallback(() => {
    setEditing(true);
  }, []);

  const finishEditing = useCallback(() => {
    if (!editor) return null;
    setEditing(false);
    return {
      text: {
        ...(typeof component.text === "object" ? component.text : {}),
        [locale]: editor.getHTML(),
      },
    } as Partial<TextComponent>;
  }, [editor, component, locale]);

  return { editor, editing, startEditing, finishEditing } as const;
}
