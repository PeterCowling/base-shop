/**
 * KeyboardShortcutProvider Component
 * Provides global keyboard shortcut handling
 * BOS-UX-16
 */

"use client";

import { useEffect, useState } from "react";

import { QuickCaptureModal } from "../capture/QuickCaptureModal";

export interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutProvider({
  children,
}: KeyboardShortcutProviderProps) {
  const [captureModalOpen, setCaptureModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open capture modal
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCaptureModalOpen(true);
      }

      // Escape to close modal (if open)
      if (event.key === "Escape" && captureModalOpen) {
        setCaptureModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [captureModalOpen]);

  return (
    <>
      {children}

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
      />
    </>
  );
}
