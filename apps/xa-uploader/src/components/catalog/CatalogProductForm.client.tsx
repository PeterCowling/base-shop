"use client";

import * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import type { SaveResult } from "./catalogConsoleActions";
import { CatalogProductBaseFields } from "./CatalogProductBaseFields.client";
import { CatalogProductClothingFields } from "./CatalogProductClothingFields.client";
import { CatalogProductImagesFields } from "./CatalogProductImagesFields.client";
import { CatalogProductJewelryFields } from "./CatalogProductJewelryFields.client";
import { BTN_DANGER_CLASS, BTN_PRIMARY_CLASS, PANEL_CLASS } from "./catalogStyles";
import { getCatalogDraftWorkflowReadiness } from "./catalogWorkflow";
import type { ActionFeedback } from "./useCatalogConsole.client";

type FormStepId = "product" | "images";
type SaveButtonState = "idle" | "saving" | "saved";

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
      ? "flex h-7 w-7 items-center justify-center rounded-full border border-gate-border text-xs text-gate-muted"
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
  missingRoles,
  t,
}: {
  publishState: CatalogProductDraftInput["publishState"];
  dataReady: boolean;
  publishReady: boolean;
  missingRoles: string[];
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
      <span>{label}</span>
      {!publishReady && dataReady && missingRoles.length > 0 ? (
        <span className="text-2xs text-gate-muted">
          {t("workflowMissingRoles", { roles: missingRoles.join(", ") })}
        </span>
      ) : null}
    </div>
  );
}

