"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import {
  deriveCatalogSiteStatus,
  formatSyncMissingScripts,
  type SyncResponse,
  type SyncScriptId,
} from "./catalogConsoleFeedback";
import { BTN_PRIMARY_CLASS, BTN_SECONDARY_CLASS, CHECKBOX_CLASS, PANEL_CLASS, SECTION_HEADER_CLASS } from "./catalogStyles";
import type { ActionFeedback } from "./useCatalogConsole.client";

type Translator = ReturnType<typeof useUploaderI18n>["t"];

function CatalogSiteStatusStrip({
  t,
  lastSyncData,
}: {
  t: Translator;
  lastSyncData: SyncResponse | null | undefined;
}) {
  if (!lastSyncData) return null;

  const status = deriveCatalogSiteStatus(lastSyncData);
  const catalogLabel =
    status.catalog === "published" ? t("syncStatusCatalogPublished") : t("syncStatusCatalogNone");
  const siteLabel = (() => {
    if (status.site === "triggered") return t("syncStatusSiteDeployTriggered");
    if (status.site === "cooldown") return t("syncStatusSiteDeployCooldown");
    if (status.site === "failed") return t("syncStatusSiteDeployFailed");
    if (status.site === "rebuild_required") return t("syncStatusSiteRebuildRequired");
    return t("syncStatusSiteNone");
  })();
  const siteClassName =
    status.site === "none"
      ? "text-gate-muted"
      : status.site === "triggered"
        ? "text-gate-muted"
        : "text-warning-fg";

  return (
    <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gate-muted">
      <span
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
        data-cy="catalog-status-strip-catalog"
      >
        {t("syncStatusCatalogLabel")}: <span className="text-success-fg">{catalogLabel}</span>
      </span>
      <span
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
        data-cy="catalog-status-strip-site"
      >
        {t("syncStatusSiteLabel")}: <span className={siteClassName}>{siteLabel}</span>
      </span>
    </div>
  );
}

export function CatalogSyncPanel({
  busy,
  syncOptions,
  syncReadiness,
  isAutosaveDirty,
  monoClassName,
  feedback,
  syncOutput,
  lastSyncData,
  publishReadiness,
  onSync,
  onRefreshReadiness,
  onChangeSyncOptions,
}: {
  busy: boolean;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  syncReadiness: {
    checking: boolean;
    ready: boolean;
    missingScripts: SyncScriptId[];
    error: string | null;
    contractConfigured?: boolean;
    contractConfigErrors?: string[];
  };
  isAutosaveDirty?: boolean;
  monoClassName?: string;
  feedback: ActionFeedback | null;
  syncOutput: string | null;
  lastSyncData?: SyncResponse | null;
  publishReadiness?: { total: number; publishable: number; draft: number };
  onSync: () => void;
  onRefreshReadiness: () => void;
  onChangeSyncOptions: (next: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean }) => void;
}) {
  const { t } = useUploaderI18n();
  const runSyncButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const optionLabels: Record<keyof typeof syncOptions, string> = {
    strict: t("syncOptionStrict"),
    recursive: t("syncOptionRecursive"),
    replace: t("syncOptionReplace"),
    dryRun: t("syncOptionDryRun"),
  };

  const syncDisabled = busy || Boolean(isAutosaveDirty) || syncReadiness.checking || !syncReadiness.ready;

  let readinessMessage = t("syncReadinessChecking");
  let readinessClassName = "text-sm text-gate-muted";
  if (syncReadiness.error) {
    readinessMessage = syncReadiness.error;
    readinessClassName = "text-sm text-danger-fg";
  } else if (isAutosaveDirty) {
    readinessMessage = t("syncReadinessAutosavePending");
    readinessClassName = "text-sm text-danger-fg";
  } else if (syncReadiness.ready) {
    readinessMessage = t("syncReadinessReady");
  } else if (!syncReadiness.checking && syncReadiness.contractConfigErrors?.length) {
    readinessMessage = `${t("syncPublishContractUnconfigured")} ${t("syncRecoveryConfigureCatalogContract")}`;
    readinessClassName = "text-sm text-danger-fg";
  } else if (!syncReadiness.checking) {
    readinessMessage = `${t("syncDependenciesMissing", {
      scripts: formatSyncMissingScripts(syncReadiness.missingScripts, t),
    })} ${t("syncRecoveryRestoreScripts")}`;
    readinessClassName = "text-sm text-danger-fg";
  }

  React.useEffect(() => {
    if (feedback) {
      runSyncButtonRef.current?.focus();
    }
  }, [feedback]);

  return (
    <section className={PANEL_CLASS}>
      <CatalogSiteStatusStrip t={t} lastSyncData={lastSyncData} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-label-lg text-gate-muted">
          {t("validateAndSync")}
        </div>
        <button
          ref={runSyncButtonRef}
          type="button"
          onClick={onSync}
          disabled={syncDisabled}
           
          className={BTN_PRIMARY_CLASS}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-run-sync"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-cy="catalog-run-sync"
        >
          {busy ? t("running") : t("runSync")}
        </button>
        <button
          type="button"
          onClick={onRefreshReadiness}
          disabled={busy || syncReadiness.checking}
           
          className={BTN_SECONDARY_CLASS}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-sync-readiness-refresh"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-cy="catalog-sync-readiness-refresh"
        >
          {t("syncReadinessRefresh")}
        </button>
      </div>

      <p
        className={`mt-3 ${readinessClassName}`}
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
        data-testid="catalog-sync-readiness"
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
        data-cy="catalog-sync-readiness"
      >
        {readinessMessage}
      </p>

      {publishReadiness ? (
        <p className="mt-2 text-xs text-gate-muted">
          {t("syncPublishReadinessSummary", {
            publishable: publishReadiness.publishable,
            draft: publishReadiness.draft,
            total: publishReadiness.total,
          })}
          {publishReadiness.publishable === 0 ? ` ${t("syncPublishReadinessZero")}` : ""}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <div>
          <div className={SECTION_HEADER_CLASS}>{t("syncOptionGroupValidation")}</div>
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group */}
          <div className="mt-2 flex flex-wrap gap-4">
            {(["strict", "recursive"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs text-gate-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions[key]}
                  onChange={(event) => onChangeSyncOptions({ ...syncOptions, [key]: event.target.checked })}
                  className={CHECKBOX_CLASS}
                />
                {optionLabels[key]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className={SECTION_HEADER_CLASS}>{t("syncOptionGroupRunModifiers")}</div>
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group */}
          <div className="mt-2 flex flex-wrap gap-4">
            {(["replace", "dryRun"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs text-gate-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions[key]}
                  onChange={(event) => onChangeSyncOptions({ ...syncOptions, [key]: event.target.checked })}
                  className={CHECKBOX_CLASS}
                />
                {optionLabels[key]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={feedback.kind === "error" ? "mt-4 text-sm text-danger-fg" : "mt-4 text-sm text-success-fg"}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-sync-feedback"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-cy="catalog-sync-feedback"
        >
          {feedback.message}
        </p>
      ) : null}

      {syncOutput ? (
        <pre
          className={`mt-4 max-h-80 overflow-auto rounded-md border border-gate-border bg-muted p-3 text-xs text-gate-ink ${monoClassName}`}
        >
          {syncOutput}
        </pre>
      ) : null}
    </section>
  );
}
