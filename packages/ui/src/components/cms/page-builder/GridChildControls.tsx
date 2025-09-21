"use client";

import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
import { useRef } from "react";

type Props = {
  parent: PageComponent;
  child: PageComponent;
  dispatch: React.Dispatch<Action>;
  containerElRef: React.MutableRefObject<HTMLDivElement | null>;
  enabled: boolean; // whether parent is a Grid container
};

export default function GridChildControls({ parent, child, dispatch, containerElRef, enabled }: Props) {
  const spanColHandleRef = useRef<HTMLDivElement | null>(null);
  const spanRowHandleRef = useRef<HTMLDivElement | null>(null);

  if (!enabled) return null;

  const maxCols = Math.max(1, Number((parent as any).columns) || 12);
  const rowsProp = Number((parent as any).rows) || 0;

  const parseSpan = (val: unknown, limit: number) => {
    const s = String(val ?? "").trim();
    const m = /span\s+(\d+)/i.exec(s);
    return m ? Math.max(1, Math.min(limit, parseInt(m[1]!, 10))) : 1;
  };

  const currCol = parseSpan((child as any).gridColumn, maxCols);
  const currRow = parseSpan((child as any).gridRow, Math.max(1, rowsProp || 1));

  const setColSpan = (n: number) =>
    dispatch({
      type: "update",
      id: child.id,
      patch: { gridColumn: `span ${Math.max(1, Math.min(maxCols, n))}` } as any,
    });
  const setRowSpan = (n: number) =>
    dispatch({
      type: "update",
      id: child.id,
      patch: {
        gridRow: `span ${Math.max(1, rowsProp ? Math.min(Math.max(1, rowsProp), n) : n)}`,
      } as any,
    });

  return (
    <>
      <div className="absolute -top-3 left-0 z-20 flex gap-1">
        <button
          type="button"
          className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black"
          aria-label="Decrease column span"
          onClick={(e) => {
            e.stopPropagation();
            setColSpan(currCol - 1);
          }}
        >
          −
        </button>
        <span className="rounded bg-black/40 px-1 text-[10px] text-white dark:bg-white/50 dark:text-black">
          {currCol} col
        </span>
        <button
          type="button"
          className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black"
          aria-label="Increase column span"
          onClick={(e) => {
            e.stopPropagation();
            setColSpan(currCol + 1);
          }}
        >
          ＋
        </button>
      </div>
      <div className="absolute -bottom-3 left-0 z-20 flex gap-1">
        <button
          type="button"
          className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black"
          aria-label="Decrease row span"
          onClick={(e) => {
            e.stopPropagation();
            setRowSpan(currRow - 1);
          }}
        >
          −
        </button>
        <span className="rounded bg-black/40 px-1 text-[10px] text-white dark:bg-white/50 dark:text-black">
          {currRow} row
        </span>
        <button
          type="button"
          className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black"
          aria-label="Increase row span"
          onClick={(e) => {
            e.stopPropagation();
            setRowSpan(currRow + 1);
          }}
        >
          ＋
        </button>
      </div>

      <div
        ref={spanColHandleRef}
        className="absolute top-0 bottom-0 right-0 z-20 w-1 cursor-col-resize bg-transparent"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const el = containerElRef.current;
          const colWidth = el ? el.clientWidth / maxCols : 0;
          const startX = e.clientX;
          const initial = parseSpan((child as any).gridColumn, maxCols);
          const move = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            const delta = colWidth > 0 ? Math.round(dx / Math.max(1, colWidth)) : 0;
            const next = Math.max(1, Math.min(maxCols, initial + delta));
            dispatch({ type: "update", id: child.id, patch: { gridColumn: `span ${next}` } as any });
          };
          const up = () => {
            try {
              window.removeEventListener("pointermove", move as any);
            } catch {}
            try {
              window.removeEventListener("pointerup", up as any);
            } catch {}
          };
          window.addEventListener("pointermove", move as any);
          window.addEventListener("pointerup", up as any, { once: true });
        }}
        title="Drag to change column span"
        aria-label="Resize grid column span"
      />

      <div
        ref={spanRowHandleRef}
        className="absolute bottom-0 left-0 right-0 z-20 h-1 cursor-row-resize bg-transparent"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!rowsProp) return; // only drag when explicit rows are set
          const el = containerElRef.current;
          const rowCount = Math.max(1, rowsProp);
          const rowHeight = el ? el.clientHeight / rowCount : 0;
          const startY = e.clientY;
          const initial = parseSpan((child as any).gridRow, rowCount);
          const move = (ev: PointerEvent) => {
            const dy = ev.clientY - startY;
            const delta = rowHeight > 0 ? Math.round(dy / Math.max(1, rowHeight)) : 0;
            const next = Math.max(1, Math.min(rowCount, initial + delta));
            dispatch({ type: "update", id: child.id, patch: { gridRow: `span ${next}` } as any });
          };
          const up = () => {
            try {
              window.removeEventListener("pointermove", move as any);
            } catch {}
            try {
              window.removeEventListener("pointerup", up as any);
            } catch {}
          };
          window.addEventListener("pointermove", move as any);
          window.addEventListener("pointerup", up as any, { once: true });
        }}
        title="Drag to change row span"
        aria-label="Resize grid row span"
      />
    </>
  );
}

