"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy filter chip pending design/i18n overhaul */

import { Cross2Icon } from "@radix-ui/react-icons";

import { Tag } from "@ui/components/atoms";

export function XaFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Tag size="sm" className="flex items-center gap-1">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex min-h-6 min-w-6 items-center justify-center"
        aria-label="Remove filter"
      >
        <Cross2Icon className="h-3 w-3" aria-hidden />
      </button>
    </Tag>
  );
}
