import { useCallback, useEffect } from "react";

import { readJson, removeItem, writeJson } from "../../lib/offline/storage";

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
    return readJson<ShiftProgress>(key);
  }, [key]);

  const save = useCallback(
    (progress: ShiftProgress) => {
      writeJson(key, progress);
    },
    [key]
  );

  const clear = useCallback(() => {
    removeItem(key);
  }, [key]);

  return { load, save, clear };
}
