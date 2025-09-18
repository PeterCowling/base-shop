import {
  coverageCodeSchema,
  type CoverageCode,
  pricingSchema,
  type PricingMatrix,
} from "@acme/types";
import { useCallback, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";

export type DurationDraft = {
  id: string;
  minDays: string;
  rate: string;
};

export type DamageDraft = {
  id: string;
  code: string;
  mode: "amount" | "deposit";
  amount: string;
};

export type CoverageDraft = {
  code: CoverageCode;
  enabled: boolean;
  fee: string;
  waiver: string;
};

type ValidationResult =
  | { success: true; data: PricingMatrix }
  | { success: false; errors: Record<string, string> };

export type PricingFormStatus = "idle" | "saving" | "saved" | "error";
export type PricingFormTab = "guided" | "json";

const coverageCodes = coverageCodeSchema.options as readonly CoverageCode[];

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
  update: (code: CoverageCode, updates: Partial<Omit<CoverageDraft, "code">>) => void;
  getErrors: (code: CoverageCode) => { fee?: string; waiver?: string };
}

interface JsonControls {
  draft: string;
  onDraftChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  error: string | null;
  applyJson: () => void;
}

export function usePricingFormState({ initial, shop, onToast }: UsePricingFormStateArgs) {
  const [baseRate, setBaseRate] = useState(() => initial.baseDailyRate.toString());
  const [durationRows, setDurationRows] = useState<DurationDraft[]>(() =>
    initial.durationDiscounts.map((tier, index) => ({
      id: `duration-${index}`,
      minDays: tier.minDays.toString(),
      rate: tier.rate.toString(),
    }))
  );
  const [damageRows, setDamageRows] = useState<DamageDraft[]>(() =>
    Object.entries(initial.damageFees).map(([code, value], index) => ({
      id: `damage-${index}`,
      code,
      mode: typeof value === "number" ? "amount" : "deposit",
      amount: typeof value === "number" ? value.toString() : "",
    }))
  );
  const [coverageRows, setCoverageRows] = useState<CoverageDraft[]>(() =>
    coverageCodes.map((code) => {
      const entry = initial.coverage?.[code];
      return {
        code,
        enabled: Boolean(entry),
        fee: entry ? entry.fee.toString() : "",
        waiver: entry ? entry.waiver.toString() : "",
      };
    })
  );
  const [activeTab, setActiveTab] = useState<PricingFormTab>("guided");
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initial, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<PricingFormStatus>("idle");
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowCounter = useRef(initial.durationDiscounts.length + damageRows.length + 1);

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

  const hydrateFromMatrix = useCallback((matrix: PricingMatrix) => {
    setBaseRate(matrix.baseDailyRate.toString());
    setDurationRows(
      matrix.durationDiscounts.map((tier, index) => ({
        id: `duration-${index}-${Date.now()}`,
        minDays: tier.minDays.toString(),
        rate: tier.rate.toString(),
      }))
    );
    setDamageRows(
      Object.entries(matrix.damageFees).map(([code, value], index) => ({
        id: `damage-${index}-${Date.now()}`,
        code,
        mode: typeof value === "number" ? "amount" : "deposit",
        amount: typeof value === "number" ? value.toString() : "",
      }))
    );
    setCoverageRows(
      coverageCodes.map((code) => {
        const entry = matrix.coverage?.[code];
        return {
          code,
          enabled: Boolean(entry),
          fee: entry ? entry.fee.toString() : "",
          waiver: entry ? entry.waiver.toString() : "",
        };
      })
    );
    setJsonDraft(JSON.stringify(matrix, null, 2));
    setFieldErrors({});
    setJsonError(null);
  }, []);

  const buildPricingFromForm = useCallback((): ValidationResult => {
    const errors: Record<string, string> = {};
    const baseInput = baseRate.trim();
    const base = Number(baseInput);
    if (baseInput === "" || !Number.isFinite(base)) {
      errors.baseDailyRate = "Enter a base daily rate";
    }

    const durations: PricingMatrix["durationDiscounts"] = [];
    durationRows.forEach((row) => {
      const keyBase = `duration-${row.id}`;
      const hasValues = row.minDays.trim() !== "" || row.rate.trim() !== "";
      if (!hasValues) {
        return;
      }
      const minDays = Number(row.minDays);
      const rate = Number(row.rate);
      if (row.minDays.trim() === "" || !Number.isFinite(minDays) || minDays <= 0) {
        errors[`${keyBase}-minDays`] = "Provide minimum rental days";
      }
      if (row.rate.trim() === "" || !Number.isFinite(rate) || rate <= 0) {
        errors[`${keyBase}-rate`] = "Provide a positive multiplier";
      }
      if (!errors[`${keyBase}-minDays`] && !errors[`${keyBase}-rate`]) {
        durations.push({ minDays, rate });
      }
    });

    const damageFees: PricingMatrix["damageFees"] = {};
    damageRows.forEach((row) => {
      const keyBase = `damage-${row.id}`;
      if (row.code.trim() === "") {
        errors[`${keyBase}-code`] = "Enter a damage code";
        return;
      }
      if (damageFees[row.code.trim()]) {
        errors[`${keyBase}-code`] = "Damage codes must be unique";
        return;
      }
      if (row.mode === "deposit") {
        damageFees[row.code.trim()] = "deposit";
        return;
      }
      if (row.amount.trim() === "") {
        errors[`${keyBase}-amount`] = "Enter a fee";
        return;
      }
      const parsedAmount = Number(row.amount);
      if (!Number.isFinite(parsedAmount)) {
        errors[`${keyBase}-amount`] = "Fee must be a number";
        return;
      }
      damageFees[row.code.trim()] = parsedAmount;
    });

    const coverage: PricingMatrix["coverage"] = {};
    coverageRows.forEach((row) => {
      if (!row.enabled) {
        return;
      }
      const fee = Number(row.fee);
      const waiver = Number(row.waiver);
      if (row.fee.trim() === "" || !Number.isFinite(fee) || fee < 0) {
        errors[`coverage-${row.code}-fee`] = "Enter a non-negative fee";
      }
      if (row.waiver.trim() === "" || !Number.isFinite(waiver) || waiver < 0) {
        errors[`coverage-${row.code}-waiver`] = "Enter a non-negative waiver";
      }
      if (!errors[`coverage-${row.code}-fee`] && !errors[`coverage-${row.code}-waiver`]) {
        coverage[row.code] = { fee, waiver };
      }
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const candidate: PricingMatrix = {
      baseDailyRate: Number.isFinite(base) ? base : 0,
      durationDiscounts: durations,
      damageFees,
      coverage,
    };
    const parsed = pricingSchema.safeParse(candidate);
    if (!parsed.success) {
      const aggregate = parsed.error.issues.map((issue) => issue.message).join("; ");
      return { success: false, errors: { root: aggregate } };
    }
    return { success: true, data: parsed.data };
  }, [baseRate, coverageRows, damageRows, durationRows]);

  const parseJsonDraft = useCallback((): ValidationResult => {
    try {
      const json = JSON.parse(jsonDraft);
      const parsed = pricingSchema.safeParse(json);
      if (!parsed.success) {
        return {
          success: false,
          errors: {
            json: parsed.error.issues.map((issue) => issue.message).join("; "),
          },
        };
      }
      return { success: true, data: parsed.data };
    } catch (err) {
      return { success: false, errors: { json: (err as Error).message } };
    }
  }, [jsonDraft]);

  const handleTabChange = useCallback(
    (next: PricingFormTab) => {
      if (next === activeTab) return;
      if (next === "json") {
        const result = buildPricingFromForm();
        if (!result.success) {
          setFieldErrors(result.errors);
          setStatus("error");
          onToast("Resolve highlighted fields before viewing JSON.");
          return;
        }
        setJsonDraft(JSON.stringify(result.data, null, 2));
        setJsonError(null);
        setActiveTab("json");
        return;
      }

      const parsed = parseJsonDraft();
      if (!parsed.success) {
        setJsonError(parsed.errors.json ?? "JSON is invalid");
        setStatus("error");
        onToast("Fix JSON errors before returning to the form.");
        return;
      }
      hydrateFromMatrix(parsed.data);
      setActiveTab("guided");
    },
    [activeTab, buildPricingFromForm, hydrateFromMatrix, onToast, parseJsonDraft]
  );

  const handleApplyJson = useCallback(() => {
    const parsed = parseJsonDraft();
    if (!parsed.success) {
      const message = parsed.errors.json ?? "JSON is invalid";
      setJsonError(message);
      setStatus("error");
      onToast(parsed.errors.json ?? "JSON could not be parsed.");
      return;
    }
    hydrateFromMatrix(parsed.data);
    setStatus("saved");
    onToast("JSON parsed and applied to the guided editor.");
  }, [hydrateFromMatrix, onToast, parseJsonDraft]);

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
        const parsed = pricingSchema.safeParse(JSON.parse(text));
        if (!parsed.success) {
          throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
        }
        hydrateFromMatrix(parsed.data);
        setStatus("saved");
        setProgressMessage(`Pricing imported from ${file.name}`);
        onToast(`Imported pricing from ${file.name}`);
      } catch (err) {
        setStatus("error");
        setProgressMessage("Import failed");
        onToast((err as Error).message || "Import failed");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [hydrateFromMatrix, onToast]
  );

  const handleExport = useCallback(() => {
    const result = buildPricingFromForm();
    if (!result.success) {
      setFieldErrors(result.errors);
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
  }, [buildPricingFromForm, onToast]);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setStatus("saving");

      let pricing: PricingMatrix;
      if (activeTab === "json") {
        const parsed = parseJsonDraft();
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
      } else {
        const result = buildPricingFromForm();
        if (!result.success) {
          setFieldErrors(result.errors);
          setStatus("error");
          onToast("Fix validation issues before saving.");
          return;
        }
        pricing = result.data;
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
        setJsonDraft(JSON.stringify(pricing, null, 2));
        onToast("Saved!");
      } catch (err) {
        setStatus("error");
        onToast((err as Error).message || "Failed to save pricing");
      }
    },
    [activeTab, buildPricingFromForm, hydrateFromMatrix, onToast, parseJsonDraft, shop]
  );

  const addDurationRow = useCallback(() => {
    const id = `duration-${rowCounter.current++}`;
    setDurationRows((prev) => [...prev, { id, minDays: "", rate: "" }]);
  }, []);

  const removeDurationRow = useCallback((id: string) => {
    setDurationRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const updateDurationRow = useCallback((id: string, updates: Partial<Omit<DurationDraft, "id">>) => {
    setDurationRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }, []);

  const addDamageRow = useCallback(() => {
    const id = `damage-${rowCounter.current++}`;
    setDamageRows((prev) => [...prev, { id, code: "", mode: "amount", amount: "" }]);
  }, []);

  const removeDamageRow = useCallback((id: string) => {
    setDamageRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const updateDamageRow = useCallback((id: string, updates: Partial<Omit<DamageDraft, "id">>) => {
    setDamageRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  }, []);

  const updateCoverageRow = useCallback((code: CoverageCode, updates: Partial<Omit<CoverageDraft, "code">>) => {
    setCoverageRows((prev) => prev.map((row) => (row.code === code ? { ...row, ...updates } : row)));
  }, []);

  const getDurationErrors = useCallback(
    (id: string) => ({
      minDays: fieldErrors[`duration-${id}-minDays`],
      rate: fieldErrors[`duration-${id}-rate`],
    }),
    [fieldErrors]
  );

  const getDamageErrors = useCallback(
    (id: string) => ({
      code: fieldErrors[`damage-${id}-code`],
      amount: fieldErrors[`damage-${id}-amount`],
    }),
    [fieldErrors]
  );

  const getCoverageErrors = useCallback(
    (code: CoverageCode) => ({
      fee: fieldErrors[`coverage-${code}-fee`],
      waiver: fieldErrors[`coverage-${code}-waiver`],
    }),
    [fieldErrors]
  );

  const onBaseRateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setBaseRate(event.target.value);
  }, []);

  const jsonControls: JsonControls = {
    draft: jsonDraft,
    onDraftChange: (event) => setJsonDraft(event.target.value),
    error: jsonError,
    applyJson: handleApplyJson,
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

