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

  // Always call the latest onSave with the latest FormData to avoid
  // optimistic-concurrency conflicts when a queued auto-save fires after
  // a manual save updated the server's updatedAt.
  const onSaveRef = useRef(onSave);
  const formDataRef = useRef(formData);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleAutoSave = useCallback(() => {
    setAutoSaveState("saving");
    onSaveRef.current(formDataRef.current)
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
  }, [onError]);

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
