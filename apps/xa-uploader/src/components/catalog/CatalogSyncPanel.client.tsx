"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader sync panel pending design/i18n overhaul */

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";
import { formatSyncMissingScripts, type SyncScriptId } from "./catalogConsoleFeedback";
import type { ActionFeedback } from "./useCatalogConsole.client";

export function CatalogSyncPanel({
  busy,
  syncOptions,
  syncReadiness,
  monoClassName,
  feedback,
  syncOutput,
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
  };
  monoClassName?: string;
  feedback: ActionFeedback | null;
  syncOutput: string | null;
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
  let readinessClassName = "text-sm text-[color:var(--gate-muted)]";
  if (syncReadiness.error) {
    readinessMessage = syncReadiness.error;
    readinessClassName = "text-sm text-danger-fg";
  } else if (syncReadiness.ready) {
    readinessMessage = t("syncReadinessReady");
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
    <section className="rounded-xl border border-border-2 bg-surface p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
          {t("validateAndSync")}
        </div>
        <button
          ref={runSyncButtonRef}
          type="button"
          onClick={onSync}
          disabled={syncDisabled}
          className="rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-fg disabled:opacity-60"
          data-testid="catalog-run-sync"
          data-cy="catalog-run-sync"
        >
          {busy ? t("running") : t("runSync")}
        </button>
        <button
          type="button"
          onClick={onRefreshReadiness}
          disabled={busy || syncReadiness.checking}
          className="rounded-md border border-border-2 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-[color:var(--gate-ink)] disabled:opacity-60"
          data-testid="catalog-sync-readiness-refresh"
          data-cy="catalog-sync-readiness-refresh"
        >
          {t("syncReadinessRefresh")}
        </button>
      </div>

      <p
        className={`mt-3 ${readinessClassName}`}
        data-testid="catalog-sync-readiness"
        data-cy="catalog-sync-readiness"
      >
        {readinessMessage}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {(["strict", "recursive", "replace", "dryRun"] as const).map((key) => (
          <label
            key={key}
            className="inline-flex items-center gap-2 text-xs text-[color:var(--gate-muted)]"
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
          data-testid="catalog-sync-feedback"
          data-cy="catalog-sync-feedback"
        >
          {feedback.message}
        </p>
      ) : null}

      {syncOutput ? (
        <pre
          className={`mt-4 max-h-80 overflow-auto rounded-md border border-border-2 bg-muted p-3 text-xs text-[color:var(--gate-ink)] ${monoClassName}`}
        >
          {syncOutput}
        </pre>
      ) : null}
    </section>
  );
}
