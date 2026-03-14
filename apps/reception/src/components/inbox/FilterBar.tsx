"use client";

import { X } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";

import { THREAD_FILTER_OPTIONS, type ThreadFilterKey } from "./filters";

interface FilterBarProps {
  activeFilters: Set<ThreadFilterKey>;
  counts?: Record<ThreadFilterKey, number>;
  onToggle: (key: ThreadFilterKey) => void;
  onClear: () => void;
}

export default function FilterBar({
  activeFilters,
  counts,
  onToggle,
  onClear,
}: FilterBarProps) {
  const activeCount = activeFilters.size;

  return (
    <Cluster className="gap-1.5 items-center">
      {THREAD_FILTER_OPTIONS.map((option) => {
        const isActive = activeFilters.has(option.key);

        return (
          <Button
            key={option.key}
            type="button"
            color={isActive ? "primary" : "default"}
            tone={isActive ? "outline" : "ghost"}
            onClick={() => onToggle(option.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              isActive
                ? "bg-primary-soft text-primary-main ring-1 ring-primary-main/30"
                : "bg-surface-3 text-foreground/70 hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            {option.label}
            {counts && counts[option.key] > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-px text-xs font-semibold tabular-nums leading-tight ${
                isActive
                  ? "bg-primary-main/20 text-primary-main"
                  : "bg-surface-elevated text-foreground/60"
              }`}>
                {counts[option.key]}
              </span>
            )}
          </Button>
        );
      })}

      {activeCount > 0 && (
        <Button
          type="button"
          color="default"
          tone="ghost"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground"
        >
          <X className="h-3 w-3" />
          Clear ({activeCount})
        </Button>
      )}
    </Cluster>
  );
}
