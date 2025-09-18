import { Card, CardContent } from "../atoms/shadcn";
import { Chip } from "../atoms";
import PublishLocationSelector from "./PublishLocationSelector";
import type { PublishLocation } from "@acme/types";
import { useMemo } from "react";

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
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((label) => (
                <Chip key={label} className="bg-muted px-3 py-1 text-xs">
                  {label}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select one or more destinations to publish this product.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
