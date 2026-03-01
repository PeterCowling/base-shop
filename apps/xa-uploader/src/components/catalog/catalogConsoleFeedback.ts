import type * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

export type SyncScriptId = "validate" | "sync";
type SyncErrorCode =
  | "sync_dependencies_missing"
  | "catalog_input_missing"
  | "catalog_input_empty"
  | "currency_rates_missing"
  | "currency_rates_invalid"
  | "catalog_publish_unconfigured"
  | "catalog_publish_failed"
  | "validation_failed"
  | "sync_failed";
type SyncRecoveryCode =
  | "restore_sync_scripts"
  | "create_catalog_input"
  | "confirm_empty_catalog_sync"
  | "save_currency_rates"
  | "configure_catalog_contract"
  | "review_catalog_contract"
  | "review_validation_logs"
  | "review_sync_logs";
type CatalogApiErrorCode =
  | "invalid"
  | "missing_product"
  | "not_found"
  | "conflict"
  | "internal_error"
  | "service_unavailable"
  | "invalid_upload_url";
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
  requiresConfirmation?: boolean;
  logs?: {
    validate?: { code: number; stdout: string; stderr: string };
    sync?: { code: number; stdout: string; stderr: string };
  };
};

export type SyncReadinessResponse = {
  ok: boolean;
  ready?: boolean;
  error?: string;
  recovery?: SyncRecoveryCode | string;
  missingScripts?: SyncScriptId[];
  checkedAt?: string;
  contractConfigured?: boolean;
  contractConfigErrors?: string[];
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
  if (normalized === "service_unavailable") return t("apiErrorServiceUnavailable");
  if (normalized === "invalid_upload_url") return t("apiErrorInvalidUploadUrl");
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

export function formatSyncMissingScripts(
  missingScripts: SyncScriptId[] | undefined,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  if (!missingScripts || missingScripts.length === 0) {
    return t("syncDependenciesUnknown");
  }
  return missingScripts.map((script) => getSyncScriptLabel(script, t)).join(", ");
}

function getSyncRecoveryMessage(
  recovery: string | undefined,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  if (recovery === "restore_sync_scripts") return t("syncRecoveryRestoreScripts");
  if (recovery === "create_catalog_input") return t("syncRecoveryCreateCatalogInput");
  if (recovery === "confirm_empty_catalog_sync") return t("syncRecoveryConfirmEmptyCatalogSync");
  if (recovery === "save_currency_rates") return t("syncRecoverySaveCurrencyRates");
  if (recovery === "configure_catalog_contract") return t("syncRecoveryConfigureCatalogContract");
  if (recovery === "review_catalog_contract") return t("syncRecoveryReviewCatalogContract");
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
    const scripts = formatSyncMissingScripts(data.missingScripts, t);
    const base = t("syncDependenciesMissing", { scripts });
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "catalog_input_empty") {
    const base = t("syncCatalogInputEmptyActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "catalog_input_missing") {
    const base = t("syncCatalogInputMissingActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "currency_rates_missing") {
    const base = t("syncCurrencyRatesMissingActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "currency_rates_invalid") {
    const base = t("syncCurrencyRatesInvalidActionable");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "catalog_publish_unconfigured") {
    const base = t("syncPublishContractUnconfigured");
    return recoveryMessage ? `${base} ${recoveryMessage}` : base;
  }
  if (data.error === "catalog_publish_failed") {
    const base = t("syncPublishContractFailedActionable");
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
