"use client";

import type { PresencePeer } from "./collab/usePresence";

export default function SoftLockBanner({ selectedIds, softLocksById }: { selectedIds: string[]; softLocksById: Map<string, PresencePeer> }) {
  if (selectedIds.length === 0) return null;
  const lock = softLocksById.get(selectedIds[0]!);
  if (!lock) return null;
  // i18n-exempt — Editor-only status message; not part of site UI
  /* i18n-exempt */ const t = (s: string) => s;
  return (
    <div className="relative">
      <div className="pointer-events-none absolute start-2 top-2 rounded bg-amber-100/90 px-2 py-1 text-xs text-amber-900 shadow">
        {lock.label} {t("is editing this block")}
      </div>
    </div>
  );
}
