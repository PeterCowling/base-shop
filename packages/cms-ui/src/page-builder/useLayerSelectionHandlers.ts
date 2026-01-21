import { useCallback } from "react";

export function useSelectionHandlers(selectedIds: string[], onSelectIds: (ids: string[]) => void) {
  return useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
        const exists = selectedIds.includes(id);
        onSelectIds(exists ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
      } else {
        onSelectIds([id]);
        setTimeout(() => {
          const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
          el?.focus?.();
        }, 0);
      }
    },
    [selectedIds, onSelectIds]
  );
}

