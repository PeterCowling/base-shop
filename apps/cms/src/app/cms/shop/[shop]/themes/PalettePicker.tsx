import { hslToHex, isHex, isHsl } from "@ui/utils/colorUtils";
import { MutableRefObject } from "react";
import ColorInput from "./ColorInput";

interface Props {
  groupedTokens: Record<string, [string, string][]>;
  overrides: Record<string, string>;
  handleOverrideChange: (
    key: string,
    defaultValue: string,
  ) => (value: string) => void;
  handleReset: (key: string) => () => void;
  overrideRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  tokens: Record<string, string>;
  textTokens: string[];
  bgTokens: string[];
  onWarningChange: (token: string, warning: string | null) => void;
  onTokenSelect: (token: string, coords?: { x: number; y: number }) => void;
}

export default function PalettePicker({
  groupedTokens,
  overrides,
  handleOverrideChange,
  handleReset,
  overrideRefs,
  tokens,
  textTokens,
  bgTokens,
  onWarningChange,
  onTokenSelect,
}: Props) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedTokens).map(([groupName, tokenList]) => (
        <fieldset key={groupName} className="space-y-2">
          <legend className="font-semibold">{groupName}</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {tokenList
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
            {tokenList.map(([k, defaultValue]) => {
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
                  tokens={tokens}
                  textTokens={textTokens}
                  bgTokens={bgTokens}
                  onWarningChange={onWarningChange}
                />
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
