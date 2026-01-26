"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import clsx from "clsx";

import { Inline, Stack } from "@/components/ui/flex";

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
};

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength,
  showCount,
  disabled,
}: TextInputProps) {
  const charCount = value.length;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <Stack className="gap-1.5">
      <Inline className="justify-between">
        <label className="text-xs font-medium text-brand-text/80">{label}</label>
        {showCount && maxLength && (
          <span
            className={clsx(
              "text-xs",
              isOverLimit ? "text-brand-terra" : "text-brand-text/50",
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </Inline>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border bg-brand-bg px-3 py-2 text-sm text-brand-heading",
          "focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/50",
          isOverLimit ? "border-brand-terra/50" : "border-brand-outline/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
      {hint && <p className="text-xs text-brand-text/50">{hint}</p>}
    </Stack>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
  disabled?: boolean;
  className?: string;
};

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength,
  showCount,
  rows = 4,
  disabled,
  className,
}: TextAreaProps) {
  const charCount = value.length;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <Stack className="gap-1.5">
      <Inline className="justify-between">
        <label className="text-xs font-medium text-brand-text/80">{label}</label>
        {showCount && maxLength && (
          <span
            className={clsx(
              "text-xs",
              isOverLimit ? "text-brand-terra" : "text-brand-text/50",
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </Inline>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={clsx(
          "w-full rounded-md border bg-brand-bg px-3 py-2 text-sm text-brand-heading",
          "focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/50",
          "resize-y",
          isOverLimit ? "border-brand-terra/50" : "border-brand-outline/40",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      />
      {hint && <p className="text-xs text-brand-text/50">{hint}</p>}
    </Stack>
  );
}
