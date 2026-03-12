"use client";

import { X } from "lucide-react";

import { THREAD_FILTER_OPTIONS, type ThreadFilterKey } from "./filters";

interface FilterBarProps {
  activeFilters: Set<ThreadFilterKey>;
  onToggle: (key: ThreadFilterKey) => void;
  onClear: () => void;
}

export default function FilterBar({
  activeFilters,
  onToggle,
  onClear,
}: FilterBarProps) {
  const activeCount = activeFilters.size;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {THREAD_FILTER_OPTIONS.map((option) => {
        const isActive = activeFilters.has(option.key);

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onToggle(option.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              isActive
                ? "bg-primary-soft text-primary-main ring-1 ring-primary-main/30"
                : "bg-surface-3 text-foreground/70 hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
