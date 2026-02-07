/**
 * useKeyboardNavigation Hook
 * Handles keyboard navigation for board cards (arrow keys, Escape)
 * Extracted from BoardView to reduce component complexity
 * BOS-P2-05
 */

import { useEffect } from "react";

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

interface UseKeyboardNavigationOptions {
  handleArrowKey: (key: ArrowKey) => void;
  isFocusMode: boolean;
  exitFocusMode: () => void;
}

/**
 * Sets up keyboard event listeners for board navigation
 * - Arrow keys: navigate between cards
 * - Escape: exit focus mode
 */
export function useKeyboardNavigation({
  handleArrowKey,
  isFocusMode,
  exitFocusMode,
}: UseKeyboardNavigationOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with input fields or modals
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Arrow keys: navigate between cards
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        handleArrowKey(event.key);
      }

      // Escape: exit focus mode
      if (event.key === "Escape" && isFocusMode) {
        event.preventDefault();
        exitFocusMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleArrowKey, isFocusMode, exitFocusMode]);
}
