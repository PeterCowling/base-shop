"use client";

import { useCallback, useRef, useState } from "react";
import type { HistoryState } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import { rectScreenToCanvas, screenToCanvas, rectsIntersect } from "./utils/coords";

type Viewport = "desktop" | "tablet" | "mobile";

interface Params {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
  editor?: HistoryState["editor"];
  viewport?: Viewport;
  onSelectIds: (ids: string[]) => void;
}

interface StartModifiers { shift?: boolean; meta?: boolean }

export default function useMarqueeSelect({ canvasRef, zoom = 1, editor, viewport, onSelectIds }: Params) {
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const baseSelectionRef = useRef<Set<string>>(new Set());
  const itemsRef = useRef<{ id: string; rect: { left: number; top: number; width: number; height: number } }[]>([]);
  const modeRef = useRef<StartModifiers>({});

  const buildItemsSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [] as { id: string; rect: { left: number; top: number; width: number; height: number } }[];
    const canvasRect = canvas.getBoundingClientRect();
    const els = Array.from(canvas.querySelectorAll<HTMLElement>('[data-component-id]'));
    const arr: { id: string; rect: { left: number; top: number; width: number; height: number } }[] = [];
    for (const el of els) {
      const id = el.getAttribute('data-component-id');
      if (!id) continue;
      // Skip locked/hidden
      const locked = !!(editor?.[id]?.locked);
      const hidden = isHiddenForViewport(id, editor, (el as any).hidden as boolean | undefined, viewport);
      if (locked || hidden) continue;
      const r = el.getBoundingClientRect();
      const rr = rectScreenToCanvas({ left: r.left, top: r.top, width: r.width, height: r.height }, canvasRect, zoom);
      arr.push({ id, rect: rr });
    }
    return arr;
  }, [canvasRef, editor, viewport, zoom]);

  const start = useCallback((e: PointerEvent | React.PointerEvent, currentSelected: string[] = [], mods: StartModifiers = {}) => {
    if (!(e instanceof PointerEvent) && !(typeof window !== 'undefined' && (e as any).nativeEvent instanceof PointerEvent)) {
      return;
    }
    const native = (e as any).nativeEvent as PointerEvent | undefined;
    const ev = (e as PointerEvent) || native!;
    if (ev.button !== 0) return; // left only
    const target = (ev.target as HTMLElement | null);
    if (!target) return;
    // Don’t start when clicking on a block or interactive element
    const isInteractive = (node: HTMLElement | null): boolean => {
      if (!node) return false;
      const tag = node.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if ((node as any).isContentEditable) return true;
      return false;
    };
    if (target.closest('[role="listitem"]') || isInteractive(target)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const startPt = screenToCanvas({ x: ev.clientX, y: ev.clientY }, cRect, zoom);
    startRef.current = startPt;
    baseSelectionRef.current = new Set(currentSelected);
    itemsRef.current = buildItemsSnapshot();
    modeRef.current = { ...mods };
    setActive(true);
    setRect({ left: startPt.x, top: startPt.y, width: 0, height: 0 });

    const onMove = (mv: PointerEvent) => {
      if (!startRef.current) return;
      const curr = screenToCanvas({ x: mv.clientX, y: mv.clientY }, cRect, zoom);
      const left = Math.min(startRef.current.x, curr.x);
      const top = Math.min(startRef.current.y, curr.y);
      const width = Math.abs(curr.x - startRef.current.x);
      const height = Math.abs(curr.y - startRef.current.y);
      const selRect = { left, top, width, height };
      setRect(selRect);
      // hit test
      const hits = new Set(itemsRef.current.filter((it) => rectsIntersect(selRect, it.rect)).map((it) => it.id));
      const base = baseSelectionRef.current;
      let next: string[] = [];
      if (modeRef.current.meta) {
        // toggle membership for hits
        const toggled = new Set<string>(base);
        hits.forEach((id) => {
          if (toggled.has(id)) toggled.delete(id); else toggled.add(id);
        });
        next = Array.from(toggled);
      } else if (modeRef.current.shift) {
        // union
        const union = new Set<string>(base);
        hits.forEach((id) => union.add(id));
        next = Array.from(union);
      } else {
        // replace
        next = Array.from(hits);
      }
      onSelectIds(next);
      try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: `Selected ${next.length} ${next.length === 1 ? 'block' : 'blocks'}` })); } catch {}
    };

    const onUp = () => {
      setActive(false);
      startRef.current = null;
      setRect(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [canvasRef, zoom, buildItemsSnapshot, onSelectIds]);

  return { active, rect, start } as const;
}