function useSaveButtonTransition(params: {
  busy: boolean;
  canOpenImageStep: boolean;
  onAdvanceToImages: () => void;
  onSavedFeedback?: () => void;
  onSave: () => Promise<SaveResult>;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const { busy, canOpenImageStep, onAdvanceToImages, onSavedFeedback, onSave, t } = params;
  const [saveButtonState, setSaveButtonState] = React.useState<SaveButtonState>("idle");
  const saveAdvanceTimerRef = React.useRef<number | null>(null);
  const clearSaveAdvanceTimer = React.useCallback(() => {
    if (saveAdvanceTimerRef.current !== null) {
      window.clearTimeout(saveAdvanceTimerRef.current);
      saveAdvanceTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearSaveAdvanceTimer();
    };
  }, [clearSaveAdvanceTimer]);

  const handleSaveClick = React.useCallback(async () => {
    if (saveButtonState === "saving" || saveButtonState === "saved" || busy) return;
    setSaveButtonState("saving");
    const result = await onSave();
    if (result.status !== "saved") {
      setSaveButtonState("idle");
      return;
    }

    setSaveButtonState("saved");
    clearSaveAdvanceTimer();
    saveAdvanceTimerRef.current = window.setTimeout(() => {
      saveAdvanceTimerRef.current = null;
      setSaveButtonState("idle");
      onSavedFeedback?.();
      if (canOpenImageStep) onAdvanceToImages();
    }, 2000);
  }, [
    busy,
    canOpenImageStep,
    clearSaveAdvanceTimer,
    onAdvanceToImages,
    onSave,
    onSavedFeedback,
    saveButtonState,
  ]);

  const cancelPendingSaveAdvance = React.useCallback(() => {
    clearSaveAdvanceTimer();
    setSaveButtonState((current) => (current === "saved" ? "idle" : current));
  }, [clearSaveAdvanceTimer]);

  const saveButtonClass =
    saveButtonState === "saved"
      ? "rounded-md border border-success-fg bg-success-bg px-4 py-2 text-xs font-semibold uppercase tracking-label text-success-fg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-fg focus-visible:ring-offset-2"
      : BTN_PRIMARY_CLASS;
  const saveButtonLabel =
    saveButtonState === "saved"
      ? t("saveButtonSaved")
      : saveButtonState === "saving"
        ? t("saving")
        : t("saveAsDraft");
  const saveButtonDisabled = busy || saveButtonState === "saving" || saveButtonState === "saved";

  return { handleSaveClick, saveButtonClass, saveButtonLabel, saveButtonDisabled, cancelPendingSaveAdvance };
}

export function CatalogProductForm({
  selectedSlug,
  draft,
  storefront,
  fieldErrors,
  monoClassName,
  busy,
  autosaveInlineMessage,
  autosaveStatus,
  lastAutosaveSavedAt,
  feedback,
  onChangeDraft,
  onSave,
  onSavedFeedback,
  onSaveWithDraft,
  onDelete,
}: {
  selectedSlug: string | null;
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  busy: boolean;
  autosaveInlineMessage: string | null;
  autosaveStatus: "saving" | "saved" | "unsaved";
  lastAutosaveSavedAt: number | null;
  feedback: ActionFeedback | null;
  onChangeDraft: (draft: CatalogProductDraftInput) => void;
  onSave: () => Promise<SaveResult>;
  onSavedFeedback?: () => void;
  onSaveWithDraft: (nextDraft: CatalogProductDraftInput) => void;
  onDelete: () => void;
}) {
  const { t } = useUploaderI18n();
  const category = draft.taxonomy.category;
  const readiness = React.useMemo(() => getCatalogDraftWorkflowReadiness(draft), [draft]);
  const missingRoles = React.useMemo(() => {
    if (!("missingRoles" in readiness)) return [];
    if (!Array.isArray(readiness.missingRoles)) return [];
    return readiness.missingRoles.map(String);
  }, [readiness]);
  const [step, setStep] = React.useState<FormStepId>("product");
  const canOpenImageStep = readiness.isDataReady;
  const autosaveCopy =
    autosaveStatus === "saving"
      ? t("autosaveStatusSaving")
      : autosaveStatus === "unsaved"
        ? `${t("autosaveStatusUnsaved")} ${t("autosaveStatusManualSaveHint")}`
        : t("autosaveStatusSaved");

  React.useEffect(() => {
    setStep("product");
  }, [selectedSlug]);
  const { handleSaveClick, saveButtonClass, saveButtonLabel, saveButtonDisabled, cancelPendingSaveAdvance } =
    useSaveButtonTransition({
      busy,
      canOpenImageStep,
      onAdvanceToImages: () => setStep("images"),
      onSave,
      onSavedFeedback,
      t,
    });
  const handleDeleteClick = React.useCallback(() => {
    cancelPendingSaveAdvance();
    onDelete();
  }, [cancelPendingSaveAdvance, onDelete]);

  return (
    <section className={PANEL_CLASS}>
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

      <p
        className={`mt-3 text-xs ${
          autosaveStatus === "unsaved"
            ? "text-danger-fg"
            : autosaveStatus === "saving"
              ? "text-gate-accent"
              : "text-success-fg"
        }`}
      >
        {autosaveCopy}
      </p>

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
              missingRoles={missingRoles}
              t={t}
            />
          </div>
        </div>

        {step === "product" ? (
          <div className="space-y-4">
            <CatalogProductBaseFields
              selectedSlug={selectedSlug}
              draft={draft}
              fieldErrors={fieldErrors}
              monoClassName={monoClassName}
              sections={["identity", "taxonomy"]}
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
            <div className="flex items-center justify-between">
              <div>
                {selectedSlug ? (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={busy}
                    className={BTN_DANGER_CLASS}
                  >
                    {t("delete")}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleSaveClick()}
                disabled={saveButtonDisabled}
                className={saveButtonClass}
                // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
                data-testid="catalog-save-details"
                // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 e2e selector
                data-cy="catalog-save-details"
              >
                {saveButtonLabel}
              </button>
            </div>
          </div>
        ) : null}

        {step === "images" ? (
          canOpenImageStep ? (
            <CatalogProductImagesFields
              draft={draft}
              storefront={storefront}
              fieldErrors={fieldErrors}
              autosaveInlineMessage={autosaveInlineMessage}
              autosaveStatus={autosaveStatus}
              lastAutosaveSavedAt={lastAutosaveSavedAt}
              onChange={onChangeDraft}
              onImageUploaded={onSaveWithDraft}
            />
          ) : (
            <div className="rounded-md border border-gate-border bg-muted px-4 py-3 text-sm text-gate-muted">
              {t("workflowImageBlocked")}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
