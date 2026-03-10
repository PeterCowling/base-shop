import { useCallback, useEffect, useMemo, useState } from "react";

import { readJson, removeItem, writeJson } from "../../lib/offline/storage";

export interface BatchCountProgress {
  categoriesComplete: string[];
  enteredQuantities: Record<string, number>;
}

interface StoredBatchCountProgress {
  sessionDate: string;
  data: BatchCountProgress;
}

function isBatchCountProgress(value: unknown): value is BatchCountProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const { categoriesComplete, enteredQuantities } = candidate;

  if (
    !Array.isArray(categoriesComplete) ||
    !categoriesComplete.every((category) => typeof category === "string")
  ) {
    return false;
  }

  if (!enteredQuantities || typeof enteredQuantities !== "object") {
    return false;
  }

  return Object.values(enteredQuantities).every(
    (quantity) => typeof quantity === "number" && Number.isFinite(quantity)
  );
}

function isStoredBatchCountProgress(
  value: unknown
): value is StoredBatchCountProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sessionDate === "string" &&
    isBatchCountProgress(candidate.data)
  );
}

export default function useBatchCountProgress(userId: string, date: string) {
  const [progress, setProgress] = useState<BatchCountProgress | null>(null);

  const storageKey = useMemo(() => {
    if (!userId) {
      return null;
    }

    return `batchCount-${userId}-${date}`;
  }, [userId, date]);

  useEffect(() => {
    if (!storageKey) {
      setProgress(null);
      return;
    }

    const parsed = readJson<unknown>(storageKey);

    if (parsed === null) {
      setProgress(null);
      return;
    }

    if (!isStoredBatchCountProgress(parsed) || parsed.sessionDate !== date) {
      removeItem(storageKey);
      setProgress(null);
      return;
    }

    setProgress(parsed.data);
  }, [date, storageKey]);

  const saveProgress = useCallback(
    (data: BatchCountProgress) => {
      setProgress(data);

      if (!userId || !storageKey) {
        return;
      }

      const payload: StoredBatchCountProgress = {
        sessionDate: date,
        data,
      };

      writeJson(storageKey, payload);
    },
    [date, storageKey, userId]
  );

  const clearProgress = useCallback(() => {
    setProgress(null);

    if (!storageKey) {
      return;
    }

    removeItem(storageKey);
  }, [storageKey]);

  return { progress, saveProgress, clearProgress };
}
