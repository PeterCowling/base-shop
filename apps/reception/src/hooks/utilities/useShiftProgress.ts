import { useCallback, useEffect } from "react";

export interface ShiftProgress {
  step: number;
  cash: number;
  keycards: number;
  receipts: Record<string, boolean>;
}

/**
 * Persist shift progress whenever the provided data changes.
 */
export function useAutoSaveShiftProgress(
  key: string,
  progress: ShiftProgress
) {
  const { save } = useShiftProgress(key);

  useEffect(() => {
    save(progress);
  }, [save, progress]);
}

export default function useShiftProgress(key: string) {
  const load = useCallback((): ShiftProgress | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as ShiftProgress) : null;
    } catch {
      return null;
    }
  }, [key]);

  const save = useCallback(
    (progress: ShiftProgress) => {
      localStorage.setItem(key, JSON.stringify(progress));
    },
    [key]
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { load, save, clear };
}
