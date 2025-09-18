"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { Toast, Tag } from "@/components/atoms";
import { type PricingMatrix } from "@acme/types";
import { cn } from "@ui/utils/style";
import { useCallback, useState } from "react";

import PricingCoverageSection from "./PricingCoverageSection";
import PricingDamageSection from "./PricingDamageSection";
import PricingDurationSection from "./PricingDurationSection";
import PricingJsonEditor from "./PricingJsonEditor";
import { usePricingFormState, type PricingFormTab } from "./usePricingFormState";

interface Props {
  shop: string;
  initial: PricingMatrix;
}

const tabs: { id: PricingFormTab; label: string }[] = [
  { id: "guided", label: "Guided form" },
  { id: "json", label: "Advanced JSON" },
];

export default function PricingForm({ shop, initial }: Props) {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const emitToast = useCallback((message: string) => {
    setToast({ open: true, message });
  }, []);

  const closeToast = useCallback(() => setToast({ open: false, message: "" }), []);

  const {
    refs: { fileInputRef },
    baseRate,
    baseRateError,
    onBaseRateChange,
    rootError,
    status,
    statusLabel,
    statusVariant,
    progressMessage,
    activeTab,
    handleTabChange,
    json,
    duration,
    damage,
    coverage,
    handleFileChange,
    handleImportClick,
    handleExport,
    onSubmit,
  } = usePricingFormState({ initial, shop, onToast: emitToast });

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
            onChange={onBaseRateChange}
            aria-invalid={baseRateError ? "true" : undefined}
            aria-describedby={baseRateError ? "base-daily-rate-error" : undefined}
            className="bg-slate-900/80 text-white"
          />
          <p className="text-xs text-white/60">
            This rate is used whenever a SKU does not specify its own price.
          </p>
          {baseRateError ? (
            <p id="base-daily-rate-error" className="text-xs text-rose-300">
              {baseRateError}
            </p>
          ) : null}
        </div>
      </section>

      <PricingDurationSection
        rows={duration.rows}
        onAdd={duration.add}
        onRemove={duration.remove}
        onUpdate={duration.update}
        getErrors={duration.getErrors}
      />

      <PricingDamageSection
        rows={damage.rows}
        onAdd={damage.add}
        onRemove={damage.remove}
        onUpdate={damage.update}
        getErrors={damage.getErrors}
      />

      <PricingCoverageSection rows={coverage.rows} onUpdate={coverage.update} getErrors={coverage.getErrors} />

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
    <PricingJsonEditor
      draft={json.draft}
      error={json.error}
      onDraftChange={json.onDraftChange}
      onApply={json.applyJson}
      onReturnToGuided={() => handleTabChange("guided")}
    />
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
            {rootError ? <span className="text-xs text-rose-300">{rootError}</span> : null}
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
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`pricing-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`pricing-panel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
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

