import type * as React from "react";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  splitList,
} from "@acme/lib/xa/catalogAdminSchema";

import { normalizeCatalogPath } from "../../lib/catalogPath";
import { getStorefrontConfig } from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { getUploaderConfirmDelete, type UploaderLocale } from "../../lib/uploaderI18n";

import {
  type ActionFeedbackState,
  type BusyLockRef,
  clearActionFeedbackDomains,
  createInitialActionFeedbackState,
  endBusyAction,
  errorToMessage,
  getCatalogApiErrorMessage,
  getSyncFailureMessage,
  type SyncResponse,
  tryBeginBusyAction,
  updateActionFeedback,
} from "./catalogConsoleFeedback";
import { buildLogBlock, toErrorMap } from "./catalogConsoleUtils";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";
import { getCatalogDraftWorkflowReadiness } from "./catalogWorkflow";

type Translator = (key: string, vars?: Record<string, unknown>) => string;

type ImageTuple = {
  file: string;
  alt: string;
};

export type SaveResult =
  | { status: "saved"; product: CatalogProductDraftInput; revision: string | null }
  | { status: "busy" }
  | { status: "validation_error" }
  | { status: "conflict" }
  | { status: "cancelled" }
  | { status: "error" };

export type PublishResult =
  | {
      status: "published";
      deployStatus: string;
      publishState: "live" | "out_of_stock";
      warnings: string[];
    }
  | { status: "busy" }
  | { status: "error"; error?: string };

export type SyncActionResult = { ok: boolean; data?: SyncResponse };

function parseImageTuples(draft: CatalogProductDraftInput): ImageTuple[] {
  const files = splitList(draft.imageFiles ?? "").map((entry) => normalizeCatalogPath(entry));
  const alts = splitList(draft.imageAltTexts ?? "");
  const tuples: ImageTuple[] = [];
  for (const [index, file] of files.entries()) {
    if (!file) continue;
    tuples.push({
      file,
      alt: alts[index] ?? "",
    });
  }
  return tuples;
}

export function mergeAutosaveImageTuples(params: {
  serverDraft: CatalogProductDraftInput;
  localDraft: CatalogProductDraftInput;
  baselineDraft?: CatalogProductDraftInput | null;
}): CatalogProductDraftInput {
  const serverTuples = parseImageTuples(params.serverDraft);
  const localTuples = parseImageTuples(params.localDraft);
  const baselineTuples = params.baselineDraft
    ? parseImageTuples(params.baselineDraft)
    : [];
  const localFiles = new Set(localTuples.map((tuple) => tuple.file));
  const removedFromBaseline = new Set(
    baselineTuples
      .map((tuple) => tuple.file)
      .filter((file) => !localFiles.has(file)),
  );
  const merged = serverTuples.filter((tuple) => !removedFromBaseline.has(tuple.file));
  const indexByFile = new Map<string, number>();

  for (const [index, tuple] of merged.entries()) {
    indexByFile.set(tuple.file, index);
  }

  for (const tuple of localTuples) {
    const existingIndex = indexByFile.get(tuple.file);
    if (existingIndex === undefined) {
      indexByFile.set(tuple.file, merged.length);
      merged.push(tuple);
      continue;
    }
    merged[existingIndex] = tuple;
  }

  const imageFiles = merged.map((tuple) => tuple.file).join("|");
  const imageAltTexts = merged.map((tuple) => tuple.alt).join("|");

  return {
    ...params.serverDraft,
    imageFiles,
    imageAltTexts,
  };
}

function getCatalogProcessWarningReasonMessage(
  reason: string,
  t: Translator,
): string {
  if (reason === "external_host_not_allowed") {
    return t("syncWarningReasonExternalHostNotAllowed");
  }
  if (reason === "invalid_cloud_key") {
    return t("syncWarningReasonInvalidCloudKey");
  }
  if (reason === "empty_path") {
    return t("syncWarningReasonEmptyPath");
  }
  return t("syncWarningReasonUnknown");
}

