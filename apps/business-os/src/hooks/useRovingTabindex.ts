/**
 * useRovingTabindex Hook
 * BOS-P2-05: Implements roving tabindex pattern for 2D grid navigation
 *
 * Roving tabindex pattern (WCAG 2.1):
 * - Only one element in tab sequence at a time (tabindex="0")
 * - All other elements have tabindex="-1"
 * - Arrow keys move focus and update which element has tabindex="0"
 * - Escape key exits focus mode
 */

import { useCallback, useState } from "react";

export interface UseRovingTabindexReturn {
  /** Currently focused element ID, or null */
  focusedId: string | null;
  /** Whether keyboard focus mode is active */
  isFocusMode: boolean;
  /** Focus a specific element and enter focus mode */
  focusElement: (id: string) => void;
  /** Exit focus mode and clear focused element */
  exitFocusMode: () => void;
  /** Handle arrow key navigation */
  handleArrowKey: (key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") => void;
  /** Get tabindex value for an element (0 for focused, -1 for others) */
  getTabIndex: (id: string) => 0 | -1;
}

/**
 * Custom hook for roving tabindex pattern in 2D grid
 * @param grid 2D array of element IDs: grid[laneIndex][cardIndex] = cardId
 * @returns Roving tabindex state and handlers
 */
export function useRovingTabindex(grid: string[][]): UseRovingTabindexReturn {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const focusElement = useCallback((id: string) => {
    setFocusedId(id);
    setIsFocusMode(true);
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusedId(null);
    setIsFocusMode(false);
  }, []);

  const findPosition = useCallback(
    (id: string): { laneIndex: number; cardIndex: number } | null => {
      for (let laneIndex = 0; laneIndex < grid.length; laneIndex++) {
        const lane = grid[laneIndex];
        const cardIndex = lane.indexOf(id);
        if (cardIndex !== -1) {
          return { laneIndex, cardIndex };
        }
      }
      return null;
    },
    [grid]
  );

  const handleArrowKey = useCallback(
    (key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") => {
      if (!focusedId) return;

      const currentPos = findPosition(focusedId);
      if (!currentPos) return;

      let newLaneIndex = currentPos.laneIndex;
      let newCardIndex = currentPos.cardIndex;

      switch (key) {
        case "ArrowUp":
          // Move up within same lane
          newCardIndex = Math.max(0, currentPos.cardIndex - 1);
          break;

        case "ArrowDown":
          // Move down within same lane
          newCardIndex = Math.min(
            grid[currentPos.laneIndex].length - 1,
            currentPos.cardIndex + 1
          );
          break;

        case "ArrowLeft":
          // Move to previous lane (skip empty lanes)
          for (let i = currentPos.laneIndex - 1; i >= 0; i--) {
            if (grid[i].length > 0) {
              newLaneIndex = i;
              // Try to maintain row position, or go to last card if lane is shorter
              newCardIndex = Math.min(currentPos.cardIndex, grid[i].length - 1);
              break;
            }
          }
          break;

        case "ArrowRight":
          // Move to next lane (skip empty lanes)
          for (let i = currentPos.laneIndex + 1; i < grid.length; i++) {
            if (grid[i].length > 0) {
              newLaneIndex = i;
              // Try to maintain row position, or go to last card if lane is shorter
              newCardIndex = Math.min(currentPos.cardIndex, grid[i].length - 1);
              break;
            }
          }
          break;
      }

      // Get new focused element
      const newFocusedId = grid[newLaneIndex]?.[newCardIndex];
      if (newFocusedId && newFocusedId !== focusedId) {
        setFocusedId(newFocusedId);
      }
    },
    [focusedId, grid, findPosition]
  );

  const getTabIndex = useCallback(
    (id: string): 0 | -1 => {
      return focusedId === id ? 0 : -1;
    },
    [focusedId]
  );

  return {
    focusedId,
    isFocusMode,
    focusElement,
    exitFocusMode,
    handleArrowKey,
    getTabIndex,
  };
}
