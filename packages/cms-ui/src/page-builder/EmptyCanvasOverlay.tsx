"use client";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Button } from "@acme/design-system/shadcn";

// i18n-exempt — Editor-only helper overlay; copy is minimal and non-user facing
/* i18n-exempt */
const t = (s: string) => s;

interface Props {
  onAddSection: () => void;
  onOpenPalette: () => void;
  onOpenPresets?: () => void;
}

export default function EmptyCanvasOverlay({ onAddSection, onOpenPalette, onOpenPresets }: Props) {
  return (
    <div className="relative w-full h-full">
      <Cluster
        alignY="center"
        justify="center"
        className="pointer-events-none absolute inset-0"
      >
        <div className="pointer-events-auto w-full sm:w-96 rounded border bg-surface-1/95 p-4 text-center shadow">
          <div className="mb-2 text-base font-semibold">{t("Start by adding a Section")}</div>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("Drag from the palette, or use the quick actions below to get going.")}
          </p>
          <Cluster justify="center" wrap className="gap-2">
            <Button type="button" onClick={onAddSection}>{t("Add Section")}</Button>
            <Button type="button" variant="outline" onClick={onOpenPalette}>{t("Open Palette")}</Button>
            {onOpenPresets && (
              <Button type="button" variant="outline" onClick={onOpenPresets}>{t("Section Library")}</Button>
            )}
          </Cluster>
          <div className="mt-3 text-xs text-muted-foreground">
            {t('Tip: Press "/" or ⌘/Ctrl+K to insert anything')}
          </div>
        </div>
      </Cluster>
    </div>
  );
}
