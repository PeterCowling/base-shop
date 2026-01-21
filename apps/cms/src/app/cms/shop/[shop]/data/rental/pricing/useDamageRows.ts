import { useCallback, useRef, useState } from "react";

import type { PricingMatrix } from "@acme/types";

import type { DamageDraft } from "./pricingFormUtils";

interface UseDamageRowsArgs {
  initial: PricingMatrix["damageFees"];
  fieldErrors: Record<string, string>;
}

export function useDamageRows({ initial, fieldErrors }: UseDamageRowsArgs) {
  const entries = Object.entries(initial);
  const counterRef = useRef(entries.length);
  const [rows, setRows] = useState<DamageDraft[]>(() =>
    entries.map(([code, value], index) => ({
      id: `damage-${index}`,
      code,
      mode: typeof value === "number" ? "amount" : "deposit",
      amount: typeof value === "number" ? value.toString() : "",
    }))
  );

  const add = useCallback(() => {
    const id = `damage-${counterRef.current++}-${Date.now()}`;
    setRows((prev) => [...prev, { id, code: "", mode: "amount", amount: "" }]);
  }, []);

  const remove = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const update = useCallback((id: string, updates: Partial<Omit<DamageDraft, "id">>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }, []);

  const hydrate = useCallback((damageFees: PricingMatrix["damageFees"]) => {
    const damageEntries = Object.entries(damageFees);
    counterRef.current = damageEntries.length;
    const timestamp = Date.now();
    setRows(
      damageEntries.map(([code, value], index) => ({
        id: `damage-${index}-${timestamp}`,
        code,
        mode: typeof value === "number" ? "amount" : "deposit",
        amount: typeof value === "number" ? value.toString() : "",
      }))
    );
  }, []);

  const getErrors = useCallback(
    (id: string) => ({
      code: fieldErrors[`damage-${id}-code`],
      amount: fieldErrors[`damage-${id}-amount`],
    }),
    [fieldErrors]
  );

  return { rows, add, remove, update, hydrate, getErrors };
}
