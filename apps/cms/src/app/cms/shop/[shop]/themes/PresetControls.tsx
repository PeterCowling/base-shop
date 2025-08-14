// apps/cms/src/app/cms/shop/[shop]/themes/PresetControls.tsx
"use client";
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
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Preset name"
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
      />
      <Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
        Save Preset
      </Button>
      {isPresetTheme && (
        <Button type="button" onClick={handleDeletePreset}>
          Delete Preset
        </Button>
      )}
    </div>
  );
}
