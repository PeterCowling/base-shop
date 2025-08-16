import { useCallback } from "react";

export default function useComponentInputs<T>(
  onChange: (patch: Partial<T>) => void,
): {
  handleInput: <K extends keyof T>(field: K, value: T[K]) => void;
} {
  const handleInput = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      onChange({ [field]: value } as Pick<T, K>);
    },
    [onChange],
  );

  return { handleInput };
}
