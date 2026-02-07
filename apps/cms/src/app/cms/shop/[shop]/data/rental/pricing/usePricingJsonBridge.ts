import type { Dispatch, SetStateAction } from "react";

import type { PricingMatrix } from "@acme/types";

import { type PricingFormStatus, type ValidationResult } from "./pricingFormUtils";
import { usePricingJsonControls } from "./usePricingJsonControls";

interface UsePricingJsonBridgeArgs {
  initial: PricingMatrix;
  onHydrate: (matrix: PricingMatrix) => void;
  onToast: (message: string) => void;
  onValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setStatus: Dispatch<SetStateAction<PricingFormStatus>>;
  getFormPricing: () => ValidationResult;
}

export function usePricingJsonBridge({
  initial,
  onHydrate,
  onToast,
  onValidationErrors,
  setStatus,
  getFormPricing,
}: UsePricingJsonBridgeArgs) {
  const controls = usePricingJsonControls({
    initial,
    onHydrate,
    onToast,
    onValidationErrors,
    setStatus,
    getFormPricing,
  });

  return {
    draft: controls.draft,
    error: controls.error,
    setError: controls.setError,
    onDraftChange: controls.onDraftChange,
    applyJson: controls.applyJson,
    parseDraft: controls.parseDraft,
    setDraftFromMatrix: controls.setDraftFromMatrix,
    progressMessage: controls.progressMessage,
    fileInputRef: controls.fileInputRef,
    handleImportClick: controls.handleImportClick,
    handleFileChange: controls.handleFileChange,
    handleExport: controls.handleExport,
  } as const;
}
