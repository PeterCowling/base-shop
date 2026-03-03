"use client";

import * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogProductBaseFields } from "./CatalogProductBaseFields.client";
import { CatalogProductClothingFields } from "./CatalogProductClothingFields.client";
import { CatalogProductImagesFields } from "./CatalogProductImagesFields.client";
import { CatalogProductJewelryFields } from "./CatalogProductJewelryFields.client";
import { BTN_DANGER_CLASS, PANEL_CLASS } from "./catalogStyles";
import { getCatalogDraftWorkflowReadiness } from "./catalogWorkflow";
import type { ActionFeedback } from "./useCatalogConsole.client";

type FormStepId = "product" | "images";

function StepIndicator({
  stepNumber,
  label,
  active,
  disabled,
  onClick,
}: {
  stepNumber: number;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const circleClass = active
    ? "flex h-7 w-7 items-center justify-center rounded-full bg-gate-accent text-xs font-semibold text-gate-on-accent"
    : disabled
      ? "flex h-7 w-7 items-center justify-center rounded-full border border-border-2 text-xs text-gate-muted"
      : "flex h-7 w-7 items-center justify-center rounded-full border border-gate-ink text-xs text-gate-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool stepper
      className="group flex items-center gap-2 disabled:cursor-default"
    >
      <span className={circleClass}>{stepNumber}</span>
      <span
        className={`text-xs uppercase tracking-label transition-colors ${
          active ? "font-semibold text-gate-accent" : disabled ? "text-gate-muted" : "text-gate-ink group-hover:text-gate-accent"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function StatusDot({
  publishState,
  dataReady,
  publishReady,
  t,
}: {
  publishState: CatalogProductDraftInput["publishState"];
  dataReady: boolean;
  publishReady: boolean;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const label = publishState === "live"
    ? t("workflowLive")
    : publishReady
      ? t("workflowReadyForLive")
      : dataReady
        ? t("workflowDraftOnly")
        : t("workflowDataRequired");
  const dotClass = publishState === "live"
    ? "bg-gate-status-ready"
    : publishReady
      ? "bg-gate-status-ready"
      : dataReady
        ? "bg-gate-status-draft"
        : "bg-gate-status-incomplete";
  return (
    <div className="flex items-center gap-2 text-xs text-gate-muted">
      <span className={`inline-block h-2 w-2 rounded-full animate-pulse-slow ${dotClass}`} />
      {label}
    </div>
  );
}

export function CatalogProductForm({
  selectedSlug,
  draft,
  fieldErrors,
  monoClassName,
  busy,
  feedback,
  onChangeDraft,
  onSave: _onSave,
  onDelete,
}: {
  selectedSlug: string | null;
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  busy: boolean;
  feedback: ActionFeedback | null;
  onChangeDraft: (draft: CatalogProductDraftInput) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { t } = useUploaderI18n();
  const category = draft.taxonomy.category;
  const readiness = React.useMemo(() => getCatalogDraftWorkflowReadiness(draft), [draft]);
  const [step, setStep] = React.useState<FormStepId>("product");
  const canOpenImageStep = readiness.isDataReady;

  React.useEffect(() => {
    setStep("product");
  }, [selectedSlug]);

  return (
    <section className={PANEL_CLASS}>
      {selectedSlug ? (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className={BTN_DANGER_CLASS}
          >
            {t("delete")}
          </button>
        </div>
      ) : null}

      {feedback ? (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={feedback.kind === "error" ? "mt-4 text-sm text-danger-fg" : "mt-4 text-sm text-success-fg"}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-draft-feedback"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <StepIndicator
            stepNumber={1}
            label={t("workflowStepProduct")}
            active={step === "product"}
            onClick={() => setStep("product")}
          />
          <div className="hidden h-px w-8 bg-border-2 sm:block" />
          <StepIndicator
            stepNumber={2}
            label={t("workflowStepImages")}
            active={step === "images"}
            disabled={!canOpenImageStep}
            onClick={() => canOpenImageStep && setStep("images")}
          />
          <div className="ms-auto">
            <StatusDot
              publishState={draft.publishState}
              dataReady={readiness.isDataReady}
              publishReady={readiness.isPublishReady}
              t={t}
            />
          </div>
        </div>

        {step === "product" ? (
          <div className="space-y-4">
            <CatalogProductBaseFields
              draft={draft}
              fieldErrors={fieldErrors}
              monoClassName={monoClassName}
              sections={["identity", "taxonomy", "commercial"]}
              onChange={onChangeDraft}
            />
            {category === "clothing" ? (
              <CatalogProductClothingFields
                draft={draft}
                fieldErrors={fieldErrors}
                onChange={onChangeDraft}
              />
            ) : null}
            {/* Bag-specific derived fields (closure type, interior, fits) now rendered in TaxonomyFields */}
            {category === "jewelry" ? (
              <CatalogProductJewelryFields
                draft={draft}
                fieldErrors={fieldErrors}
                onChange={onChangeDraft}
              />
            ) : null}
          </div>
        ) : null}

        {step === "images" ? (
          canOpenImageStep ? (
            <CatalogProductImagesFields
              draft={draft}
              fieldErrors={fieldErrors}
              onChange={onChangeDraft}
            />
          ) : (
            <div className="rounded-md border border-border-2 bg-muted px-4 py-3 text-sm text-gate-muted">
              {t("workflowImageBlocked")}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
