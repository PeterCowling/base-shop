"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader submission panel pending design/i18n overhaul */

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogSubmissionPanel({
  busy,
  submissionAction = null,
  selectedCount,
  maxProducts,
  maxBytes = 250 * 1024 * 1024,
  minImageEdge = 1600,
  r2Destination = "r2://<bucket>/submissions/",
  uploadUrl,
  submissionStatus = null,
  onUploadUrlChange,
  onUploadToR2,
  onExport,
  onClear,
}: {
  busy: boolean;
  submissionAction?: "export" | "upload" | null;
  selectedCount: number;
  maxProducts: number;
  maxBytes?: number;
  minImageEdge?: number;
  r2Destination?: string;
  uploadUrl?: string;
  submissionStatus?: string | null;
  onUploadUrlChange?: (value: string) => void;
  onUploadToR2?: () => void;
  onExport: () => void;
  onClear: () => void;
}) {
  const { t } = useUploaderI18n();
  const disabled = busy || selectedCount < 1 || selectedCount > maxProducts;
  const uploadFieldValue = uploadUrl ?? "";
  const uploadSectionEnabled = Boolean(onUploadUrlChange && onUploadToR2);
  const uploadDisabled = !uploadSectionEnabled || disabled || !uploadFieldValue.trim();
  const maxMb = Math.max(1, Math.round(maxBytes / 1024 / 1024));

  return (
    <section className="rounded-xl border border-border-2 bg-white p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
            {t("submissionTitle")}
          </div>
          <div className="text-sm text-[color:var(--gate-muted)]">
            {t("submissionHint", { count: selectedCount, max: maxProducts })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            disabled={busy || selectedCount === 0}
            className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] transition hover:underline disabled:opacity-60"
          >
            {t("clearSelection")}
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={disabled}
            className="rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-60"
          >
            {submissionAction === "export" ? t("exporting") : t("exportZip")}
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-[color:var(--gate-muted)]">
        <div className="text-xs uppercase tracking-[0.35em]">{t("submissionRulesTitle")}</div>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>{t("submissionRuleMaxProducts", { max: maxProducts })}</li>
          <li>{t("submissionRuleMaxSize", { maxMb })}</li>
          <li>{t("submissionRuleLocalRun")}</li>
          <li>{t("submissionRuleImageSpec", { minEdge: minImageEdge })}</li>
          <li>{t("submissionRuleNewLink")}</li>
        </ul>
      </div>

      {uploadSectionEnabled ? (
        <div className="mt-6 border-t border-border-2 pt-6">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
            {t("r2UploadTitle")}
          </div>
          <div className="mt-2 text-sm text-[color:var(--gate-muted)]">
            {t("r2DestinationLabel")}: <span className="font-mono text-xs">{r2Destination}</span>
          </div>

          <label className="mt-3 block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            {t("r2UploadUrlLabel")}
            <input
              value={uploadFieldValue}
              onChange={(event) => onUploadUrlChange?.(event.target.value)}
              className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gate-ink)]/20"
              placeholder={t("r2UploadUrlPlaceholder")}
            />
          </label>
          <div className="mt-2 text-sm text-[color:var(--gate-muted)]">
            {t("r2UploadHint")}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onUploadToR2?.()}
              disabled={uploadDisabled}
              className="rounded-md border border-[color:var(--gate-ink)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--gate-ink)] disabled:opacity-60"
            >
              {submissionAction === "upload" ? t("uploadingToR2") : t("uploadToR2")}
            </button>
            {submissionStatus ? (
              <div className="text-sm text-[color:var(--gate-muted)]">{submissionStatus}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
