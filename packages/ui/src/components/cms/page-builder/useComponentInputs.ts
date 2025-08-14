import { useCallback } from "react";

export default function useComponentInputs<T>(
  onChange: (patch: Partial<T>) => void,
) {
  const handleInput = useCallback(
    (field: keyof T & string, value: any) => {
      onChange({ [field]: value } as Partial<T>);
    },
    [onChange],
  );

  return { handleInput };
}
