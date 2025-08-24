"use client";
import { useCallback } from "react";

type ResizePatch = Record<string, string | undefined>;

export default function useComponentResize(
  onResize: (patch: ResizePatch) => void
) {
  const handleResize = useCallback(
    (field: string, value: string) => {
      const v = value.trim();
      onResize({ [field]: v || undefined });
    },
    [onResize]
  );

  const handleFullSize = useCallback(
    (field: string) => {
      onResize({ [field]: "100%" });
    },
    [onResize]
  );

  return { handleResize, handleFullSize };
}
