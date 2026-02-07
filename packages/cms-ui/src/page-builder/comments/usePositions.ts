import { useCallback, useEffect, useRef } from "react";

import type { PositionsMap } from "./types";

export function usePositions(canvasRef: React.RefObject<HTMLDivElement | null>, deps: unknown[] = []) {
  const positions = useRef<PositionsMap>({});

  const recalcPositions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const map: PositionsMap = {};
    const all = canvas.querySelectorAll<HTMLElement>("[data-component-id]");
    all.forEach((el) => {
      const id = el.getAttribute("data-component-id");
      if (!id) return;
      const r = el.getBoundingClientRect();
      map[id] = { left: Math.max(0, r.left - canvasRect.left), top: Math.max(0, r.top - canvasRect.top), width: r.width, height: r.height };
    });
    positions.current = map;
  }, [canvasRef]);

  useEffect(() => {
    recalcPositions();
    const handle = () => recalcPositions();
    window.addEventListener("resize", handle);
    const t = setInterval(handle, 500);
    return () => {
      window.removeEventListener("resize", handle);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-221: watcher intentionally depends on recalcPositions + external deps array
  }, [recalcPositions, ...deps]);

  return { positions, recalcPositions } as const;
}
