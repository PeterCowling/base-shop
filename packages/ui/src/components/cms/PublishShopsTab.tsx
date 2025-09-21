import { Card, CardContent } from "../atoms/shadcn";
import { Chip } from "../atoms";
import PublishShopsSelector from "./PublishShopsSelector";
import { useMemo } from "react";

interface PublishShopsTabProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PublishShopsTab({
  selectedIds,
  onChange,
}: PublishShopsTabProps) {
  const selectedLabels = useMemo(() => selectedIds, [selectedIds]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <PublishShopsSelector selectedIds={selectedIds} onChange={onChange} showReload />
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
              Select one or more shops to publish this product.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

