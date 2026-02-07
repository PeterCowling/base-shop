// packages/ui/src/components/cms/page-builder/CanvasControlsMenu.tsx
"use client";

import { useTranslations } from "@acme/i18n";

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";

import GridSettings from "./GridSettings";

interface Props {
  gridProps: React.ComponentProps<typeof GridSettings>;
}

// Compact menu wrapper that tucks the verbose GridSettings into a popover.
export default function CanvasControlsMenu({ gridProps }: Props) {
  const t = useTranslations();
  return (
    <Popover>
      <Tooltip text={t("Canvas settings") as string}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={t("Canvas settings") as string}>
            {t("Canvas")}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent>
        <div className="space-y-3">
          <div className="text-sm font-medium">{t("Canvas")}</div>
          <GridSettings {...gridProps} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
