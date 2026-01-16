import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { PricingMatrix } from "@acme/types";

import {
  parseJsonDraft,
  type PricingFormStatus,
  type ValidationResult,
} from "./pricingFormUtils";

interface UsePricingJsonControlsArgs {
  initial: PricingMatrix;
  onHydrate: (matrix: PricingMatrix) => void;
  onToast: (message: string) => void;
  onValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setStatus: Dispatch<SetStateAction<PricingFormStatus>>;
  getFormPricing: () => ValidationResult;
}

export function usePricingJsonControls({
  initial,
  onHydrate,
  onToast,
  onValidationErrors,
  setStatus,
  getFormPricing,
}: UsePricingJsonControlsArgs) {
  const [draft, setDraft] = useState(() => JSON.stringify(initial, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  }, []);

  const setDraftFromMatrix = useCallback((matrix: PricingMatrix) => {
    setDraft(JSON.stringify(matrix, null, 2));
    setError(null);
  }, []);

  const parseDraft = useCallback(() => parseJsonDraft(draft), [draft]);

  const applyJson = useCallback(() => {
    const parsed = parseDraft();
    if (parsed.success === false) {
      const message = parsed.errors.json ?? "JSON is invalid";
      setError(message);
      setStatus("error");
      onToast(message);
      return;
    }

    onHydrate(parsed.data);
    onValidationErrors({});
    setDraftFromMatrix(parsed.data);
    setStatus("saved");
    onToast("JSON parsed and applied to the guided editor.");
  }, [onHydrate, onToast, onValidationErrors, parseDraft, setDraftFromMatrix, setStatus]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setProgressMessage(`Importing ${file.name}…`);
      try {
        const text = await file.text();
        const parsed = parseJsonDraft(text);
        if (parsed.success === false) {
          throw new Error(parsed.errors.json ?? "JSON is invalid");
        }

        onHydrate(parsed.data);
        onValidationErrors({});
        setDraftFromMatrix(parsed.data);
        setStatus("saved");
        setProgressMessage(`Pricing imported from ${file.name}`);
        onToast(`Imported pricing from ${file.name}`);
      } catch (err) {
        setStatus("error");
        setProgressMessage("Import failed");
        onToast((err as Error).message || "Import failed");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onHydrate, onToast, onValidationErrors, setDraftFromMatrix, setStatus]
  );

  const handleExport = useCallback(() => {
    const result = getFormPricing();
    if (result.success === false) {
      onValidationErrors(result.errors);
      setStatus("error");
      onToast("Fix validation errors before exporting.");
      return;
    }

    try {
      setProgressMessage("Preparing export…");
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pricing.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setProgressMessage("Pricing JSON export started");
      onToast("Pricing JSON download started");
    } catch (err) {
      setStatus("error");
      setProgressMessage("Export failed");
      onToast((err as Error).message || "Export failed");
    }
  }, [getFormPricing, onToast, onValidationErrors, setStatus]);

  return {
    draft,
    error,
    setError,
    onDraftChange,
    applyJson,
    parseDraft,
    setDraftFromMatrix,
    progressMessage,
    fileInputRef,
    handleImportClick,
    handleFileChange,
    handleExport,
  } as const;
}
