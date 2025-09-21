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
          <label className="text-sm font-medium text-foreground" htmlFor="base-daily-rate">
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
            className="bg-surface-2 text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            This rate is used whenever a SKU does not specify its own price.
          </p>
          {baseRateError ? (
            <p id="base-daily-rate-error" className="text-xs text-danger-foreground">
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

      <section className="rounded-xl border border-border/10 bg-surface-2 p-4">
        <h3 className="text-sm font-semibold text-foreground">Need a quick checklist?</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
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
    <form onSubmit={onSubmit} className="space-y-6 text-foreground">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="space-y-5 rounded-2xl border border-border/10 bg-surface-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag
                variant={statusVariant}
                className={cn("rounded-lg px-3 py-1 text-xs font-medium")}
              >
                {statusLabel}
              </Tag>
              {progressMessage ? (
                <span className="text-xs text-muted-foreground" role="status">
                  {progressMessage}
                </span>
              ) : null}
            </div>
            {rootError ? <span className="text-xs text-danger-foreground">{rootError}</span> : null}
            <p className="text-xs text-muted-foreground">
              Save regularly to push updates to pricing services. Import JSON from finance or export to share with operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
              onClick={handleImportClick}
            >
              Import JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
              onClick={handleExport}
            >
              Export JSON
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/10 bg-surface-2">
          <div className="flex gap-2 border-b border-border/10 bg-surface-2 p-2" role="tablist">
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
                      ? "bg-success/20 text-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-surface-3"
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
          className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-lg hover:bg-success/90"
        >
          Save pricing
        </Button>
        <span className="text-xs text-muted-foreground">
          Updates apply immediately to rental quotes after saving.
        </span>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </form>
  );
}
