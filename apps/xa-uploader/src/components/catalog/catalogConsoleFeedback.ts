import type * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

export type SyncScriptId = "validate" | "sync";
type SyncErrorCode =
  | "sync_dependencies_missing"
  | "catalog_input_missing"
  | "catalog_input_empty"
  | "no_publishable_products"
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
  | "mark_products_ready"
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
type ActionDomain = "login" | "draft" | "sync";
type ActionFeedbackKind = "error" | "success";
type SyncDeployStatus = "triggered" | "skipped_unconfigured" | "skipped_cooldown" | "failed";

export type SessionState = { authenticated: boolean };

export type CatalogListResponse = {
  ok: boolean;
  products?: CatalogProductDraftInput[];
  revisionsById?: Record<string, string>;
  error?: string;
};

export type ActionFeedback = { kind: ActionFeedbackKind; message: string };
export type ActionFeedbackState = Record<ActionDomain, ActionFeedback | null>;

export type SyncResponse = {
  ok: boolean;
  error?: SyncErrorCode | string;
  recovery?: SyncRecoveryCode | string;
  deploy?: {
    status?: SyncDeployStatus | string;
    nextEligibleAt?: string;
    reason?: string;
    httpStatus?: number;
  };
  display?: {
    mode?: string;
    requiresXaBBuild?: boolean;
    nextAction?: string;
    deployStatus?: SyncDeployStatus | string;
    nextEligibleAt?: string;
  };
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
  return { login: null, draft: null, sync: null };
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
  if (recovery === "mark_products_ready") return t("syncRecoveryMarkProductsReady");
  if (recovery === "save_currency_rates") return t("syncRecoverySaveCurrencyRates");
  if (recovery === "configure_catalog_contract") return t("syncRecoveryConfigureCatalogContract");
  if (recovery === "review_catalog_contract") return t("syncRecoveryReviewCatalogContract");
  if (recovery === "review_validation_logs") return t("syncRecoveryReviewValidationLogs");
  if (recovery === "review_sync_logs") return t("syncRecoveryReviewSyncLogs");
  return "";
}

function appendRecovery(base: string, recovery: string): string {
  return recovery ? `${base} ${recovery}` : base;
}

export function getSyncFailureMessage(
  data: SyncResponse,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  const recoveryMessage = getSyncRecoveryMessage(data.recovery, t);
  if (data.error === "sync_dependencies_missing") {
    const scripts = formatSyncMissingScripts(data.missingScripts, t);
    return appendRecovery(t("syncDependenciesMissing", { scripts }), recoveryMessage);
  }

  const actionableKeys: Record<string, string> = {
    catalog_input_empty: "syncCatalogInputEmptyActionable",
    no_publishable_products: "syncNoPublishableProductsActionable",
    catalog_input_missing: "syncCatalogInputMissingActionable",
    currency_rates_missing: "syncCurrencyRatesMissingActionable",
    currency_rates_invalid: "syncCurrencyRatesInvalidActionable",
    catalog_publish_unconfigured: "syncPublishContractUnconfigured",
    catalog_publish_failed: "syncPublishContractFailedActionable",
    validation_failed: "syncValidationFailedActionable",
    sync_failed: "syncPipelineFailedActionable",
  };
  const key = data.error ? actionableKeys[data.error] : undefined;
  if (key) {
    return appendRecovery(t(key), recoveryMessage);
  }
  return t("syncFailed");
}
