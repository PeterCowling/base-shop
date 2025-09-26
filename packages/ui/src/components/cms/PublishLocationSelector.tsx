// packages/ui/components/cms/PublishLocationSelector.tsx
"use client";

import { Button, Input } from "../atoms/shadcn";
import type { PublishLocation } from "@acme/types";
import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import { toggleItem } from "@acme/shared-utils";
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
      onChange(toggleItem(selectedIds, id));
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
              className="flex cursor-pointer items-start gap-2 select-none"
            >
              <Input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={() => toggle(id)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground ms-1 text-xs">
                  ({requiredOrientation})
                </span>
                {description && (
                  <>
                    <br />
                    <span className="text-muted-foreground text-sm">
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
        <Button
          type="button"
          onClick={reload}
          variant="outline"
          className="mt-4 inline-flex items-center rounded-2xl p-2 text-sm shadow"
        >
          Refresh list
        </Button>
      )}
    </>
  );
}

export default memo(PublishLocationSelectorInner, equal);
