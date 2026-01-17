// apps/cms/src/app/cms/shop/[shop]/themes/ThemePreview.tsx
"use client";
import { useState } from "react";
import InlineColorPicker from "./InlineColorPicker";
import WizardPreview from "../../../wizard/WizardPreview";
import TokenInspector from "../../../wizard/TokenInspector";
import PreviewDeviceSelector from "../../../wizard/PreviewDeviceSelector";
import { devicePresets, type DevicePreset } from "@acme/ui/utils/devicePresets";
import type { CSSProperties } from "react";

interface Picker {
  token: string;
  x: number;
  y: number;
  defaultValue: string;
}

interface Props {
  overrides: Record<string, string>;
  onChange: (token: string, defaultValue: string) => (value: string) => void;
  previewTokens: Record<string, string>;
  /** Default theme values so we can determine the original token format */
  themeDefaults: Record<string, string>;
  /** Optional callback to focus a token's input in the editor */
  onTokenSelect?: (token: string) => void;
}

export default function ThemePreview({
  overrides,
  onChange,
  previewTokens,
  themeDefaults,
  onTokenSelect,
}: Props) {
  const [picker, setPicker] = useState<Picker | null>(null);
  const [device, setDevice] = useState<DevicePreset>(devicePresets[0]);

  const handleTokenClick = (
    token: string,
    coords: { x: number; y: number } | DOMRect,
  ) => {
    const defaultValue = themeDefaults[token];
    if (!defaultValue) return;

    let x: number;
    let y: number;

    if ("width" in coords) {
      x = coords.left + coords.width / 2;
      y = coords.top + coords.height;
    } else {
      x = coords.x;
      y = coords.y;
    }

    setPicker({ token, x, y, defaultValue });
    onTokenSelect?.(token);
  };

  const handlePickerClose = () => setPicker(null);

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
          onClose={handlePickerClose}
        />
      )}
      <PreviewDeviceSelector onChange={setDevice} />
      <TokenInspector inspectMode onTokenSelect={handleTokenClick}>
        <WizardPreview
          style={previewTokens as CSSProperties}
          device={device}
        />
      </TokenInspector>
    </>
  );
}
