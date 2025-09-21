// apps/cms/src/app/cms/shop/[shop]/themes/OverrideField.tsx
"use client";
import ColorInput from "./ColorInput";

interface Props {
  name: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
  tokens: Record<string, string>;
  textTokens: string[];
  bgTokens: string[];
  onWarningChange: (token: string, warning: string | null) => void;
  isSelected?: boolean;
}

export default function OverrideField({
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
  isSelected = false,
}: Props) {
  return (
    <div className={isSelected ? "ring-2 ring-primary rounded-md p-1" : ""}>
      <ColorInput
        key={name}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onReset={onReset}
        inputRef={inputRef}
        tokens={tokens}
        textTokens={textTokens}
        bgTokens={bgTokens}
        onWarningChange={onWarningChange}
      />
    </div>
  );
}
