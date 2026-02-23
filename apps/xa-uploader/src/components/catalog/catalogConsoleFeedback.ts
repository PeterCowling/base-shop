import type * as React from "react";

import type { CatalogProductDraftInput } from "../../lib/catalogAdminSchema";

type SyncScriptId = "validate" | "sync";
type SyncErrorCode = "sync_dependencies_missing" | "validation_failed" | "sync_failed";
type SyncRecoveryCode = "restore_sync_scripts" | "review_validation_logs" | "review_sync_logs";
type CatalogApiErrorCode = "invalid" | "missing_product" | "not_found" | "conflict" | "internal_error";
type ActionDomain = "login" | "draft" | "submission" | "sync";
type ActionFeedbackKind = "error" | "success";

export type SessionState = { authenticated: boolean };

export type CatalogListResponse = {
  ok: boolean;
  products?: CatalogProductDraftInput[];
  revisionsById?: Record<string, string>;
  error?: string;
};

export type ActionFeedback = { kind: ActionFeedbackKind; message: string };
export type ActionFeedbackState = Record<ActionDomain, ActionFeedback | null>;
export type SubmissionAction = "export" | "upload" | null;

export type SyncResponse = {
  ok: boolean;
  error?: SyncErrorCode | string;
  recovery?: SyncRecoveryCode | string;
  missingScripts?: SyncScriptId[];
  logs?: {
    validate?: { code: number; stdout: string; stderr: string };
    sync?: { code: number; stdout: string; stderr: string };
  };
};

export type BusyLockRef = React.MutableRefObject<boolean>;

export function errorToMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function getCatalogApiErrorMessage(
  code: string | undefined,
  fallbackKey: string,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  const normalized = (code ?? "").trim() as CatalogApiErrorCode | "";
  if (normalized === "invalid") return t("apiErrorInvalid");
  if (normalized === "missing_product") return t("apiErrorMissingProduct");
  if (normalized === "not_found") return t("apiErrorNotFound");
  if (normalized === "conflict") return t("apiErrorConflict");
  if (normalized === "internal_error") return t("apiErrorInternal");
  return t(fallbackKey);
}

export function createInitialActionFeedbackState(): ActionFeedbackState {
  return { login: null, draft: null, submission: null, sync: null };
}

export function updateActionFeedback(
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>,
  domain: ActionDomain,
  feedback: ActionFeedback | null,
) {
  setActionFeedback((prev) => ({ ...prev, [domain]: feedback }));
}

export function clearActionFeedbackDomains(
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>,
  domains: ActionDomain[],
) {
  setActionFeedback((prev) => {
    const next = { ...prev };
    for (const domain of domains) {
      next[domain] = null;
    }
    return next;
  });
}

export function tryBeginBusyAction(
  busyLockRef: BusyLockRef,
  setBusy: React.Dispatch<React.SetStateAction<boolean>>,
): boolean {
  if (busyLockRef.current) return false;
  busyLockRef.current = true;
  setBusy(true);
  return true;
}

export function endBusyAction(
  busyLockRef: BusyLockRef,
  setBusy: React.Dispatch<React.SetStateAction<boolean>>,
) {
  busyLockRef.current = false;
  setBusy(false);
}

function getSyncScriptLabel(
  script: SyncScriptId,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  if (script === "validate") return t("syncDependencyValidate");
  return t("syncDependencyPipeline");
}

function getSyncRecoveryMessage(
  recovery: string | undefined,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  if (recovery === "restore_sync_scripts") return t("syncRecoveryRestoreScripts");
  if (recovery === "review_validation_logs") return t("syncRecoveryReviewValidationLogs");
  if (recovery === "review_sync_logs") return t("syncRecoveryReviewSyncLogs");
  return "";
}

export function getSyncFailureMessage(
  data: SyncResponse,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  const recoveryMessage = getSyncRecoveryMessage(data.recovery, t);
  if (data.error === "sync_dependencies_missing") {
    const scripts =
      data.missingScripts && data.missingScripts.length > 0
        ? data.missingScripts.map((script) => getSyncScriptLabel(script, t)).join(", ")
        : t("syncDependenciesUnknown");
    const base = t("syncDependenciesMissing", { scripts });
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "validation_failed") {
    const base = t("syncValidationFailedActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "sync_failed") {
    const base = t("syncPipelineFailedActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  return t("syncFailed");
}
