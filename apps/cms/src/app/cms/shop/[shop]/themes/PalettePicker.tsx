"use client";

import ColorInput from "./ColorInput";
import InlineColorPicker from "./InlineColorPicker";
import { hslToHex, isHex, isHsl } from "@ui/utils/colorUtils";
import type { MutableRefObject } from "react";

interface PickerState {
  token: string;
  x: number;
  y: number;
  defaultValue: string;
}

interface Props {
  groupedTokens: Record<string, [string, string][]>;
  overrides: Record<string, string>;
  mergedTokens: Record<string, string>;
  handleOverrideChange: (
    key: string,
    defaultValue: string,
  ) => (value: string) => void;
  handleReset: (key: string) => () => void;
  overrideRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  textTokenKeys: string[];
  bgTokenKeys: string[];
  handleWarningChange: (token: string, warning: string | null) => void;
  handleTokenSelect: (token: string, coords?: { x: number; y: number }) => void;
  picker: PickerState | null;
  handlePickerClose: () => void;
}

export default function PalettePicker({
  groupedTokens,
  overrides,
  mergedTokens,
  handleOverrideChange,
  handleReset,
  overrideRefs,
  textTokenKeys,
  bgTokenKeys,
  handleWarningChange,
  handleTokenSelect,
  picker,
  handlePickerClose,
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
          onChange={handleOverrideChange(picker.token, picker.defaultValue)}
          onClose={handlePickerClose}
        />
      )}
      <div className="space-y-6">
        {Object.entries(groupedTokens).map(([groupName, tokens]) => (
          <fieldset key={groupName} className="space-y-2">
            <legend className="font-semibold">{groupName}</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {tokens
                .filter(([, v]) => isHex(v) || isHsl(v))
                .map(([k, defaultValue]) => {
                  const current = overrides[k] || defaultValue;
                  const colorValue = isHsl(defaultValue)
                    ? isHex(current)
                      ? current
                      : hslToHex(current)
                    : current;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-label={k}
                      title={k}
                      className="h-6 w-6 rounded border"
                      style={{ background: colorValue }}
                      onClick={() => handleTokenSelect(k)}
                    />
                  );
                })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {tokens.map(([k, defaultValue]) => {
                const hasOverride = Object.prototype.hasOwnProperty.call(
                  overrides,
                  k,
                );
                const overrideValue = hasOverride ? overrides[k] : "";
                return (
                  <ColorInput
                    key={k}
                    name={k}
                    defaultValue={defaultValue}
                    value={overrideValue}
                    onChange={handleOverrideChange(k, defaultValue)}
                    onReset={handleReset(k)}
                    inputRef={(el) => (overrideRefs.current[k] = el)}
                    tokens={mergedTokens}
                    textTokens={textTokenKeys}
                    bgTokens={bgTokenKeys}
                    onWarningChange={handleWarningChange}
                  />
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </>
  );
}
