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

/**
 * Renders a label, splitting a trailing " (English)" parenthetical onto its own line.
 * The split is applied after hydration to avoid SSR/client locale mismatch errors —
 * the locale is localStorage-based so the server always renders the fallback (EN) label
 * while the client may render a ZH label with a parenthetical suffix.
 */
function LabelText({ label }: { label: string }) {
  const [parts, setParts] = React.useState<{ main: string; sub: string } | null>(null);
  React.useEffect(() => {
    const match = label.match(/^(.*?)\s+\(([^)]+)\)$/);
    setParts(match ? { main: match[1], sub: match[2] } : null);
  }, [label]);

  if (!parts) return <span className="leading-snug">{label}</span>;
  return (
    <span className="leading-snug">
      {parts.main}
      <span className="block text-gate-muted">{parts.sub}</span>
    </span>
  );
}

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
              <LabelText label={getLabel ? getLabel(opt) : opt} />
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
