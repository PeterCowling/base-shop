"use client";

import { useEffect, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
import { Button } from "../../atoms/shadcn";
import { alignLeft, alignRight, alignTop, alignBottom, alignCenterX, alignCenterY, distributeHorizontal, distributeVertical } from "./state/layout/geometry";
import { rectScreenToCanvas } from "./utils/coords";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  viewport: "desktop" | "tablet" | "mobile";
  disabled?: boolean;
  zoom?: number;
}

export default function SelectionQuickActions({ components, selectedIds, dispatch, canvasRef, viewport, disabled = false, zoom = 1 }: Props) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  // Compute bounding box of selected items and position bubble near top-center
  useEffect(() => {
    if (!canvasRef.current || selectedIds.length === 0) {
      setPos(null);
      return;
    }
    const bounds = canvasRef.current.getBoundingClientRect();
    const rects: { left: number; top: number; right: number; bottom: number }[] = [];
    selectedIds.forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = rectScreenToCanvas({ left: r.left, top: r.top, width: r.width, height: r.height }, bounds, zoom);
      rects.push({ left: c.left, top: c.top, right: c.left + c.width, bottom: c.top + c.height });
    });
    if (rects.length === 0) {
      setPos(null);
      return;
    }
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const centerX = (left + right) / 2;
    const gap = 8;
    setPos({ left: centerX, top: Math.max(0, top - gap) });
  }, [canvasRef, selectedIds, zoom]);

  if (!pos || selectedIds.length === 0) return null;

  const vpKey = (k: "left" | "top") => (viewport === "desktop" ? `${k}Desktop` : viewport === "tablet" ? `${k}Tablet` : `${k}Mobile`);

  const locked = disabled;
  const doPatch = (patches: { id: string; left?: string; top?: string }[]) => {
    patches.forEach((p) => {
      if (p.left !== undefined) dispatch({ type: "resize", id: p.id, [vpKey("left")]: p.left } as any);
      if (p.top !== undefined) dispatch({ type: "resize", id: p.id, [vpKey("top")]: p.top } as any);
    });
  };

  const ids = selectedIds;

  const centerInParentX = () => {
    ids.forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const left = Math.round((parent.clientWidth - el.offsetWidth) / 2);
      dispatch({ type: "resize", id, [vpKey("left")]: `${left}px` } as any);
    });
  };
  const centerInParentY = () => {
    ids.forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const top = Math.round((parent.clientHeight - el.offsetHeight) / 2);
      dispatch({ type: "resize", id, [vpKey("top")]: `${top}px` } as any);
    });
  };

  return (
    <div
      ref={bubbleRef}
      className="absolute z-40 -translate-x-1/2 -translate-y-full rounded bg-muted/90 px-1 py-1 text-xs text-muted-foreground shadow backdrop-blur"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex flex-wrap items-center gap-1">
        {selectedIds.length > 1 && (
          <>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignLeft(components, ids, viewport))}>L</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignRight(components, ids, viewport))}>R</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignTop(components, ids, viewport))}>T</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignBottom(components, ids, viewport))}>B</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignCenterX(components, ids, viewport))}>CX</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(alignCenterY(components, ids, viewport))}>CY</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(distributeHorizontal(components, ids, viewport))}>DH</Button>
            <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={() => doPatch(distributeVertical(components, ids, viewport))}>DV</Button>
          </>
        )}
        <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={centerInParentX} title="Center horizontally in parent">C‒P X</Button>
        <Button type="button" className="h-6 px-2 py-0 text-xs" variant="outline" disabled={locked} onClick={centerInParentY} title="Center vertically in parent">C‒P Y</Button>
      </div>
    </div>
  );
}
