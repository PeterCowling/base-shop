import { useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";

export function useCanvasRefs(canvasRef?: React.RefObject<HTMLDivElement | null>) {
  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({ id: "canvas", data: {} });

  const assignCanvasRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasDropRef(node);
    if (canvasRef) (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setCanvasDropRef, canvasRef]);

  return { assignCanvasRef, isCanvasOver };
}

