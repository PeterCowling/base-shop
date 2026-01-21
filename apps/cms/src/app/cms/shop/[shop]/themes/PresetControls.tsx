// apps/cms/src/app/cms/shop/[shop]/themes/PresetControls.tsx
"use client";
import type { ChangeEvent } from "react";

import { useTranslations } from "@acme/i18n";
import { Inline } from "@acme/ui/components/atoms/primitives";

import { Button, Input } from "@/components/atoms/shadcn";

interface Props {
  presetName: string;
  setPresetName: (name: string) => void;
  handleSavePreset: () => void;
  handleDeletePreset: () => void;
  isPresetTheme: boolean;
}

export default function PresetControls({
  presetName,
  setPresetName,
  handleSavePreset,
  handleDeletePreset,
  isPresetTheme,
}: Props) {
  const t = useTranslations();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    if (typeof value === "string" && value !== key) {
      return value;
    }
    return fallback;
  };
  const presetPlaceholder = translate("cms.themes.presetNamePlaceholder", "Preset name");
  const saveLabel = translate("cms.themes.savePreset", "Save Preset");
  const deleteLabel = translate("cms.themes.deletePreset", "Delete Preset");
  return (
    <Inline alignY="center" gap={2}>
      <Input
        placeholder={presetPlaceholder}
        value={presetName}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPresetName(e.target.value)}
      />
      <Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
        {saveLabel}
      </Button>
      {isPresetTheme && (
        <Button type="button" onClick={handleDeletePreset}>
          {deleteLabel}
        </Button>
      )}
    </Inline>
  );
}
