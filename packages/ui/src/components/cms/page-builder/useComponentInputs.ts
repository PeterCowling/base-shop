import { useCallback } from "react";
import type { PageComponent } from "@acme/types";

export function useComponentInputs(
  onChange: (patch: Partial<PageComponent>) => void
) {
  return useCallback(
    (field: string, value: unknown) => {
      onChange({ [field]: value } as Partial<PageComponent>);
    },
    [onChange]
  );
}

export default useComponentInputs;
