"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Button, Input } from "@/components/atoms/shadcn";
import { hslToHex, hexToHsl, isHex, isHsl } from "@ui/utils/colorUtils";
import ColorContrastChecker from "color-contrast-checker";

interface Props {
  name: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  /** Current merged token values (defaults + overrides) */
  tokens: Record<string, string>;
  /** Keys for text/foreground tokens */
  textTokens: string[];
  /** Keys for background tokens */
  bgTokens: string[];
  /** Notify parent of contrast warning updates */
  onWarningChange?: (token: string, warning: string | null) => void;
}

export default function ColorInput({
  name,
  defaultValue,
  value,
  onChange,
  onReset,
  inputRef,
  tokens,
  textTokens,
  bgTokens,
  onWarningChange,
}: Props) {
  const hasOverride = value !== "";
  const isOverridden = hasOverride && value !== defaultValue;
  const defaultIsHsl = isHsl(defaultValue);
  const defaultIsHex = isHex(defaultValue);
  const isColor = defaultIsHsl || defaultIsHex;
  const current = hasOverride ? value : defaultValue;
  const defaultHex = defaultIsHsl ? hslToHex(defaultValue) : defaultValue;
  const colorValue = defaultIsHsl
    ? isHex(current)
      ? current
      : hslToHex(current)
    : current;
  const overrideHex = hasOverride
    ? defaultIsHsl
      ? isHex(value)
        ? value
        : hslToHex(value)
      : value
    : defaultHex;

  const [warning, setWarning] = useState<string | null>(null);

  const checkContrast = (raw: string) => {
    const ccc = new ColorContrastChecker();
    const colorHex = defaultIsHsl ? hslToHex(raw) : raw;
    if (!isHex(colorHex)) return;
    const isTextToken = /text|foreground/i.test(name);
    const isBgToken = /bg|background/i.test(name);
    const compareTokens = isTextToken
      ? bgTokens
      : isBgToken
        ? textTokens
        : [];
    let warn: string | null = null;
    for (const t of compareTokens) {
      const other = tokens[t];
      if (!other) continue;
      const otherHex = isHsl(other) ? hslToHex(other) : other;
      if (!isHex(otherHex)) continue;
      const ratio = ccc.getContrastRatio(colorHex, otherHex);
      if (ratio < 4.5) {
        warn = `${name} on ${t} contrast ${ratio.toFixed(2)}:1`;
        break;
      }
    }
    setWarning(warn);
    onWarningChange?.(name, warn);
  };

  useEffect(() => {
    checkContrast(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, tokens]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const converted = defaultIsHsl ? hexToHsl(raw) : raw;
    onChange(converted === defaultValue ? "" : converted);
    checkContrast(converted);
  };

  return (
    <label
      data-token-key={name}
      className={`flex flex-col gap-1 ${isOverridden ? "bg-warning/10" : ""}`}
    >
      <span className="flex items-center gap-2">
        {name}
        {warning && (
          <span className="rounded bg-warning/20 px-1 text-xs text-warning-foreground">
            {warning}
          </span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Input value={defaultValue} disabled />
        {isColor ? (
          <>
            <input
              type="color"
              value={colorValue}
              onChange={handleChange}
              ref={inputRef}
              className={isOverridden ? "bg-warning/20" : ""}
            />
            <div className="flex items-center gap-1">
              <span
                className="h-6 w-6 rounded border"
                title="Default"
                style={{ background: defaultHex }}
              />
              <span
                className="h-6 w-6 rounded border"
                title={hasOverride ? "Custom" : "Default"}
                style={{ background: overrideHex }}
              />
            </div>
          </>
        ) : (
          <Input
            placeholder={defaultValue}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            ref={inputRef}
            className={isOverridden ? "bg-warning/20" : ""}
          />
        )}
        {hasOverride && (
          <Button type="button" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </label>
  );
}
