"use client";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Textarea,
} from "@/components/atoms/shadcn";
import { Toast, Tag } from "@/components/atoms";
import {
  coverageCodeSchema,
  type CoverageCode,
  pricingSchema,
  type PricingMatrix,
} from "@acme/types";
import { cn } from "@ui/utils/style";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

interface Props {
  shop: string;
  initial: PricingMatrix;
}

type DurationDraft = {
  id: string;
  minDays: string;
  rate: string;
};

type DamageDraft = {
  id: string;
  code: string;
  mode: "amount" | "deposit";
  amount: string;
};

type CoverageDraft = {
  code: CoverageCode;
  enabled: boolean;
  fee: string;
  waiver: string;
};

type ValidationResult =
  | { success: true; data: PricingMatrix }
  | { success: false; errors: Record<string, string> };

const coverageCodes = coverageCodeSchema.options as readonly CoverageCode[];

export default function PricingForm({ shop, initial }: Props) {
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
  const [activeTab, setActiveTab] = useState<"guided" | "json">("guided");
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initial, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
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

  const emitToast = (message: string) => {
    setToast({ open: true, message });
  };

  const closeToast = () => setToast({ open: false, message: "" });

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

  const handleTabChange = (next: "guided" | "json") => {
    if (next === activeTab) return;
    if (next === "json") {
      const result = buildPricingFromForm();
      if (!result.success) {
        setFieldErrors(result.errors);
        setStatus("error");
        emitToast("Resolve highlighted fields before viewing JSON.");
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
      emitToast("Fix JSON errors before returning to the form.");
      return;
    }
    hydrateFromMatrix(parsed.data);
    setActiveTab("guided");
  };

  const handleApplyJson = () => {
    const parsed = parseJsonDraft();
    if (!parsed.success) {
      setJsonError(parsed.errors.json ?? "JSON is invalid");
      setStatus("error");
      emitToast(parsed.errors.json ?? "JSON could not be parsed.");
      return;
    }
    hydrateFromMatrix(parsed.data);
    setStatus("saved");
    emitToast("JSON parsed and applied to the guided editor.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      emitToast(`Imported pricing from ${file.name}`);
    } catch (err) {
      setStatus("error");
      setProgressMessage("Import failed");
      emitToast((err as Error).message || "Import failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    const result = buildPricingFromForm();
    if (!result.success) {
      setFieldErrors(result.errors);
      setStatus("error");
      emitToast("Fix validation errors before exporting.");
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
      emitToast("Pricing JSON download started");
    } catch (err) {
      setStatus("error");
      setProgressMessage("Export failed");
      emitToast((err as Error).message || "Export failed");
    }
  };

  const addDurationRow = () => {
    const id = `duration-${rowCounter.current++}`;
    setDurationRows((prev) => [...prev, { id, minDays: "", rate: "" }]);
  };

  const removeDurationRow = (id: string) => {
    setDurationRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addDamageRow = () => {
    const id = `damage-${rowCounter.current++}`;
    setDamageRows((prev) => [...prev, { id, code: "", mode: "amount", amount: "" }]);
  };

  const removeDamageRow = (id: string) => {
    setDamageRows((prev) => prev.filter((row) => row.id !== id));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    const result = buildPricingFromForm();
    if (!result.success) {
      setFieldErrors(result.errors);
      setStatus("error");
      emitToast("Fix validation issues before saving.");
      return;
    }
    try {
      const response = await fetch(`/api/data/${shop}/rental/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save pricing");
      }
      setStatus("saved");
      setFieldErrors({});
      setJsonDraft(JSON.stringify(result.data, null, 2));
      emitToast("Pricing saved");
    } catch (err) {
      setStatus("error");
      emitToast((err as Error).message || "Failed to save pricing");
    }
  };

  const guidedTab = (
    <div className="space-y-6" role="tabpanel" aria-labelledby="pricing-tab-guided">
      <section className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-white" htmlFor="base-daily-rate">
            Base daily rate
          </label>
          <Input
            id="base-daily-rate"
            type="number"
            min={0}
            step="0.01"
            value={baseRate}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setBaseRate(event.target.value)}
            aria-invalid={fieldErrors.baseDailyRate ? "true" : undefined}
            aria-describedby={fieldErrors.baseDailyRate ? "base-daily-rate-error" : undefined}
            className="bg-slate-900/80 text-white"
          />
          <p className="text-xs text-white/60">
            This rate is used whenever a SKU does not specify its own price.
          </p>
          {fieldErrors.baseDailyRate ? (
            <p id="base-daily-rate-error" className="text-xs text-rose-300">
              {fieldErrors.baseDailyRate}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Duration discounts</h3>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-white/30 text-xs text-white hover:bg-white/10"
            onClick={addDurationRow}
          >
            Add discount tier
          </Button>
        </div>
        <p className="text-xs text-white/60">
          Offer incentives for longer rentals. Leave a row blank to remove it.
        </p>
        <div className="space-y-4">
          {durationRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-white/60">
              No duration tiers configured. Add one to reward longer bookings.
            </p>
          ) : null}
          {durationRows.map((row) => {
            const minDaysError = fieldErrors[`duration-${row.id}-minDays`];
            const rateError = fieldErrors[`duration-${row.id}-rate`];
            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">Min days</span>
                  <Input
                    type="number"
                    min={1}
                    value={row.minDays}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setDurationRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, minDays: event.target.value } : item
                        )
                      )
                    }
                    aria-invalid={minDaysError ? "true" : undefined}
                    aria-describedby={minDaysError ? `${row.id}-minDays-error` : undefined}
                    className="bg-slate-950/80 text-white"
                  />
                  {minDaysError ? (
                    <span id={`${row.id}-minDays-error`} className="text-xs text-rose-300">
                      {minDaysError}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">Rate multiplier</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.rate}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setDurationRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, rate: event.target.value } : item
                        )
                      )
                    }
                    aria-invalid={rateError ? "true" : undefined}
                    aria-describedby={rateError ? `${row.id}-rate-error` : undefined}
                    className="bg-slate-950/80 text-white"
                  />
                  {rateError ? (
                    <span id={`${row.id}-rate-error`} className="text-xs text-rose-300">
                      {rateError}
                    </span>
                  ) : null}
                </label>
                <div className="flex items-start justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg text-xs text-white/70 hover:bg-white/10"
                    onClick={() => removeDurationRow(row.id)}
                    aria-label={`remove-duration-${row.id}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Damage fees</h3>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-white/30 text-xs text-white hover:bg-white/10"
            onClick={addDamageRow}
          >
            Add damage rule
          </Button>
        </div>
        <p className="text-xs text-white/60">
          Map damage codes to a fixed fee or reuse the deposit amount.
        </p>
        <div className="space-y-4">
          {damageRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-white/60">
              No damage fees yet. Add codes for your most common incidents.
            </p>
          ) : null}
          {damageRows.map((row) => {
            const codeError = fieldErrors[`damage-${row.id}-code`];
            const amountError = fieldErrors[`damage-${row.id}-amount`];
            const isDeposit = row.mode === "deposit";
            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">Damage code</span>
                  <Input
                    value={row.code}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setDamageRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, code: event.target.value } : item
                        )
                      )
                    }
                    aria-invalid={codeError ? "true" : undefined}
                    aria-describedby={codeError ? `${row.id}-code-error` : undefined}
                    className="bg-slate-950/80 text-white"
                  />
                  {codeError ? (
                    <span id={`${row.id}-code-error`} className="text-xs text-rose-300">
                      {codeError}
                    </span>
                  ) : null}
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">Resolution</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isDeposit ? "ghost" : "outline"}
                      className={cn(
                        "h-9 flex-1 rounded-lg text-xs",
                        isDeposit ? "border-white/10 bg-white/10 text-white" : "border-white/30 text-white"
                      )}
                      onClick={() =>
                        setDamageRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, mode: "amount" } : item
                          )
                        )
                      }
                    >
                      Fixed fee
                    </Button>
                    <Button
                      type="button"
                      variant={isDeposit ? "outline" : "ghost"}
                      className={cn(
                        "h-9 flex-1 rounded-lg text-xs",
                        isDeposit ? "border-white/30 text-white" : "border-white/10 bg-white/10 text-white"
                      )}
                      onClick={() =>
                        setDamageRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, mode: "deposit", amount: "" } : item
                          )
                        )
                      }
                    >
                      Use deposit
                    </Button>
                  </div>
                  {!isDeposit ? (
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.amount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setDamageRows((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, amount: event.target.value } : item
                            )
                          )
                        }
                        aria-invalid={amountError ? "true" : undefined}
                        aria-describedby={amountError ? `${row.id}-amount-error` : undefined}
                        className="bg-slate-950/80 text-white"
                      />
                      {amountError ? (
                        <span id={`${row.id}-amount-error`} className="text-xs text-rose-300">
                          {amountError}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60">Deposit amount will be charged instead of a fixed fee.</p>
                  )}
                </div>
                <div className="flex items-start justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg text-xs text-white/70 hover:bg-white/10"
                    onClick={() => removeDamageRow(row.id)}
                    aria-label={`remove-damage-${row.id}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Coverage fees</h3>
        <p className="text-xs text-white/60">
          Enable optional coverage to offset repair costs. Leave unchecked to skip offering the coverage.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {coverageRows.map((row) => {
            const feeError = fieldErrors[`coverage-${row.code}-fee`];
            const waiverError = fieldErrors[`coverage-${row.code}-waiver`];
            return (
              <Card key={row.code} className="border border-white/10 bg-slate-900/60 text-white">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold capitalize">{row.code}</span>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Checkbox
                        id={`coverage-${row.code}`}
                        checked={row.enabled}
                        onCheckedChange={(checked) =>
                          setCoverageRows((prev) =>
                            prev.map((item) =>
                              item.code === row.code
                                ? { ...item, enabled: Boolean(checked) }
                                : item
                            )
                          )
                        }
                      />
                      <label htmlFor={`coverage-${row.code}`}>Offer coverage</label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-white/70" htmlFor={`coverage-fee-${row.code}`}>
                      Coverage fee
                    </label>
                    <Input
                      id={`coverage-fee-${row.code}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.fee}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setCoverageRows((prev) =>
                          prev.map((item) =>
                            item.code === row.code ? { ...item, fee: event.target.value } : item
                          )
                        )
                      }
                      disabled={!row.enabled}
                      aria-invalid={feeError ? "true" : undefined}
                      aria-describedby={feeError ? `coverage-${row.code}-fee-error` : undefined}
                      className="bg-slate-950/80 text-white disabled:opacity-40"
                    />
                    {feeError ? (
                      <span id={`coverage-${row.code}-fee-error`} className="text-xs text-rose-300">
                        {feeError}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-white/70" htmlFor={`coverage-waiver-${row.code}`}>
                      Waiver limit
                    </label>
                    <Input
                      id={`coverage-waiver-${row.code}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.waiver}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setCoverageRows((prev) =>
                          prev.map((item) =>
                            item.code === row.code ? { ...item, waiver: event.target.value } : item
                          )
                        )
                      }
                      disabled={!row.enabled}
                      aria-invalid={waiverError ? "true" : undefined}
                      aria-describedby={waiverError ? `coverage-${row.code}-waiver-error` : undefined}
                      className="bg-slate-950/80 text-white disabled:opacity-40"
                    />
                    {waiverError ? (
                      <span id={`coverage-${row.code}-waiver-error`} className="text-xs text-rose-300">
                        {waiverError}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-white">Need a quick checklist?</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
          <li>Verify base rate aligns with current merchandising calendar.</li>
          <li>Mirror long-stay discounts shared by finance to avoid manual overrides.</li>
          <li>Confirm damage codes match warehouse dispositions and deposit policy.</li>
        </ul>
      </section>
    </div>
  );

  const jsonTab = (
    <div className="space-y-4" role="tabpanel" aria-labelledby="pricing-tab-json">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white" htmlFor="pricing-json-editor">
          Pricing JSON configuration
        </label>
        <Textarea
          id="pricing-json-editor"
          value={jsonDraft}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setJsonDraft(event.target.value)}
          rows={18}
          className="bg-slate-950/80 text-white"
          aria-invalid={jsonError ? "true" : undefined}
          aria-describedby={jsonError ? "pricing-json-error" : undefined}
        />
        <p className="text-xs text-white/60">
          Edit directly to paste pricing from other systems. Validation runs before you return to the guided editor.
        </p>
        {jsonError ? (
          <p id="pricing-json-error" className="text-xs text-rose-300">
            {jsonError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-400"
          onClick={handleApplyJson}
        >
          Apply JSON to form
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-white/30 px-4 text-sm text-white hover:bg-white/10"
          onClick={() => handleTabChange("guided")}
        >
          Return to guided editor
        </Button>
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-white">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag
                variant={statusVariant}
                className={cn(
                  "rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium",
                  status === "saved" && "bg-emerald-500/20 text-emerald-100",
                  status === "error" && "bg-rose-500/20 text-rose-100"
                )}
              >
                {statusLabel}
              </Tag>
              {progressMessage ? (
                <span className="text-xs text-white/70" role="status">
                  {progressMessage}
                </span>
              ) : null}
            </div>
            {fieldErrors.root ? (
              <span className="text-xs text-rose-300">{fieldErrors.root}</span>
            ) : null}
            <p className="text-xs text-white/60">
              Save regularly to push updates to pricing services. Import JSON from finance or export to share with operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-white hover:bg-white/10"
              onClick={handleImportClick}
            >
              Import JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-white hover:bg-white/10"
              onClick={handleExport}
            >
              Export JSON
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70">
          <div className="flex gap-2 border-b border-white/10 bg-slate-900/50 p-2" role="tablist">
            {[{ id: "guided", label: "Guided form" }, { id: "json", label: "Advanced JSON" }].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`pricing-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`pricing-panel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-emerald-500/20 text-white shadow-inner"
                      : "text-white/60 hover:bg-white/10"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div
            id={`pricing-panel-${activeTab}`}
            className="space-y-4 p-5"
            role="tabpanel"
            aria-labelledby={`pricing-tab-${activeTab}`}
          >
            {activeTab === "guided" ? guidedTab : jsonTab}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
        >
          Save pricing
        </Button>
        <span className="text-xs text-white/60">
          Updates apply immediately to rental quotes after saving.
        </span>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </form>
  );
}
