"use client";

import React from "react";

/**
 * Manages palette open/close state, width persistence, and Ctrl/Cmd+B toggle.
 * Single purpose: Palette visibility/size with keyboard + localStorage.
 */
export default function usePaletteState() {
  const [showPalette, setShowPalette] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem("pb:show-palette");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const [paletteWidth, setPaletteWidth] = React.useState<number>(() => {
    try {
      // Fixed palette/sidebar width: 350px for consistency across selectors
      return 350;
    } catch {
      return 350;
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem("pb:show-palette", showPalette ? "1" : "0"); } catch {}
  }, [showPalette]);

  React.useEffect(() => {
    try { localStorage.setItem("pb:palette-width", String(350)); } catch {}
  }, [paletteWidth]);

  // Keyboard shortcut: Ctrl/Cmd + B toggles the palette
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const isEditable = !!t && (t.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isEditable) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { showPalette, setShowPalette, paletteWidth, setPaletteWidth } as const;
}
