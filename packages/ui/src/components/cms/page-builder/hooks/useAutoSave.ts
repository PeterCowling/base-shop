"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveState = "idle" | "saving" | "saved" | "error";

interface Params {
  onSave: (fd: FormData) => Promise<unknown>;
  formData: FormData;
  deps: unknown[];
  onError?: (retry: () => void) => void;
}

export default function useAutoSave({
  onSave,
  formData,
  deps,
  onError,
}: Params) {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>("idle");
  const saveDebounceRef = useRef<number | null>(null);
  const initialRender = useRef(true);

  const handleAutoSave = useCallback(() => {
    setAutoSaveState("saving");
    onSave(formData)
      .then(() => {
        setAutoSaveState("saved");
        setTimeout(() => setAutoSaveState("idle"), 1000);
      })
      .catch(() => {
        setAutoSaveState("error");
        onError?.(() => {
          handleAutoSave();
        });
      });
  }, [onSave, formData, onError]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(handleAutoSave, 2000);
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAutoSave, ...deps]);

  return { autoSaveState, handleAutoSave };
}
