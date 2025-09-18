import { useCallback, useRef, useState } from "react";
import type { PricingMatrix } from "@acme/types";

import type { DurationDraft } from "./pricingFormUtils";

interface UseDurationRowsArgs {
  initial: PricingMatrix["durationDiscounts"];
  fieldErrors: Record<string, string>;
}

export function useDurationRows({ initial, fieldErrors }: UseDurationRowsArgs) {
  const counterRef = useRef(initial.length);
  const [rows, setRows] = useState<DurationDraft[]>(() =>
    initial.map((tier, index) => ({
      id: `duration-${index}`,
      minDays: tier.minDays.toString(),
      rate: tier.rate.toString(),
    }))
  );

  const add = useCallback(() => {
    const id = `duration-${counterRef.current++}-${Date.now()}`;
    setRows((prev) => [...prev, { id, minDays: "", rate: "" }]);
  }, []);

  const remove = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const update = useCallback((id: string, updates: Partial<Omit<DurationDraft, "id">>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }, []);

  const hydrate = useCallback((discounts: PricingMatrix["durationDiscounts"]) => {
    counterRef.current = discounts.length;
    const timestamp = Date.now();
    setRows(
      discounts.map((tier, index) => ({
        id: `duration-${index}-${timestamp}`,
        minDays: tier.minDays.toString(),
        rate: tier.rate.toString(),
      }))
    );
  }, []);

  const getErrors = useCallback(
    (id: string) => ({
      minDays: fieldErrors[`duration-${id}-minDays`],
      rate: fieldErrors[`duration-${id}-rate`],
    }),
    [fieldErrors]
  );

  return { rows, add, remove, update, hydrate, getErrors };
}
