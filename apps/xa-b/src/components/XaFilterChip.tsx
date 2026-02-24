"use client";

import { Cross2Icon } from "@radix-ui/react-icons";

import { IconButton, Tag } from "@acme/design-system/atoms";

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
      <IconButton
        type="button"
        onClick={onRemove}
        size="sm"
        variant="ghost"
        className="h-6 w-6 min-h-6 min-w-6 hover:bg-transparent"
        aria-label="Remove filter"
      >
        <Cross2Icon className="h-3 w-3" aria-hidden />
      </IconButton>
    </Tag>
  );
}
