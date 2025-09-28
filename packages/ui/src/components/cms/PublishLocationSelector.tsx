// packages/ui/components/cms/PublishLocationSelector.tsx
"use client";

import { Button, Input } from "../atoms/shadcn";
import type { PublishLocation } from "@acme/types";
import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import { toggleItem } from "@acme/shared-utils";
import { memo, useCallback } from "react";
import { Stack, Inline } from "../atoms/primitives";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const { locations, reload } = usePublishLocations();

  const toggle = useCallback(
    (id: string) => {
      onChange(toggleItem(selectedIds, id));
    },
    [selectedIds, onChange]
  );

  return (
    <>
      <Stack gap={2}>
        {locations.map(
          ({ id, name, description, requiredOrientation }: PublishLocation) => {
            const inputId = `pl_${id}`;
            return (
              <div key={id} className="cursor-pointer select-none">
                <Inline alignY="start" gap={2}>
                  <Input
                    id={inputId}
                    type="checkbox"
                    checked={selectedIds.includes(id)}
                    onChange={() => toggle(id)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <label htmlFor={inputId} className="font-medium">
                      {name}
                    </label>
                    <span className="text-muted-foreground ms-1 text-xs">
                      ({requiredOrientation})
                    </span>
                    {description && (
                      <>
                        <br />
                        <label htmlFor={inputId} className="text-muted-foreground text-sm">
                          {description}
                        </label>
                      </>
                    )}
                  </span>
                </Inline>
              </div>
            );
          }
        )}
      </Stack>

      {showReload && (
        <Button
          type="button"
          onClick={reload}
          variant="outline"
          className="mt-4 rounded-2xl p-2 text-sm shadow"
        >
          {t("actions.refreshList")}
        </Button>
      )}
    </>
  );
}

export default memo(PublishLocationSelectorInner, equal);
