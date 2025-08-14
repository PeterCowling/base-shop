// apps/cms/src/app/cms/shop/[shop]/themes/ThemePreview.tsx
"use client";
import InlineColorPicker from "./InlineColorPicker";
import WizardPreview from "../../../wizard/WizardPreview";
import type { CSSProperties } from "react";

interface Picker {
  token: string;
  x: number;
  y: number;
  defaultValue: string;
}

interface Props {
  picker: Picker | null;
  overrides: Record<string, string>;
  onChange: (token: string, defaultValue: string) => (value: string) => void;
  onPickerClose: () => void;
  previewTokens: Record<string, string>;
  onTokenSelect: (token: string, coords?: { x: number; y: number }) => void;
}

export default function ThemePreview({
  picker,
  overrides,
  onChange,
  onPickerClose,
  previewTokens,
  onTokenSelect,
}: Props) {
  return (
    <>
      {picker && (
        <InlineColorPicker
          token={picker.token}
          defaultValue={picker.defaultValue}
          value={overrides[picker.token] || picker.defaultValue}
          x={picker.x}
          y={picker.y}
          onChange={onChange(picker.token, picker.defaultValue)}
          onClose={onPickerClose}
        />
      )}
      <WizardPreview
        style={previewTokens as CSSProperties}
        inspectMode
        onTokenSelect={onTokenSelect}
      />
    </>
  );
}
