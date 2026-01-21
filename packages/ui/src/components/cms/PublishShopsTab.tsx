import { useMemo } from "react";

import { useTranslations } from "@acme/i18n";

import { Chip } from "../atoms";
import { Inline } from "../atoms/primitives/Inline";
import { Card, CardContent } from "../atoms/shadcn";

import PublishShopsSelector from "./PublishShopsSelector";

interface PublishShopsTabProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PublishShopsTab({
  selectedIds,
  onChange,
}: PublishShopsTabProps) {
  const t = useTranslations();
  const selectedLabels = useMemo(() => selectedIds, [selectedIds]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <PublishShopsSelector selectedIds={selectedIds} onChange={onChange} showReload />
          {selectedIds.length > 0 ? (
            <Inline gap={2} wrap>
              {selectedLabels.map((label) => (
                <Chip key={label} className="bg-muted px-3 py-1 text-xs">
                  {label}
                </Chip>
              ))}
            </Inline>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Select one or more shops to publish this product.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
