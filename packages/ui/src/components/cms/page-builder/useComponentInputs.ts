import { useCallback } from "react";
import type { PageComponent } from "@acme/types";

export default function useComponentInputs(
  onChange: (patch: Partial<PageComponent>) => void
) {
  const handleInput = useCallback(
    (field: string, value: any) => {
      onChange({ [field]: value } as Partial<PageComponent>);
    },
    [onChange]
  );

  return { handleInput };
}
