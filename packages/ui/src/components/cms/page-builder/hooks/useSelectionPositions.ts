"use client";

import { useEffect, useState } from "react";
import type { Rect } from "../utils/coords";

/**
 * Tracks bounding boxes of elements with [data-component-id] inside the canvas.
 * Boxes are returned in canvas-local coordinates.
 */
export default function useSelectionPositions(
  canvasRef: React.RefObject<HTMLDivElement | null> | undefined,
  deps: unknown,
) {
  const [positions, setPositions] = useState<Record<string, Rect>>({});

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const update = () => {
      const rect = canvas.getBoundingClientRect();
      const map: Record<string, Rect> = {};
      const all = canvas.querySelectorAll<HTMLElement>("[data-component-id]");
      all.forEach((el) => {
        const id = el.getAttribute("data-component-id");
        if (!id) return;
        const r = el.getBoundingClientRect();
        map[id] = {
          left: Math.max(0, r.left - rect.left),
          top: Math.max(0, r.top - rect.top),
          width: r.width,
          height: r.height,
        };
      });
      setPositions(map);
    };
    update();
    const int = window.setInterval(update, 500);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(int);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-232: need ref.current without re-subscribing
  }, [canvasRef?.current, deps]);

  return positions;
}
