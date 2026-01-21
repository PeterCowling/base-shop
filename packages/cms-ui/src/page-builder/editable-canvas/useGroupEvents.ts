import { useEffect } from "react";

export function useGroupEvents(groupAs: (k: "Section" | "MultiColumn") => void, ungroup: () => void) {
  useEffect(() => {
    const onGroup = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ kind: "Section" | "MultiColumn" }>;
        const kind = ce?.detail?.kind;
        if (kind) groupAs(kind);
      } catch {}
    };
    const onUngroup = () => ungroup();
    window.addEventListener('pb:group', onGroup as EventListener);
    window.addEventListener('pb:ungroup', onUngroup as EventListener);
    return () => {
      window.removeEventListener('pb:group', onGroup as EventListener);
      window.removeEventListener('pb:ungroup', onUngroup as EventListener);
    };
  }, [groupAs, ungroup]);
}

