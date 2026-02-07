"use client";

import { Chip } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";

interface ErrorChipsProps {
  errors?: string[];
}

export function ErrorChips({ errors }: ErrorChipsProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <Inline gap={2} wrap className="pt-1">
      {errors.map((error, index) => (
        <Chip
          key={`${error}-${index}`}
          className="bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
          data-token="--color-danger" // i18n-exempt -- DS-000 design token reference; non-UI string [ttl=2026-01-01]
        >
          {error}
        </Chip>
      ))}
    </Inline>
  );
}

export default ErrorChips;
