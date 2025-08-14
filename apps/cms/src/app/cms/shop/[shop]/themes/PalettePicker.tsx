// apps/cms/src/app/cms/shop/[shop]/themes/PalettePicker.tsx
"use client";
import { hslToHex, isHex, isHsl } from "@ui/utils/colorUtils";
import ColorInput from "./ColorInput";
import type { MutableRefObject } from "react";

interface Props {
  groupedTokens: Record<string, [string, string][]>;
  overrides: Record<string, string>;
  handleOverrideChange: (
    key: string,
    defaultValue: string,
  ) => (value: string) => void;
  handleReset: (key: string) => () => void;
  handleGroupReset: (keys: string[]) => () => void;
  overrideRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  mergedTokens: Record<string, string>;
  textTokenKeys: string[];
  bgTokenKeys: string[];
  handleWarningChange: (token: string, warning: string | null) => void;
  onTokenSelect: (token: string) => void;
}

export default function PalettePicker({
  groupedTokens,
  overrides,
  handleOverrideChange,
  handleReset,
  handleGroupReset,
  overrideRefs,
  mergedTokens,
  textTokenKeys,
  bgTokenKeys,
  handleWarningChange,
  onTokenSelect,
}: Props) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedTokens).map(([groupName, tokens]) => (
        <fieldset key={groupName} className="space-y-2">
          <legend className="flex items-center justify-between font-semibold">
            {groupName}
            <button
              type="button"
              className="text-sm underline"
              onClick={handleGroupReset(tokens.map(([k]) => k))}
            >
              Reset
            </button>
          </legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {tokens
              .filter(([, v]) => isHex(v) || isHsl(v))
              .map(([k, defaultValue]) => {
                const hasOverride = Object.prototype.hasOwnProperty.call(
                  overrides,
                  k,
                );
                const current = hasOverride ? overrides[k] : defaultValue;
                const defaultHex = isHsl(defaultValue)
                  ? hslToHex(defaultValue)
                  : defaultValue;
                const currentHex = isHsl(defaultValue)
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
                    className="h-6 w-6 overflow-hidden rounded border p-0"
                    onClick={() => onTokenSelect(k)}
                  >
                    {hasOverride ? (
                      <span className="flex h-full w-full">
                        <span
                          className="h-full w-1/2"
                          style={{ background: defaultHex }}
                          title="Default"
                        />
                        <span
                          className="h-full w-1/2"
                          style={{ background: currentHex }}
                          title="Custom"
                        />
                      </span>
                    ) : (
                      <span
                        className="block h-full w-full"
                        style={{ background: defaultHex }}
                      />
                    )}
                  </button>
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
  );
}
