import type { ChangeEvent, Dispatch, SetStateAction } from "react";

export type ErrorSetter = Dispatch<SetStateAction<Record<string, string[]>>>;

export function jsonFieldHandler<T>(
  field: string,
  updater: (parsed: T) => void,
  setErrors: ErrorSetter,
) {
  return (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value) as T;
      updater(parsed);
      setErrors((prev) => {
        const { [field]: _omit, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, [field]: ["Invalid JSON"] }));
    }
  };
}
