"use client";

import { Tooltip } from "@/components/atoms";
import { Input } from "@/components/atoms/shadcn";

import type { SeoData } from "./useSeoEditor";

interface SeoAdvancedSettingsProps {
  open: boolean;
  onToggle(): void;
  draft: SeoData;
  updateField(field: keyof SeoData, value: string): void;
}

export function SeoAdvancedSettings({
  open,
  onToggle,
  draft,
  updateField,
}: SeoAdvancedSettingsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="text-sm font-medium text-link"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? "Hide advanced settings" : "Show advanced settings"}
      </button>
      {open && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              Canonical Base
              <Tooltip text="Base URL used to build canonical links.">?</Tooltip>
            </span>
            <Input
              value={draft.canonicalBase}
              onChange={(event) => updateField("canonicalBase", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Open Graph URL</span>
            <Input
              value={draft.ogUrl}
              onChange={(event) => updateField("ogUrl", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Twitter Card</span>
            <Input
              value={draft.twitterCard}
              onChange={(event) => updateField("twitterCard", event.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
