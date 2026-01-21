"use client";

import { useCallback, useState } from "react";

import type { ComponentType } from "../defaults";

export default function useRecents() {
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("pb:recent-types");
      return s ? (JSON.parse(s) as string[]) : [];
    } catch {
      return [];
    }
  });

  const pushRecent = useCallback((type: ComponentType) => {
    try {
      setRecents((prev) => {
        const next = [type, ...prev.filter((t) => t !== type)].slice(0, 10);
        localStorage.setItem("pb:recent-types", JSON.stringify(next));
        return next;
      });
    } catch {
      /* noop */
    }
  }, []);

  return { recents, pushRecent } as const;
}

