import { memo, useEffect, useState } from "react";

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
              className="block text-xs font-medium mb-1 text-center dark:text-darkAccentGreen"
            >
              {denom.label}
            </label>
            <input
              id={`${idPrefix}${idx}`}
              type="text"
              className={`border ${borderClass} rounded p-1 text-sm w-[130px] text-center dark:bg-darkBg dark:text-darkAccentGreen`}
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
            <span className="text-sm block mt-1 text-center dark:text-darkAccentGreen">
              €{lineTotal.toFixed(2)}
            </span>
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
        Sort notes and coins, then enter counts. Use a dedicated,
        distraction-free area for counting.
      </p>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mt-12 mb-4 dark:text-darkAccentGreen">Coins</h3>
        <div className="flex flex-nowrap gap-6 overflow-x-auto">
          {renderRows(coinIndices)}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mt-12 mb-4 dark:text-darkAccentGreen">Notes</h3>
        <div className="flex flex-nowrap gap-4 overflow-x-auto">
          {renderRows(noteIndices)}
        </div>
      </div>
    </>
  );
});

export default DenominationInput;
