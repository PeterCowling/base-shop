import { useEffect, useState } from "react";
import type { PositionsMap, Thread } from "./types";

type Pos = { x: number; y: number };

export function useDragPins(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  positionsRef: React.MutableRefObject<PositionsMap>,
  threads: Thread[],
  patch: (id: string, body: Record<string, unknown>) => Promise<void> | void
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<Pos | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragId) return;
      const thread = threads.find((t) => t.id === dragId);
      if (!thread) return;
      const comp = positionsRef.current[thread.componentId];
      const canvas = canvasRef.current;
      if (!comp || !canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const clientX = e.clientX - canvasRect.left - comp.left;
      const clientY = e.clientY - canvasRect.top - comp.top;
      const x = Math.min(1, Math.max(0, clientX / Math.max(1, comp.width)));
      const y = Math.min(1, Math.max(0, clientY / Math.max(1, comp.height)));
      setDragPos({ x, y });
    };
    const onUp = async () => {
      if (dragId && dragPos) {
        await patch(dragId, { pos: dragPos });
      }
      setDragId(null);
      setDragPos(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, true);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp, true);
    };
  }, [dragId, dragPos, threads, canvasRef, positionsRef, patch]);

  const startDrag = (id: string) => setDragId(id);

  return { dragId, dragPos, startDrag } as const;
}

