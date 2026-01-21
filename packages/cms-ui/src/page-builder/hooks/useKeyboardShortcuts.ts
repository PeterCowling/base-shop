"use client";

import { useEffect } from "react";

interface Params {
  onPublish: () => void;
  rotateDevice: (dir: "left" | "right") => void;
  togglePreview: () => void;
}

export default function useKeyboardShortcuts({ onPublish, rotateDevice, togglePreview }: Params) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "SELECT" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey) {
          if (k === "s") {
            e.preventDefault();
            try { window.dispatchEvent(new Event("pb:save-version")); } catch {}
            return;
          }
          if (k === "p") {
            e.preventDefault();
            onPublish();
            return;
          }
          if (k === "]") {
            e.preventDefault();
            rotateDevice("right");
            return;
          }
          if (k === "[") {
            e.preventDefault();
            rotateDevice("left");
            return;
          }
        }
        // Ctrl/Cmd + Alt + P ⇒ Preview toggle
        if ((e.altKey || (e as KeyboardEvent & { altGraphKey?: boolean }).altGraphKey) && k === "p") {
          e.preventDefault();
          togglePreview();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPublish, rotateDevice, togglePreview]);
}
