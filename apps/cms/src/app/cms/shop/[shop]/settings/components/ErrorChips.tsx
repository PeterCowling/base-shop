"use client";

import { Chip } from "@/components/atoms";

interface ErrorChipsProps {
  errors?: string[];
}

export function ErrorChips({ errors }: ErrorChipsProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-2 pt-1">
      {errors.map((error, index) => (
        <Chip
          key={`${error}-${index}`}
          className="bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
          data-token="--color-danger"
        >
          {error}
        </Chip>
      ))}
    </span>
  );
}

export default ErrorChips;
