"use client";

import React from "react";

/**
 * Manages the DevTools visibility and the Ctrl/Cmd+Alt+D toggle.
 * Single purpose: DevTools open/close state + keyboard binding + persistence.
 */
export default function useDevToolsToggle() {
  const [showDevTools, setShowDevTools] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("pb:devtools") === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable = !!target && (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (editable) return;
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setShowDevTools((v) => {
          try { localStorage.setItem("pb:devtools", v ? "0" : "1"); } catch {}
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { showDevTools, setShowDevTools } as const;
}
