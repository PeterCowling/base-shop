"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import type { ActionFeedback } from "./useCatalogConsole.client";

type CatalogSubmissionPanelProps = {
  busy: boolean;
  submissionAction?: "export" | "upload" | null;
  selectedCount: number;
  maxProducts: number;
  maxBytes?: number;
  minImageEdge?: number;
  r2Destination?: string;
  uploadUrl?: string;
  feedback?: ActionFeedback | null;
  onUploadUrlChange?: (value: string) => void;
  onUploadToR2?: () => void;
  onExport: () => void;
  onClear: () => void;
};

function SubmissionFeedback({ feedback }: { feedback: ActionFeedback | null }) {
  if (!feedback) return null;

  return (
    <div
      role={feedback.kind === "error" ? "alert" : "status"}
      aria-live={feedback.kind === "error" ? "assertive" : "polite"}
      className={feedback.kind === "error" ? "text-sm text-danger-fg" : "text-sm text-success-fg"}
      // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
      data-testid="catalog-submission-feedback"
    >
      {feedback.message}
    </div>
  );
}

function SubmissionRules({
  t,
  maxProducts,
  maxMb,
  minImageEdge,
}: {
  t: ReturnType<typeof useUploaderI18n>["t"];
  maxProducts: number;
  maxMb: number;
  minImageEdge: number;
}) {
  return (
    <div className="mt-4 text-sm text-gate-muted">
      <div className="text-xs uppercase tracking-label-lg">{t("submissionRulesTitle")}</div>
      <ul className="mt-2 list-disc space-y-1 ps-5">
        <li>{t("submissionRuleMaxProducts", { max: maxProducts })}</li>
        <li>{t("submissionRuleMaxSize", { maxMb })}</li>
        <li>{t("submissionRuleLocalRun")}</li>
        <li>{t("submissionRuleImageSpec", { minEdge: minImageEdge })}</li>
        <li>{t("submissionRuleNewLink")}</li>
      </ul>
    </div>
  );
}

function deriveSubmissionState({
  busy,
  selectedCount,
  maxProducts,
  maxBytes,
  uploadUrl,
  uploadSectionEnabled,
}: {
  busy: boolean;
  selectedCount: number;
  maxProducts: number;
  maxBytes: number;
  uploadUrl: string;
  uploadSectionEnabled: boolean;
}) {
  const disabled = busy || selectedCount < 1 || selectedCount > maxProducts;
  return {
    disabled,
    maxMb: Math.max(1, Math.round(maxBytes / 1024 / 1024)),
    uploadDisabled: !uploadSectionEnabled || disabled || !uploadUrl.trim(),
  };
}

export function CatalogSubmissionPanel({
  busy,
  submissionAction = null,
  selectedCount,
  maxProducts,
  maxBytes = 250 * 1024 * 1024,
  minImageEdge = 1600,
  r2Destination = "storage://<destination>/submissions/",
  uploadUrl,
  feedback = null,
  onUploadUrlChange,
  onUploadToR2,
  onExport,
  onClear,
}: CatalogSubmissionPanelProps) {
  const { t } = useUploaderI18n();
  const exportButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const uploadSectionEnabled = Boolean(onUploadUrlChange && onUploadToR2);
  const uploadFieldValue = uploadUrl ?? "";
  const { disabled, uploadDisabled, maxMb } = deriveSubmissionState({
    busy,
    selectedCount,
    maxProducts,
    maxBytes,
    uploadUrl: uploadFieldValue,
    uploadSectionEnabled,
  });

  React.useEffect(() => {
    if (feedback?.kind === "error") {
      exportButtonRef.current?.focus();
    }
  }, [feedback?.kind]);

  return (
    <section className="rounded-xl border border-border-2 bg-surface p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-label-lg text-gate-muted">
            {t("submissionTitle")}
          </div>
          <div className="text-sm text-gate-muted">
            {t("submissionHint", { count: selectedCount, max: maxProducts })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            disabled={busy || selectedCount === 0}
            // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
            className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase tracking-label text-gate-ink transition hover:underline disabled:opacity-60"
          >
            {t("clearSelection")}
          </button>
          <button
            ref={exportButtonRef}
            type="button"
            onClick={onExport}
            disabled={disabled}
            // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
            className="rounded-md border border-gate-ink bg-gate-ink px-4 py-2 text-xs font-semibold uppercase tracking-label text-primary-fg disabled:opacity-60"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-export-zip"
          >
            {submissionAction === "export" ? t("exporting") : t("exportZip")}
          </button>
        </div>
      </div>

      <SubmissionRules t={t} maxProducts={maxProducts} maxMb={maxMb} minImageEdge={minImageEdge} />

      {uploadSectionEnabled ? (
        <div className="mt-6 border-t border-border-2 pt-6">
          <div className="text-xs uppercase tracking-label-lg text-gate-muted">
            {t("r2UploadTitle")}
          </div>
          <div className="mt-2 text-sm text-gate-muted">
            {t("r2DestinationLabel")}: <span className="font-mono text-xs">{r2Destination}</span>
          </div>

          <label className="mt-3 block text-xs uppercase tracking-label text-gate-muted">
            {t("r2UploadUrlLabel")}
            <input
              value={uploadFieldValue}
              onChange={(event) => onUploadUrlChange?.(event.target.value)}
              className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-gate-ink/20"
              placeholder={t("r2UploadUrlPlaceholder")}
            />
          </label>
          <div className="mt-2 text-sm text-gate-muted">
            {t("r2UploadHint")}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onUploadToR2?.()}
              disabled={uploadDisabled}
              // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
              className="rounded-md border border-gate-ink bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-label text-gate-ink disabled:opacity-60"
            >
              {submissionAction === "upload" ? t("uploadingToR2") : t("uploadToR2")}
            </button>
            <SubmissionFeedback feedback={feedback} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
