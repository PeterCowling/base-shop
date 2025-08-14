import { useCallback } from "react";

export function useComponentResize(
  onResize: (patch: Record<string, string | undefined>) => void
) {
  return useCallback(
    (field: string, value: string | undefined) => {
      onResize({ [field]: value });
    },
    [onResize]
  );
}

export default useComponentResize;
