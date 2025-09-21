"use client";

import { useEffect } from "react";

/**
 * Dims locked items while group overlay is active.
 */
export default function useDimLockedSelection({
  enabled,
  lockedIds,
}: {
  enabled: boolean;
  lockedIds: string[];
}) {
  useEffect(() => {
    const dimmed: HTMLElement[] = [];
    if (enabled && lockedIds.length > 0) {
      lockedIds.forEach((id) => {
        const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
        if (el) {
          (el as any).dataset.pbPrevOpacity = el.style.opacity;
          el.style.opacity = "0.4";
          dimmed.push(el);
        }
      });
    }
    return () => {
      dimmed.forEach((el) => {
        const prev = (el as any).dataset.pbPrevOpacity as string | undefined;
        el.style.opacity = prev ?? "";
        if ((el as any).dataset) delete (el as any).dataset.pbPrevOpacity;
      });
    };
  }, [enabled, lockedIds.join(",")]);
}

