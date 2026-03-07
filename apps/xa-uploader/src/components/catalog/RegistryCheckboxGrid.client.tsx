"use client";

import * as React from "react";

import { CHECKBOX_CLASS, INPUT_CLASS } from "./catalogStyles";

type Props = {
  label: string;
  options: string[];
  selected: string[];
  customPlaceholder?: string;
  fieldError?: string;
  testId?: string;
  /** Optional display label for an option value. Defaults to the value itself. */
  getLabel?: (value: string) => string;
  onChange: (next: string[]) => void;
};

export function RegistryCheckboxGrid({
  label,
  options,
  selected,
  customPlaceholder,
  fieldError,
  testId,
  getLabel,
  onChange,
}: Props) {
  const registrySet = React.useMemo(() => new Set(options), [options]);
  const registrySelected = selected.filter((v) => registrySet.has(v));
  const customValues = selected.filter((v) => !registrySet.has(v));
  const customText = customValues.join(", ");

  const toggle = React.useCallback(
    (value: string) => {
      const next = registrySelected.includes(value)
        ? registrySelected.filter((v) => v !== value)
        : [...registrySelected, value];
      onChange([...next, ...customValues]);
    },
    [registrySelected, customValues, onChange],
  );

  const handleCustomChange = React.useCallback(
    (text: string) => {
      const customs = text
        .split(/[|,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      onChange([...registrySelected, ...customs]);
    },
    [registrySelected, onChange],
  );

  return (
    <fieldset data-testid={testId}>
      <legend className="text-xs uppercase tracking-label text-gate-muted">{label}</legend>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox grid */}
      <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {options.map((opt) => {
          const isSelected = registrySelected.includes(opt);
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                isSelected
                  ? "border-gate-accent bg-gate-accent-soft text-gate-ink"
                  : "border-gate-border bg-gate-input text-gate-ink hover:border-gate-accent hover:bg-gate-accent-soft"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(opt)}
                className={`mt-0.5 shrink-0 ${CHECKBOX_CLASS}`}
              />
              <span className="leading-snug">{getLabel ? getLabel(opt) : opt}</span>
            </label>
          );
        })}
      </div>
      {customPlaceholder ? (
        <input
          value={customText}
          onChange={(event) => handleCustomChange(event.target.value)}
          placeholder={customPlaceholder}
          className={INPUT_CLASS}
          data-testid={testId ? `${testId}-custom` : undefined}
        />
      ) : null}
      {fieldError ? <div className="mt-1 text-xs text-danger-fg">{fieldError}</div> : null}
    </fieldset>
  );
}
