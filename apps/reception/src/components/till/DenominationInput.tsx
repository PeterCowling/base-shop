import { memo, useEffect, useState } from "react";

import { Input } from "@acme/design-system";
import { Inline } from "@acme/design-system/primitives";

import { type Denomination, DENOMINATIONS } from "../../types/component/Till";

export interface DenominationInputProps {
  denomCounts: number[];
  handleChange: (idx: number, value: string) => void;
  idPrefix: string; // e.g. "denomOpen_" or "denomClose_"
  denominations?: Denomination[];
}

/**
 * Renders input fields for counting currency denominations.
 * Shows separate tables for coins and notes.
 */
export const DenominationInput = memo(function DenominationInput({
  denomCounts,
  handleChange,
  idPrefix,
  denominations = DENOMINATIONS,
}: DenominationInputProps) {
  const [localValues, setLocalValues] = useState<string[]>(() =>
    denomCounts.map((c) => (c === 0 ? "" : String(c)))
  );

  useEffect(() => {
    setLocalValues(denomCounts.map((c) => (c === 0 ? "" : String(c))));
  }, [denomCounts]);
  const coinIndices = denominations
    .map((_, i) => i)
    .filter((i) => denominations[i].value <= 2);
  const noteIndices = denominations
    .map((_, i) => i)
    .filter((i) => denominations[i].value > 2);

  const borderClass = idPrefix.startsWith("denomOpen_")
    ? "border-info-light"
    : "border-error-light";

  const renderRows = (indices: number[]) => (
    <>
      {indices.map((idx) => {
        const denom = denominations[idx];
        const count = denomCounts[idx] || 0;
        const lineTotal = denom.value * count;
        return (
          <div key={denom.label} className="p-1 flex-none">
            <label
              htmlFor={`${idPrefix}${idx}`}
              className="block text-xs font-medium mb-1 text-center"
            >
              {denom.label}
            </label>
            <Input
              compatibilityMode="no-wrapper"
              id={`${idPrefix}${idx}`}
              type="text"
              className={`border ${borderClass} rounded p-1 text-sm w-[130px] text-center`}
              value={localValues[idx]}
              onChange={(e) => {
                const val = e.target.value;
                setLocalValues((prev) => {
                  const copy = [...prev];
                  copy[idx] = val;
                  return copy;
                });
                handleChange(idx, val);
              }}
            />
            <span className="text-sm block mt-1 text-center">
              €{lineTotal.toFixed(2)}
            </span>
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Sort notes and coins, then enter counts. Use a dedicated,
        distraction-free area for counting.
      </p>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mt-12 mb-4">Coins</h3>
        <Inline wrap={false} gap={6} className="overflow-x-auto">
          {renderRows(coinIndices)}
        </Inline>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mt-12 mb-4">Notes</h3>
        <Inline wrap={false} gap={4} className="overflow-x-auto">
          {renderRows(noteIndices)}
        </Inline>
      </div>
    </>
  );
});

export default DenominationInput;
