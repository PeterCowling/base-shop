// apps/cms/src/app/cms/shop/[shop]/themes/PresetControls.tsx
"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import type { ChangeEvent } from "react";
import { Inline } from "@ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";

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
  return (
    <Inline alignY="center" gap={2}>
      <Input
        placeholder={t("cms.themes.presetNamePlaceholder") as string}
        value={presetName}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPresetName(e.target.value)}
      />
      <Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
        {t("cms.themes.savePreset")}
      </Button>
      {isPresetTheme && (
        <Button type="button" onClick={handleDeletePreset}>
          {t("cms.themes.deletePreset")}
        </Button>
      )}
    </Inline>
  );
}
