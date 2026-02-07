import { memo, useCallback, useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { DISCREPANCY_LIMIT } from "../../constants/cash";
import { useDenominationCalculator } from "../../hooks/client/till/useDenominationCalculator";
import { type Denomination, DENOMINATIONS } from "../../types/component/Till";
import { DenominationInput } from "../till/DenominationInput";

import { DifferenceBadge } from "./DifferenceBadge";

export interface CashCountingFormProps {
  idPrefix: string;
  title: string;
  borderClass: string;
  textClass: string;
  confirmClass: string;
  confirmLabel: string;
  onConfirm: (
    cash: number,
    keycards: number,
    breakdown: Record<string, number>
  ) => void;
  onCancel: () => void;
  hideCancel?: boolean;
  hideConfirm?: boolean;
  expectedCash?: number;
  expectedKeycards?: number;
  showExpected?: boolean;
  showKeycards?: boolean;
  keycardLabel?: string;
  denominations?: Denomination[];
  onChange?: (
    cash: number,
    keycards: number,
    breakdown: Record<string, number>
  ) => void;
  children?: React.ReactNode;
  submitRef?: React.MutableRefObject<(() => void) | undefined>;
}

export const CashCountingForm = memo(function CashCountingForm({
  idPrefix,
  title,
  borderClass,
  textClass,
  confirmClass,
  confirmLabel,
  onConfirm,
  onCancel,
  hideCancel,
  hideConfirm,
  expectedCash,
  expectedKeycards,
  showExpected = true,
  showKeycards = false,
  keycardLabel = "Keycards Counted",
  denominations = DENOMINATIONS,
  onChange,
  children,
  submitRef,
}: CashCountingFormProps) {
  const { denomCounts, totalDenomValue, handleDenomChange } =
    useDenominationCalculator(denominations);

  const [keycardInput, setKeycardInput] = useState<string>("0");

  const buildBreakdown = useCallback(() => {
    const map: Record<string, number> = {};
    denominations.forEach((d, idx) => {
      const c = denomCounts[idx] || 0;
      if (c > 0) map[d.value.toString()] = c;
    });
    return map;
  }, [denominations, denomCounts]);

  useEffect(() => {
    onChange?.(
      totalDenomValue,
      parseInt(keycardInput || "0", 10),
      buildBreakdown()
    );
  }, [totalDenomValue, keycardInput, onChange, buildBreakdown]);

  const diffCash =
    expectedCash !== undefined ? totalDenomValue - expectedCash : undefined;
  const diffKeycards =
    expectedKeycards !== undefined
      ? parseInt(keycardInput || "0", 10) - expectedKeycards
      : undefined;

  const handleSubmit = useCallback(() => {
    const cards = parseInt(keycardInput || "0", 10);
    onConfirm(totalDenomValue, cards, buildBreakdown());
  }, [keycardInput, buildBreakdown, onConfirm, totalDenomValue]);

  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit;
    }
  }, [submitRef, handleSubmit]);

  return (
    <div className={`mb-6 border ${borderClass} rounded p-4 dark:bg-darkSurface dark:text-darkAccentGreen`}>
      <div className="flex justify-between items-center mb-2 dark:bg-darkSurface">
        <h2 className="text-xl font-semibold dark:text-darkAccentGreen">{title}</h2>
      </div>
      <DenominationInput
        denomCounts={denomCounts}
        handleChange={handleDenomChange}
        idPrefix={idPrefix}
        denominations={denominations}
      />
      {showKeycards && (
        <div className="mt-4 flex items-center gap-2">
          <label
            htmlFor={`${idPrefix}keycards`}
            className="font-semibold text-sm dark:text-darkAccentGreen"
          >
            {keycardLabel}
          </label>
          <input
            id={`${idPrefix}keycards`}
            type="number"
            value={keycardInput}
            onChange={(e) => setKeycardInput(e.target.value)}
            className="border rounded p-1 w-24 dark:bg-darkBg dark:text-darkAccentGreen"
          />
        </div>
      )}
      {children}
      {showExpected && expectedCash !== undefined && (
        <div
          className={`flex flex-col items-end mt-6 text-sm ${textClass} text-right dark:text-darkAccentGreen`}
        >
          <strong className="mb-2">Total: €{totalDenomValue.toFixed(2)}</strong>
          <div className="mb-2">Expected cash: €{expectedCash.toFixed(2)}</div>
          {expectedKeycards !== undefined && (
            <div className="mb-2">Expected keycards: {expectedKeycards}</div>
          )}
          <div className="flex items-center justify-end gap-1">
            {diffCash !== undefined && <DifferenceBadge value={diffCash} />}
            {diffKeycards !== undefined && (
              <DifferenceBadge value={diffKeycards} />
            )}
            {diffCash !== undefined &&
              Math.abs(diffCash) >= DISCREPANCY_LIMIT && (
                <ExclamationTriangleIcon
                  className="h-4 w-4 text-warning-main"
                  aria-hidden="true"
                />
              )}
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        {!hideCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-info-main text-white rounded hover:bg-info-dark dark:bg-darkSurface dark:text-darkAccentOrange"
          >
            Cancel
          </button>
        )}
        {!hideConfirm && (
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 ${confirmClass} dark:bg-darkAccentGreen`}
          >
            {confirmLabel}
          </button>
        )}
      </div>
    </div>
  );
});

export default CashCountingForm;
