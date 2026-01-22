"use client";

import { useCallback, useState } from "react";

import { Inline } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";
import { type PricingMatrix } from "@acme/types";

import { Tag,Toast } from "@/components/atoms";
import { Button, Input } from "@/components/atoms/shadcn";

import PricingCoverageSection from "./PricingCoverageSection";
import PricingDamageSection from "./PricingDamageSection";
import PricingDurationSection from "./PricingDurationSection";
import PricingJsonEditor from "./PricingJsonEditor";
import { type PricingFormTab,usePricingFormState } from "./usePricingFormState";

interface Props {
  shop: string;
  initial: PricingMatrix;
}

const tabs: { id: PricingFormTab }[] = [
  { id: "guided" },
  { id: "json" },
];

// Non-UI string constants
const BASE_RATE_ID = "base-daily-rate"; // i18n-exempt -- CMS-1010 control id, not user-facing copy [ttl=2026-03-31]
const BASE_RATE_ERROR_ID = "base-daily-rate-error"; // i18n-exempt -- CMS-1010 aria-describedby id, not user-facing copy [ttl=2026-03-31]
const JSON_MIME_ACCEPT = ".json,application/json"; // i18n-exempt -- CMS-1010 MIME types for file input [ttl=2026-03-31]
const TAG_CLASS = "rounded-lg px-3 py-1 text-xs font-medium"; // i18n-exempt -- CMS-1010 utility class names [ttl=2026-03-31]
const TAB_BASE_CLASS = "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition"; // i18n-exempt -- CMS-1010 utility class names [ttl=2026-03-31]
const TAB_ACTIVE_CLASS = "bg-success/20 text-foreground shadow-inner"; // i18n-exempt -- CMS-1010 utility class names [ttl=2026-03-31]
const TAB_INACTIVE_CLASS = "text-muted-foreground hover:bg-surface-3"; // i18n-exempt -- CMS-1010 utility class names [ttl=2026-03-31]

export default function PricingForm({ shop, initial }: Props) {
  const t = useTranslations();
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
          <label className="text-sm font-medium text-foreground" htmlFor={BASE_RATE_ID}>
            {t("cms.pricing.baseDailyRate")}
          </label>
          <Input
            id={BASE_RATE_ID}
            type="number"
            min={0}
            step="0.01"
            value={baseRate}
            onChange={onBaseRateChange}
            aria-invalid={baseRateError ? "true" : undefined}
            aria-describedby={baseRateError ? BASE_RATE_ERROR_ID : undefined}
            className="bg-surface-2 text-foreground"
          />
          <p className="text-xs text-muted-foreground">{t("cms.pricing.baseDailyRate.help")}</p>
          {baseRateError ? (
            <p id={BASE_RATE_ERROR_ID} className="text-xs text-danger-foreground">
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

      <section className="rounded-xl border border-border-1 bg-surface-2 p-4">
        <h3 className="text-sm font-semibold text-foreground">{t("cms.pricing.checklist.title")}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>{t("cms.pricing.checklist.item.verifyBaseRate")}</li>
          <li>{t("cms.pricing.checklist.item.longStayDiscounts")}</li>
          <li>{t("cms.pricing.checklist.item.damageCodes")}</li>
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
        accept={JSON_MIME_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="space-y-5 rounded-2xl border border-border-1 bg-surface-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag
                variant={statusVariant}
                className={cn(TAG_CLASS)}
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
            <p className="text-xs text-muted-foreground">{t("cms.pricing.toolbar.help")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
              onClick={handleImportClick}
            >
              {t("cms.pricing.toolbar.importJSON")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
              onClick={handleExport}
            >
              {t("cms.pricing.toolbar.exportJSON")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border-1 bg-surface-2">
          <Inline gap={2} className="border-b border-border-1 bg-surface-2 p-2" role="tablist">
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
                    TAB_BASE_CLASS,
                    isActive ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                  )}
                >
                  {tab.id === "guided" ? t("cms.pricing.tabs.guided") : t("cms.pricing.tabs.json")}
                </button>
              );
            })}
          </Inline>
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
          className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
        >
          {t("cms.pricing.save")}
        </Button>
        <span className="text-xs text-muted-foreground">{t("cms.pricing.saveNotice")}</span>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </form>
  );
}
