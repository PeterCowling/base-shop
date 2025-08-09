import { useEffect, useState } from "react";

export interface ResponsiveDisplayCountOptions {
  /** Minimum number of items to display */
  min?: number;
  /** Maximum number of items to display */
  max?: number;
  /**
   * Minimum width in pixels for each item.
   * Used to approximate how many items can fit
   * within the current viewport width.
   */
  itemMinWidth?: number;
}

export function useResponsiveDisplayCount({
  min = 1,
  max = 4,
  itemMinWidth = 300,
}: ResponsiveDisplayCountOptions = {}) {
  const [count, setCount] = useState(min);

  useEffect(() => {
    const update = () => {
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      const possible = Math.floor(width / itemMinWidth);
      const next = Math.max(min, Math.min(max, possible || min));
      setCount(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [min, max, itemMinWidth]);

  return count;
}

export default useResponsiveDisplayCount;
