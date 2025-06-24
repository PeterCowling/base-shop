// packages/ui/components/cms/PublishLocationSelector.tsx
"use client";

import type { PublishLocation } from "@types/PublishLocation";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { memo, useCallback } from "react";

export interface PublishLocationSelectorProps {
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
  showReload?: boolean;
}

const equal = (
  p: PublishLocationSelectorProps,
  n: PublishLocationSelectorProps
) =>
  p.selectedIds === n.selectedIds &&
  p.onChange === n.onChange &&
  p.showReload === n.showReload;

function PublishLocationSelectorInner({
  selectedIds,
  onChange,
  showReload = false,
}: PublishLocationSelectorProps) {
  const { locations, reload } = usePublishLocations();

  const toggle = useCallback(
    (id: string) => {
      const idx = selectedIds.indexOf(id);
      const next =
        idx === -1
          ? [...selectedIds, id]
          : [...selectedIds.slice(0, idx), ...selectedIds.slice(idx + 1)];
      onChange(next);
    },
    [selectedIds, onChange]
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        {locations.map(
          ({ id, name, description, requiredOrientation }: PublishLocation) => (
            <label
              key={id}
              className="flex items-start gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={() => toggle(id)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium">{name}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({requiredOrientation})
                </span>
                {description && (
                  <>
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {description}
                    </span>
                  </>
                )}
              </span>
            </label>
          )
        )}
      </div>

      {showReload && (
        <button
          type="button"
          onClick={reload}
          className="mt-4 inline-flex items-center rounded-2xl border p-2 text-sm shadow"
        >
          Refresh list
        </button>
      )}
    </>
  );
}

export default memo(PublishLocationSelectorInner, equal);