const MISSING_PRUNED_RE = /^cloud_media_missing_pruned:(\d+)$/;
const VALIDATION_LIMIT_RE = /^cloud_media_validation_limit_skipped:(\d+)$/;
const ROW_EMPTY_IMAGE_PATH_RE = /^\[row (\d+)\] "([^"]+)" has an empty image path entry\.$/;
const ROW_UNSUPPORTED_CLOUD_PATH_RE =
  /^\[row (\d+)\] "([^"]+)" has unsupported cloud image path "([^"]+)" \(([^)]+)\)\.$/;

function getCatalogProcessWarningMessage(
  warning: string,
  t: Translator,
): string {
  if (warning === "publish_state_promotion_failed") {
    return t("syncWarningPublishStatePromotionFailed");
  }

  const missingPrunedMatch = MISSING_PRUNED_RE.exec(warning);
  if (missingPrunedMatch) {
    return t("syncWarningCloudMediaMissingPruned", {
      count: Number.parseInt(missingPrunedMatch[1] ?? "0", 10),
    });
  }

  const validationLimitMatch = VALIDATION_LIMIT_RE.exec(warning);
  if (validationLimitMatch) {
    return t("syncWarningCloudMediaValidationLimitSkipped", {
      count: Number.parseInt(validationLimitMatch[1] ?? "0", 10),
    });
  }

  const emptyImagePathMatch = ROW_EMPTY_IMAGE_PATH_RE.exec(warning);
  if (emptyImagePathMatch) {
    return t("syncWarningRowEmptyImagePath", {
      row: Number.parseInt(emptyImagePathMatch[1] ?? "0", 10),
      slug: emptyImagePathMatch[2] ?? "",
    });
  }

  const unsupportedCloudPathMatch = ROW_UNSUPPORTED_CLOUD_PATH_RE.exec(warning);
  if (unsupportedCloudPathMatch) {
    return t("syncWarningRowUnsupportedCloudPath", {
      row: Number.parseInt(unsupportedCloudPathMatch[1] ?? "0", 10),
      slug: unsupportedCloudPathMatch[2] ?? "",
      path: unsupportedCloudPathMatch[3] ?? "",
      reason: getCatalogProcessWarningReasonMessage(unsupportedCloudPathMatch[4] ?? "", t),
    });
  }

  return t("syncWarningUnknownGeneric");
}

function appendCatalogProcessWarnings(params: {
  base: string;
  warnings: string[] | undefined;
  summaryKey: string;
  t: Translator;
}): string {
  const warnings = (params.warnings ?? []).map((warning) => warning.trim()).filter(Boolean);
  if (warnings.length === 0) return params.base;
  const localizedWarnings = warnings.map((warning) => getCatalogProcessWarningMessage(warning, params.t)).join(" ");
  return `${params.base} ${params.t(params.summaryKey, { warnings: localizedWarnings })}`;
}

export function shouldTriggerAutosync(params: {
  pendingAutosaveDraftRef: { current: unknown };
  busyLockRef: { current: boolean };
  syncReadinessReady: boolean;
  syncReadinessChecking: boolean;
  draft: CatalogProductDraftInput;
}): boolean {
  if (params.pendingAutosaveDraftRef.current !== null) return false;
  if (params.busyLockRef.current) return false;
  if (!params.syncReadinessReady || params.syncReadinessChecking) return false;
  return getCatalogDraftWorkflowReadiness(params.draft).isPublishReady;
}

export function handleNewImpl({
  defaultCategory,
  preservedBrand,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSyncOutput,
}: {
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
  preservedBrand?: Pick<CatalogProductDraftInput, "brandHandle" | "brandName">;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  setSelectedSlug(null);
  setDraft(buildEmptyDraft(defaultCategory, preservedBrand));
  setDraftRevision(null);
  setFieldErrors({});
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
  setSyncOutput(null);
}

export function handleStorefrontChangeImpl({
  nextStorefront,
  currentStorefront,
  setStorefront,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSyncOutput,
}: {
  nextStorefront: XaCatalogStorefront;
  currentStorefront: XaCatalogStorefront;
  setStorefront: React.Dispatch<React.SetStateAction<XaCatalogStorefront>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  if (nextStorefront === currentStorefront) return;
  setStorefront(nextStorefront);
  setProducts([]);
  setRevisionsById({});
  setSelectedSlug(null);
  setDraft(buildEmptyDraft(getStorefrontConfig(nextStorefront).defaultCategory));
  setDraftRevision(null);
  setFieldErrors({});
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
  setSyncOutput(null);
}

export function handleSelectImpl({
  product,
  revisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSyncOutput,
}: {
  product: CatalogProductDraftInput;
  revisionsById: Record<string, string>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  const normalized = withDraftDefaults(product);
  setSelectedSlug(normalized.slug);
  setDraft(normalized);
  const id = (normalized.id ?? "").trim();
  setDraftRevision(id ? revisionsById[id] ?? null : null);
  setFieldErrors({});
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
  setSyncOutput(null);
}

export async function handleLoginImpl({
  event,
  token,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  loadSession,
}: {
  event: React.FormEvent<HTMLFormElement>;
  token: string;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  loadSession: () => Promise<void>;
}): Promise<void> {
  event.preventDefault();
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["login"]);
  try {
    const response = await fetch("/api/uploader/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      throw new Error(t("unauthorized"));
    }
    await loadSession();
  } catch (err) {
    updateActionFeedback(setActionFeedback, "login", {
      kind: "error",
      message: errorToMessage(err, t("loginFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleLogoutImpl({
  uploaderMode,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSession,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setSyncOutput,
  defaultCategory,
}: {
  uploaderMode: "vendor" | "internal";
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSession: React.Dispatch<React.SetStateAction<{ authenticated: boolean } | null>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
}): Promise<void> {
  if (uploaderMode === "vendor") return;
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["login"]);
  try {
    await fetch("/api/uploader/logout", { method: "POST" });
    setSession({ authenticated: false });
    setProducts([]);
    setRevisionsById({});
    setSelectedSlug(null);
    setDraft(buildEmptyDraft(defaultCategory));
    setDraftRevision(null);
    setFieldErrors({});
    setSyncOutput(null);
    setActionFeedback(createInitialActionFeedbackState());
  } catch (err) {
    updateActionFeedback(setActionFeedback, "login", {
      kind: "error",
      message: errorToMessage(err, t("logoutFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleSaveImpl({
  draft,
  draftRevision,
  storefront,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setFieldErrors,
  setDraftRevision,
  loadCatalog,
  handleSelect,
  confirmUnpublish,
  suppressSuccessFeedback = false,
}: {
  draft: CatalogProductDraftInput;
  draftRevision: string | null;
  storefront: XaCatalogStorefront;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  handleSelect: (product: CatalogProductDraftInput) => void;
  confirmUnpublish: (message: string) => boolean;
  suppressSuccessFeedback?: boolean;
}): Promise<SaveResult> {
  const parsed = catalogProductDraftSchema.safeParse(draft);
  if (!parsed.success) {
    setFieldErrors(toErrorMap(parsed.error, t));
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: t("fixValidationErrorsBeforeSaving"),
    });
    return { status: "validation_error" };
  }

  if (!tryBeginBusyAction(busyLockRef, setBusy)) return { status: "busy" };
  clearActionFeedbackDomains(setActionFeedback, ["draft"]);
  setFieldErrors({});

  const doSave = async (confirm?: boolean): Promise<SaveResult> => {
    const response = await fetch(`/api/catalog/products?storefront=${encodeURIComponent(storefront)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: draft,
        ifMatch: draftRevision ?? undefined,
        ...(confirm ? { confirmUnpublish: true } : {}),
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      product?: CatalogProductDraftInput;
      revision?: string;
      error?: string;
      reason?: string;
      requiresConfirmation?: boolean;
    };

    if (response.status === 409 && data.error === "would_unpublish" && data.requiresConfirmation) {
      const confirmed = confirmUnpublish(t("saveConfirmUnpublish"));
      if (!confirmed) return { status: "cancelled" };
      return await doSave(true);
    }

    if (response.status === 409 && data.error === "conflict" && data.reason === "revision_conflict") {
      return { status: "conflict" };
    }

    if (!response.ok || !data.ok || !data.product) {
      throw new Error(getCatalogApiErrorMessage(data.error, "saveFailed", t));
    }
    await loadCatalog();
    handleSelect(data.product);
    setDraftRevision(data.revision ?? null);
    if (!suppressSuccessFeedback) {
      updateActionFeedback(setActionFeedback, "draft", {
        kind: "success",
        message: t("saveSucceeded"),
      });
    }
    return {
      status: "saved",
      product: data.product,
      revision: data.revision ?? null,
    };
  };

  try {
    return await doSave();
  } catch (err) {
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: errorToMessage(err, t("saveFailed")),
    });
    return { status: "error" };
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleDeleteImpl({
  selectedSlug,
  locale,
  storefront,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  loadCatalog,
  handleNew,
}: {
  selectedSlug: string | null;
  locale: UploaderLocale;
  storefront: XaCatalogStorefront;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  loadCatalog: () => Promise<void>;
  handleNew: () => void;
}): Promise<void> {
  if (!selectedSlug) return;
  const targetSlug = selectedSlug;
  if (!confirm(getUploaderConfirmDelete(locale, targetSlug))) return;

  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["draft"]);
  try {
    const response = await fetch(
      `/api/catalog/products/${encodeURIComponent(targetSlug)}?storefront=${encodeURIComponent(storefront)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      throw new Error(getCatalogApiErrorMessage(data.error, "deleteFailed", t));
    }
    await loadCatalog();
    handleNew();
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "success",
      message: t("deleteSucceeded", { slug: targetSlug }),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: errorToMessage(err, t("deleteFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

function getSyncSuccessMessage(
  syncData: SyncResponse,
  t: Translator,
): string {
  let baseMessage = t("syncSucceeded");
  const deployStatus = syncData.deploy?.status ?? syncData.display?.deployStatus;
  const nextEligibleAt = syncData.deploy?.nextEligibleAt ?? syncData.display?.nextEligibleAt;
  if (deployStatus === "triggered") {
    baseMessage = t("syncSucceededDeployTriggered");
  } else if (deployStatus === "skipped_cooldown") {
    baseMessage = t("syncSucceededDeployCooldown", {
      nextEligibleAt: nextEligibleAt ?? t("syncCooldownUnknown"),
    });
  } else if (deployStatus === "failed") {
    baseMessage = t("syncSucceededDeployFailed");
  } else if (syncData.display?.requiresXaBBuild === true) {
    baseMessage = t("syncSucceededRebuildRequired");
  }
  return appendCatalogProcessWarnings({
    base: baseMessage,
    warnings: syncData.warnings,
    summaryKey: "syncWarningsSummary",
    t,
  });
}

export async function handlePublishImpl({
  draftId,
  draftRevision,
  publishState,
  storefront,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  loadCatalog,
}: {
  draftId: string;
  draftRevision: string;
  publishState: "live" | "out_of_stock";
  storefront: XaCatalogStorefront;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  loadCatalog: () => Promise<void>;
}): Promise<PublishResult> {
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return { status: "busy" };
  clearActionFeedbackDomains(setActionFeedback, ["draft"]);
  try {
    const response = await fetch("/api/catalog/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storefront, draftId, ifMatch: draftRevision, publishState }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      deployStatus?: string;
      deployReason?: string;
      deployNextEligibleAt?: string;
      warnings?: string[];
      error?: string;
    };
    if (!response.ok || !data.ok) {
      throw new Error(getCatalogApiErrorMessage(data.error, "makeLiveFailed", t));
    }
    await loadCatalog().catch(() => null);
    const deployStatus = data.deployStatus ?? "skipped_unconfigured";
    let message: string;
    if (publishState === "out_of_stock") {
      if (deployStatus === "triggered") {
        message = t("markOutOfStockSuccess");
      } else if (deployStatus === "skipped_cooldown") {
        message = t("markOutOfStockSuccessCooldown");
      } else if (deployStatus === "skipped_runtime_live_catalog") {
        message = t("markOutOfStockSuccessLiveCatalog");
      } else if (deployStatus === "failed") {
        message = t("markOutOfStockSuccessFailed");
      } else {
        message = t("markOutOfStockSuccessUnconfigured");
      }
    } else {
      if (deployStatus === "triggered") {
        message = t("makeLiveSuccess");
      } else if (deployStatus === "skipped_cooldown") {
        message = t("makeLiveSuccessCooldown");
      } else if (deployStatus === "skipped_runtime_live_catalog") {
        message = t("makeLiveSuccessLiveCatalog");
      } else if (deployStatus === "failed") {
        message = t("makeLiveSuccessFailed");
      } else {
        message = t("makeLiveSuccessUnconfigured");
      }
    }
    const feedbackMessage = appendCatalogProcessWarnings({
      base: message,
      warnings: data.warnings,
      summaryKey: "publishWarningsSummary",
      t,
    });
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "success",
      message: feedbackMessage,
    });
    return { status: "published", deployStatus, publishState, warnings: data.warnings ?? [] };
  } catch (err) {
    const failureKey = publishState === "out_of_stock" ? "markOutOfStockFailed" : "makeLiveFailed";
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: errorToMessage(err, t(failureKey)),
    });
    return { status: "error", error: errorToMessage(err, t(failureKey)) };
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleSyncImpl({
  storefront,
  syncOptions,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSyncOutput,
  loadCatalog,
  confirmEmptyCatalogSync,
}: {
  storefront: XaCatalogStorefront;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  confirmEmptyCatalogSync: (message: string) => boolean;
}): Promise<SyncActionResult> {
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return { ok: false };
  clearActionFeedbackDomains(setActionFeedback, ["sync"]);
  setSyncOutput(null);

  const runSyncRequest = async (confirmEmptyInput: boolean): Promise<{ response: Response; data: SyncResponse }> => {
    const response = await fetch("/api/catalog/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        options: { ...syncOptions, confirmEmptyInput },
        storefront,
      }),
    });
    const data = (await response.json()) as SyncResponse;
    return { response, data };
  };

  try {
    let syncAttempt = await runSyncRequest(false);

    const CONFIRMABLE_SYNC_ERRORS: readonly string[] = ["catalog_input_empty", "no_publishable_products"];
    if (
      syncAttempt.response.status === 409 &&
      syncAttempt.data.requiresConfirmation &&
      syncAttempt.data.error &&
      CONFIRMABLE_SYNC_ERRORS.includes(syncAttempt.data.error)
    ) {
      const confirmMessage =
        syncAttempt.data.error === "no_publishable_products"
          ? t("syncConfirmNoPublishableProducts")
          : t("syncConfirmEmptyCatalogSync");
      const confirmed = confirmEmptyCatalogSync(confirmMessage);
      if (!confirmed) return { ok: false, data: syncAttempt.data };
      syncAttempt = await runSyncRequest(true);
    }

    const output =
      [
        buildLogBlock("validate", syncAttempt.data.logs?.validate),
        buildLogBlock("sync", syncAttempt.data.logs?.sync),
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim() || null;
    setSyncOutput(output);

    if (!syncAttempt.response.ok || !syncAttempt.data.ok) {
      throw new Error(getSyncFailureMessage(syncAttempt.data, t));
    }
    await loadCatalog().catch(() => null);
    const syncSuccessMessage = getSyncSuccessMessage(syncAttempt.data, t);
    updateActionFeedback(setActionFeedback, "sync", {
      kind: "success",
      message: syncSuccessMessage,
    });
    return { ok: true, data: syncAttempt.data };
  } catch (err) {
    updateActionFeedback(setActionFeedback, "sync", {
      kind: "error",
      message: errorToMessage(err, t("syncFailed")),
    });
    return { ok: false };
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}
