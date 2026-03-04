"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { formatSyncMissingScripts, type SyncScriptId } from "./catalogConsoleFeedback";
import { BTN_PRIMARY_CLASS, BTN_SECONDARY_CLASS, PANEL_CLASS } from "./catalogStyles";
import type { ActionFeedback } from "./useCatalogConsole.client";

export function CatalogSyncPanel({
  busy,
  syncOptions,
  syncReadiness,
  monoClassName,
  feedback,
  syncOutput,
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
  monoClassName?: string;
  feedback: ActionFeedback | null;
  syncOutput: string | null;
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

  const syncDisabled = busy || syncReadiness.checking || !syncReadiness.ready;

  let readinessMessage = t("syncReadinessChecking");
  let readinessClassName = "text-sm text-gate-muted";
  if (syncReadiness.error) {
    readinessMessage = syncReadiness.error;
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

      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool checkbox group */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {(["strict", "recursive", "replace", "dryRun"] as const).map((key) => (
          <label
            key={key}
            className="inline-flex items-center gap-2 text-xs text-gate-muted"
          >
            <input
              type="checkbox"
              checked={syncOptions[key]}
              onChange={(event) => onChangeSyncOptions({ ...syncOptions, [key]: event.target.checked })}
            />
            {optionLabels[key]}
          </label>
        ))}
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
