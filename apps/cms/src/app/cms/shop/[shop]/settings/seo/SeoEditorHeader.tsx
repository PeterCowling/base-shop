"use client";

import { Tooltip } from "@/components/atoms";

interface SeoEditorHeaderProps {
  freeze: boolean;
  onFreezeChange(checked: boolean): void | Promise<void>;
}

export function SeoEditorHeader({ freeze, onFreezeChange }: SeoEditorHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold">SEO metadata</h3>
        <p className="text-muted-foreground text-sm">
          Manage localized titles, descriptions, and social previews.
        </p>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={freeze}
          onChange={(event) => {
            void onFreezeChange(event.target.checked);
          }}
        />
        <span>Freeze translations</span>
        <Tooltip text="Apply the same metadata across all locales.">?</Tooltip>
      </label>
    </div>
  );
}
