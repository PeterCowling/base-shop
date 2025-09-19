"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snapToGrid } from "./gridSnap";

type Pos = { left: number; top: number; width: number; height: number };

type Viewport = "desktop" | "tablet" | "mobile";

interface Props {
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  ids: string[];
  viewport: Viewport;
  gridEnabled?: boolean;
  gridCols: number;
  onApply: (patches: Record<string, { left?: string; top?: string; width?: string; height?: string }>) => void;
}

export default function MultiSelectOverlay({ canvasRef, ids, gridEnabled = false, gridCols, onApply }: Props) {
  const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const startParentBoundsRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const startMapRef = useRef<Record<string, Pos>>({});
  const idToParentRef = useRef<Record<string, HTMLElement>>({});
  const groupBoundsRef = useRef<Map<HTMLElement, { left: number; top: number; width: number; height: number }>>(new Map());
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Compute initial positions and overlay bounds
  useEffect(() => {
    if (!canvasRef?.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const map: Record<string, Pos> = {};
    const rects: Pos[] = [];
    idToParentRef.current = {};
    groupBoundsRef.current = new Map();
    ids.forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = r.left - canvasRect.left;
      const top = r.top - canvasRect.top;
      const width = r.width;
      const height = r.height;
      const parent = (el.offsetParent as HTMLElement | null) ?? el.parentElement ?? undefined;
      if (parent) idToParentRef.current[id] = parent;
      const parentLeft = el.offsetLeft;
      const parentTop = el.offsetTop;
      map[id] = { left: parentLeft, top: parentTop, width, height };
      // Update per-parent group bounds in parent space
      if (parent) {
        const gb = groupBoundsRef.current.get(parent);
        const right = parentLeft + width;
        const bottom = parentTop + height;
        if (!gb) {
          groupBoundsRef.current.set(parent, { left: parentLeft, top: parentTop, width, height });
        } else {
          const minL = Math.min(gb.left, parentLeft);
          const minT = Math.min(gb.top, parentTop);
          const maxR = Math.max(gb.left + gb.width, right);
          const maxB = Math.max(gb.top + gb.height, bottom);
          groupBoundsRef.current.set(parent, { left: minL, top: minT, width: maxR - minL, height: maxB - minT });
        }
      }
      rects.push({ left, top, width, height });
    });
    startMapRef.current = map;
    // Compute bounds in parent coordinate space
    if (Object.keys(map).length > 0) {
      const minPX = Math.min(...Object.values(map).map((m) => m.left));
      const minPY = Math.min(...Object.values(map).map((m) => m.top));
      const maxPX = Math.max(...Object.values(map).map((m) => m.left + m.width));
      const maxPY = Math.max(...Object.values(map).map((m) => m.top + m.height));
      startParentBoundsRef.current = { left: minPX, top: minPY, width: maxPX - minPX, height: maxPY - minPY };
    } else {
      startParentBoundsRef.current = null;
    }
    if (rects.length === 0) {
      setBounds(null);
      return;
    }
    const minX = Math.min(...rects.map((r) => r.left));
    const minY = Math.min(...rects.map((r) => r.top));
    const maxX = Math.max(...rects.map((r) => r.left + r.width));
    const maxY = Math.max(...rects.map((r) => r.top + r.height));
    setBounds({ left: minX, top: minY, width: maxX - minX, height: maxY - minY });
    setDragDelta({ dx: 0, dy: 0 });
  }, [ids, canvasRef]);

  type Handle = "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s" | null;

  const handlePointerDown = (e: React.PointerEvent, handle: Handle = null) => {
    e.stopPropagation();
    dragRef.current = { x: e.clientX, y: e.clientY };
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dxRaw = ev.clientX - dragRef.current.x;
      const dyRaw = ev.clientY - dragRef.current.y;
      let dx = dxRaw;
      let dy = dyRaw;
      if (gridEnabled && canvasRef?.current) {
        const unit = canvasRef.current.offsetWidth / gridCols;
        dx = snapToGrid(dxRaw, unit) - snapToGrid(0, unit);
        dy = snapToGrid(dyRaw, unit) - snapToGrid(0, unit);
      }
      const out: Record<string, { left?: string; top?: string; width?: string; height?: string }> = {};
      if (!handle) {
        setDragDelta({ dx, dy });
        Object.entries(startMapRef.current).forEach(([id, p]) => {
          out[id] = { left: `${Math.round(p.left + dx)}px`, top: `${Math.round(p.top + dy)}px` };
        });
      } else {
        const vis = bounds;
        if (!vis) return;
        // New overlay size in display space (used for visual; assume dx/dy apply to width/height per handle)
        let newWVis = vis.width;
        let newHVis = vis.height;
        if (handle.includes("e")) newWVis = vis.width + dx;
        if (handle.includes("w")) newWVis = vis.width - dx;
        if (handle.includes("s")) newHVis = vis.height + dy;
        if (handle.includes("n")) newHVis = vis.height - dy;
        // Scale factors in parent space
        const sx = handle.includes("e") || handle.includes("w") ? Math.max(0.01, newWVis / vis.width) : 1;
        const sy = handle.includes("n") || handle.includes("s") ? Math.max(0.01, newHVis / vis.height) : 1;
        // For each id, compute scaling relative to its own parent's group bounds
        Object.entries(startMapRef.current).forEach(([id, p]) => {
          const parent = idToParentRef.current[id];
          const start = parent ? groupBoundsRef.current.get(parent) : undefined;
          if (!start) return;
          const anchorX = handle.includes("w") ? start.left + start.width : start.left;
          const anchorY = handle.includes("n") ? start.top + start.height : start.top;
          const newLeft = anchorX + (p.left - start.left) * sx;
          const newTop = anchorY + (p.top - start.top) * sy;
          const newWidth = p.width * sx;
          const newHeight = p.height * sy;
          const patch: { left?: string; top?: string; width?: string; height?: string } = {};
          if (sx !== 1) {
            patch.left = `${Math.round(newLeft)}px`;
            patch.width = `${Math.round(newWidth)}px`;
          }
          if (sy !== 1) {
            patch.top = `${Math.round(newTop)}px`;
            patch.height = `${Math.round(newHeight)}px`;
          }
          out[id] = patch;
        });
        setDragDelta({ dx: 0, dy: 0 });
      }
      onApply(out);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const overlayStyle = useMemo(() => {
    if (!bounds) return undefined;
    const { left, top, width, height } = bounds;
    return {
      left: left + dragDelta.dx,
      top: top + dragDelta.dy,
      width,
      height,
    } as React.CSSProperties;
  }, [bounds, dragDelta]);

  if (!bounds) return null;
  return (
    <div className="absolute z-40" style={overlayStyle}>
      <div
        className="absolute inset-0 rounded border-2 border-dashed border-primary/70"
        onPointerDown={(e) => handlePointerDown(e, null)}
        role="button"
        aria-label="Move selection"
        title="Drag to move selection"
      />
      {/* Corner handles */}
      <div onPointerDown={(e) => handlePointerDown(e, "nw")} role="button" aria-label="Resize group from top-left" tabIndex={0} className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "ne")} role="button" aria-label="Resize group from top-right" tabIndex={0} className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "sw")} role="button" aria-label="Resize group from bottom-left" tabIndex={0} className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "se")} role="button" aria-label="Resize group from bottom-right" tabIndex={0} className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      {/* Side handles */}
      <div onPointerDown={(e) => handlePointerDown(e, "n")} role="button" aria-label="Resize group from top" tabIndex={0} className="absolute -top-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "s")} role="button" aria-label="Resize group from bottom" tabIndex={0} className="absolute -bottom-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "w")} role="button" aria-label="Resize group from left" tabIndex={0} className="absolute top-1/2 -left-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <div onPointerDown={(e) => handlePointerDown(e, "e")} role="button" aria-label="Resize group from right" tabIndex={0} className="absolute top-1/2 -right-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
    </div>
  );
}
