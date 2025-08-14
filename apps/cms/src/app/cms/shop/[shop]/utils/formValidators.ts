import { Dispatch, SetStateAction } from "react";

export function handleJsonInput<T>(
  value: string,
  field: string,
  setValue: (parsed: T) => void,
  setErrors: Dispatch<SetStateAction<Record<string, string[]>>>,
) {
  try {
    const parsed = JSON.parse(value) as T;
    setValue(parsed);
    setErrors((prev) => {
      const { [field]: _ignored, ...rest } = prev;
      return rest;
    });
  } catch {
    setErrors((prev) => ({ ...prev, [field]: ["Invalid JSON"] }));
  }
}
