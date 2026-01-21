import { type ChangeEvent, type Dispatch, type SetStateAction,useCallback, useState } from "react";

import type { PricingMatrix } from "@acme/types";

import {
  buildPricingFromForm,
  type CoverageDraft,
  type DamageDraft,
  type DurationDraft,
  type ValidationResult,
} from "./pricingFormUtils";
import { useCoverageRows } from "./useCoverageRows";
import { useDamageRows } from "./useDamageRows";
import { useDurationRows } from "./useDurationRows";

interface UsePricingGridStateArgs {
  initial: PricingMatrix;
}

export interface DurationControls {
  rows: DurationDraft[];
  add: () => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<DurationDraft, "id">>) => void;
  getErrors: (id: string) => { minDays?: string; rate?: string };
}

export interface DamageControls {
  rows: DamageDraft[];
  add: () => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<DamageDraft, "id">>) => void;
  getErrors: (id: string) => { code?: string; amount?: string };
}

export interface CoverageControls {
  rows: CoverageDraft[];
  update: (code: CoverageDraft["code"], updates: Partial<Omit<CoverageDraft, "code">>) => void;
  getErrors: (code: CoverageDraft["code"]) => { fee?: string; waiver?: string };
}

export interface PricingGridDrafts {
  baseRate: string;
  durationRows: DurationDraft[];
  damageRows: DamageDraft[];
  coverageRows: CoverageDraft[];
}

export interface PricingGridErrors {
  baseDailyRate?: string;
  root?: string;
}

export interface PricingGridState {
  drafts: PricingGridDrafts;
  controls: {
    onBaseRateChange: (event: ChangeEvent<HTMLInputElement>) => void;
    duration: DurationControls;
    damage: DamageControls;
    coverage: CoverageControls;
  };
  errors: PricingGridErrors;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  clearFieldErrors: () => void;
  hydrateFromMatrix: (matrix: PricingMatrix) => void;
  getFormPricing: () => ValidationResult;
}

export function usePricingGridState({ initial }: UsePricingGridStateArgs): PricingGridState {
  const [baseRate, setBaseRate] = useState(() => initial.baseDailyRate.toString());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    rows: durationRows,
    add: addDurationRow,
    remove: removeDurationRow,
    update: updateDurationRow,
    hydrate: hydrateDurationRows,
    getErrors: getDurationErrors,
  } = useDurationRows({ initial: initial.durationDiscounts, fieldErrors });

  const {
    rows: damageRows,
    add: addDamageRow,
    remove: removeDamageRow,
    update: updateDamageRow,
    hydrate: hydrateDamageRows,
    getErrors: getDamageErrors,
  } = useDamageRows({ initial: initial.damageFees, fieldErrors });

  const {
    rows: coverageRows,
    update: updateCoverageRow,
    hydrate: hydrateCoverageRows,
    getErrors: getCoverageErrors,
  } = useCoverageRows({ initial: initial.coverage, fieldErrors });

  const hydrateFromMatrix = useCallback(
    (matrix: PricingMatrix) => {
      setBaseRate(matrix.baseDailyRate.toString());
      hydrateDurationRows(matrix.durationDiscounts);
      hydrateDamageRows(matrix.damageFees);
      hydrateCoverageRows(matrix.coverage);
      setFieldErrors({});
    },
    [hydrateCoverageRows, hydrateDamageRows, hydrateDurationRows]
  );

  const onBaseRateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setBaseRate(event.target.value);
  }, []);

  const getFormPricing = useCallback(
    () =>
      buildPricingFromForm({
        baseRate,
        durationRows,
        damageRows,
        coverageRows,
      }),
    [baseRate, coverageRows, damageRows, durationRows]
  );

  const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

  return {
    drafts: {
      baseRate,
      durationRows,
      damageRows,
      coverageRows,
    },
    controls: {
      onBaseRateChange,
      duration: {
        rows: durationRows,
        add: addDurationRow,
        remove: removeDurationRow,
        update: updateDurationRow,
        getErrors: getDurationErrors,
      },
      damage: {
        rows: damageRows,
        add: addDamageRow,
        remove: removeDamageRow,
        update: updateDamageRow,
        getErrors: getDamageErrors,
      },
      coverage: {
        rows: coverageRows,
        update: updateCoverageRow,
        getErrors: getCoverageErrors,
      },
    },
    errors: {
      baseDailyRate: fieldErrors.baseDailyRate,
      root: fieldErrors.root,
    },
    setFieldErrors,
    clearFieldErrors,
    hydrateFromMatrix,
    getFormPricing,
  };
}
