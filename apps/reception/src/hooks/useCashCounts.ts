import { useCallback } from "react";

import type { FloatEntry } from "../types/finance";

import { useCashCountsData } from "./data/useCashCountsData";
import { useCashCountsMutations } from "./mutations/useCashCountsMutations";

export function useCashCounts() {
  const { cashCounts, loading, error } = useCashCountsData();
  const { addCashCount, addFloatEntry } = useCashCountsMutations();

  const floatEntries: FloatEntry[] = (cashCounts || [])
    .filter((c) => c.type === "float")
    .map((c) => ({
      amount: c.amount || 0,
      userId: c.user,
      createdAt: c.timestamp,
    }));

  const recordFloatEntry = useCallback(
    (amount: number) => addFloatEntry(amount),
    [addFloatEntry]
  );

  return {
    cashCounts,
    floatEntries,
    loading,
    error,
    addCashCount,
    recordFloatEntry,
  };
}
