"use client";
import { useState, useRef } from "react";

export interface Guides {
  x: number | null;
  y: number | null;
}

export default function useGuides(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const siblingEdgesRef = useRef<{ vertical: number[]; horizontal: number[] }>(
    { vertical: [], horizontal: [] }
  );
  const [guides, setGuides] = useState<Guides>({ x: null, y: null });

  const computeSiblingEdges = () => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return { vertical: [], horizontal: [] };
    const vertical: number[] = [];
    const horizontal: number[] = [];
    // Add container centerlines to improve snapping to midlines
    const centerX = parent.offsetWidth / 2;
    const centerY = parent.offsetHeight / 2;
    if (Number.isFinite(centerX)) vertical.push(centerX);
    if (Number.isFinite(centerY)) horizontal.push(centerY);
    Array.from(parent.children).forEach((child) => {
      if (child === el) return;
      const c = child as HTMLElement;
      vertical.push(c.offsetLeft, c.offsetLeft + c.offsetWidth);
      horizontal.push(c.offsetTop, c.offsetTop + c.offsetHeight);
    });
    siblingEdgesRef.current = { vertical, horizontal };
    return siblingEdgesRef.current;
  };

  return { guides, setGuides, siblingEdgesRef, computeSiblingEdges };
}
