/* src/hooks/client/till/useDenominationCalculator.ts */

import { useCallback, useMemo, useState } from "react";

import { Denomination } from "../../../types/component/Till";

/**
 * Custom hook for counting currency denominations.
 *
 * - denomCounts: array of counts (index matched to denominations array)
 * - totalDenomValue: sum of (count * value)
 * - handleDenomChange: updates the count for a given index
 */
export function useDenominationCalculator(denominations: Denomination[]) {
  const [denomCounts, setDenomCounts] = useState<number[]>(
    Array(denominations.length).fill(0)
  );

  const totalDenomValue = useMemo(() => {
    return denominations.reduce((acc, denom, idx) => {
      const count = denomCounts[idx] || 0;
      return acc + denom.value * count;
    }, 0);
  }, [denominations, denomCounts]);

  const handleDenomChange = useCallback((idx: number, newVal: string) => {
    // Only allow numeric input
    const safeVal = newVal.replace(/[^0-9]/g, "");
    const parsed = parseInt(safeVal, 10) || 0;
    setDenomCounts((prev) => {
      const copy = [...prev];
      copy[idx] = parsed;
      return copy;
    });
  }, []);

  return {
    denomCounts,
    setDenomCounts,
    totalDenomValue,
    handleDenomChange,
  };
}
