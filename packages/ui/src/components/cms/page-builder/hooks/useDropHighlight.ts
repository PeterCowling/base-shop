"use client";

import { useState } from "react";
import type { Rect } from "../utils/coords";
import { rectScreenToCanvas } from "../utils/coords";

export default function useDropHighlight({
  preview,
  canvasRef,
  zoom,
  setDragOver,
}: {
  preview?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  setDragOver: (v: boolean) => void;
}) {
  const [dropRect, setDropRect] = useState<Rect | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (preview) return;
    e.preventDefault();
    setDragOver(true);
    const target = (e.target as HTMLElement).closest('[role="listitem"], #canvas');
    if (target instanceof HTMLElement && canvasRef?.current) {
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const r = rectScreenToCanvas({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }, canvasBounds, zoom);
      setDropRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    } else {
      setDropRect(null);
    }
  };

  const clearHighlight = () => {
    setDragOver(false);
    setDropRect(null);
  };

  return { dropRect, handleDragOver, clearHighlight, setDropRect } as const;
}

