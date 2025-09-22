import { useEffect, useRef } from "react";

export type TabHover = { parentId: string; tabIndex: number };

export function useLastTabHover() {
  const lastTabHoverRef = useRef<TabHover | null>(null);

  useEffect(() => {
    const onHover = (e: Event) => {
      try {
        const ce = e as CustomEvent<TabHover>;
        if (ce?.detail && typeof ce.detail.parentId === 'string' && typeof ce.detail.tabIndex === 'number') {
          lastTabHoverRef.current = { parentId: ce.detail.parentId, tabIndex: ce.detail.tabIndex };
        }
      } catch {}
    };
    window.addEventListener('pb-tab-hover', onHover as any);
    return () => window.removeEventListener('pb-tab-hover', onHover as any);
  }, []);

  return lastTabHoverRef;
}

