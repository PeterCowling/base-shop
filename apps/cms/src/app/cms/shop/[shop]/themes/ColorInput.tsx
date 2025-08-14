"use client";

import { ChangeEvent } from "react";
import { Button, Input } from "@/components/atoms/shadcn";
import { hslToHex, hexToHsl, isHex, isHsl } from "@ui/utils/colorUtils";

interface Props {
  name: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export default function ColorInput({
  name,
  defaultValue,
  value,
  onChange,
  onReset,
  inputRef,
}: Props) {
  const hasOverride = value !== "";
  const isOverridden = hasOverride && value !== defaultValue;
  const defaultIsHsl = isHsl(defaultValue);
  const defaultIsHex = isHex(defaultValue);
  const isColor = defaultIsHsl || defaultIsHex;
  const current = hasOverride ? value : defaultValue;
  const colorValue = defaultIsHsl
    ? isHex(current)
      ? current
      : hslToHex(current)
    : current;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const converted = defaultIsHsl ? hexToHsl(raw) : raw;
    onChange(converted === defaultValue ? "" : converted);
  };

  return (
    <label
      data-token-key={name}
      className={`flex flex-col gap-1 ${isOverridden ? "bg-amber-50" : ""}`}
    >
      <span>{name}</span>
      <div className="flex items-center gap-2">
        <Input value={defaultValue} disabled />
        {isColor ? (
          <>
            <input
              type="color"
              value={colorValue}
              onChange={handleChange}
              ref={inputRef}
              className={isOverridden ? "bg-amber-100" : ""}
            />
            <span className="h-6 w-6 rounded border" style={{ background: colorValue }} />
          </>
        ) : (
          <Input
            placeholder={defaultValue}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            ref={inputRef}
            className={isOverridden ? "bg-amber-100" : ""}
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
