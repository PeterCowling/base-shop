import type { PricingMatrix } from "@acme/types";
import { useCallback, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import {
  buildPricingFromForm,
  type CoverageDraft,
  type DamageDraft,
  type DurationDraft,
  type PricingFormStatus,
  type PricingFormTab,
} from "./pricingFormUtils";
import { useCoverageRows } from "./useCoverageRows";
import { useDamageRows } from "./useDamageRows";
import { useDurationRows } from "./useDurationRows";
import { usePricingJsonControls } from "./usePricingJsonControls";

interface UsePricingFormStateArgs {
  initial: PricingMatrix;
  shop: string;
  onToast: (message: string) => void;
}

interface DurationControls {
  rows: DurationDraft[];
  add: () => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<DurationDraft, "id">>) => void;
  getErrors: (id: string) => { minDays?: string; rate?: string };
}

interface DamageControls {
  rows: DamageDraft[];
  add: () => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<DamageDraft, "id">>) => void;
  getErrors: (id: string) => { code?: string; amount?: string };
}

interface CoverageControls {
  rows: CoverageDraft[];
  update: (code: CoverageDraft["code"], updates: Partial<Omit<CoverageDraft, "code">>) => void;
  getErrors: (code: CoverageDraft["code"]) => { fee?: string; waiver?: string };
}

interface JsonControls {
  draft: string;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  error: string | null;
  applyJson: () => void;
}

export function usePricingFormState({ initial, shop, onToast }: UsePricingFormStateArgs) {
  const [baseRate, setBaseRate] = useState(() => initial.baseDailyRate.toString());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<PricingFormStatus>("idle");
  const [activeTab, setActiveTab] = useState<PricingFormTab>("guided");

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

  const statusLabel = useMemo(() => {
    switch (status) {
      case "saving":
        return "Saving changes";
      case "saved":
        return "Pricing saved";
      case "error":
        return "Needs attention";
      default:
        return "Draft";
    }
  }, [status]);

  const statusVariant = status === "saved" ? "success" : status === "error" ? "destructive" : "default";

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

  const {
    draft: jsonDraft,
    error: jsonError,
    setError: setJsonError,
    onDraftChange,
    applyJson,
    parseDraft,
    setDraftFromMatrix,
    progressMessage,
    fileInputRef,
    handleImportClick,
    handleFileChange,
    handleExport,
  } = usePricingJsonControls({
    initial,
    onHydrate: hydrateFromMatrix,
    onToast,
    onValidationErrors: setFieldErrors,
    setStatus,
    getFormPricing,
  });

  const handleTabChange = useCallback(
    (next: PricingFormTab) => {
      if (next === activeTab) return;

      if (next === "json") {
        const result = getFormPricing();
        if (!result.success) {
          setFieldErrors(result.errors);
          setStatus("error");
          onToast("Resolve highlighted fields before viewing JSON.");
          return;
        }
        setFieldErrors({});
        setDraftFromMatrix(result.data);
        setActiveTab("json");
        return;
      }

      const parsed = parseDraft();
      if (!parsed.success) {
        const message = parsed.errors.json ?? "JSON is invalid";
        setJsonError(message);
        setStatus("error");
        onToast("Fix JSON errors before returning to the form.");
        return;
      }

      hydrateFromMatrix(parsed.data);
      setDraftFromMatrix(parsed.data);
      setActiveTab("guided");
    },
    [
      activeTab,
      getFormPricing,
      hydrateFromMatrix,
      onToast,
      parseDraft,
      setDraftFromMatrix,
      setFieldErrors,
      setJsonError,
      setStatus,
    ]
  );

  const onBaseRateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setBaseRate(event.target.value);
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setStatus("saving");

      let pricing: PricingMatrix;
      if (activeTab === "json") {
        const parsed = parseDraft();
        if (!parsed.success) {
          const message = parsed.errors.json ?? "JSON could not be parsed.";
          setJsonError(message);
          setStatus("error");
          onToast(message);
          return;
        }
        pricing = parsed.data;
        hydrateFromMatrix(parsed.data);
        setFieldErrors({});
        setDraftFromMatrix(parsed.data);
      } else {
        const result = getFormPricing();
        if (!result.success) {
          setFieldErrors(result.errors);
          setStatus("error");
          onToast("Fix validation issues before saving.");
          return;
        }
        pricing = result.data;
        setFieldErrors({});
        setDraftFromMatrix(result.data);
      }

      try {
        const response = await fetch(`/api/data/${shop}/rental/pricing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pricing),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Failed to save pricing");
        }
        setStatus("saved");
        setFieldErrors({});
        setJsonError(null);
        setDraftFromMatrix(pricing);
        onToast("Saved!");
      } catch (err) {
        setStatus("error");
        onToast((err as Error).message || "Failed to save pricing");
      }
    },
    [
      activeTab,
      getFormPricing,
      hydrateFromMatrix,
      onToast,
      parseDraft,
      setDraftFromMatrix,
      setFieldErrors,
      setJsonError,
      setStatus,
      shop,
    ]
  );

  const jsonControls: JsonControls = {
    draft: jsonDraft,
    onDraftChange,
    error: jsonError,
    applyJson,
  };

  const durationControls: DurationControls = {
    rows: durationRows,
    add: addDurationRow,
    remove: removeDurationRow,
    update: updateDurationRow,
    getErrors: getDurationErrors,
  };

  const damageControls: DamageControls = {
    rows: damageRows,
    add: addDamageRow,
    remove: removeDamageRow,
    update: updateDamageRow,
    getErrors: getDamageErrors,
  };

  const coverageControls: CoverageControls = {
    rows: coverageRows,
    update: updateCoverageRow,
    getErrors: getCoverageErrors,
  };

  return {
    refs: {
      fileInputRef,
    },
    baseRate,
    baseRateError: fieldErrors.baseDailyRate,
    onBaseRateChange,
    rootError: fieldErrors.root,
    status,
    statusLabel,
    statusVariant,
    progressMessage,
    activeTab,
    handleTabChange,
    json: jsonControls,
    duration: durationControls,
    damage: damageControls,
    coverage: coverageControls,
    handleFileChange,
    handleImportClick,
    handleExport,
    onSubmit,
  };
}

export type {
  DurationDraft,
  DamageDraft,
  CoverageDraft,
  PricingFormStatus,
  PricingFormTab,
} from "./pricingFormUtils";
