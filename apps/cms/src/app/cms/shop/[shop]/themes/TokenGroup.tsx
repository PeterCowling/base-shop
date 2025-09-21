// apps/cms/src/app/cms/shop/[shop]/themes/TokenGroup.tsx
"use client";
import { hslToHex, isHex, isHsl } from "@ui/utils/colorUtils";
import OverrideField from "./OverrideField";
import type { MutableRefObject } from "react";

interface Props {
  name: string;
  tokens: [string, string][];
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
  selectedToken: string | null;
}

export default function TokenGroup({
  name,
  tokens,
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
  selectedToken,
}: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex flex-wrap items-center justify-between gap-2 font-semibold">
        {name}
        <button
          type="button"
          className="shrink-0 text-sm underline"
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
                className={`h-6 w-6 overflow-hidden rounded border p-0 ${
                  hasOverride ? "ring-2 ring-amber-400" : ""
                } ${selectedToken === k ? "ring-2 ring-blue-500" : ""}`}
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
          const hasOverride = Object.prototype.hasOwnProperty.call(overrides, k);
          const overrideValue = hasOverride ? overrides[k] : "";
          return (
            <OverrideField
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
              isSelected={selectedToken === k}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
