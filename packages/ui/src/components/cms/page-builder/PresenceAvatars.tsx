"use client";

import React, { useMemo } from "react";
import usePresence from "./collab/usePresence";

export default function PresenceAvatars({ shop, pageId }: { shop: string | null; pageId: string | null }) {
  const { peers } = usePresence({ shop, pageId, meId: (typeof window !== "undefined" ? (window as any).__PB_USER_ID : null) || "me", label: (typeof window !== "undefined" ? (window as any).__PB_USER_NAME : null) || "Me", selectedIds: [], editingId: null });
  const show = useMemo(() => peers.slice(0, 4), [peers]);
  if (show.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2">
      {show.map((p) => (
        <div key={p.id} className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-1 text-xs" style={{ backgroundColor: p.color }} title={p.label} aria-label={p.label}>
          <span className="mix-blend-difference text-white">{p.label?.slice(0, 2).toUpperCase()}</span>
        </div>
      ))}
      {peers.length > show.length && (
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-1 bg-muted text-xs" title={`+${peers.length - show.length} more`}>
          +{peers.length - show.length}
        </div>
      )}
    </div>
  );
}
