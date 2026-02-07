import { useMemo } from "react";

import { useTranslations } from "@acme/i18n";
import type { PublishLocation } from "@acme/types";

import { Chip } from "../atoms";
import { Inline } from "../atoms/primitives/Inline";
import { Card, CardContent } from "../atoms/shadcn";

import PublishLocationSelector from "./PublishLocationSelector";

interface PublishLocationsTabProps {
  selectedIds: string[];
  locations: PublishLocation[];
  onChange: (ids: string[]) => void;
}

export default function PublishLocationsTab({
  selectedIds,
  locations,
  onChange,
}: PublishLocationsTabProps) {
  const t = useTranslations();
  const selectedLabels = useMemo(
    () =>
      selectedIds.map(
        (id) => locations.find((location) => location.id === id)?.name ?? id,
      ),
    [selectedIds, locations],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <PublishLocationSelector
            selectedIds={selectedIds}
            onChange={onChange}
            showReload
          />
          {selectedIds.length > 0 ? (
            <Inline className="gap-2" wrap>
              {selectedLabels.map((label) => (
                <Chip key={label} className="bg-muted px-3 py-1 text-xs">
                  {label}
                </Chip>
              ))}
            </Inline>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("products.selectPublishDestinations")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
