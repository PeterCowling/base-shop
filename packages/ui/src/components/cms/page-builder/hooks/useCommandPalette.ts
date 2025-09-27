"use client";

import React from "react";

/**
 * Manages Command Palette visibility and keyboard shortcuts
 * ("/" when not in input; Cmd/Ctrl+K).
 */
export default function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const isEditable = !!t && (t.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isEditable) return;
      const k = e.key.toLowerCase();
      if (k === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      } else if (k === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen } as const;
}
