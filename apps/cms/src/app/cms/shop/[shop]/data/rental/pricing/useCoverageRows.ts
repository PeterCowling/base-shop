import { useCallback, useState } from "react";
import { coverageCodeSchema, type CoverageCode, type PricingMatrix } from "@acme/types";

import type { CoverageDraft } from "./pricingFormUtils";

const coverageCodes = coverageCodeSchema.options as readonly CoverageCode[];

interface UseCoverageRowsArgs {
  initial: PricingMatrix["coverage"] | undefined;
  fieldErrors: Record<string, string>;
}

export function useCoverageRows({ initial, fieldErrors }: UseCoverageRowsArgs) {
  const [rows, setRows] = useState<CoverageDraft[]>(() =>
    coverageCodes.map((code) => {
      const entry = initial?.[code];
      return {
        code,
        enabled: Boolean(entry),
        fee: entry ? entry.fee.toString() : "",
        waiver: entry ? entry.waiver.toString() : "",
      } satisfies CoverageDraft;
    })
  );

  const hydrate = useCallback((coverage: PricingMatrix["coverage"] | undefined) => {
    setRows(
      coverageCodes.map((code) => {
        const entry = coverage?.[code];
        return {
          code,
          enabled: Boolean(entry),
          fee: entry ? entry.fee.toString() : "",
          waiver: entry ? entry.waiver.toString() : "",
        } satisfies CoverageDraft;
      })
    );
  }, []);

  const update = useCallback((code: CoverageCode, updates: Partial<Omit<CoverageDraft, "code">>) => {
    setRows((prev) => prev.map((row) => (row.code === code ? { ...row, ...updates } : row)));
  }, []);

  const getErrors = useCallback(
    (code: CoverageCode) => ({
      fee: fieldErrors[`coverage-${code}-fee`],
      waiver: fieldErrors[`coverage-${code}-waiver`],
    }),
    [fieldErrors]
  );

  return { rows, update, hydrate, getErrors };
}
