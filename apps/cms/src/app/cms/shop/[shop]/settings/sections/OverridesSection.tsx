"use client";

import type { MappingRow } from "@/hooks/useMappingRows";

import LocaleOverrides from "../LocaleOverrides";
import PriceOverrides from "../PriceOverrides";

interface OverridesSectionProps {
  priceOverrides: MappingRow[];
  addPriceOverride: () => void;
  updatePriceOverride: (index: number, field: "key" | "value", value: string) => void;
  removePriceOverride: (index: number) => void;
  priceErrors: Record<string, string[]>;
  localeOverrides: MappingRow[];
  addLocaleOverride: () => void;
  updateLocaleOverride: (index: number, field: "key" | "value", value: string) => void;
  removeLocaleOverride: (index: number) => void;
  localeErrors: Record<string, string[]>;
}

export default function OverridesSection({
  priceOverrides,
  addPriceOverride,
  updatePriceOverride,
  removePriceOverride,
  priceErrors,
  localeOverrides,
  addLocaleOverride,
  updateLocaleOverride,
  removeLocaleOverride,
  localeErrors,
}: OverridesSectionProps) {
  return (
    <div className="space-y-6">
      <PriceOverrides
        overrides={priceOverrides}
        addOverride={addPriceOverride}
        updateOverride={updatePriceOverride}
        removeOverride={removePriceOverride}
        errors={priceErrors}
      />
      <LocaleOverrides
        overrides={localeOverrides}
        addOverride={addLocaleOverride}
        updateOverride={updateLocaleOverride}
        removeOverride={removeLocaleOverride}
        errors={localeErrors}
      />
    </div>
  );
}
