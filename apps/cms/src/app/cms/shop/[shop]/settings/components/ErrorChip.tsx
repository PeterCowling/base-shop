"use client";

import { Chip } from "@/components/atoms";
import { cn } from "@ui/utils/style";

interface ErrorChipProps {
  error?: string | string[];
  className?: string;
}

export function ErrorChip({ error, className }: ErrorChipProps) {
  if (!error) return null;

  const message = Array.isArray(error) ? error.filter(Boolean).join(" ") : error;
  if (!message) return null;

  return (
    <Chip
      variant="destructive"
      className={cn("border border-destructive/30 bg-destructive/10 text-destructive", className)}
    >
      {message}
    </Chip>
  );
}
