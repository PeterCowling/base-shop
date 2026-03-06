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
  onChange: (next: string[]) => void;
};

export function RegistryCheckboxGrid({
  label,
  options,
  selected,
  customPlaceholder,
  fieldError,
  testId,
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
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3 lg:grid-cols-4">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-gate-ink cursor-pointer">
            <input
              type="checkbox"
              checked={registrySelected.includes(opt)}
              onChange={() => toggle(opt)}
              className={CHECKBOX_CLASS}
            />
            {opt}
          </label>
        ))}
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
