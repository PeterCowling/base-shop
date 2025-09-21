"use client";

import type { PresencePeer } from "./collab/usePresence";

export default function SoftLockBanner({ selectedIds, softLocksById }: { selectedIds: string[]; softLocksById: Map<string, PresencePeer> }) {
  if (selectedIds.length === 0) return null;
  const lock = softLocksById.get(selectedIds[0]!);
  if (!lock) return null;
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-40 rounded bg-amber-100/90 px-2 py-1 text-xs text-amber-900 shadow">
      {lock.label} is editing this block
    </div>
  );
}

