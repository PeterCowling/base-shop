"use client";

import React from "react";
import type { PositionsMap, Thread } from "./types";

type Pos = { x: number; y: number };

export function CommentsPinsLayer({
  threads,
  visibleThreads,
  positionsRef,
  dragId,
  dragPos,
  onStartDrag,
  onOpen,
}: {
  threads: Thread[];
  visibleThreads: Thread[];
  positionsRef: React.MutableRefObject<PositionsMap>;
  dragId: string | null;
  dragPos: Pos | null;
  onStartDrag: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      {visibleThreads.map((t, i) => {
        const comp = positionsRef.current[t.componentId];
        if (!comp) return null;
        const isDragging = dragId === t.id && !!dragPos;
        const rel = isDragging ? (dragPos as Pos) : (t.pos ?? null);
        const pinLeft = comp.left + (rel ? (rel.x * comp.width) : 8);
        const pinTop = comp.top + (rel ? (rel.y * comp.height) : 8);
        return (
          <button
            key={t.id}
            type="button"
            className={`pointer-events-auto absolute -translate-y-1/2 translate-x-1/2 rounded-full border px-2 py-1 text-xs shadow ${t.resolved ? "bg-green-200" : "bg-amber-200"}`}
            style={{ left: pinLeft, top: pinTop, cursor: "grab" }}
            onMouseDown={(e) => { if (e.button === 0) { onStartDrag(t.id); e.preventDefault(); e.stopPropagation(); } }}
            onClick={() => onOpen(t.id)}
            title={`Comment on ${t.componentId}`}
          >
            {i + 1}
          </button>
        );
      })}

      {(() => {
        const counts = new Map<string, number>();
        threads.forEach((t) => counts.set(t.componentId, (counts.get(t.componentId) ?? 0) + (t.resolved ? 0 : 1)));
        return Array.from(counts.entries()).map(([cid, count]) => {
          if (!count) return null;
          const comp = positionsRef.current[cid];
          if (!comp) return null;
          return (
            <div
              key={`badge-${cid}`}
              className="pointer-events-none absolute flex h-5 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              style={{ left: comp.left + comp.width - 6, top: comp.top + 6 }}
              title={`${count} unresolved comments`}
            >
              {count}
            </div>
          );
        });
      })()}
    </>
  );
}

export default CommentsPinsLayer;
