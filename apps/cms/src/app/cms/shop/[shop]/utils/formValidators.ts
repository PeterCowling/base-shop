"use client";

import type {
  ChangeEvent,
  Dispatch,
  SetStateAction,
} from "react";
import type { Shop } from "@acme/types";

export function createJsonChangeHandler<K extends keyof Shop>(
  field: K,
  setInfo: Dispatch<SetStateAction<Shop>>,
  setErrors: Dispatch<SetStateAction<Record<string, string[]>>>,
) {
  return (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    try {
      const parsed = JSON.parse(value);
      setInfo((prev) => ({ ...prev, [field]: parsed }));
      setErrors((prev) => {
        const { [field]: _removed, ...rest } = prev;
        return rest;
      });
    } catch {
      setErrors((prev) => ({ ...prev, [field]: ["Invalid JSON"] }));
    }
  };
}
