"use client";

import * as React from "react";

import {
  type CatalogProductDraftInput,
  splitList,
} from "@acme/lib/xa/catalogAdminSchema";

import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import type { SaveResult } from "./catalogConsoleActions";
import { CatalogProductBaseFields } from "./CatalogProductBaseFields.client";
import { CatalogProductClothingFields } from "./CatalogProductClothingFields.client";
import {
  AdditionalImagesPanel,
  ImageDropZone,
  MainImagePanel,
  useImageUploadController,
} from "./CatalogProductImagesFields.client";
import { CatalogProductJewelryFields } from "./CatalogProductJewelryFields.client";
import { BTN_DANGER_CLASS, BTN_PRIMARY_CLASS, PANEL_CLASS } from "./catalogStyles";
import { getCatalogDraftWorkflowReadiness } from "./catalogWorkflow";
import type { ActionFeedback } from "./useCatalogConsole.client";

type SaveButtonState = "idle" | "saving" | "saved";

type ImageEntry = { path: string; filename: string; isMain: boolean };

function parseImageEntries(files: string): ImageEntry[] {
  return splitList(files).map((path, index) => ({
    path,
    filename: path.split("/").pop() ?? path,
    isMain: index === 0,
  }));
}

function StatusDot({
  publishState,
  dataReady,
  publishReady,
  hasImages,
  t,
}: {
  publishState: CatalogProductDraftInput["publishState"];
  dataReady: boolean;
  publishReady: boolean;
  hasImages: boolean;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const label = !dataReady
    ? t("workflowDataRequired")
    : !publishReady
      ? t("workflowDraftOnly")
      : publishState === "out_of_stock"
        ? t("workflowOutOfStock")
        : publishState === "live"
          ? t("workflowLive")
          : t("workflowReadyForLive");
  const dotClass = !dataReady
    ? "bg-gate-status-incomplete"
    : !publishReady
      ? "bg-gate-status-draft"
      : publishState === "out_of_stock"
        ? "bg-warning"
        : "bg-gate-status-ready";
  return (
    <div className="flex items-center gap-2 text-xs text-gate-muted">
      <span className={`inline-block h-2 w-2 rounded-full animate-pulse-slow ${dotClass}`} />
      <span>{label}</span>
      {!publishReady && dataReady && !hasImages ? (
        <span className="text-2xs text-gate-muted">
          {t("workflowImageRequired")}
        </span>
      ) : null}
    </div>
  );
}

function useSaveButtonTransition(params: {
  busy: boolean;
  onSavedFeedback?: () => void;
  onSave: () => Promise<SaveResult>;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const { busy, onSavedFeedback, onSave, t } = params;
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
    }, 2000);
  }, [busy, clearSaveAdvanceTimer, onSave, onSavedFeedback, saveButtonState]);

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

function UploadStatusMessages({
  hasSlug,
  pendingPreviewUrl,
  uploadStatus,
  uploadError,
  autosaveInlineMessage,
  autosaveStatus,
  fieldErrors,
  t,
}: {
  hasSlug: boolean;
  pendingPreviewUrl: string | null;
  uploadStatus: string;
  uploadError: string;
  autosaveInlineMessage: string | null;
  autosaveStatus: "saving" | "saved" | "unsaved";
  fieldErrors: Record<string, string>;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  return (
    <>
      {pendingPreviewUrl ? (
        <div className="text-xs text-gate-accent">{t("uploadImagePending")}</div>
      ) : !hasSlug ? (
        <div className="text-xs text-gate-muted">{t("uploadImageErrorNoSlug")}</div>
      ) : null}
      {uploadStatus === "persisting" ? (
        <div className="text-xs text-gate-accent">
          {autosaveStatus === "saving" ? t("uploadImagePersisting") : t("uploadImagePersistPending")}
        </div>
      ) : null}
      {uploadStatus === "persisted" ? (
        <div className="text-xs text-success-fg">{t("uploadImagePersisted")}</div>
      ) : null}
      {uploadStatus === "error" && uploadError ? (
        <div className="text-xs text-danger-fg">{uploadError}</div>
      ) : null}
      {autosaveInlineMessage ? (
        <div className="text-xs text-danger-fg">{autosaveInlineMessage}</div>
      ) : null}
      {fieldErrors.imageFiles ? <div className="text-xs text-danger-fg">{fieldErrors.imageFiles}</div> : null}
    </>
  );
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
  const hasSlug = (draft.slug ?? "").trim().length > 0;
  const imageEntries = React.useMemo(() => parseImageEntries(draft.imageFiles ?? ""), [draft.imageFiles]);
  const autosaveCopy =
    autosaveStatus === "saving"
      ? t("autosaveStatusSaving")
      : autosaveStatus === "unsaved"
        ? `${t("autosaveStatusUnsaved")} ${t("autosaveStatusManualSaveHint")}`
        : t("autosaveStatusSaved");
  const { handleSaveClick, saveButtonClass, saveButtonLabel, saveButtonDisabled, cancelPendingSaveAdvance } =
    useSaveButtonTransition({
      busy,
      onSave,
      onSavedFeedback,
      t,
    });
  const {
    fileInputRef,
    dragOver,
    uploadStatus,
    uploadError,
    pendingPreviewUrl,
    canUpload,
    isUploading,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleRemoveImage,
    handleMakeMainImage,
    handleReorderImage,
  } = useImageUploadController({
    draft,
    storefront,
    hasSlug,
    imageEntries,
    lastAutosaveSavedAt,
    onChange: onChangeDraft,
    onImageUploaded: onSaveWithDraft,
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
        <div className="flex justify-end">
          <StatusDot
            publishState={draft.publishState}
            dataReady={readiness.isDataReady}
            publishReady={readiness.isPublishReady}
            hasImages={readiness.hasImages}
            t={t}
          />
        </div>
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-label-lg text-gate-muted">{t("imagesFieldsTitle")}</div>

          <ImageDropZone
            canUpload={canUpload}
            isUploading={isUploading}
            dragOver={dragOver}
            hasImages={imageEntries.length > 0}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileInput={handleFileInput}
            t={t}
          />

          <UploadStatusMessages
            hasSlug={hasSlug}
            pendingPreviewUrl={pendingPreviewUrl}
            uploadStatus={uploadStatus}
            uploadError={uploadError}
            autosaveInlineMessage={autosaveInlineMessage}
            autosaveStatus={autosaveStatus}
            fieldErrors={fieldErrors}
            t={t}
          />

          <MainImagePanel entry={imageEntries[0]} pendingPreviewUrl={pendingPreviewUrl} onRemove={handleRemoveImage} />

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

          <AdditionalImagesPanel
            entries={imageEntries.slice(1)}
            onRemove={handleRemoveImage}
            onMakeMain={handleMakeMainImage}
            onReorder={handleReorderImage}
          />

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
      </div>
    </section>
  );
}
