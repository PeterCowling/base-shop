import type { PricingMatrix } from "@acme/types";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import {
  type PricingFormStatus,
  type PricingFormTab,
} from "./pricingFormUtils";
import { usePricingGridState } from "./usePricingGridState";
import { usePricingJsonBridge } from "./usePricingJsonBridge";

interface UsePricingFormStateArgs {
  initial: PricingMatrix;
  shop: string;
  onToast: (message: string) => void;
}

export function usePricingFormState({ initial, shop, onToast }: UsePricingFormStateArgs) {
  const [status, setStatus] = useState<PricingFormStatus>("idle");
  const [activeTab, setActiveTab] = useState<PricingFormTab>("guided");

  const {
    drafts,
    controls,
    errors,
    setFieldErrors,
    clearFieldErrors,
    hydrateFromMatrix,
    getFormPricing,
  } = usePricingGridState({ initial });

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
  } = usePricingJsonBridge({
    initial,
    onHydrate: hydrateFromMatrix,
    onToast,
    onValidationErrors: setFieldErrors,
    setStatus,
    getFormPricing,
  });

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

        clearFieldErrors();
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
      clearFieldErrors,
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
        clearFieldErrors();
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
        clearFieldErrors();
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
        clearFieldErrors();
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
      clearFieldErrors,
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

  return {
    refs: {
      fileInputRef,
    },
    baseRate: drafts.baseRate,
    baseRateError: errors.baseDailyRate,
    onBaseRateChange: controls.onBaseRateChange,
    rootError: errors.root,
    status,
    statusLabel,
    statusVariant,
    progressMessage,
    activeTab,
    handleTabChange,
    json: {
      draft: jsonDraft,
      onDraftChange,
      error: jsonError,
      applyJson,
    },
    duration: controls.duration,
    damage: controls.damage,
    coverage: controls.coverage,
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
