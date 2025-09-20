"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Lightweight inline text editor for simple string props (e.g. Button.label).
 * Mirrors the start/finish semantics of useLocalizedTextEditor but without
 * the TipTap dependency. Returns helpers and a ref to bind to a contentEditable.
 */
export default function useInlineText<T extends object, K extends keyof T & string>(
  component: T,
  key: K,
) {
  const initial = (component?.[key] as unknown as string) ?? "";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(initial);
  const ref = useRef<HTMLElement | null>(null);

  const startEditing = useCallback(() => {
    setEditing(true);
    // Delay focus to next frame so the element exists
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        // Place caret at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
        el.focus();
      }
    });
  }, []);

  const finishEditing = useCallback(() => {
    setEditing(false);
    return { [key]: value } as Partial<T>;
  }, [key, value]);

  const bind = {
    ref: (node: HTMLElement | null) => {
      ref.current = node;
    },
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: (e: React.FormEvent<HTMLElement>) => {
      setValue((e.target as HTMLElement).innerText);
    },
    onBlur: () => {
      setEditing(false);
    },
  } as const;

  return { editing, value, startEditing, finishEditing, bind } as const;
}

